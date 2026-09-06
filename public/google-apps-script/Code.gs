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
  Personnel: { prefix: 'PER', headers: ['ID', 'Nama', 'Tipe (Karyawan/Mitra DC)', 'Rekening Bank', 'Posisi Jabatan', 'NIK', 'Foto KTP', 'Nama File KTP'], keys: ['id', 'name', 'type', 'bank', 'position', 'nik', 'ktpPhoto', 'ktpPhotoName'] },
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
      Object.keys(ARMS_SCHEMA).forEach(function (name) {
        var schema = ARMS_SCHEMA[name];
        var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
        if (sheet.getLastRow()) {
          var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          existing.forEach(function (header, index) {
            if (header && header !== schema.headers[index]) throw new Error('Header sheet ' + name + ' tidak sesuai pada kolom ' + (index + 1) + '.');
          });
        }
        if (sheet.getMaxColumns() < schema.headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), schema.headers.length - sheet.getMaxColumns());
        sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers])
          .setBackground('#4f46e5').setFontColor('#ffffff').setFontWeight('bold');
        sheet.setFrozenRows(1);
        schema.keys.forEach(function (key, index) {
          if (['nik', 'phone', 'emergency', 'contract', 'bank', 'id', 'number', 'issuedAt', 'validUntil', 'date', 'dueDate', 'regencyId', 'districtId', 'plate', 'createdDate', 'dueDateSnapshot', 'activityDate', 'nextActionDate', 'code'].indexOf(key) >= 0) {
            sheet.getRange(2, index + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
          }
        });
      });
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

function rows_(name) {
  var sheet = database_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet ' + name + ' belum tersedia. Jalankan initializeDatabase.');
  if (sheet.getLastColumn() < ARMS_SCHEMA[name].keys.length) throw new Error('Struktur sheet ' + name + ' perlu diperbarui. Jalankan initializeDatabase dari editor sebagai pemilik.');
  if (sheet.getLastRow() < 2) return [];
  var keys = ARMS_SCHEMA[name].keys;
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, keys.length).getValues().filter(function (row) { return row[0]; }).map(function (row) {
    var data = {};
    keys.forEach(function (key, i) {
      var value = row[i];
      if (value instanceof Date) value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (key === 'manualDetails') {
        try { value = JSON.parse(value || '[]'); } catch (e) { value = []; }
      }
      if (key === 'hasPayment' || key === 'paymentClosed') value = crmBool_(value);
      data[key] = value;
    });
    return data;
  });
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

function write_(name, data, existingId) {
  var sheet = database_().getSheetByName(name);
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
  SpreadsheetApp.flush();
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
  if (name === 'Personnel') {
    record.name = required_(record.name, 'Nama personel');
    if (['Karyawan', 'Mitra DC'].indexOf(record.type) < 0) throw new Error('Tipe personel tidak valid.');
    record.bank = required_(record.bank, 'Rekening bank');
    record.position = crmText_(record.position, 'Posisi / Jabatan', 150);
    record.nik = String(record.nik || '').trim();
    if (record.nik && !/^\d{16}$/.test(record.nik)) throw new Error('NIK personel harus 16 digit atau dikosongkan.');
    record.ktpPhoto = existing ? existing.ktpPhoto || '' : ''; record.ktpPhotoName = existing ? existing.ktpPhotoName || '' : '';
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
        if (name === 'Customers' || name === 'Personnel') prepareCustomerPhotos_(record, newFiles, replacedFiles);
        write_(name, record, id);
      } catch (error) {
        newFiles.forEach(function (file) { try { file.setTrashed(true); } catch (cleanupError) { console.warn('Dokumen baru perlu diperiksa oleh administrator.'); } });
        throw error;
      }
      if (name === 'Customers' || name === 'Personnel') {
        replacedFiles.forEach(trashCustomerDocument_);
      }
      if (['Clients', 'Cases', 'Customers'].indexOf(name) >= 0) syncCrmReferences_();
      if (name === 'CollectionLogs') { var linked = find_('Cases', record.caseId); if (linked.status === 'Aktif') { linked.status = 'Dalam Proses'; write_('Cases', linked, linked.id); } }
      if (['Payments', 'Customers', 'Cases'].indexOf(name) >= 0) syncCasePayments_();
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
      if ((name === 'Payments' || name === 'Executions') && rows_('Transactions').some(function (t) { return t.sourceId === id && t.sourceType === (name === 'Payments' ? 'payment' : 'execution'); })) throw new Error('Data masih menjadi sumber mutasi rekening. Koreksi mutasi terlebih dahulu.');
      if (name === 'Users' && (user.id === id || (record.role === 'Administrator' && rows_('Users').filter(function (u) { return u.role === 'Administrator'; }).length <= 1))) throw new Error('Administrator aktif tidak dapat dihapus.');
      var sheet = database_().getSheetByName(name);
      var index = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().findIndex(function (row) { return row[0] === id; });
      sheet.deleteRow(index + 2);
      if (name === 'Payments') syncCasePayments_();
      if (name === 'Customers') [record.ktpPhoto, record.stnkPhoto].filter(Boolean).forEach(trashCustomerDocument_);
      if (name === 'Personnel' && record.ktpPhoto) trashCustomerDocument_(record.ktpPhoto);
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
      currentUser: user, settings: settings_(), spreadsheetUrl: database_().getUrl()
    };
  });
}
function settings_() {
  var saved = PropertiesService.getScriptProperties().getProperty('ARMS_SETTINGS');
  return loadWorkspaceLogo_(saved ? JSON.parse(saved) : { agency: 'ARMS Agency', address: 'Jakarta, Indonesia', signer: 'Admin Pratama', feeRate: 10, partnerRate: 40, target: 500000000, reportIntervalDays: 3, signerPosition: '' });
}
function getSettings() { return response_(function () { authorize_(false); return settings_(); }); }
function updateSettings(data) {
  return response_(function () {
    authorize_(true);
    return locked_(function () {
      var settings = {
        agency: required_(data.agency, 'Nama agensi'), address: String(data.address || ''),
        signer: required_(data.signer, 'Penandatangan'), feeRate: percent_(data.feeRate),
        partnerRate: percent_(data.partnerRate), target: money_(data.target, 'Target'), signerPosition: String(data.signerPosition || '').slice(0, 150), reportIntervalDays: Math.round(Number(data.reportIntervalDays || 3))
      };
      if (!isFinite(settings.reportIntervalDays) || settings.reportIntervalDays < 1 || settings.reportIntervalDays > 30) throw new Error('Interval reminder antara 1 dan 30 hari.');
      return persistWorkspaceSettings_(data, settings);
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

function prepareCustomerPhotos_(record, newFiles, replacedFiles) {
  var staged = ['ktp', 'stnk'].map(function (kind) {
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