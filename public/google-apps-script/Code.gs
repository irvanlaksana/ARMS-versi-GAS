/** ARMS - Google Apps Script V8 backend. Run initializeDatabase in the editor first. */
var ARMS_SCHEMA = {
  Users: { prefix: 'USR', headers: ['ID', 'Username', 'Role'], keys: ['id', 'username', 'role'] },
  Clients: {
    prefix: 'CLI',
    headers: ['ID', 'Kode Perusahaan Klien', 'Nama Perusahaan Lengkap', 'Industri', 'Contact Person', 'No Phone WhatsApp', 'Email', 'Alamat Domisili Kantor', 'Alamat Lengkap', 'Kabupaten Kota ID', 'Kabupaten Kota', 'Kecamatan ID', 'Kecamatan', 'Kelurahan Desa', 'Created At'],
    keys: ['id', 'code', 'name', 'industry', 'contactPerson', 'phone', 'email', 'address', 'streetAddress', 'regencyId', 'regency', 'districtId', 'district', 'village', 'createdAt']
  },
  CollectionLogs: {
    prefix: 'LOG',
    headers: ['ID', 'No Log', 'Case_ID', 'Tipe Aktivitas Kanal', 'Tanggal Aktivitas', 'Personnel_ID', 'Pihak Dihubungi', 'Outcome', 'Action Plan', 'Next Action', 'Laporan Rinci', 'Ada Pembayaran', 'Created At', 'Updated At', 'SK_ID'],
    keys: ['id', 'number', 'caseId', 'activity', 'activityDate', 'personnelId', 'contactedParty', 'outcome', 'actionPlan', 'nextActionDate', 'report', 'hasPayment', 'createdAt', 'updatedAt', 'letterId']
  },
  Customers: {
    prefix: 'CUS',
    headers: ['ID', 'Nama', 'NIK', 'No Kontak', 'Alamat', 'Pekerjaan', 'Kontak Darurat', 'Detail Kendaraan', 'Angsuran', 'Denda', 'Total Angsuran', 'No Kontrak', 'Kabupaten Kota ID', 'Kabupaten Kota', 'Kecamatan ID', 'Kecamatan', 'Kelurahan Desa', 'Alamat Lengkap', 'Tanggal Jatuh Tempo', 'Foto KTP', 'Nama File KTP', 'Foto STNK', 'Nama File STNK', 'Merk Type', 'Nomor Polisi'],
    keys: ['id', 'name', 'nik', 'phone', 'address', 'occupation', 'emergency', 'vehicle', 'installment', 'penalty', 'total', 'contract', 'regencyId', 'regency', 'districtId', 'district', 'village', 'streetAddress', 'dueDate', 'ktpPhoto', 'ktpPhotoName', 'stnkPhoto', 'stnkPhotoName', 'brandType', 'plate']
  },
  Cases: {
    prefix: 'CAS',
    headers: ['ID', 'No Kasus', 'Klien', 'Tipe Klien', 'Customer_ID', 'No Kontrak', 'Principal Outstanding', 'Overdue Days', 'DPD Bucket', 'Asset Summary', 'Status', 'Created At', 'Payment Closed', 'Client_ID', 'Layanan', 'Personnel_ID', 'Tanggal Dibuat', 'Jatuh Tempo Acuan'],
    keys: ['id', 'number', 'client', 'clientType', 'customerId', 'contract', 'principal', 'overdue', 'bucket', 'asset', 'status', 'createdAt', 'paymentClosed', 'clientId', 'service', 'personnelId', 'createdDate', 'dueDateSnapshot']
  },
  Personnel: { prefix: 'PER', headers: ['ID', 'Nama', 'Tipe (Karyawan/Mitra DC)', 'Rekening Bank', 'Posisi Jabatan', 'NIK', 'Foto KTP', 'Nama File KTP', 'Foto SPPI', 'Nama File SPPI'], keys: ['id', 'name', 'type', 'bank', 'position', 'nik', 'ktpPhoto', 'ktpPhotoName', 'sppiPhoto', 'sppiPhotoName'] },
  Proposals: {
    prefix: 'PRP',
    headers: ['ID', 'No Proposal', 'Judul', 'Client_ID', 'Nama Klien', 'Diajukan Kepada', 'Tanggal', 'Tempat', 'Status', 'Halaman', 'Mitra', 'Lampiran', 'Penandatangan', 'Jabatan Penandatangan', 'Contact Person', 'No Telepon', 'Email', 'Catatan', 'Created At', 'Updated At'],
    keys: ['id', 'number', 'title', 'clientId', 'clientName', 'recipient', 'date', 'place', 'status', 'pages', 'partners', 'attachments', 'signer', 'signerPosition', 'contactPerson', 'phone', 'email', 'notes', 'createdAt', 'updatedAt']
  },
  SK: {
    prefix: 'SK',
    headers: ['ID', 'No SK', 'Case_ID', 'Personnel_ID', 'Tanggal Terbit', 'Status', 'Tempat', 'Penandatangan', 'Perwakilan Klien', 'Alamat Klien', 'Berlaku Sampai', 'Generator Data', 'Catatan Update', 'Updated At', 'PDF Surat', 'Nama File PDF', 'Ukuran PDF', 'PDF Uploaded At', 'PDF Upload ID'],
    keys: ['id', 'number', 'caseId', 'personnelId', 'issuedAt', 'status', 'place', 'signer', 'clientRepresentative', 'clientAddress', 'validUntil', 'generatorData', 'updateNote', 'updatedAt', 'pdfUrl', 'pdfName', 'pdfSize', 'pdfUploadedAt', 'pdfUploadId']
  },
  Payments: {
    prefix: 'PAY',
    headers: ['ID', 'No Kuitansi', 'Case_ID', 'Amount', 'Gross Fee', 'Company Revenue', 'Partner Commission', 'Total Manual Splits', 'Bukti Transfer', 'Tanggal', 'Fee Rate', 'Partner Rate', 'Manual Details', 'CollectionLog_ID'],
    keys: ['id', 'number', 'caseId', 'amount', 'grossFee', 'companyRevenue', 'partnerCommission', 'manualTotal', 'proof', 'date', 'feeRate', 'partnerRate', 'manualDetails', 'collectionLogId']
  },
  Executions: {
    prefix: 'EXE',
    headers: ['ID', 'No Penarikan', 'Case_ID', 'Personnel_ID', 'Tanggal', 'Lokasi', 'Metode', 'Referensi Kuasa', 'No BAST', 'Status', 'Dasar Fee', 'Fee Rate', 'Partner Rate', 'Gross Fee', 'Company Revenue', 'Partner Commission', 'Catatan'],
    keys: ['id', 'number', 'caseId', 'personnelId', 'date', 'location', 'method', 'authorityRef', 'handoverRef', 'status', 'feeBase', 'feeRate', 'partnerRate', 'grossFee', 'companyRevenue', 'partnerCommission', 'notes']
  },
  Accounts: { prefix: 'ACC', headers: ['ID', 'Nama Rekening', 'Bank', 'Nomor Rekening', 'Atas Nama', 'Saldo Awal'], keys: ['id', 'name', 'bank', 'number', 'holder', 'openingBalance'] },
  Transactions: {
    prefix: 'TRX',
    headers: ['ID', 'No Transaksi', 'Account_ID', 'Tanggal', 'Jenis', 'Kategori', 'Sumber', 'Source_ID', 'Case_ID', 'Klien', 'Nominal', 'Referensi', 'Keterangan', 'Client_ID'],
    keys: ['id', 'number', 'accountId', 'date', 'type', 'category', 'sourceType', 'sourceId', 'caseId', 'client', 'amount', 'reference', 'description', 'clientId']
  }
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('ARMS | Account Receivables Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function response_(work) {
  try { return { status: 'success', data: work(), message: 'Berhasil.' }; }
  catch (error) { return { status: 'error', data: [], message: error.message || 'Terjadi kesalahan server.' }; }
}

function locked_(work) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Server sedang sibuk. Silakan coba lagi.');
  try { return work(); } finally { lock.releaseLock(); }
}

function database_() {
  var id = PropertiesService.getScriptProperties().getProperty('ARMS_SPREADSHEET_ID');
  if (!id) throw new Error('Database belum disiapkan. Jalankan initializeDatabase dari editor Apps Script.');
  return SpreadsheetApp.openById(id);
}

function initializeDatabase() {
  return response_(function () {
    var activeEmail = Session.getActiveUser().getEmail().toLowerCase();
    var ownerEmail = Session.getEffectiveUser().getEmail().toLowerCase();
    if (!activeEmail || activeEmail !== ownerEmail) throw new Error('Inisialisasi hanya dapat dijalankan oleh pemilik dari editor.');
    return locked_(function () {
      var props = PropertiesService.getScriptProperties();
      if (props.getProperty('ARMS_INITIALIZED_BY') && props.getProperty('ARMS_INITIALIZED_BY') !== activeEmail) {
        throw new Error('Hanya pemilik database yang dapat melakukan inisialisasi.');
      }
      var savedId = props.getProperty('ARMS_SPREADSHEET_ID');
      var ss = savedId ? SpreadsheetApp.openById(savedId) : (SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('ARMS - Database'));
      props.setProperty('ARMS_SPREADSHEET_ID', ss.getId());
      props.setProperty('ARMS_INITIALIZED_BY', activeEmail);
      // Seluruh sheet dibuat/dilengkapi otomatis; kolom baru selalu appended di akhir.
      ARMS_SCHEMA_READY = {};
      Object.keys(ARMS_SCHEMA).forEach(function (name) { ensureSchema_(name); });
      var users = rows_('Users');
      if (!users.length) write_('Users', { id: id_('Users'), username: activeEmail, role: 'Administrator' });
      var cases = rows_('Cases');
      rows_('Customers').forEach(function (customer) {
        var linked = cases.find(function (c) { return c.customerId === customer.id; });
        var changed = false;
        if (!customer.contract && linked) { customer.contract = linked.contract; changed = true; }
        if (!customer.streetAddress && customer.address) { customer.streetAddress = customer.address; changed = true; }
        if (!customer.brandType && customer.vehicle) { customer.brandType = customer.vehicle; changed = true; }
        if (changed) write_('Customers', customer, customer.id);
      });
      migrateCrm_();
      syncCasePayments_();
      return { spreadsheetId: ss.getId(), url: ss.getUrl(), sheets: Object.keys(ARMS_SCHEMA) };
    });
  });
}

