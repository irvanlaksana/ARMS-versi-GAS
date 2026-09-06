import { getAssignee, getBucket, isIsoDate, jakartaDate, overdueDays, vehicleSummary, type Case, type Client, type ClientIndustry, type CollectionLog, type Database, type Entity, type RecordData } from './data';

export const CLIENT_INDUSTRIES: ClientIndustry[] = ['MULTIFINANCE', 'PERBANKAN', 'FINTECH', 'PERORANGAN'];
export const RECOVERY_SERVICES = ['Penagihan Piutang', 'Mediasi & Penyelesaian', 'Eksekusi / Tarik Unit'];
export const COLLECTION_CHANNELS = ['Kunjungan Lapangan', 'WhatsApp & Chat', 'Eksekusi Unit', 'Penarikan aset jaminan'];
export const CONTACTED_PARTIES = ['Debitur Langsung', 'Keluarga / Perwakilan Debitur', 'Penjamin', 'Pihak Lain'];
export const COLLECTION_OUTCOMES = ['Janji Bayar (Promise to Pay)', 'Pembayaran Titipan / Pelunasan', 'Sepakat Mediasi Kantor', 'Unit Ditemukan / Teridentifikasi', 'Unit Berhasil Ditarik / Diserahterimakan', 'Debitur Tidak di Rumah / Nomor Tidak Aktif', 'Menolak Bayar / Tidak Kooperatif'];
const normalized = (value: unknown) => String(value || '').trim().toLocaleLowerCase('id-ID');
export function requiredText(value: unknown, label: string, max = 200) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label} wajib diisi.`);
  if (text.length > max) throw new Error(`${label} maksimal ${max} karakter.`);
  return text;
}
export function validDate(value: string, label: string) {
  if (!isIsoDate(value)) throw new Error(`${label} tidak valid.`);
  return value;
}
export function caseHasHistory(db: Database, id: string) {
  return db.payments.some(p => p.caseId === id) || db.collections.some(l => l.caseId === id) || db.letters.some(l => l.caseId === id) || db.executions.some(e => e.caseId === id) || db.transactions.some(t => t.caseId === id);
}

export function normalizeCrmRecord(db: Database, entity: Entity, record: RecordData, existing?: RecordData) {
  if (entity === 'clients') {
    const c = record as Client;
    c.code = requiredText(c.code, 'Kode Perusahaan Klien', 30).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(c.code)) throw new Error('Kode klien hanya boleh memuat huruf, angka, titik, garis bawah, dan tanda hubung.');
    if (db.clients.some(item => item.id !== c.id && normalized(item.code) === normalized(c.code))) throw new Error('Kode perusahaan klien sudah digunakan.');
    c.name = requiredText(c.name, 'Nama Perusahaan Lengkap / Pemberi Kuasa');
    if (!CLIENT_INDUSTRIES.includes(c.industry)) throw new Error('Pilih industri yang valid.');
    c.contactPerson = requiredText(c.contactPerson, 'Contact Person', 150);
    c.phone = requiredText(c.phone, 'No. Phone / WhatsApp', 20);
    if (!/^[+0-9 ()-]{8,20}$/.test(c.phone)) throw new Error('Nomor telepon / WhatsApp tidak valid.');
    c.email = String(c.email || '').trim().toLowerCase();
    if (c.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) || c.email.length > 254)) throw new Error('Alamat email tidak valid.');
    c.streetAddress = requiredText(c.streetAddress, 'Alamat Domisili / Kantor', 500);
    c.regency = requiredText(c.regency, 'Kabupaten/Kota', 150); c.district = requiredText(c.district, 'Kecamatan', 150); c.village = requiredText(c.village, 'Kelurahan / Desa', 150);
    c.regencyId = String(c.regencyId || ''); c.districtId = String(c.districtId || '');
    if (Boolean(c.regencyId) !== Boolean(c.districtId) || (c.regencyId && !c.districtId.startsWith(`${c.regencyId}.`))) throw new Error('Kecamatan tidak sesuai dengan kabupaten/kota. Pilih ulang atau isi wilayah manual.');
    c.address = [c.streetAddress, c.village, c.district, c.regency].join(', ');
    c.createdAt = (existing as Client)?.createdAt || new Date().toISOString();
  }
  if (entity === 'cases') {
    const c = record as Case, old = existing as Case | undefined;
    const client = db.clients.find(item => item.id === c.clientId), customer = db.customers.find(item => item.id === c.customerId);
    if (!client) throw new Error('Pilih Client / Creditor yang terdaftar di master klien.');
    if (!customer) throw new Error('Pilih debitur yang terdaftar.');
    if (!db.personnel.some(p => p.id === c.personnelId)) throw new Error('Assign To Personnel / Mitra wajib dipilih.');
    if (!RECOVERY_SERVICES.includes(c.service || '')) throw new Error('Pilih layanan penanganan kasus.');
    if (old && (old.customerId !== c.customerId || old.clientId !== c.clientId) && caseHasHistory(db, c.id)) throw new Error('Klien/debitur tidak dapat diganti karena kasus sudah memiliki riwayat.');
    c.client = client.name; c.clientType = client.industry;
    c.contract = requiredText(customer.contract, 'Nomor kontrak pada data debitur', 100);
    if (db.cases.some(item => item.id !== c.id && item.clientId === c.clientId && item.customerId === c.customerId && normalized(item.contract) === normalized(c.contract))) throw new Error('Kasus untuk klien, debitur, dan nomor kontrak ini sudah ada.');
    if (!Number.isSafeInteger(Number(customer.total)) || Number(customer.total) < 0 || Number(customer.total) > 1e15) throw new Error('Total Angsuran debitur tidak valid. Perbaiki data debitur terlebih dahulu.');
    c.principal = Number(customer.total); c.asset = vehicleSummary(customer);
    c.createdAt = old?.createdAt || new Date().toISOString();
    c.createdDate = validDate(old?.createdDate || jakartaDate(c.createdAt), 'Tanggal pembuatan kasus');
    c.dueDateSnapshot = validDate(customer.dueDate || '', 'Tanggal jatuh tempo debitur');
    c.overdue = overdueDays(c.dueDateSnapshot, c.createdDate)!; c.bucket = getBucket(c.overdue);
    c.status = c.status || 'Aktif';
    if (!['Aktif', 'Dalam Proses', 'Selesai', 'Ditunda'].includes(c.status)) throw new Error('Status kasus tidak valid.');
    c.paymentClosed = old?.paymentClosed || false;
  }
  if (entity === 'collections') {
    const log = record as CollectionLog, old = existing as CollectionLog | undefined;
    const c = db.cases.find(item => item.id === log.caseId);
    if (!c) throw new Error('Pilih Berkas Perkara / Kasus yang terdaftar.');
    log.letterId = String(log.letterId || '');
    if (log.letterId) {
      const letter = db.letters.find(l => l.id === log.letterId);
      if (!letter || letter.caseId !== log.caseId || letter.personnelId !== log.personnelId) throw new Error('SK laporan harus sesuai dengan kasus dan petugas.');
    }
    if (!db.personnel.some(p => p.id === log.personnelId)) throw new Error('Petugas / Mitra Lapangan / PIC tidak ditemukan.');
    if (!COLLECTION_CHANNELS.includes(log.activity)) throw new Error('Tipe aktivitas / kanal interaksi tidak valid.');
    if (!CONTACTED_PARTIES.includes(log.contactedParty)) throw new Error('Pilih pihak yang ditemui / dihubungi.');
    if (!COLLECTION_OUTCOMES.includes(log.outcome)) throw new Error('Pilih Hasil Tindakan / Outcome yang valid.');
    log.activityDate = validDate(log.activityDate, 'Tanggal aktivitas');
    if (log.activityDate > jakartaDate()) throw new Error('Log mencatat aktivitas yang sudah dilakukan, bukan tanggal mendatang.');
    const caseDate = validDate(c.createdDate || jakartaDate(c.createdAt), 'Tanggal pembuatan kasus terkait');
    if (log.activityDate < caseDate) throw new Error('Tanggal aktivitas tidak boleh sebelum kasus dibuat.');
    log.report = requiredText(log.report, 'Laporan rinci pembicaraan & situasi lapangan', 5000);
    if (log.report.length < 10) throw new Error('Laporan rinci minimal 10 karakter.');
    log.actionPlan = String(log.actionPlan || '').trim(); if (log.actionPlan.length > 1500) throw new Error('Action Plan maksimal 1500 karakter.');
    log.nextActionDate = String(log.nextActionDate || '');
    if (log.outcome === COLLECTION_OUTCOMES[0] && !log.nextActionDate) throw new Error('Target tanggal janji bayar wajib diisi untuk Promise to Pay.');
    if (log.nextActionDate) { validDate(log.nextActionDate, 'Target tanggal / Next Action'); if (log.nextActionDate < log.activityDate) throw new Error('Next Action tidak boleh sebelum tanggal aktivitas.'); }
    log.hasPayment = log.hasPayment === true;
    if (log.outcome === COLLECTION_OUTCOMES[1] && !log.hasPayment) throw new Error('Outcome pembayaran harus ditandai memiliki pembayaran.');
    const receipts = db.payments.filter(p => p.collectionLogId === log.id);
    if (receipts.length && (!log.hasPayment || receipts.some(p => p.caseId !== log.caseId))) throw new Error('Log sudah terhubung ke pembayaran. Kasus dan penanda pembayaran tidak dapat diubah.');
    log.createdAt = old?.createdAt || new Date().toISOString(); log.updatedAt = new Date().toISOString();
    log.number = old?.number || `LOG-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }
}

