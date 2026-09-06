/** ARMS CRM: client master, recovery-case relations, and collections log validation. */
var CRM_INDUSTRIES = ['MULTIFINANCE', 'PERBANKAN', 'FINTECH', 'PERORANGAN'];
var CRM_SERVICES = ['Penagihan Piutang', 'Mediasi & Penyelesaian', 'Eksekusi / Tarik Unit'];
var CRM_CHANNELS = ['Kunjungan Lapangan', 'WhatsApp & Chat', 'Eksekusi Unit', 'Penarikan aset jaminan'];
var CRM_PARTIES = ['Debitur Langsung', 'Keluarga / Perwakilan Debitur', 'Penjamin', 'Pihak Lain'];
var CRM_OUTCOMES = ['Janji Bayar (Promise to Pay)', 'Pembayaran Titipan / Pelunasan', 'Sepakat Mediasi Kantor', 'Unit Ditemukan / Teridentifikasi', 'Unit Berhasil Ditarik / Diserahterimakan', 'Debitur Tidak di Rumah / Nomor Tidak Aktif', 'Menolak Bayar / Tidak Kooperatif'];

function crmText_(value, label, max) {
  var text = required_(value, label);
  if (text.length > (max || 200)) throw new Error(label + ' terlalu panjang (maks. ' + (max || 200) + ' karakter).');
  return text;
}
function crmDateKey_(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  var date = value ? new Date(value) : new Date();
  return isNaN(date.getTime()) ? '' : Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');
}
function crmOverdue_(dueDate, createdDate) {
  date_(dueDate); date_(createdDate);
  return Math.max(0, Math.floor((Date.parse(createdDate) - Date.parse(dueDate)) / 86400000));
}
function crmVehicle_(customer) {
  var description = String(customer.brandType || customer.vehicle || '').trim(), plate = String(customer.plate || '').trim();
  return !plate || description.toUpperCase().endsWith(plate.toUpperCase()) ? description : [description, plate].filter(Boolean).join(' / ');
}
function crmBool_(value) { return value === true || String(value).toLowerCase() === 'true'; }
function crmHasHistory_(caseId) {
  return ['SK', 'Payments', 'Executions', 'Transactions', 'CollectionLogs'].some(function (name) { return rows_(name).some(function (r) { return r.caseId === caseId; }); });
}