var ARMS_TEXT_KEYS = ['nik', 'phone', 'emergency', 'contract', 'bank', 'id', 'number', 'issuedAt', 'validUntil', 'date', 'dueDate', 'regencyId', 'districtId', 'plate', 'createdDate', 'dueDateSnapshot', 'activityDate', 'nextActionDate', 'code'];
var ARMS_JSON_KEYS = ['manualDetails', 'pages', 'partners', 'attachments'];
var ARMS_SCHEMA_READY = {};

/**
 * Pastikan sheet tersedia dan seluruh kolom inti ada. Kolom baru selalu ditambahkan
 * di urutan paling akhir sehingga data lama tidak pernah bergeser atau hilang.
 * Hasilnya di-cache per eksekusi agar request tetap hemat kuota.
 */
function ensureSchema_(name) {
  var schema = ARMS_SCHEMA[name];
  if (!schema) throw new Error('Struktur sheet ' + name + ' tidak dikenal.');
  var sheet = database_().getSheetByName(name) || database_().insertSheet(name);
  if (ARMS_SCHEMA_READY[name]) return sheet;
  var used = sheet.getLastColumn();
  if (used < schema.headers.length) {
    if (used) {
      var existing = sheet.getRange(1, 1, 1, used).getValues()[0];
      for (var i = 0; i < used; i++) {
        if (existing[i] && String(existing[i]) !== schema.headers[i]) throw new Error('Header sheet ' + name + ' tidak sesuai pada kolom ' + (i + 1) + '. Periksa header sebelum melanjutkan.');
      }
    }
    if (sheet.getMaxColumns() < schema.headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), schema.headers.length - sheet.getMaxColumns());
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]).setBackground('#4f46e5').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    schema.keys.forEach(function (key, index) {
      if (ARMS_TEXT_KEYS.indexOf(key) >= 0) sheet.getRange(2, index + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    });
    SpreadsheetApp.flush();
  }
  ARMS_SCHEMA_READY[name] = true;
  return sheet;
}

function rows_(name) {
  var sheet = ensureSchema_(name);
  if (sheet.getLastRow() < 2) return [];
  var keys = ARMS_SCHEMA[name].keys;
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, keys.length).getValues().filter(function (row) { return row[0]; }).map(function (row) {
    var data = {};
    keys.forEach(function (key, i) {
      var value = row[i];
      if (value instanceof Date) value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (ARMS_JSON_KEYS.indexOf(key) >= 0) {
        if (Array.isArray(value)) { /* sudah berupa array */ }
        else { try { value = JSON.parse(value || '[]'); } catch (e) { value = []; } }
        if (!Array.isArray(value)) value = [];
      }
      if (key === 'hasPayment' || key === 'paymentClosed') value = crmBool_(value);
      data[key] = value;
    });
    return data;
  });
}

/** Baca tabel tambahan tanpa menggagalkan request bila sheet belum siap. */
function optionalRows_(name) {
  try { return rows_(name); } catch (error) { return []; }
}

function authorize_(adminOnly) {
  var email = Session.getActiveUser().getEmail().toLowerCase();
  if (!email) throw new Error('Identitas Google tidak tersedia. Gunakan deployment internal Google Workspace dengan akun terverifikasi.');
  var user = rows_('Users').find(function (row) { return String(row.username).toLowerCase() === email; });
  if (!user) throw new Error('Akses ditolak. Minta administrator menambahkan email Anda ke Users.');
  if (adminOnly && user.role !== 'Administrator') throw new Error('Tindakan ini memerlukan peran Administrator.');
  return user;
}

function id_(name) { return ARMS_SCHEMA[name].prefix + '-' + Utilities.getUuid().toUpperCase(); }
function required_(value, label) {
  var text = String(value == null ? '' : value).trim();
  if (!text) throw new Error(label + ' wajib diisi.');
  return text;
}
function money_(value, label) {
  var number = Number(value || 0);
  if (!isFinite(number) || number < 0 || number > 1e15) throw new Error((label || 'Nominal') + ' tidak valid.');
  return Math.round(number);
}
function percent_(value) {
  var n = Number(value);
  if (!isFinite(n) || n < 0 || n > 100) throw new Error('Persentase harus antara 0 dan 100.');
  return n;
}
function date_(value) {
  var text = required_(value, 'Tanggal');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) throw new Error('Tanggal tidak valid.');
  return text;
}
function bucket_(days) { return days <= 30 ? '1-30 hari' : days <= 60 ? '31-60 hari' : days <= 90 ? '61-90 hari' : '>90 hari'; }
function find_(name, id) {
  var record = rows_(name).find(function (row) { return row.id === id; });
  if (!record) throw new Error('Data ' + name + ' tidak ditemukan.');
  return record;
}
function nextNumber_(prefix) {
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM');
  var key = 'SEQUENCE_' + prefix + '_' + date;
  var props = PropertiesService.getScriptProperties();
  var sequence = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(sequence));
  return prefix + '/ARMS/' + date + '/' + String(sequence).padStart(4, '0');
}

function write_(name, data, existingId, skipFlush) {
  var sheet = ensureSchema_(name);
  var values = ARMS_SCHEMA[name].keys.map(function (key) {
    var value = data[key] == null ? '' : data[key];
    if (Array.isArray(value)) value = JSON.stringify(value);
    // Escape spreadsheet formulas without changing financial numeric cells.
    if (typeof value === 'string' && /^[=+@-]/.test(value)) value = "'" + value;
    return value;
  });
  if (existingId) {
    var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    var index = ids.findIndex(function (row) { return row[0] === existingId; });
    if (index < 0) throw new Error('Data tidak ditemukan.');
    sheet.getRange(index + 2, 1, 1, values.length).setValues([values]);
  } else sheet.appendRow(values);
  if (!skipFlush) SpreadsheetApp.flush();
  return data;
}

