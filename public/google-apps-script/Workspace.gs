/** Branding, private personnel documents, and all-or-nothing debtor imports. */
function loadWorkspaceLogo_(settings) {
  var result = Object.assign({}, settings);
  result.logo = '';
  if (settings.logoFileId) {
    try {
      var file = DriveApp.getFileById(settings.logoFileId);
      if (!file.isTrashed() && file.getSize() <= 140000) {
        var blob = file.getBlob();
        if (['image/png', 'image/jpeg', 'image/webp'].indexOf(blob.getContentType()) >= 0) result.logo = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      }
    } catch (error) { console.warn('Logo workspace tidak dapat dibaca.'); }
  }
  delete result.logoFileId;
  return result;
}
function persistWorkspaceSettings_(data, settings) {
  var props = PropertiesService.getScriptProperties(), raw = props.getProperty('ARMS_SETTINGS');
  var previous = raw ? JSON.parse(raw) : {}, oldLogo = loadWorkspaceLogo_(previous).logo;
  settings.logoFileId = previous.logoFileId || ''; settings.logoName = previous.logoName || '';
  var newFile = null;
  try {
    if (Object.prototype.hasOwnProperty.call(data, 'logo') && data.logo !== oldLogo) {
      if (data.logo) {
        if (typeof data.logo !== 'string' || data.logo.length > 180000) throw new Error('Logo terlalu besar. Upload ulang gambar melalui Pengaturan.');
        var match = data.logo.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
        if (!match) throw new Error('Format logo tidak valid.');
        var blob = photoBlob_({ mimeType: match[1], dataUrl: data.logo });
        newFile = documentFolder_().createFile(blob.setName('ARMS-LOGO-' + Utilities.getUuid() + '.' + (match[1] === 'image/png' ? 'png' : match[1] === 'image/jpeg' ? 'jpg' : 'webp')));
        settings.logoFileId = newFile.getId(); settings.logoName = String(data.logoName || 'Logo perusahaan').slice(0, 150);
      } else { settings.logoFileId = ''; settings.logoName = ''; }
    }
    props.setProperty('ARMS_SETTINGS', JSON.stringify(settings));
  } catch (error) { if (newFile) { try { newFile.setTrashed(true); } catch (cleanup) {} } throw error; }
  if (previous.logoFileId && previous.logoFileId !== settings.logoFileId) { try { DriveApp.getFileById(previous.logoFileId).setTrashed(true); } catch (error) { console.warn('Logo lama perlu dibersihkan.'); } }
  return loadWorkspaceLogo_(settings);
}
function getPersonnelDocument(id) {
  return response_(function () {
    authorize_(false);
    var person = find_('Personnel', id), file = customerFile_(person.ktpPhoto);
    if (file.getSize() > 2 * 1024 * 1024) throw new Error('Ukuran KTP melebihi batas.');
    var blob = file.getBlob();
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(blob.getContentType()) < 0) throw new Error('Format KTP tidak didukung.');
    return { name: person.ktpPhotoName || file.getName(), mimeType: blob.getContentType(), dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
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