// Legacy names are linked once; missing contact/address data stays blank, never fabricated.
export function migrateCrm(db: Database) {
  db.clients = Array.isArray(db.clients) ? db.clients : [];
  db.collections = Array.isArray(db.collections) ? db.collections : [];
  const findOrCreateClient = (name: string, industry: ClientIndustry) => {
    let client = db.clients.find(item => normalized(item.name) === normalized(name));
    if (!client && name) {
      let i = db.clients.length + 1;
      while (db.clients.some(item => item.id === `CLI-LEGACY-${i}` || item.code === `LEGACY-${i}`)) i++;
      client = { id: `CLI-LEGACY-${i}`, code: `LEGACY-${i}`, name, industry: CLIENT_INDUSTRIES.includes(industry) ? industry : 'MULTIFINANCE', contactPerson: '', phone: '', email: '', streetAddress: '', regencyId: '', regency: '', districtId: '', district: '', village: '', address: '', createdAt: new Date().toISOString() };
      db.clients.push(client);
    }
    return client;
  };
  db.cases.forEach(c => {
    if (!c.clientId) c.clientId = findOrCreateClient(c.client, c.clientType)?.id || '';
    c.createdDate = c.createdDate || jakartaDate(c.createdAt); c.service = c.service || RECOVERY_SERVICES[0];
    c.personnelId = c.personnelId || getAssignee(db, c.id)?.id || '';
  });
  db.transactions.forEach(t => { if (!t.clientId && t.client && t.sourceType === 'multifinance') t.clientId = findOrCreateClient(t.client, 'MULTIFINANCE')?.id; });
  db.collections.forEach(log => { log.hasPayment = log.hasPayment === true || String(log.hasPayment).toLowerCase() === 'true'; });
  return syncCrmRelations(db);
}
export function syncCrmRelations(db: Database) {
  db.cases = db.cases.map(c => {
    const client = db.clients.find(item => item.id === c.clientId), customer = db.customers.find(item => item.id === c.customerId);
    const next = { ...c };
    if (client) { next.client = client.name; next.clientType = client.industry; }
    if (customer) {
      next.contract = customer.contract || c.contract; next.principal = Number(customer.total); next.asset = vehicleSummary(customer);
      const days = overdueDays(customer.dueDate || '', c.createdDate || jakartaDate(c.createdAt));
      if (days !== null) { next.overdue = days; next.bucket = getBucket(days); next.dueDateSnapshot = customer.dueDate; }
    }
    return next;
  });
  db.transactions = db.transactions.map(t => {
    const c = db.cases.find(c => c.id === t.caseId), clientId = c?.clientId || t.clientId;
    const client = db.clients.find(item => item.id === clientId);
    return client ? { ...t, clientId: client.id, client: client.name } : t;
  });
  return db;
}
export function nextActionStatus(db: Database, log: CollectionLog) {
  const c = db.cases.find(c => c.id === log.caseId);
  if (c?.status === 'Selesai') return 'Kasus selesai';
  if (!log.nextActionDate) return 'Tanpa jadwal';
  const today = jakartaDate();
  return log.nextActionDate < today ? 'Lewat target' : log.nextActionDate === today ? 'Hari ini' : 'Terjadwal';
}