function normalizeCrm_(name, record, existing) {
  if (name === 'Clients') {
    record.code = crmText_(record.code, 'Kode Perusahaan Klien', 30).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(record.code)) throw new Error('Kode klien hanya boleh berupa huruf, angka, titik, garis bawah, atau tanda hubung.');
    if (rows_('Clients').some(function (c) { return c.id !== record.id && String(c.code).toUpperCase() === record.code; })) throw new Error('Kode perusahaan klien sudah digunakan.');
    record.name = crmText_(record.name, 'Nama Perusahaan Lengkap / Pemberi Kuasa');
    if (CRM_INDUSTRIES.indexOf(record.industry) < 0) throw new Error('Industri klien tidak valid.');
    record.contactPerson = crmText_(record.contactPerson, 'Contact Person', 150);
    record.phone = crmText_(record.phone, 'No. Phone / WhatsApp', 20);
    if (!/^[+0-9 ()-]{8,20}$/.test(record.phone)) throw new Error('Nomor telepon / WhatsApp tidak valid.');
    record.email = String(record.email || '').trim().toLowerCase();
    if (record.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) || record.email.length > 254)) throw new Error('Alamat email tidak valid.');
    record.streetAddress = crmText_(record.streetAddress, 'Alamat Domisili / Kantor', 500);
    record.regency = crmText_(record.regency, 'Kabupaten/Kota', 150); record.district = crmText_(record.district, 'Kecamatan', 150); record.village = crmText_(record.village, 'Kelurahan / Desa', 150);
    record.regencyId = String(record.regencyId || ''); record.districtId = String(record.districtId || '');
    if (Boolean(record.regencyId) !== Boolean(record.districtId) || (record.regencyId && record.districtId.indexOf(record.regencyId + '.') !== 0)) throw new Error('Kecamatan tidak sesuai dengan kabupaten/kota. Pilih ulang atau isi wilayah manual.');
    record.address = [record.streetAddress, record.village, record.district, record.regency].join(', ');
    record.createdAt = existing ? existing.createdAt : new Date().toISOString();
  }
  if (name === 'Cases') {
    var client = find_('Clients', required_(record.clientId, 'Client / Creditor'));
    var customer = find_('Customers', required_(record.customerId, 'Debitur'));
    find_('Personnel', required_(record.personnelId, 'Assign To Personnel / Mitra'));
    if (CRM_SERVICES.indexOf(record.service) < 0) throw new Error('Layanan kasus tidak valid.');
    if (existing && (existing.customerId !== record.customerId || existing.clientId !== record.clientId) && crmHasHistory_(record.id)) throw new Error('Klien/debitur tidak dapat diganti karena kasus sudah memiliki riwayat.');
    record.client = client.name; record.clientType = client.industry;
    if (CRM_INDUSTRIES.indexOf(record.clientType) < 0) throw new Error('Perbaiki industri pada master klien.');
    record.contract = crmText_(customer.contract, 'Nomor kontrak pada data debitur', 100);
    if (rows_('Cases').some(function (c) { return c.id !== record.id && c.clientId === record.clientId && c.customerId === record.customerId && String(c.contract).toLowerCase() === record.contract.toLowerCase(); })) throw new Error('Kasus untuk klien, debitur, dan kontrak ini sudah ada.');
    record.principal = money_(customer.total, 'Total angsuran debitur'); record.asset = crmVehicle_(customer);
    record.createdAt = existing ? existing.createdAt : new Date().toISOString();
    record.createdDate = date_(existing && existing.createdDate ? existing.createdDate : crmDateKey_(record.createdAt));
    record.dueDateSnapshot = date_(customer.dueDate);
    record.overdue = crmOverdue_(record.dueDateSnapshot, record.createdDate); record.bucket = bucket_(record.overdue);
    record.number = existing ? existing.number : nextNumber_('CS');
    record.status = record.status || 'Aktif';
    if (['Aktif', 'Dalam Proses', 'Selesai', 'Ditunda'].indexOf(record.status) < 0) throw new Error('Status kasus tidak valid.');
    record.paymentClosed = existing ? crmBool_(existing.paymentClosed) : false;
  }
  if (name === 'CollectionLogs') {
    var c = find_('Cases', required_(record.caseId, 'Berkas Perkara / Kasus'));
    record.letterId = String(record.letterId || '');
    if (record.letterId) { var letter = find_('SK', record.letterId); if (letter.caseId !== record.caseId || letter.personnelId !== record.personnelId) throw new Error('SK laporan harus sesuai kasus dan petugas.'); }
    find_('Personnel', required_(record.personnelId, 'Petugas / PIC'));
    if (CRM_CHANNELS.indexOf(record.activity) < 0) throw new Error('Tipe aktivitas / kanal interaksi tidak valid.');
    if (CRM_PARTIES.indexOf(record.contactedParty) < 0) throw new Error('Pilih pihak yang ditemui / dihubungi.');
    if (CRM_OUTCOMES.indexOf(record.outcome) < 0) throw new Error('Hasil tindakan / outcome tidak valid.');
    record.activityDate = date_(record.activityDate);
    if (record.activityDate > crmDateKey_()) throw new Error('Tanggal log tidak boleh di masa mendatang.');
    var caseDate = date_(c.createdDate || crmDateKey_(c.createdAt));
    if (record.activityDate < caseDate) throw new Error('Tanggal aktivitas tidak boleh sebelum kasus dibuat.');
    record.report = crmText_(record.report, 'Laporan rinci pembicaraan & situasi lapangan', 5000);
    if (record.report.length < 10) throw new Error('Laporan rinci minimal 10 karakter.');
    record.actionPlan = String(record.actionPlan || '').trim();
    if (record.actionPlan.length > 1500) throw new Error('Action Plan maksimal 1500 karakter.');
    record.nextActionDate = String(record.nextActionDate || '');
    if (record.outcome === CRM_OUTCOMES[0] && !record.nextActionDate) throw new Error('Target tanggal janji bayar wajib diisi.');
    if (record.nextActionDate) { date_(record.nextActionDate); if (record.nextActionDate < record.activityDate) throw new Error('Next Action tidak boleh sebelum tanggal aktivitas.'); }
    record.hasPayment = crmBool_(record.hasPayment);
    if (record.outcome === CRM_OUTCOMES[1] && !record.hasPayment) throw new Error('Outcome pembayaran harus ditandai memiliki pembayaran.');
    var receipts = rows_('Payments').filter(function (p) { return p.collectionLogId === record.id; });
    if (receipts.length && (!record.hasPayment || receipts.some(function (p) { return p.caseId !== record.caseId; }))) throw new Error('Log sudah memiliki pembayaran. Kasus dan penanda pembayaran tidak dapat diubah.');
    record.createdAt = existing ? existing.createdAt : new Date().toISOString(); record.updatedAt = new Date().toISOString();
    record.number = existing ? existing.number : nextNumber_('LOG');
  }
}