function normalize_(name, data, existing) {
  var record = Object.assign({}, existing || {}, data);
  record.id = existing ? existing.id : id_(name);
  if (name === 'Customers') {
    record.name = required_(record.name, 'Nama debitur');
    record.contract = required_(record.contract, 'No. Kontrak');
    if (rows_(name).some(function (r) { return String(r.contract).toLowerCase() === record.contract.toLowerCase() && r.id !== record.id; })) throw new Error('No. kontrak sudah terdaftar pada debitur lain.');
    record.nik = String(record.nik || '');
    if (record.nik && !/^\d{16}$/.test(record.nik)) throw new Error('NIK lama tidak valid. Perbaiki data identitas di spreadsheet.');
    record.phone = required_(record.phone, 'Nomor Handphone');
    if (!/^[+0-9 ()-]{8,20}$/.test(record.phone)) throw new Error('Nomor handphone tidak valid.');
    record.regency = required_(record.regency, 'Kabupaten/Kota');
    record.district = required_(record.district, 'Kecamatan');
    record.village = required_(record.village, 'Kelurahan / Desa');
    record.streetAddress = required_(record.streetAddress, 'Alamat lengkap');
    record.regencyId = String(record.regencyId || '');
    record.districtId = String(record.districtId || '');
    if (record.regencyId && record.districtId && record.districtId.indexOf(record.regencyId + '.') !== 0) throw new Error('Kecamatan tidak sesuai dengan kabupaten/kota.');
    record.dueDate = date_(record.dueDate);
    record.address = [record.streetAddress, record.village, record.district, record.regency].join(', ');
    record.brandType = String(record.brandType || '').trim();
    record.plate = String(record.plate || '').trim().toUpperCase();
    record.vehicle = [record.brandType, record.plate].filter(Boolean).join(' / ');
    ['ktp', 'stnk'].forEach(function (kind) {
      record[kind + 'Photo'] = existing ? existing[kind + 'Photo'] || '' : '';
      record[kind + 'PhotoName'] = existing ? existing[kind + 'PhotoName'] || '' : '';
    });
    record.installment = money_(record.installment, 'Angsuran');
    record.penalty = money_(record.penalty, 'Denda');
    record.total = money_(record.installment + record.penalty, 'Total Angsuran');
    var linkedCases = rows_('Cases').filter(function (c) { return c.customerId === record.id; });
    var payments = rows_('Payments');
    linkedCases.forEach(function (c) {
      var paid = payments.filter(function (p) { return p.caseId === c.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
      if (paid > record.total) throw new Error('Total angsuran tidak boleh lebih kecil dari pembayaran yang telah diterima.');
    });
  }
  if (name === 'Clients' || name === 'Cases' || name === 'CollectionLogs') normalizeCrm_(name, record, existing);
  if (name === 'Proposals') normalizeProposal_(record, existing);
  if (name === 'Personnel') {
    record.name = required_(record.name, 'Nama personel');
    if (['Karyawan', 'Mitra DC'].indexOf(record.type) < 0) throw new Error('Tipe personel tidak valid.');
    record.bank = required_(record.bank, 'Rekening bank');
    record.position = crmText_(record.position, 'Posisi / Jabatan', 150);
    record.nik = String(record.nik || '').trim();
    if (record.nik && !/^\d{16}$/.test(record.nik)) throw new Error('NIK personel harus 16 digit atau dikosongkan.');
    record.ktpPhoto = existing ? existing.ktpPhoto || '' : ''; record.ktpPhotoName = existing ? existing.ktpPhotoName || '' : '';
    // SPPI (Sertifikasi Profesi Pembiayaan Indonesia) opsional untuk karyawan maupun mitra DC.
    record.sppiPhoto = existing ? existing.sppiPhoto || '' : ''; record.sppiPhotoName = existing ? existing.sppiPhotoName || '' : '';
  }
  if (name === 'SK') {
    var linked = find_('Cases', required_(record.caseId, 'Kasus'));
    find_('Personnel', required_(record.personnelId, 'Petugas'));
    if (existing && (existing.caseId !== record.caseId || existing.personnelId !== record.personnelId) && (existing.pdfUrl || rows_('CollectionLogs').some(function (log) { return log.letterId === existing.id; }))) throw new Error('Kasus dan petugas tidak dapat diganti pada SK yang sudah memiliki PDF atau laporan.');
    record.number = existing ? existing.number : nextNumber_(linked.clientType === 'PERORANGAN' ? 'SK' : 'ST');
    record.issuedAt = date_(record.issuedAt);
    record.place = required_(record.place, 'Tempat');
    record.signer = required_(record.signer, 'Penandatangan');
    record.clientRepresentative = required_(record.clientRepresentative, 'Perwakilan klien / pemberi kuasa');
    if (linked.clientType === 'PERORANGAN') record.clientAddress = required_(record.clientAddress, 'Alamat pemberi kuasa');
    record.status = record.status || 'Aktif';
    if (['Aktif', 'Draft', 'Selesai', 'Dicabut'].indexOf(record.status) < 0) throw new Error('Status surat tidak valid.');
    record.validUntil = String(record.validUntil || '');
    if (record.validUntil) { date_(record.validUntil); if (record.validUntil < record.issuedAt) throw new Error('Berlaku sampai tidak boleh sebelum tanggal terbit.'); }
    // Legacy drafts remain in Sheets; PDF metadata is only changed by uploadSKPdf.
    record.generatorData = existing ? existing.generatorData || '' : '';
    ['pdfUrl', 'pdfName', 'pdfUploadedAt', 'pdfUploadId'].forEach(function (key) { record[key] = existing ? existing[key] || '' : ''; });
    record.pdfSize = existing ? Number(existing.pdfSize || 0) : 0;
    record.updateNote = String(record.updateNote || '').trim();
    if (record.updateNote.length > 2000) throw new Error('Catatan update maksimal 2000 karakter.');
    record.updatedAt = new Date().toISOString();
  }
  if (name === 'Payments') {
    var caseRecord = find_('Cases', required_(record.caseId, 'Kasus'));
    validateCollectionPayment_(record, existing);
    if ((!existing || existing.caseId !== record.caseId) && caseSuccessful_(caseRecord)) throw new Error('Kasus sudah berhasil / selesai. Pilih kasus aktif lainnya.');
    record.amount = money_(record.amount, 'Pembayaran');
    if (!record.amount) throw new Error('Pembayaran harus lebih dari nol.');
    var paid = rows_('Payments').filter(function (p) { return p.caseId === record.caseId && p.id !== record.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
    if (record.amount > Number(caseRecord.principal) - paid) throw new Error('Pembayaran melebihi sisa piutang kasus.');
    record.feeRate = percent_(record.feeRate == null ? 10 : record.feeRate);
    record.partnerRate = percent_(record.partnerRate == null ? 40 : record.partnerRate);
    record.grossFee = Math.round(record.amount * record.feeRate / 100);
    record.partnerCommission = Math.round(record.grossFee * record.partnerRate / 100);
    record.companyRevenue = record.grossFee - record.partnerCommission;
    record.manualTotal = 0;
    record.manualDetails = (Array.isArray(record.manualDetails) ? record.manualDetails : []).map(function (row) {
      var amount = money_(row.amount, 'Biaya manual');
      var mode = row.mode === 'split' ? 'split' : 'company';
      var rate = mode === 'split' ? percent_(row.partnerPercent == null ? record.partnerRate : row.partnerPercent) : 0;
      var partner = Math.round(amount * rate / 100);
      record.manualTotal += amount;
      record.partnerCommission += partner;
      record.companyRevenue += amount - partner;
      return { id: row.id || Utilities.getUuid(), label: required_(row.label, 'Keterangan biaya'), amount: amount, mode: mode, partnerPercent: rate };
    });
    record.proof = record.proof || '';
    if (record.proof && !/^https:\/\//i.test(record.proof)) throw new Error('Bukti transfer harus berupa tautan HTTPS.');
    record.number = existing ? existing.number : nextNumber_('KW');
    record.date = date_(record.date);
    if (feePosted_('payment', record.id, 'Pemasukan') > record.grossFee + record.manualTotal || feePosted_('payment', record.id, 'Pengeluaran') > record.partnerCommission) throw new Error('Fee baru lebih kecil dari mutasi rekening yang sudah dicatat.');
    if (existing && existing.caseId !== record.caseId && rows_('Transactions').some(function (t) { return t.sourceType === 'payment' && t.sourceId === record.id; })) throw new Error('Pembayaran dengan mutasi fee tidak dapat dipindahkan ke kasus lain.');
  }
  if (name === 'Users') {
    record.username = required_(record.username, 'Email Google').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.username)) throw new Error('Email tidak valid.');
    if (['Administrator', 'Supervisor', 'Collector'].indexOf(record.role) < 0) throw new Error('Peran tidak valid.');
    if (rows_('Users').some(function (u) { return u.username === record.username && u.id !== record.id; })) throw new Error('Email sudah terdaftar.');
    if (existing && String(existing.username).toLowerCase() === Session.getActiveUser().getEmail().toLowerCase() && record.username !== String(existing.username).toLowerCase()) throw new Error('Email akun aktif tidak dapat diganti.');
    if (existing && existing.role === 'Administrator' && record.role !== 'Administrator' && rows_('Users').filter(function (u) { return u.role === 'Administrator'; }).length < 2) throw new Error('Minimal satu Administrator harus tetap aktif.');
  }
  normalizeFinance_(name, record, existing);
  return record;
}

function list_(name) {
  return response_(function () { authorize_(name === 'Users'); return joined_(name); });
}
function save_(name, data, id) {
  return response_(function () {
    var user = authorize_(name === 'Users');
    if ((name === 'Accounts' || name === 'Transactions') && user.role === 'Collector') throw new Error('Mutasi rekening dikelola Administrator atau Supervisor.');
    return locked_(function () {
      var existing = id ? find_(name, id) : null;
      var record = normalize_(name, data || {}, existing);
      var newFiles = [];
      var replacedFiles = [];
      try {
        if (name === 'Customers' || name === 'Personnel') prepareEntityPhotos_(name, record, newFiles, replacedFiles);
        write_(name, record, id);
        // Sinkron relasi hanya pada record yang berubah agar penyimpanan lebih cepat;
        // flush dilakukan sekali di akhir untuk penghematan waktu API.
        if (name === 'Customers') syncCustomerCases_(record);
        else if (name === 'Cases') { syncCaseReference_(record); syncCasePaymentsFor_([record.id]); }
        else if (name === 'Payments') syncCasePaymentsFor_([record.caseId].concat(existing && existing.caseId !== record.caseId ? [existing.caseId] : []));
        else if (name === 'Clients') syncCrmReferences_();
        else if (name === 'CollectionLogs') { var linked = find_('Cases', record.caseId); if (linked.status === 'Aktif') { linked.status = 'Dalam Proses'; write_('Cases', linked, linked.id, true); } }
        SpreadsheetApp.flush();
      } catch (error) {
        newFiles.forEach(function (file) { try { file.setTrashed(true); } catch (cleanupError) { console.warn('Dokumen baru perlu diperiksa oleh administrator.'); } });
        throw error;
      }
      if (name === 'Customers' || name === 'Personnel') {
        replacedFiles.forEach(trashCustomerDocument_);
      }
      return record;
    });
  });
}
function remove_(name, id) {
  return response_(function () {
    var user = authorize_(name === 'Users');
    if (user.role === 'Collector') throw new Error('Collector tidak memiliki izin menghapus data.');
    return locked_(function () {
      var record = find_(name, id);
      var dependencies = { SK: [['CollectionLogs', 'letterId']], Clients: [['Cases', 'clientId'], ['Transactions', 'clientId']], CollectionLogs: [['Payments', 'collectionLogId']], Customers: [['Cases', 'customerId']], Cases: [['SK', 'caseId'], ['Payments', 'caseId'], ['Executions', 'caseId'], ['Transactions', 'caseId'], ['CollectionLogs', 'caseId']], Personnel: [['Cases', 'personnelId'], ['CollectionLogs', 'personnelId'], ['SK', 'personnelId'], ['Executions', 'personnelId']], Accounts: [['Transactions', 'accountId']] };
      (dependencies[name] || []).forEach(function (dependency) {
        if (rows_(dependency[0]).some(function (row) { return row[dependency[1]] === id; })) throw new Error('Data masih digunakan di ' + dependency[0] + '. Hapus relasinya terlebih dahulu.');
      });
      if (name === 'Personnel' && optionalRows_('Proposals').some(function (proposal) { return proposalPartners_(proposal).indexOf(id) >= 0; })) throw new Error('Personel masih dipakai pada halaman Tim & Mitra sebuah proposal. Hapus dari proposal tersebut terlebih dahulu.');
      if ((name === 'Payments' || name === 'Executions') && rows_('Transactions').some(function (t) { return t.sourceId === id && t.sourceType === (name === 'Payments' ? 'payment' : 'execution'); })) throw new Error('Data masih menjadi sumber mutasi rekening. Koreksi mutasi terlebih dahulu.');
      if (name === 'Users' && (user.id === id || (record.role === 'Administrator' && rows_('Users').filter(function (u) { return u.role === 'Administrator'; }).length <= 1))) throw new Error('Administrator aktif tidak dapat dihapus.');
      var sheet = database_().getSheetByName(name);
      var index = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().findIndex(function (row) { return row[0] === id; });
      sheet.deleteRow(index + 2);
      if (name === 'Payments') syncCasePaymentsFor_([record.caseId]);
      if (name === 'Customers') [record.ktpPhoto, record.stnkPhoto].filter(Boolean).forEach(trashCustomerDocument_);
      if (name === 'Personnel') [record.ktpPhoto, record.sppiPhoto].filter(Boolean).forEach(trashCustomerDocument_);
      if (name === 'SK' && record.pdfUrl) trashCustomerDocument_(record.pdfUrl);
      return { id: id };
    });
  });
}

function joined_(name) {
  var records = rows_(name);
  if (name === 'Cases' || name === 'SK' || name === 'Payments' || name === 'CollectionLogs') {
    var customers = rows_('Customers');
    var cases = name === 'Cases' ? records : rows_('Cases');
    var staff = rows_('Personnel');
    var letters = rows_('SK');
    return records.map(function (record) {
      var c = name === 'Cases' ? record : cases.find(function (item) { return item.id === record.caseId; });
      var customer = c && customers.find(function (item) { return item.id === c.customerId; });
      var sk = name === 'SK' ? record : letters.filter(function (item) { return c && item.caseId === c.id && item.status === 'Aktif'; }).slice(-1)[0];
      var personId = name === 'SK' || name === 'CollectionLogs' ? record.personnelId : c && c.personnelId ? c.personnelId : sk ? sk.personnelId : '';
      var person = staff.find(function (item) { return item.id === personId; });
      return Object.assign({}, record, { customerName: customer ? customer.name : '', customerNik: customer ? String(customer.nik) : '', caseNumber: c ? c.number : '', client: c ? c.client : '', personnelName: person ? person.name : '' });
    });
  }
  return records;
}

function getBootstrap() {
  return response_(function () {
    var user = authorize_(false);
    return {
      clients: rows_('Clients'), collections: joined_('CollectionLogs'),
      customers: rows_('Customers'), cases: joined_('Cases'), personnel: rows_('Personnel'),
      letters: joined_('SK'), payments: joined_('Payments'), executions: rows_('Executions'), accounts: rows_('Accounts'), transactions: rows_('Transactions'), users: user.role === 'Administrator' ? rows_('Users') : [user],
      proposals: optionalRows_('Proposals'),
      currentUser: user, settings: settings_(), spreadsheetUrl: database_().getUrl()
    };
  });
}
function settings_() {
  var saved = PropertiesService.getScriptProperties().getProperty('ARMS_SETTINGS');
  return loadWorkspaceBranding_(saved ? JSON.parse(saved) : { agency: 'ARMS Agency', address: 'Jakarta, Indonesia', signer: 'Admin Pratama', feeRate: 10, partnerRate: 40, target: 500000000, reportIntervalDays: 3, signerPosition: '' });
}
function getSettings() { return response_(function () { authorize_(false); return settings_(); }); }
function updateSettings(data) {
  return response_(function () {
    authorize_(true);
    return locked_(function () {
      var settings = {
        agency: required_(data.agency, 'Nama agensi'), address: String(data.address || ''),
        signer: required_(data.signer, 'Penandatangan'), feeRate: percent_(data.feeRate),
        partnerRate: percent_(data.partnerRate), target: money_(data.target, 'Target'), signerPosition: String(data.signerPosition || '').slice(0, 150), reportIntervalDays: Math.round(Number(data.reportIntervalDays || 3)),
        proposalCity: String(data.proposalCity || '').slice(0, 100), proposalContact: String(data.proposalContact || '').slice(0, 150), proposalPhone: String(data.proposalPhone || '').slice(0, 30), proposalEmail: String(data.proposalEmail || '').slice(0, 254)
      };
      if (!isFinite(settings.reportIntervalDays) || settings.reportIntervalDays < 1 || settings.reportIntervalDays > 30) throw new Error('Interval reminder antara 1 dan 30 hari.');
      if (settings.proposalPhone && !/^[+0-9 ()-]{8,30}$/.test(settings.proposalPhone)) throw new Error('Nomor telepon proposal tidak valid.');
      if (settings.proposalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.proposalEmail)) throw new Error('Alamat email proposal tidak valid.');
      return persistWorkspaceBranding_(data, settings);
    });
  });
}

function documentFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('ARMS_DOCUMENTS_FOLDER_ID');
  if (!id) {
    var folder = DriveApp.createFolder('ARMS - Dokumen Debitur');
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    folder.setShareableByEditors(false);
    props.setProperty('ARMS_DOCUMENTS_FOLDER_ID', folder.getId());
    return folder;
  }
  var existing = DriveApp.getFolderById(id);
  if (existing.isTrashed() || existing.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error('Folder dokumen tidak tersedia atau aksesnya terlalu luas. Minta administrator memeriksa ARMS_DOCUMENTS_FOLDER_ID dan membatasi akses folder.');
  return existing;
}

function photoBlob_(upload) {
  if (!upload || typeof upload !== 'object') throw new Error('Data foto tidak valid.');
  var dataUrl = String(upload.dataUrl || '');
  if (dataUrl.length > 2800000) throw new Error('Ukuran foto maksimal 2 MB.');
  var match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[1] !== upload.mimeType) throw new Error('Gunakan foto JPG, PNG, atau WebP.');
  var bytes = Utilities.base64Decode(match[2]);
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error('Ukuran foto maksimal 2 MB.');
  var at = function (i) { return ((bytes[i] || 0) + 256) % 256; };
  var valid = match[1] === 'image/jpeg' ? at(0) === 255 && at(1) === 216 && at(2) === 255 : match[1] === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every(function (value, i) { return at(i) === value; }) : [82, 73, 70, 70].every(function (value, i) { return at(i) === value; }) && [87, 69, 66, 80].every(function (value, i) { return at(i + 8) === value; });
  if (!valid) throw new Error('Isi file tidak sesuai dengan format gambar.');
  var extension = match[1] === 'image/jpeg' ? '.jpg' : match[1] === 'image/png' ? '.png' : '.webp';
  return Utilities.newBlob(bytes, match[1], 'dokumen' + extension);
}

function prepareEntityPhotos_(name, record, newFiles, replacedFiles) {
  var kinds = name === 'Personnel' ? ['ktp', 'sppi'] : ['ktp', 'stnk'];
  var staged = kinds.map(function (kind) {
    var upload = record[kind + 'Upload'];
    return { kind: kind, upload: upload, blob: upload ? photoBlob_(upload) : null };
  });
  staged.forEach(function (item) {
    var key = item.kind + 'Photo';
    if (item.upload !== undefined) {
      if (record[key]) replacedFiles.push(record[key]);
      if (item.blob) {
        var file = documentFolder_().createFile(item.blob.setName(record.id + '-' + item.kind.toUpperCase() + '-' + Utilities.getUuid().slice(0, 8) + item.blob.getName().slice(item.blob.getName().lastIndexOf('.'))));
        newFiles.push(file);
        record[key] = file.getUrl();
        record[key + 'Name'] = String(item.upload.name || item.kind.toUpperCase()).replace(/[\\/\r\n]/g, '_').slice(0, 150);
      } else { record[key] = ''; record[key + 'Name'] = ''; }
    }
    delete record[item.kind + 'Upload'];
  });
}

function customerFile_(url) {
  var match = String(url || '').match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\//);
  var folderId = PropertiesService.getScriptProperties().getProperty('ARMS_DOCUMENTS_FOLDER_ID');
  if (!match || !folderId) throw new Error('Referensi dokumen tidak valid.');
  var file = DriveApp.getFileById(match[1]);
  var parents = file.getParents();
  var belongs = false;
  while (parents.hasNext()) { if (parents.next().getId() === folderId) belongs = true; }
  if (!belongs || file.isTrashed()) throw new Error('Dokumen tidak ditemukan di folder ARMS.');
  return file;
}
function trashCustomerDocument_(url) {
  if (!url) return;
  try { customerFile_(url).setTrashed(true); }
  catch (error) { console.warn('Dokumen lama perlu dibersihkan oleh administrator.'); }
}
function getCustomerDocument(customerId, kind) {
  return response_(function () {
    authorize_(false);
    if (['ktp', 'stnk'].indexOf(kind) < 0) throw new Error('Jenis dokumen tidak valid.');
    var customer = find_('Customers', customerId);
    var file = customerFile_(customer[kind + 'Photo']);
    if (file.getSize() > 2 * 1024 * 1024) throw new Error('Ukuran dokumen melebihi batas.');
    var blob = file.getBlob();
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(blob.getContentType()) < 0) throw new Error('Format dokumen tidak didukung.');
    return { name: customer[kind + 'PhotoName'] || file.getName(), mimeType: blob.getContentType(), dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
  });
}

function caseSuccessful_(c) {
  var paid = rows_('Payments').filter(function (p) { return p.caseId === c.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
  return c.status === 'Selesai' || (Number(c.principal) > 0 && paid >= Number(c.principal));
}
function syncCasePayments_() {
  var payments = rows_('Payments');
  rows_('Cases').forEach(function (c) {
    var paid = payments.filter(function (p) { return p.caseId === c.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
    var complete = Number(c.principal) > 0 && paid >= Number(c.principal);
    var autoClosed = c.paymentClosed === true || String(c.paymentClosed).toLowerCase() === 'true';
    if (complete && c.status !== 'Selesai') { c.status = 'Selesai'; c.paymentClosed = true; write_('Cases', c, c.id); }
    else if (!complete && autoClosed) { c.status = 'Dalam Proses'; c.paymentClosed = false; write_('Cases', c, c.id); }
  });
}
/** Versi terarah: hanya kasus yang disebut yang disinkronkan (lebih cepat saat simpan). */
function syncCasePaymentsFor_(caseIds) {
  var ids = (Array.isArray(caseIds) ? caseIds : [caseIds]).filter(Boolean);
  if (!ids.length) return;
  var payments = rows_('Payments');
  rows_('Cases').forEach(function (c) {
    if (ids.indexOf(c.id) < 0) return;
    var paid = payments.filter(function (p) { return p.caseId === c.id; }).reduce(function (sum, p) { return sum + Number(p.amount); }, 0);
    var complete = Number(c.principal) > 0 && paid >= Number(c.principal);
    var autoClosed = c.paymentClosed === true || String(c.paymentClosed).toLowerCase() === 'true';
    if (complete && c.status !== 'Selesai') { c.status = 'Selesai'; c.paymentClosed = true; write_('Cases', c, c.id, true); }
    else if (!complete && autoClosed) { c.status = 'Dalam Proses'; c.paymentClosed = false; write_('Cases', c, c.id, true); }
  });
}
/** Sinkronkan referensi hanya untuk kasus milik debitur yang disimpan. */
function syncCustomerCases_(customer) {
  var cases = rows_('Cases'), related = [];
  cases.forEach(function (c) {
    if (c.customerId !== customer.id) return;
    var before = JSON.stringify(c);
    c.contract = customer.contract || c.contract;
    c.principal = Number(customer.total);
    c.asset = crmVehicle_(customer);
    if (customer.dueDate && c.createdDate) {
      try { c.overdue = crmOverdue_(customer.dueDate, c.createdDate); c.bucket = bucket_(c.overdue); c.dueDateSnapshot = customer.dueDate; }
      catch (error) { console.warn('Tanggal debitur lama belum valid; lengkapi sebelum mengedit kasus.'); }
    }
    if (JSON.stringify(c) !== before) write_('Cases', c, c.id, true);
    related.push(c.id);
  });
  syncCasePaymentsFor_(related);
}
/** Sinkronkan referensi satu kasus (klien, debitur, transaksi terkait). */
function syncCaseReference_(record) {
  var before = JSON.stringify(record);
  var clients = rows_('Clients'), customers = rows_('Customers');
  var client = clients.find(function (r) { return r.id === record.clientId; });
  var customer = customers.find(function (r) { return r.id === record.customerId; });
  if (client) { record.client = client.name; record.clientType = client.industry; }
  if (customer) {
    record.contract = customer.contract || record.contract;
    record.principal = Number(customer.total);
    record.asset = crmVehicle_(customer);
    if (customer.dueDate && record.createdDate) {
      try { record.overdue = crmOverdue_(customer.dueDate, record.createdDate); record.bucket = bucket_(record.overdue); record.dueDateSnapshot = customer.dueDate; }
      catch (error) { console.warn('Tanggal debitur lama belum valid; lengkapi sebelum mengedit kasus.'); }
    }
  }
  if (JSON.stringify(record) !== before) write_('Cases', record, record.id, true);
  rows_('Transactions').forEach(function (t) {
    if (t.caseId !== record.id) return;
    var beforeT = JSON.stringify(t);
    var clientId = record.clientId || t.clientId;
    var txClient = clients.find(function (r) { return r.id === clientId; });
    if (txClient && (t.clientId !== txClient.id || t.client !== txClient.name)) { t.clientId = txClient.id; t.client = txClient.name; write_('Transactions', t, t.id, true); }
  });
}
function feePosted_(type, sourceId, direction, excludedId) {
  return rows_('Transactions').filter(function (t) { return t.sourceType === type && t.sourceId === sourceId && t.type === direction && t.id !== excludedId; }).reduce(function (sum, t) { return sum + Number(t.amount); }, 0);
}
function normalizeFinance_(name, record, existing) {
  if (name === 'Executions') {
    var c = find_('Cases', required_(record.caseId, 'Kasus'));
    if ((!existing || existing.caseId !== c.id) && caseSuccessful_(c)) throw new Error('Kasus sudah selesai dan tidak dapat ditugaskan untuk penarikan.');
    find_('Personnel', required_(record.personnelId, 'Petugas'));
    if (['Penyerahan Sukarela', 'Eksekusi Sesuai Dokumen'].indexOf(record.method) < 0) throw new Error('Metode penarikan tidak valid.');
    if (['Dijadwalkan', 'Dalam Proses', 'Selesai', 'Dibatalkan'].indexOf(record.status) < 0) throw new Error('Status penarikan tidak valid.');
    if (record.status !== 'Dibatalkan' && rows_('Executions').some(function (e) { return e.caseId === record.caseId && e.id !== record.id && e.status !== 'Dibatalkan'; })) throw new Error('Kasus sudah memiliki penugasan tarik unit. Edit penugasan tersebut.');
    record.date = date_(record.date); record.location = required_(record.location, 'Lokasi'); record.authorityRef = required_(record.authorityRef, 'Referensi kuasa / dokumen sah');
    if (record.status === 'Selesai') record.handoverRef = required_(record.handoverRef, 'Nomor BAST / serah terima');
    record.feeBase = money_(record.feeBase, 'Dasar fee'); record.feeRate = percent_(record.feeRate); record.partnerRate = percent_(record.partnerRate);
    record.grossFee = Math.round(record.feeBase * record.feeRate / 100); record.partnerCommission = Math.round(record.grossFee * record.partnerRate / 100); record.companyRevenue = record.grossFee - record.partnerCommission;
    record.number = existing ? existing.number : nextNumber_('TU');
    var related = rows_('Transactions').some(function (t) { return t.sourceType === 'execution' && t.sourceId === record.id; });
    if (related && (record.status !== 'Selesai' || existing.caseId !== record.caseId)) throw new Error('Penarikan sudah memiliki mutasi fee. Koreksi mutasi dahulu.');
    if (feePosted_('execution', record.id, 'Pemasukan') > record.grossFee || feePosted_('execution', record.id, 'Pengeluaran') > record.partnerCommission) throw new Error('Fee baru lebih kecil dari mutasi rekening yang telah dicatat.');
  }
  if (name === 'Accounts') {
    record.name = required_(record.name, 'Nama rekening'); record.bank = required_(record.bank, 'Bank / kas'); record.number = required_(record.number, 'Nomor rekening / kode kas'); record.holder = required_(record.holder, 'Atas nama'); record.openingBalance = money_(record.openingBalance, 'Saldo awal');
    if (rows_('Accounts').some(function (a) { return a.id !== record.id && String(a.bank).toLowerCase() === record.bank.toLowerCase() && String(a.number) === record.number; })) throw new Error('Rekening sudah terdaftar.');
  }
  if (name === 'Transactions') {
    find_('Accounts', required_(record.accountId, 'Rekening'));
    if (['Pemasukan', 'Pengeluaran'].indexOf(record.type) < 0) throw new Error('Jenis mutasi tidak valid.');
    if (['manual', 'multifinance', 'payment', 'execution', 'case'].indexOf(record.sourceType) < 0) throw new Error('Sumber mutasi tidak valid.');
    record.amount = money_(record.amount, 'Nominal'); if (!record.amount) throw new Error('Nominal harus lebih dari nol.');
    record.date = date_(record.date); record.description = required_(record.description, 'Keterangan'); record.reference = required_(record.reference, 'Referensi'); record.category = required_(record.category, 'Kategori');
    if (rows_('Transactions').some(function (t) { return t.id !== record.id && t.accountId === record.accountId && t.type === record.type && String(t.reference).toLowerCase() === record.reference.toLowerCase(); })) throw new Error('Referensi transaksi sudah dicatat di rekening ini.');
    if (record.sourceType === 'payment' || record.sourceType === 'execution') {
      var source = find_(record.sourceType === 'payment' ? 'Payments' : 'Executions', required_(record.sourceId, 'Sumber fee'));
      if (record.sourceType === 'execution' && source.status !== 'Selesai') throw new Error('Fee tarik unit hanya dapat dicatat setelah penarikan selesai.');
      var sourceCase = find_('Cases', source.caseId);
      record.caseId = source.caseId; record.client = sourceCase.client; record.clientId = sourceCase.clientId || '';
      var expected = record.type === 'Pemasukan' ? Number(source.grossFee) + Number(source.manualTotal || 0) : Number(source.partnerCommission);
      if (record.amount > Math.max(0, expected - feePosted_(record.sourceType, record.sourceId, record.type, record.id))) throw new Error('Nominal melebihi sisa fee / komisi yang belum dicatat.');
      record.category = record.type === 'Pengeluaran' ? 'Komisi Mitra' : record.sourceType === 'execution' ? 'Fee Tarik Unit' : 'Fee Penagihan';
    } else if (record.sourceType === 'case') {
      var caseRecord = find_('Cases', required_(record.sourceId, 'Kasus selesai'));
      if (!caseSuccessful_(caseRecord)) throw new Error('Pilih kasus yang sudah terselesaikan.');
      record.caseId = caseRecord.id; record.client = caseRecord.client; record.clientId = caseRecord.clientId || '';
    } else {
      record.sourceId = ''; record.caseId = '';
      if (record.sourceType === 'multifinance') { var client = find_('Clients', required_(record.clientId, 'Client / Creditor')); record.client = client.name; }
      else record.clientId = '';
    }
    record.number = existing ? existing.number : nextNumber_('TRX');
  }
}

function getUsers() { return list_('Users'); }
function addUser(data) { return save_('Users', data); }
function updateUser(id, data) { return save_('Users', data, id); }
function deleteUser(id) { return remove_('Users', id); }
function getCustomers() { return list_('Customers'); }
function addCustomer(data) { return save_('Customers', data); }
function updateCustomer(id, data) { return save_('Customers', data, id); }
function deleteCustomer(id) { return remove_('Customers', id); }
function getCases() { return list_('Cases'); }
function addCase(data) { return save_('Cases', data); }
function updateCase(id, data) { return save_('Cases', data, id); }
function deleteCase(id) { return remove_('Cases', id); }
function getPersonnel() { return list_('Personnel'); }
function addPersonnel(data) { return save_('Personnel', data); }
function updatePersonnel(id, data) { return save_('Personnel', data, id); }
function deletePersonnel(id) { return remove_('Personnel', id); }
function getSK() { return list_('SK'); }
function addSK(data) { return save_('SK', data); }
function updateSK(id, data) { return save_('SK', data, id); }
function deleteSK(id) { return remove_('SK', id); }
function getPayments() { return list_('Payments'); }
function addPayment(data) { return save_('Payments', data); }
function updatePayment(id, data) { return save_('Payments', data, id); }
function deletePayment(id) { return remove_('Payments', id); }
function getExecutions() { return list_('Executions'); }
function addExecution(data) { return save_('Executions', data); }
function updateExecution(id, data) { return save_('Executions', data, id); }
function deleteExecution(id) { return remove_('Executions', id); }
function getAccounts() { return list_('Accounts'); }
function addAccount(data) { return save_('Accounts', data); }
function updateAccount(id, data) { return save_('Accounts', data, id); }
function deleteAccount(id) { return remove_('Accounts', id); }
function getTransactions() { return list_('Transactions'); }
function addTransaction(data) { return save_('Transactions', data); }
function updateTransaction(id, data) { return save_('Transactions', data, id); }
function deleteTransaction(id) { return remove_('Transactions', id); }
function getClients() { return list_('Clients'); }
function addClient(data) { return save_('Clients', data); }
function updateClient(id, data) { return save_('Clients', data, id); }
function deleteClient(id) { return remove_('Clients', id); }
function getCollectionLogs() { return list_('CollectionLogs'); }
function addCollectionLog(data) { return save_('CollectionLogs', data); }
function updateCollectionLog(id, data) { return save_('CollectionLogs', data, id); }
function deleteCollectionLog(id) { return remove_('CollectionLogs', id); }
/* =====================================================================
   BAGIAN CRM (dahulu Crm.gs) - digabung agar deployment cukup satu file.
   ===================================================================== */
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
  // Nama klien pada proposal mengikuti master klien; isi halaman tidak diubah otomatis.
  optionalRows_('Proposals').forEach(function (proposal) {
    if (!proposal.clientId) return;
    var target = clients.find(function (r) { return r.id === proposal.clientId; });
    if (target && proposal.clientName !== target.name) { proposal.clientName = target.name; write_('Proposals', proposal, proposal.id); }
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
    db.Personnel.forEach(function (p) {
      if (!p.position) issue('Personnel', p.id, 'Posisi / Jabatan belum dilengkapi.');
      if (p.nik && !/^\d{16}$/.test(String(p.nik))) issue('Personnel', p.id, 'NIK tidak valid.');
      if (p.type === 'Mitra DC' && !p.ktpPhoto) issue('Personnel', p.id, 'Mitra DC belum memiliki foto KTP untuk lampiran proposal.');
      if (p.type === 'Mitra DC' && !p.sppiPhoto) issue('Personnel', p.id, 'Mitra DC belum memiliki foto sertifikat SPPI (opsional, tetapi diminta pada proposal).');
    });
    db.Proposals.forEach(function (proposal) {
      if (!Array.isArray(proposal.pages) || !proposal.pages.length) issue('Proposals', proposal.id, 'Halaman proposal kosong atau tidak terbaca.');
      if (proposal.clientId && !exists('Clients', proposal.clientId)) issue('Proposals', proposal.id, 'Client_ID proposal tidak valid.');
      if (PROPOSAL_STATUSES.indexOf(proposal.status) < 0) issue('Proposals', proposal.id, 'Status proposal tidak valid.');
      proposalPartners_(proposal).forEach(function (personId) { if (!exists('Personnel', personId)) issue('Proposals', proposal.id, 'Mitra ' + personId + ' pada halaman Tim & Mitra sudah tidak ada.'); });
      if (JSON.stringify(proposal.pages || []).length > PROPOSAL_CELL_LIMIT) issue('Proposals', proposal.id, 'Isi halaman melebihi batas satu sel spreadsheet.');
    });
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
/* =====================================================================
   BAGIAN WORKSPACE (dahulu Workspace.gs) - digabung ke dalam Code.gs.
   ===================================================================== */
var ARMS_BRANDING_LIMITS = { logo: 140000, letterhead: 1000000 };

/** Baca satu berkas branding (logo / kop surat) dari Drive sebagai data URL. */
function brandingImage_(fileId, limit) {
  if (!fileId) return '';
  try {
    var file = DriveApp.getFileById(fileId);
    if (file.isTrashed() || file.getSize() > limit) return '';
    var blob = file.getBlob();
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(blob.getContentType()) < 0) return '';
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (error) { console.warn('Berkas branding workspace tidak dapat dibaca.'); return ''; }
}
/** Satu workspace tunggal: logo perusahaan dan kop surat dipakai seluruh dokumen. */
function loadWorkspaceBranding_(settings) {
  var result = Object.assign({}, settings);
  result.logo = brandingImage_(settings.logoFileId, ARMS_BRANDING_LIMITS.logo);
  result.letterhead = brandingImage_(settings.letterheadFileId, ARMS_BRANDING_LIMITS.letterhead);
  delete result.logoFileId;
  delete result.letterheadFileId;
  return result;
}
function storeBrandingImage_(data, settings, previous, key, label, prefix, maxDataUrl) {
  var current = brandingImage_(previous[key + 'FileId'], ARMS_BRANDING_LIMITS[key]);
  settings[key + 'FileId'] = previous[key + 'FileId'] || '';
  settings[key + 'Name'] = previous[key + 'Name'] || '';
  if (!Object.prototype.hasOwnProperty.call(data, key) || data[key] === current) return null;
  if (!data[key]) { settings[key + 'FileId'] = ''; settings[key + 'Name'] = ''; return null; }
  if (typeof data[key] !== 'string' || data[key].length > maxDataUrl) throw new Error(label + ' terlalu besar. Perkecil gambar lalu unggah ulang melalui Pengaturan.');
  var match = String(data[key]).match(/^data:(image\/(?:png|jpeg|webp));base64,/);
  if (!match) throw new Error('Format ' + label.toLowerCase() + ' tidak valid.');
  var blob = photoBlob_({ mimeType: match[1], dataUrl: data[key] });
  var extension = match[1] === 'image/png' ? 'png' : match[1] === 'image/jpeg' ? 'jpg' : 'webp';
  var file = documentFolder_().createFile(blob.setName(prefix + '-' + Utilities.getUuid() + '.' + extension));
  settings[key + 'FileId'] = file.getId();
  settings[key + 'Name'] = String(data[key + 'Name'] || label).slice(0, 150);
  return file;
}
function persistWorkspaceBranding_(data, settings) {
  var props = PropertiesService.getScriptProperties(), raw = props.getProperty('ARMS_SETTINGS');
  var previous = raw ? JSON.parse(raw) : {}, created = [];
  try {
    created.push(storeBrandingImage_(data, settings, previous, 'logo', 'Logo perusahaan', 'ARMS-LOGO', 180000));
    created.push(storeBrandingImage_(data, settings, previous, 'letterhead', 'Kop surat', 'ARMS-KOP', 1300000));
    props.setProperty('ARMS_SETTINGS', JSON.stringify(settings));
  } catch (error) {
    created.forEach(function (file) { if (file) { try { file.setTrashed(true); } catch (cleanup) { console.warn('Berkas branding baru perlu diperiksa.'); } } });
    throw error;
  }
  ['logo', 'letterhead'].forEach(function (key) {
    var old = previous[key + 'FileId'];
    if (old && old !== settings[key + 'FileId']) { try { DriveApp.getFileById(old).setTrashed(true); } catch (error) { console.warn('Berkas branding lama perlu dibersihkan.'); } }
  });
  return loadWorkspaceBranding_(settings);
}
/** Unduh dokumen personel (KTP atau sertifikat SPPI) dari folder Drive terbatas. */
function getPersonnelFile(id, kind) {
  return response_(function () {
    authorize_(false);
    var type = ['ktp', 'sppi'].indexOf(kind) >= 0 ? kind : 'ktp', label = type === 'sppi' ? 'SPPI' : 'KTP';
    var person = find_('Personnel', id), file = customerFile_(person[type + 'Photo']);
    if (file.getSize() > 2 * 1024 * 1024) throw new Error('Ukuran ' + label + ' melebihi batas.');
    var blob = file.getBlob();
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(blob.getContentType()) < 0) throw new Error('Format ' + label + ' tidak didukung.');
    return { kind: type, name: person[type + 'PhotoName'] || file.getName(), mimeType: blob.getContentType(), dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
  });
}
/** Foto KTP + SPPI beberapa personel sekaligus untuk lampiran halaman Tim & Mitra proposal. */
function getPersonnelFiles(ids) {
  return response_(function () {
    authorize_(false);
    var wanted = (Array.isArray(ids) ? ids : []).map(String).filter(Boolean).slice(0, 12);
    if (!wanted.length) return [];
    var staff = rows_('Personnel'), result = [];
    wanted.forEach(function (id) {
      var person = staff.find(function (row) { return row.id === id; });
      if (!person) return;
      var entry = { id: id, name: person.name, position: person.position || '', type: person.type || '', nik: String(person.nik || ''), ktp: null, sppi: null };
      ['ktp', 'sppi'].forEach(function (kind) {
        try {
          var file = customerFile_(person[kind + 'Photo']);
          if (file.getSize() > 1500000) { entry[kind] = { error: 'Ukuran file melebihi 1,5 MB. Perkecil foto agar dapat ditampilkan.' }; return; }
          var blob = file.getBlob();
          if (['image/png', 'image/jpeg', 'image/webp'].indexOf(blob.getContentType()) < 0) { entry[kind] = { error: 'Format file tidak didukung.' }; return; }
          entry[kind] = { name: person[kind + 'PhotoName'] || file.getName(), mimeType: blob.getContentType(), dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
        } catch (error) { entry[kind] = null; }
      });
      result.push(entry);
    });
    return result;
  });
}

function importCustomers(input, batchId) {
  return response_(function () {
    authorize_(false);
    if (!Array.isArray(input) || !input.length || input.length > 300 || !/^[a-f0-9-]{36}$/.test(String(batchId))) throw new Error('Impor maksimal 300 baris dengan batch ID yang valid.');
    return locked_(function () {
      var current = rows_('Customers'), contracts = Object.create(null), seen = Object.create(null), prefix = 'CUS-BULK-' + batchId + '-';
      var replay = current.filter(function (c) { return String(c.id).indexOf(prefix) === 0; });
      if (replay.length) {
        if (replay.length !== input.length || replay.some(function (r) { var index = Number(String(r.id).slice(prefix.length)); return !input[index] || String(input[index].contract).trim() !== r.contract; })) throw new Error('Batch sebelumnya tidak sesuai. Muat ulang dan periksa data sebelum mengulang.');
        return replay;
      }
      current.forEach(function (c) { contracts[String(c.contract).trim().toLowerCase()] = true; });
      var records = input.map(function (raw, index) {
        try {
          function text(key, required, max) {
            if (raw[key] != null && typeof raw[key] !== 'string' && typeof raw[key] !== 'number') throw new Error('Field ' + key + ' tidak valid.');
            var v = String(raw[key] == null ? '' : raw[key]).trim();
            if (required && !v) throw new Error(key + ' wajib diisi.');
            if (v.length > (max || 500)) throw new Error(key + ' terlalu panjang.');
            return v;
          }
          var contract = text('contract', true, 100), name = text('name', true, 150), phone = text('phone', true, 20), nik = text('nik', false, 16);
          if (typeof raw.contract !== 'string' || typeof raw.phone !== 'string' || (raw.nik && typeof raw.nik !== 'string')) throw new Error('Kontrak, telepon, dan NIK harus berupa teks.');
          if (contracts[contract.toLowerCase()] || seen[contract.toLowerCase()]) throw new Error('Nomor kontrak duplikat.');
          if (!/^[+0-9 ()-]{8,20}$/.test(phone) || (nik && !/^\d{16}$/.test(nik))) throw new Error('Nomor handphone / NIK tidak valid.');
          if (raw.installment === undefined || raw.installment === null || raw.installment === '') throw new Error('Angsuran wajib diisi.');
          var installment = Number(raw.installment), penalty = Number(raw.penalty || 0);
          if (!Number.isSafeInteger(installment) || !Number.isSafeInteger(penalty) || installment < 0 || penalty < 0 || installment + penalty > 1e15) throw new Error('Nominal harus rupiah bulat positif.');
          if (raw.total != null && raw.total !== '' && Number(raw.total) !== installment + penalty) throw new Error('Total Angsuran tidak sama dengan Angsuran + Denda.');
          var r = { id: prefix + index, contract: contract, name: name, nik: nik, phone: phone, regencyId: '', regency: text('regency', true), districtId: '', district: text('district', true), village: text('village', true), streetAddress: text('streetAddress', true), dueDate: date_(raw.dueDate), installment: installment, penalty: penalty, total: installment + penalty, brandType: text('brandType'), plate: text('plate').toUpperCase(), occupation: '', emergency: '' };
          r.address = [r.streetAddress, r.village, r.district, r.regency].join(', '); r.vehicle = [r.brandType, r.plate].filter(Boolean).join(' / ');
          seen[contract.toLowerCase()] = true;
          return r;
        } catch (error) { throw new Error('Baris ' + (index + 2) + ': ' + error.message); }
      });
      // Validate every row before the single range write. No existing debtor is overwritten.
      var sheet = database_().getSheetByName('Customers'), start = sheet.getLastRow() + 1, keys = ARMS_SCHEMA.Customers.keys;
      if (sheet.getMaxRows() < start + records.length - 1) sheet.insertRowsAfter(sheet.getMaxRows(), start + records.length - 1 - sheet.getMaxRows());
      var cells = records.map(function (r) { return keys.map(function (key) { var value = r[key] == null ? '' : r[key]; return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value; }); });
      sheet.getRange(start, 1, records.length, keys.length).setValues(cells);
      SpreadsheetApp.flush();
      return records;
    });
  });
}

function pdfBlob_(upload) {
  if (!upload || typeof upload !== 'object' || upload.mimeType !== 'application/pdf') throw new Error('Hanya dokumen PDF yang dapat diunggah.');
  var name = String(upload.name || '').replace(/[\\/\x00-\x1f\x7f]/g, '_').trim();
  if (!/\.pdf$/i.test(name)) throw new Error('Nama file harus berakhiran .pdf.');
  name = name.slice(0, -4).slice(0, 145) + '.pdf';
  var dataUrl = String(upload.dataUrl || '');
  if (dataUrl.length > 7000000) throw new Error('Ukuran PDF maksimal 5 MB.');
  var match = dataUrl.match(/^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new Error('Format data PDF tidak valid.');
  var bytes = Utilities.base64Decode(match[1]);
  if (!bytes.length || bytes.length > 5 * 1024 * 1024 || bytes.length !== Number(upload.size)) throw new Error('Ukuran PDF tidak sesuai atau melebihi 5 MB.');
  var asText = function (array) { return array.map(function (byte) { return String.fromCharCode((byte + 256) % 256); }).join(''); };
  if (!/^%PDF-\d\.\d/.test(asText(bytes.slice(0, 8))) || asText(bytes.slice(Math.max(0, bytes.length - 4096))).indexOf('%%EOF') < 0) throw new Error('File bukan PDF yang valid atau dokumennya belum lengkap.');
  return Utilities.newBlob(bytes, 'application/pdf', name);
}

function uploadSKPdf(letterId, upload, uploadId, expectedPdfUrl) {
  return response_(function () {
    authorize_(false);
    if (!/^[a-f0-9-]{36}$/.test(String(uploadId || ''))) throw new Error('ID unggahan tidak valid.');
    return locked_(function () {
      var letter = find_('SK', required_(letterId, 'Penugasan'));
      if (!letter.number) throw new Error('Simpan penugasan terlebih dahulu sebelum mengunggah PDF.');
      if (letter.pdfUploadId === uploadId) return letter;
      if (String(letter.pdfUrl || '') !== String(expectedPdfUrl || '')) throw new Error('PDF penugasan sudah berubah. Muat ulang workspace sebelum mengganti dokumen.');
      var blob = pdfBlob_(upload), filename = blob.getName();
      var file = documentFolder_().createFile(blob.setName(letter.id + '-SURAT-' + uploadId + '.pdf'));
      var oldUrl = letter.pdfUrl || '';
      try {
        letter.pdfUrl = file.getUrl(); letter.pdfName = filename; letter.pdfSize = file.getSize();
        letter.pdfUploadedAt = new Date().toISOString(); letter.pdfUploadId = uploadId;
        write_('SK', letter, letter.id);
      } catch (error) {
        // If Sheets acknowledged the write but flush failed, keep the committed document.
        var committed = null;
        try { committed = find_('SK', letter.id).pdfUploadId === uploadId; } catch (readError) {}
        if (committed === false) { try { file.setTrashed(true); } catch (cleanupError) { console.warn('PDF baru perlu diperiksa administrator.'); } }
        if (committed !== true) throw error;
      }
      if (oldUrl && oldUrl !== letter.pdfUrl) trashCustomerDocument_(oldUrl);
      return letter;
    });
  });
}

function getSKPdf(letterId) {
  return response_(function () {
    authorize_(false);
    var letter = find_('SK', required_(letterId, 'Penugasan'));
    if (!letter.pdfUrl) throw new Error('PDF surat belum diunggah.');
    var file = customerFile_(letter.pdfUrl);
    if (file.getSize() > 5 * 1024 * 1024) throw new Error('Dokumen PDF melebihi batas 5 MB.');
    var blob = file.getBlob();
    if (blob.getContentType() !== 'application/pdf') throw new Error('Dokumen tersimpan bukan PDF.');
    return { name: letter.pdfName || 'surat-penugasan.pdf', mimeType: 'application/pdf', dataUrl: 'data:application/pdf;base64,' + Utilities.base64Encode(blob.getBytes()), size: file.getSize() };
  });
}
/* =====================================================================
   BAGIAN PROPOSAL - proposal kerja sama editable per halaman,
   termasuk halaman Tim & Mitra DC dengan foto KTP dan sertifikat SPPI.
   ===================================================================== */
var PROPOSAL_STATUSES = ['Draft', 'Terkirim', 'Diterima', 'Ditolak'];
var PROPOSAL_PAGE_KINDS = ['cover', 'toc', 'content'];
var PROPOSAL_BLOCK_TYPES = ['letterhead', 'heading', 'paragraph', 'bullets', 'pairs', 'table', 'partners', 'signature'];
var PROPOSAL_CELL_LIMIT = 45000;

function proposalText_(value, label, max, required) {
  var text = String(value == null ? '' : value).replace(/\r/g, '').trim();
  if (required && !text) throw new Error(label + ' wajib diisi.');
  if (text.length > max) throw new Error(label + ' maksimal ' + max + ' karakter.');
  return text;
}
function proposalPartners_(record) {
  var seen = {}, list = [];
  (Array.isArray(record && record.partners) ? record.partners : []).forEach(function (id) {
    var key = String(id == null ? '' : id).trim();
    if (key && !seen[key]) { seen[key] = true; list.push(key); }
  });
  return list;
}
function proposalList_(value, label, maxItems, maxText) {
  if (value == null || value === '') return [];
  if (!Array.isArray(value)) throw new Error(label + ' harus berupa daftar.');
  if (value.length > maxItems) throw new Error(label + ' maksimal ' + maxItems + ' baris.');
  return value.map(function (item, index) {
    return proposalText_(typeof item === 'object' && item !== null ? item.text || item.value || item.label || '' : item, label + ' baris ' + (index + 1), maxText, false);
  });
}
function proposalBlock_(block, index) {
  if (!block || typeof block !== 'object') throw new Error('Blok ' + (index + 1) + ' tidak valid.');
  var type = String(block.type || 'paragraph');
  if (PROPOSAL_BLOCK_TYPES.indexOf(type) < 0) throw new Error('Jenis blok ' + type + ' tidak dikenal.');
  var label = 'Halaman, blok ' + (index + 1);
  if (type === 'letterhead') return { type: 'letterhead', full: block.full !== false, caption: proposalText_(block.caption, label, 200) };
  if (type === 'heading') {
    var level = [1, 2, 3].indexOf(Number(block.level)) >= 0 ? Number(block.level) : 2;
    return { type: 'heading', level: level, text: proposalText_(block.text, label, 200) };
  }
  if (type === 'paragraph') return { type: 'paragraph', text: proposalText_(block.text, label, 5000), align: block.align === 'center' ? 'center' : 'justify' };
  if (type === 'bullets') {
    var items = proposalList_(block.items, label + ' daftar', 40, 500).filter(Boolean);
    return { type: 'bullets', ordered: block.ordered === true, items: items };
  }
  if (type === 'pairs') {
    var rows = (Array.isArray(block.rows) ? block.rows : []).slice(0, 40).map(function (row, i) {
      if (!row || typeof row !== 'object') throw new Error(label + ' baris ' + (i + 1) + ' tidak valid.');
      return { label: proposalText_(row.label, label + ' baris ' + (i + 1), 150), value: proposalText_(row.value, label + ' baris ' + (i + 1), 500) };
    }).filter(function (row) { return row.label || row.value; });
    return { type: 'pairs', title: proposalText_(block.title, label, 150), rows: rows };
  }
  if (type === 'table') {
    var columns = proposalList_(block.columns, label + ' kolom tabel', 8, 60);
    var body = (Array.isArray(block.rows) ? block.rows : []).slice(0, 60).map(function (row, i) {
      if (!Array.isArray(row)) throw new Error(label + ' baris tabel ' + (i + 1) + ' tidak valid.');
      return row.slice(0, 8).map(function (cell) { return proposalText_(cell, label + ' sel tabel', 300); });
    }).filter(function (row) { return row.some(function (cell) { return cell; }); });
    return { type: 'table', title: proposalText_(block.title, label, 150), columns: columns, rows: body };
  }
  if (type === 'partners') {
    return {
      type: 'partners',
      title: proposalText_(block.title, label, 150),
      note: proposalText_(block.note, label, 500),
      showKtp: block.showKtp !== false,
      showSppi: block.showSppi !== false,
      showNik: block.showNik === true
    };
  }
  return {
    type: 'signature',
    city: proposalText_(block.city, label, 100),
    label: proposalText_(block.label, label, 150),
    name: proposalText_(block.name, label, 150),
    position: proposalText_(block.position, label, 150)
  };
}
/** Blok yang dibiarkan kosong oleh pengguna dibuang, bukan ditolak. */
function proposalBlockEmpty_(block) {
  if (!block) return true;
  if (block.type === 'heading' || block.type === 'paragraph') return !String(block.text || '').trim();
  if (block.type === 'bullets') return !(block.items || []).length;
  if (block.type === 'pairs') return !(block.rows || []).length;
  if (block.type === 'table') return !(block.columns || []).length;
  return false;
}
function proposalPage_(page, index) {
  if (!page || typeof page !== 'object') throw new Error('Halaman ' + (index + 1) + ' tidak valid.');
  var kind = PROPOSAL_PAGE_KINDS.indexOf(page.kind) >= 0 ? page.kind : 'content';
  var blocks = (Array.isArray(page.blocks) ? page.blocks : []).slice(0, 40).map(proposalBlock_).filter(function (block) { return !proposalBlockEmpty_(block); });
  return {
    id: proposalText_(page.id, 'ID halaman', 60) || 'PG-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    kind: kind,
    title: proposalText_(page.title, 'Judul halaman ' + (index + 1), 200),
    subtitle: proposalText_(page.subtitle, 'Sub judul halaman ' + (index + 1), 200),
    blocks: blocks
  };
}
function normalizeProposal_(record, existing) {
  record.title = proposalText_(record.title, 'Judul proposal', 200, true);
  record.number = proposalText_(record.number, 'Nomor proposal', 60);
  if (!record.number) record.number = existing && existing.number ? String(existing.number) : nextNumber_('PRP');
  if (rows_('Proposals').some(function (row) { return row.id !== record.id && String(row.number).toLowerCase() === record.number.toLowerCase(); })) throw new Error('Nomor proposal sudah digunakan.');
  record.clientId = String(record.clientId || '').trim();
  if (record.clientId) {
    var client = find_('Clients', record.clientId);
    record.clientName = client.name;
    if (!record.recipient) record.recipient = client.contactPerson ? 'Bapak/Ibu ' + client.contactPerson + '\n' + client.name : client.name;
  } else {
    record.clientName = proposalText_(record.clientName, 'Nama klien', 200);
  }
  record.recipient = proposalText_(record.recipient, 'Diajukan kepada', 400, true);
  record.date = date_(record.date);
  record.place = proposalText_(record.place, 'Tempat', 100, true);
  record.status = PROPOSAL_STATUSES.indexOf(record.status) >= 0 ? record.status : 'Draft';
  record.signer = proposalText_(record.signer, 'Penandatangan', 150, true);
  record.signerPosition = proposalText_(record.signerPosition, 'Jabatan penandatangan', 150);
  record.contactPerson = proposalText_(record.contactPerson, 'Contact person', 150);
  record.phone = proposalText_(record.phone, 'Nomor telepon', 30);
  if (record.phone && !/^[+0-9 ()-]{8,30}$/.test(record.phone)) throw new Error('Nomor telepon proposal tidak valid.');
  record.email = proposalText_(record.email, 'Email', 254).toLowerCase();
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) throw new Error('Alamat email proposal tidak valid.');
  record.notes = proposalText_(record.notes, 'Catatan internal', 2000);
  record.attachments = proposalList_(record.attachments, 'Lampiran', 20, 200).filter(Boolean);
  var staff = rows_('Personnel');
  record.partners = proposalPartners_(record).slice(0, 40);
  record.partners.forEach(function (id) {
    if (!staff.some(function (person) { return person.id === id; })) throw new Error('Mitra / personel pada halaman Tim & Mitra tidak ditemukan. Muat ulang workspace.');
  });
  var pages = (Array.isArray(record.pages) ? record.pages : []).slice(0, 40).map(proposalPage_);
  if (!pages.length) throw new Error('Proposal minimal memiliki satu halaman.');
  if (pages[0].kind !== 'cover') pages[0].kind = 'cover';
  pages.slice(1).forEach(function (page) { if (page.kind === 'cover') page.kind = 'content'; });
  if (pages.filter(function (page) { return page.kind === 'toc'; }).length > 1) throw new Error('Hanya satu halaman daftar isi yang diizinkan.');
  record.pages = pages;
  if (JSON.stringify(pages).length > PROPOSAL_CELL_LIMIT) throw new Error('Isi proposal terlalu panjang untuk satu baris spreadsheet. Kurangi teks atau jumlah halaman (maks. ' + PROPOSAL_CELL_LIMIT + ' karakter).');
  record.createdAt = existing ? existing.createdAt : new Date().toISOString();
  record.updatedAt = new Date().toISOString();
}

function getProposals() { return list_('Proposals'); }
function addProposal(data) { return save_('Proposals', data); }
function updateProposal(id, data) { return save_('Proposals', data, id); }
function deleteProposal(id) { return remove_('Proposals', id); }