function validateCollectionPayment_(record, existing) {
  record.collectionLogId = String(record.collectionLogId || '');
  if (existing && existing.collectionLogId && existing.collectionLogId !== record.collectionLogId) throw new Error('Relasi log pada kuitansi tidak dapat dilepas atau diganti.');
  if (!record.collectionLogId) return;
  var log = find_('CollectionLogs', record.collectionLogId);
  if (!crmBool_(log.hasPayment) || log.caseId !== record.caseId) throw new Error('Log penagihan tidak sesuai dengan kasus pembayaran.');
  if (rows_('Payments').some(function (p) { return p.id !== record.id && p.collectionLogId === log.id; })) throw new Error('Pembayaran untuk log ini sudah dicatat. Buka kuitansi yang ada.');
}

function migrateCrm_() {
  var clients = rows_('Clients'), cases = rows_('Cases'), letters = rows_('SK');
  function fromName(name, industry) {
    if (!name) return null;
    var client = clients.find(function (c) { return String(c.name).trim().toLowerCase() === String(name).trim().toLowerCase(); });
    if (!client) {
      var i = clients.length + 1;
      while (clients.some(function (c) { return c.code === 'LEGACY-' + i; })) i++;
      client = { id: id_('Clients'), code: 'LEGACY-' + i, name: name, industry: CRM_INDUSTRIES.indexOf(industry) >= 0 ? industry : 'MULTIFINANCE', contactPerson: '', phone: '', email: '', address: '', streetAddress: '', regencyId: '', regency: '', districtId: '', district: '', village: '', createdAt: new Date().toISOString() };
      write_('Clients', client); clients.push(client);
    }
    return client;
  }
  cases.forEach(function (c) {
    var changed = false;
    if (!c.clientId) { var client = fromName(c.client, c.clientType); if (client) { c.clientId = client.id; changed = true; } }
    if (!c.createdDate) { c.createdDate = crmDateKey_(c.createdAt); changed = true; }
    if (!c.service) { c.service = CRM_SERVICES[0]; changed = true; }
    if (!c.personnelId) { var letter = letters.filter(function (l) { return l.caseId === c.id && l.status === 'Aktif'; }).slice(-1)[0]; if (letter) { c.personnelId = letter.personnelId; changed = true; } }
    if (changed) write_('Cases', c, c.id);
  });
  rows_('Transactions').forEach(function (t) {
    if (!t.clientId && t.client && t.sourceType === 'multifinance') { var client = fromName(t.client, 'MULTIFINANCE'); if (client) { t.clientId = client.id; write_('Transactions', t, t.id); } }
  });
  syncCrmReferences_();
}

function syncCrmReferences_() {
  var clients = rows_('Clients'), customers = rows_('Customers'), cases = rows_('Cases');
  cases.forEach(function (c) {
    var before = JSON.stringify(c), client = clients.find(function (r) { return r.id === c.clientId; }), customer = customers.find(function (r) { return r.id === c.customerId; });
    if (client) { c.client = client.name; c.clientType = client.industry; }
    if (customer) {
      c.contract = customer.contract || c.contract; c.principal = Number(customer.total); c.asset = crmVehicle_(customer);
      if (customer.dueDate && c.createdDate) {
        try { c.overdue = crmOverdue_(customer.dueDate, c.createdDate); c.bucket = bucket_(c.overdue); c.dueDateSnapshot = customer.dueDate; }
        catch (error) { console.warn('Tanggal debitur lama belum valid; lengkapi sebelum mengedit kasus.'); }
      }
    }
    if (JSON.stringify(c) !== before) write_('Cases', c, c.id);
  });
  rows_('Transactions').forEach(function (t) {
    var c = cases.find(function (c) { return c.id === t.caseId; });
    var clientId = c && c.clientId ? c.clientId : t.clientId;
    var client = clients.find(function (r) { return r.id === clientId; });
    if (client && (t.clientId !== client.id || t.client !== client.name)) { t.clientId = client.id; t.client = client.name; write_('Transactions', t, t.id); }
  });
}

/** Read-only audit. Run as Administrator after initialization or data migration. */
function validateWorkspace() {
  return response_(function () {
    authorize_(true);
    var db = {}, issues = [], checked = 0;
    Object.keys(ARMS_SCHEMA).forEach(function (name) {
      db[name] = rows_(name);
      var ids = {};
      db[name].forEach(function (r) { checked++; if (ids[r.id]) issues.push({ table: name, id: r.id, message: 'ID duplikat.' }); ids[r.id] = true; });
    });
    function issue(table, id, message) { issues.push({ table: table, id: id, message: message }); }
    function exists(table, id) { return db[table].some(function (r) { return r.id === id; }); }
    var codes = {};
    db.Clients.forEach(function (c) {
      var code = String(c.code).trim().toUpperCase();
      if (!code || codes[code]) issue('Clients', c.id, 'Kode klien kosong atau duplikat.');
      codes[code] = true;
      if (CRM_INDUSTRIES.indexOf(c.industry) < 0) issue('Clients', c.id, 'Industri tidak valid.');
      if (!c.contactPerson || !c.phone || !c.regency || !c.district || !c.village || !c.streetAddress) issue('Clients', c.id, 'Lengkapi kontak dan domisili (termasuk data hasil migrasi).');
    });
    db.Cases.forEach(function (c) {
      if (!exists('Clients', c.clientId)) issue('Cases', c.id, 'Client_ID tidak valid.');
      if (!exists('Personnel', c.personnelId)) issue('Cases', c.id, 'Assign To Personnel / Mitra belum valid.');
      var customer = db.Customers.find(function (r) { return r.id === c.customerId; });
      if (!customer) issue('Cases', c.id, 'Customer_ID tidak valid.');
      else {
        if (Number(c.principal) !== Number(customer.total) || c.contract !== customer.contract) issue('Cases', c.id, 'Kontrak / principal tidak sinkron dengan debitur.');
        try { if (Number(c.overdue) !== crmOverdue_(customer.dueDate, c.createdDate)) issue('Cases', c.id, 'Hari tunggakan tidak sesuai tanggal acuan.'); }
        catch (error) { issue('Cases', c.id, 'Tanggal jatuh tempo / pembuatan belum valid.'); }
      }
      var paid = db.Payments.filter(function (p) { return p.caseId === c.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
      if (paid > Number(c.principal)) issue('Cases', c.id, 'Jumlah pembayaran melebihi principal.');
    });
    db.CollectionLogs.forEach(function (l) {
      if (!exists('Cases', l.caseId) || !exists('Personnel', l.personnelId)) issue('CollectionLogs', l.id, 'Relasi kasus / PIC tidak valid.');
      if (l.letterId) { var sk = db.SK.find(function (r) { return r.id === l.letterId; }); if (!sk || sk.caseId !== l.caseId || sk.personnelId !== l.personnelId) issue('CollectionLogs', l.id, 'Relasi SK laporan tidak sesuai.'); }
      if (CRM_CHANNELS.indexOf(l.activity) < 0 || CRM_OUTCOMES.indexOf(l.outcome) < 0) issue('CollectionLogs', l.id, 'Aktivitas / outcome tidak valid.');
      if (l.outcome === CRM_OUTCOMES[0] && !l.nextActionDate) issue('CollectionLogs', l.id, 'Promise to Pay tanpa target tanggal.');
      if (l.nextActionDate && l.nextActionDate < l.activityDate) issue('CollectionLogs', l.id, 'Next Action sebelum aktivitas.');
    });
    db.Personnel.forEach(function (p) { if (!p.position) issue('Personnel', p.id, 'Posisi / Jabatan belum dilengkapi.'); if (p.nik && !/^\d{16}$/.test(String(p.nik))) issue('Personnel', p.id, 'NIK tidak valid.'); });
    db.SK.forEach(function (l) {
      if (!exists('Cases', l.caseId) || !exists('Personnel', l.personnelId)) issue('SK', l.id, 'Relasi kasus / petugas tidak valid.');
      if (l.validUntil && l.validUntil < l.issuedAt) issue('SK', l.id, 'Masa berlaku sebelum tanggal terbit.');
      if (l.pdfUrl && (!l.pdfName || !/\.pdf$/i.test(l.pdfName) || Number(l.pdfSize) <= 0 || Number(l.pdfSize) > 5 * 1024 * 1024 || !l.pdfUploadedAt)) issue('SK', l.id, 'Metadata PDF penugasan tidak lengkap atau tidak valid.');
    });
    var loggedPayments = {};
    db.Payments.forEach(function (p) {
      if (!exists('Cases', p.caseId)) issue('Payments', p.id, 'Case_ID tidak valid.');
      if (Number(p.companyRevenue) + Number(p.partnerCommission) !== Number(p.grossFee) + Number(p.manualTotal)) issue('Payments', p.id, 'Pembagian fee tidak seimbang.');
      if (p.collectionLogId) {
        var log = db.CollectionLogs.find(function (l) { return l.id === p.collectionLogId; });
        if (!log || log.caseId !== p.caseId || !crmBool_(log.hasPayment)) issue('Payments', p.id, 'Relasi collections log tidak sesuai.');
        if (loggedPayments[p.collectionLogId]) issue('Payments', p.id, 'Lebih dari satu kuitansi untuk log yang sama.');
        loggedPayments[p.collectionLogId] = true;
      }
    });
    db.Transactions.forEach(function (t) { if (!exists('Accounts', t.accountId)) issue('Transactions', t.id, 'Account_ID tidak valid.'); if (t.clientId && !exists('Clients', t.clientId)) issue('Transactions', t.id, 'Client_ID tidak valid.'); });
    return { valid: issues.length === 0, checkedRecords: checked, issues: issues, message: issues.length ? 'Tinjau dan lengkapi temuan sebelum operasional.' : 'Relasi dan pemeriksaan dasar konsisten.' };
  });
}