import { calculatePayment, canReceivePayment, createSeed, getPaid, isoToday, postedFee, syncPaymentStatus, type Database, type Entity, type RecordData, type Customer, type Case, type Letter, type Payment, type PdfUpload, type Settings, type User } from './data';
import { clearPhotos, pdfUploadBlob, removePhoto, safePdfName, storePdf, storePhoto } from './documents';
import { validateFinanceRecord } from './finance';
import { migrateCrm, normalizeCrmRecord, syncCrmRelations, validDate } from './crm';
import { PAYLOAD_LIMIT } from './letterPayload';

interface ApiResponse<T> { status: 'success' | 'error'; data: T; message: string }
interface ScriptRunner {
  withSuccessHandler(callback: (response: ApiResponse<unknown>) => void): ScriptRunner;
  withFailureHandler(callback: (error: Error) => void): ScriptRunner;
  [name: string]: unknown;
}
declare global { interface Window { google?: { script?: { run: ScriptRunner } } } }
const STORAGE_KEY = 'arms.workspace.v1';
export const isGoogleConnected = () => Boolean(window.google?.script?.run);
export class SavedRecordRefreshError extends Error {
  constructor(public entity: Entity, public record: RecordData) {
    super('Data sudah tersimpan di server, tetapi pemuatan ulang gagal. ID tersimpan dipertahankan agar percobaan berikutnya tidak membuat data ganda. Muat ulang workspace saat koneksi pulih.');
    this.name = 'SavedRecordRefreshError';
  }
}
export function recoverSavedRecord(db: Database, error: SavedRecordRefreshError) {
  const next = JSON.parse(JSON.stringify(db)) as Database;
  const rows = next[error.entity] as RecordData[];
  const index = rows.findIndex(r => r.id === error.record.id);
  if (index >= 0) rows[index] = error.record; else rows.unshift(error.record);
  return migrateDatabase(next);
}

export function gasCall<T>(name: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!window.google?.script?.run) { reject(new Error('Google Apps Script tidak tersedia.')); return; }
    const runner = window.google.script.run
      .withSuccessHandler(response => response?.status === 'success' ? resolve(response.data as T) : reject(new Error(response?.message || 'Respons server tidak valid.')))
      .withFailureHandler(error => reject(new Error(error.message || 'Tidak dapat menghubungi server.')));
    (runner[name] as (...params: unknown[]) => void)(...args);
  });
}

function persist(data: Database) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { throw new Error('Penyimpanan lokal penuh atau diblokir. Aktifkan penyimpanan browser sebelum menyimpan.'); }
}

/** Sinkronkan hasil operasi server ke workspace lokal tanpa panggilan ulang. */
function applyServerMutation(db: Database, entity: Entity, saved?: RecordData, removeId?: string): Database {
  const next = migrateDatabase(JSON.parse(JSON.stringify(db)));
  if (removeId) {
    const rows = next[entity] as RecordData[];
    const removeIndex = rows.findIndex(r => r.id === removeId);
    if (removeIndex >= 0) rows.splice(removeIndex, 1);
  } else if (saved) {
    const rows = next[entity] as RecordData[];
    const index = rows.findIndex(r => r.id === saved.id);
    if (index >= 0) rows[index] = saved; else rows.unshift(saved);
  }
  if (entity === 'collections') {
    const log = saved as Database['collections'][number] | undefined;
    const c = next.cases.find(c => c.id === log?.caseId);
    if (c?.status === 'Aktif') c.status = 'Dalam Proses';
  }
  return migrateDatabase(next);
}

function migrateDatabase(db: Database): Database {
  db.executions = Array.isArray(db.executions) ? db.executions : [];
  db.accounts = Array.isArray(db.accounts) ? db.accounts : [];
  db.transactions = Array.isArray(db.transactions) ? db.transactions : [];
  db.cases = db.cases.map(c => ({ ...c, paymentClosed: c.paymentClosed === true || String(c.paymentClosed).toLowerCase() === 'true' }));
  return syncPaymentStatus(migrateCrm(db));
}
export async function loadDatabase(): Promise<Database> {
  if (isGoogleConnected()) return migrateDatabase(await gasCall<Database>('getBootstrap'));
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Database;
      if (Array.isArray(parsed.customers) && Array.isArray(parsed.cases) && Array.isArray(parsed.payments) && Array.isArray(parsed.personnel) && Array.isArray(parsed.letters) && Array.isArray(parsed.users) && parsed.settings) {
        if (!parsed.currentUser) parsed.currentUser = parsed.users.find(u => u.id === 'USR-001');
        parsed.customers = parsed.customers.map(customer => ({ ...customer,
          contract: customer.contract || parsed.cases.find(c => c.customerId === customer.id)?.contract || '',
          streetAddress: customer.streetAddress ?? customer.address ?? '', brandType: customer.brandType ?? customer.vehicle ?? '',
        }));
        return migrateDatabase(parsed);
      }
    }
  } catch { /* The demo remains usable when browser storage cannot be read. */ }
  return createSeed();
}

const endpoints: Record<Entity, string> = { clients: 'Client', collections: 'CollectionLog', customers: 'Customer', cases: 'Case', personnel: 'Personnel', letters: 'SK', payments: 'Payment', users: 'User', executions: 'Execution', accounts: 'Account', transactions: 'Transaction' };

function validateNumber(n: unknown, label: string, max = 1e15) {
  if (!Number.isFinite(Number(n)) || Number(n) < 0 || Number(n) > max) throw new Error(`${label} tidak valid.`);
}
/** Payload surat otomatis ikut disimpan pada penugasan; nilai lama dipertahankan bila payload kosong. */
function normalizeGeneratorData(value: unknown, fallback?: string) {
  const text = String(value ?? '').trim();
  if (!text) return fallback || '';
  if (text.length > PAYLOAD_LIMIT) throw new Error(`Payload generator melebihi ${PAYLOAD_LIMIT} karakter.`);
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Payload generator bukan JSON yang valid.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Payload generator harus berupa objek JSON.');
  return text;
}
export async function saveRecord(db: Database, entity: Entity, values: Partial<RecordData>, id?: string): Promise<Database> {
  if (['clients', 'cases', 'collections'].includes(entity)) {
    const existing = (db[entity] as RecordData[]).find(r => r.id === id);
    if (id && !existing) throw new Error('Data sudah tidak tersedia. Muat ulang workspace.');
    const candidate = { ...existing, ...values, id: id || '__new__' } as RecordData;
    normalizeCrmRecord(db, entity, candidate, existing);
  }
  if (isGoogleConnected()) {
    const saved = await gasCall<RecordData>(`${id ? 'update' : 'add'}${endpoints[entity]}`, ...(id ? [id, values] : [values]));
    // Server sudah mengonfirmasi dan mengembalikan record lengkap; sinkronkan
    // relasi secara lokal agar tidak perlu memuat ulang seluruh workspace.
    return applyServerMutation(db, entity, saved);
  }
  const next: Database = migrateDatabase(JSON.parse(JSON.stringify(db)));
  if (entity === 'users' && next.currentUser?.role !== 'Administrator') throw new Error('Hanya Administrator yang dapat mengelola pengguna.');
  if (['accounts', 'transactions'].includes(entity) && next.currentUser?.role === 'Collector') throw new Error('Mutasi rekening dikelola Administrator atau Supervisor.');
  const existing = (next[entity] as RecordData[]).find(record => record.id === id);
  if (id && !existing) throw new Error('Data tidak ditemukan. Muat ulang workspace.');
  const unique = crypto.randomUUID().slice(0, 8).toUpperCase();
  const record = { ...existing, ...values, id: id || `${entity.slice(0, 3).toUpperCase()}-${unique}` } as RecordData;
  if (entity === 'customers') {
    const customer = record as Customer;
    customer.name = customer.name?.trim(); customer.contract = customer.contract?.trim(); customer.phone = customer.phone?.trim();
    if (!customer.name || !customer.contract || !customer.phone || !/^[+0-9 ()-]{8,20}$/.test(customer.phone)) throw new Error('Isi nomor kontrak, nama, dan nomor handphone yang valid.');
    if (next.customers.some(c => c.contract?.toLowerCase() === customer.contract!.toLowerCase() && c.id !== customer.id)) throw new Error('No. kontrak sudah terdaftar pada debitur lain.');
    if (![customer.regency, customer.district, customer.village, customer.streetAddress].every(value => value?.trim())) throw new Error('Lengkapi kabupaten/kota, kecamatan, kelurahan/desa, dan alamat lengkap.');
    if (customer.regencyId && customer.districtId && !customer.districtId.startsWith(`${customer.regencyId}.`)) throw new Error('Kecamatan tidak sesuai dengan kabupaten/kota.');
    if (!customer.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(customer.dueDate) || isNaN(Date.parse(customer.dueDate)) || new Date(customer.dueDate).toISOString().slice(0, 10) !== customer.dueDate) throw new Error('Tanggal jatuh tempo tidak valid.');
    customer.nik = customer.nik || '';
    customer.address = [customer.streetAddress, customer.village, customer.district, customer.regency].map(v => v?.trim()).filter(Boolean).join(', ');
    customer.plate = (customer.plate || '').trim().toUpperCase();
    customer.vehicle = [customer.brandType?.trim(), customer.plate].filter(Boolean).join(' / ');
    validateNumber(customer.installment, 'Angsuran'); validateNumber(customer.penalty, 'Denda');
    customer.installment = Math.round(Number(customer.installment)); customer.penalty = Math.round(Number(customer.penalty));
    customer.total = customer.installment + customer.penalty;
    validateNumber(customer.total, 'Total Angsuran');
    next.cases = next.cases.map(c => {
      if (c.customerId !== customer.id) return c;
      if (getPaid(next, c.id) > customer.total) throw new Error('Total angsuran tidak boleh kurang dari pembayaran yang sudah diterima.');
      return { ...c, principal: customer.total };
    });
  }
  if (entity === 'cases') {
    const c = record as Case;
    normalizeCrmRecord(next, entity, c, existing);
    c.number = (existing as Case)?.number || `CS-${new Date().getFullYear()}-${unique.slice(0, 5)}`;
  }
  if (entity === 'clients' || entity === 'collections') normalizeCrmRecord(next, entity, record, existing);
  if (entity === 'letters') {
    const letter = record as Database['letters'][number];
    const old = existing as Letter | undefined;
    const c = next.cases.find(item => item.id === letter.caseId);
    if (!c || !next.personnel.some(p => p.id === letter.personnelId)) throw new Error('Kasus dan petugas wajib dipilih.');
    if (old && (old.caseId !== letter.caseId || old.personnelId !== letter.personnelId) && (old.pdfUrl || next.collections.some(log => log.letterId === old.id))) throw new Error('Kasus dan petugas tidak dapat diganti pada SK yang sudah memiliki PDF atau laporan. Buat penugasan baru bila diperlukan.');
    letter.number = (existing as typeof letter)?.number || `${c.clientType === 'PERORANGAN' ? 'SK' : 'ST'}/ARMS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${unique.slice(0, 4)}`;
    if (!letter.issuedAt || !letter.signer?.trim() || !letter.place?.trim()) throw new Error('Tanggal, tempat, dan penandatangan wajib diisi.');
    if (!letter.clientRepresentative?.trim()) throw new Error('Perwakilan klien / pemberi kuasa wajib diisi.');
    if (c.clientType === 'PERORANGAN' && !letter.clientAddress?.trim()) throw new Error('Alamat pemberi kuasa wajib diisi.');
    validDate(letter.issuedAt, 'Tanggal terbit');
    if (letter.validUntil) { validDate(letter.validUntil, 'Berlaku sampai'); if (letter.validUntil < letter.issuedAt) throw new Error('Masa berlaku tidak boleh sebelum tanggal terbit.'); }
    letter.generatorData = normalizeGeneratorData(letter.generatorData, old?.generatorData);
    letter.pdfUrl = old?.pdfUrl || ''; letter.pdfName = old?.pdfName || ''; letter.pdfSize = old?.pdfSize || 0;
    letter.pdfUploadedAt = old?.pdfUploadedAt || ''; letter.pdfUploadId = old?.pdfUploadId || '';
    if ((letter.updateNote || '').length > 2000) throw new Error('Catatan update maksimal 2000 karakter.');
    letter.updatedAt = new Date().toISOString();
  }
  if (entity === 'payments') {
    const payment = record as Payment;
    const c = next.cases.find(item => item.id === payment.caseId);
    if (!c) throw new Error('Pilih kasus yang terdaftar.');
    payment.collectionLogId = String(payment.collectionLogId || '');
    if ((existing as Payment)?.collectionLogId && payment.collectionLogId !== (existing as Payment).collectionLogId) throw new Error('Relasi log pembayaran yang sudah tercatat tidak dapat dilepas atau diganti.');
    if (payment.collectionLogId) {
      const log = next.collections.find(l => l.id === payment.collectionLogId);
      if (!log || !log.hasPayment || log.caseId !== payment.caseId) throw new Error('Log penagihan tidak sesuai dengan kasus atau belum ditandai memiliki pembayaran.');
      if (next.payments.some(p => p.id !== payment.id && p.collectionLogId === log.id)) throw new Error('Pembayaran untuk log ini sudah dicatat. Buka kuitansi yang sudah ada.');
    }
    if ((!existing || (existing as Payment).caseId !== c.id) && !canReceivePayment(next, c)) throw new Error('Debitur pada kasus ini sudah berhasil / selesai. Pilih kasus aktif lainnya.');
    validateNumber(payment.amount, 'Pembayaran');
    payment.amount = Math.round(Number(payment.amount));
    if (!payment.amount) throw new Error('Nominal pembayaran harus lebih dari nol.');
    if (payment.amount > c.principal - getPaid(next, c.id, id)) throw new Error('Pembayaran melebihi sisa piutang kasus.');
    validateNumber(payment.feeRate, 'Fee', 100); validateNumber(payment.partnerRate, 'Komisi mitra', 100);
    if (!Array.isArray(payment.manualDetails)) payment.manualDetails = [];
    payment.manualDetails.forEach(row => { validateNumber(row.amount, 'Biaya manual'); validateNumber(row.partnerPercent, 'Split', 100); if (!String(row.label || '').trim()) throw new Error('Keterangan biaya manual wajib diisi.'); row.amount = Math.round(Number(row.amount)); });
    Object.assign(payment, calculatePayment(payment.amount, Number(payment.feeRate), Number(payment.partnerRate), payment.manualDetails));
    if (postedFee(next, 'payment', payment.id, 'Pemasukan') > payment.grossFee + payment.manualTotal || postedFee(next, 'payment', payment.id, 'Pengeluaran') > payment.partnerCommission) throw new Error('Fee baru lebih kecil dari mutasi rekening yang telah dicatat.');
    if (existing && (existing as Payment).caseId !== payment.caseId && next.transactions.some(t => t.sourceType === 'payment' && t.sourceId === payment.id)) throw new Error('Pembayaran dengan mutasi fee tidak dapat dipindahkan ke kasus lain.');
    if (payment.proof && !/^https:\/\//i.test(payment.proof)) throw new Error('Gunakan tautan HTTPS untuk bukti transfer.');
    payment.number = (existing as Payment)?.number || `KW/ARMS/${new Date().getFullYear()}/${unique.slice(0, 5)}`;
    payment.date = payment.date || isoToday();
    validDate(payment.date, 'Tanggal pembayaran');
  }
  if (entity === 'personnel') {
    const p = record as Database['personnel'][number];
    if (!p.name?.trim() || !p.bank?.trim() || !p.position?.trim()) throw new Error('Nama, posisi/jabatan, dan rekening bank wajib diisi.');
    if (!['Karyawan', 'Mitra DC'].includes(p.type)) throw new Error('Tipe personel tidak valid.');
    p.nik = String(p.nik || '').trim();
    if (p.nik && !/^\d{16}$/.test(p.nik)) throw new Error('NIK personel harus 16 digit atau dikosongkan.');
  }
  if (entity === 'users') {
    const user = record as User;
    user.username = user.username.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.username)) throw new Error('Alamat email Google tidak valid.');
    if (next.users.some(u => u.username === user.username && u.id !== user.id)) throw new Error('Email sudah terdaftar.');
    if (existing?.id === (next.currentUser?.id || 'USR-001') && user.username !== (existing as User).username) throw new Error('Email akun aktif tidak dapat diganti.');
    if ((existing as User)?.role === 'Administrator' && user.role !== 'Administrator' && next.users.filter(u => u.role === 'Administrator').length < 2) throw new Error('Minimal satu Administrator harus tetap aktif.');
  }
  validateFinanceRecord(next, entity, record, existing);
  const rows = next[entity] as RecordData[];
  if (id) rows[rows.findIndex(r => r.id === id)] = record;
  else rows.unshift(record);
  if (entity === 'users' && record.id === next.currentUser?.id) next.currentUser = record as User;
  syncPaymentStatus(syncCrmRelations(next));
  if (entity === 'collections') {
    const log = record as Database['collections'][number];
    const c = next.cases.find(c => c.id === log.caseId);
    if (c?.status === 'Aktif') c.status = 'Dalam Proses';
  }
  const addedPhotos: string[] = [];
  const replacedPhotos: string[] = [];
  try {
    if (entity === 'customers') {
      const customer = record as Customer;
      for (const kind of ['ktp', 'stnk'] as const) {
        const upload = customer[`${kind}Upload`];
        if (upload !== undefined) {
          const oldReference = (existing as Customer | undefined)?.[`${kind}Photo`];
          if (oldReference) replacedPhotos.push(oldReference);
          if (upload) {
            customer[`${kind}Photo`] = await storePhoto(upload);
            customer[`${kind}PhotoName`] = upload.name;
            addedPhotos.push(customer[`${kind}Photo`]!);
          } else { customer[`${kind}Photo`] = ''; customer[`${kind}PhotoName`] = ''; }
        }
        delete customer[`${kind}Upload`];
      }
    }
    if (entity === 'personnel') {
      const p = record as Database['personnel'][number];
      if (p.ktpUpload !== undefined) {
        if ((existing as typeof p | undefined)?.ktpPhoto) replacedPhotos.push((existing as typeof p).ktpPhoto!);
        if (p.ktpUpload) { p.ktpPhoto = await storePhoto(p.ktpUpload); p.ktpPhotoName = p.ktpUpload.name; addedPhotos.push(p.ktpPhoto); }
        else { p.ktpPhoto = ''; p.ktpPhotoName = ''; }
      }
      delete p.ktpUpload;
    }
    persist(next);
  } catch (error) {
    await Promise.allSettled(addedPhotos.map(removePhoto));
    throw error;
  }
  // Remove superseded local files only after the updated record is durable.
  await Promise.allSettled(replacedPhotos.map(removePhoto));
  return next;
}

export async function deleteRecord(db: Database, entity: Entity, id: string): Promise<Database> {
  if (isGoogleConnected()) { await gasCall(`delete${endpoints[entity]}`, id); return applyServerMutation(db, entity, undefined, id); }
  if (db.currentUser?.role === 'Collector') throw new Error('Collector tidak memiliki izin menghapus data.');
  if (entity === 'users' && db.currentUser?.role !== 'Administrator') throw new Error('Hanya Administrator yang dapat mengelola pengguna.');
  if (entity === 'clients' && (db.cases.some(c => c.clientId === id) || db.transactions.some(t => t.clientId === id))) throw new Error('Klien masih terhubung ke kasus atau transaksi. Hapus relasinya terlebih dahulu.');
  if (entity === 'collections' && db.payments.some(p => p.collectionLogId === id)) throw new Error('Log sudah memiliki pembayaran. Hapus atau koreksi pembayaran terlebih dahulu.');
  if (entity === 'letters' && db.collections.some(log => log.letterId === id)) throw new Error('SK masih memiliki laporan. Ubah status menjadi Selesai atau Dicabut, jangan hapus riwayatnya.');
  if (entity === 'accounts' && db.transactions.some(t => t.accountId === id)) throw new Error('Rekening masih memiliki mutasi. Hapus atau pindahkan mutasinya terlebih dahulu.');
  if ((entity === 'payments' || entity === 'executions') && db.transactions.some(t => t.sourceId === id && t.sourceType === (entity === 'payments' ? 'payment' : 'execution'))) throw new Error('Data masih menjadi sumber mutasi rekening. Koreksi mutasi terlebih dahulu.');
  if (entity === 'customers' && db.cases.some(c => c.customerId === id)) throw new Error('Debitur masih memiliki kasus. Hapus relasi kasus terlebih dahulu.');
  if (entity === 'cases' && (db.letters.some(l => l.caseId === id) || db.payments.some(p => p.caseId === id) || db.executions.some(e => e.caseId === id) || db.transactions.some(t => t.caseId === id) || db.collections.some(l => l.caseId === id))) throw new Error('Kasus masih memiliki log, surat, pembayaran, penarikan, atau mutasi. Hapus relasi terlebih dahulu.');
  if (entity === 'personnel' && (db.cases.some(c => c.personnelId === id) || db.collections.some(l => l.personnelId === id) || db.letters.some(l => l.personnelId === id) || db.executions.some(e => e.personnelId === id))) throw new Error('Personel masih ditugaskan pada kasus, log, surat, atau tarik unit.');
  if (entity === 'users' && (id === (db.currentUser?.id || 'USR-001') || (db.users.find(u => u.id === id)?.role === 'Administrator' && db.users.filter(u => u.role === 'Administrator').length <= 1))) throw new Error('Administrator terakhir atau akun aktif tidak dapat dihapus.');
  const next = { ...db, [entity]: (db[entity] as RecordData[]).filter(r => r.id !== id) };
  syncPaymentStatus(next);
  persist(next);
  if (entity === 'customers') {
    const customer = db.customers.find(c => c.id === id);
    await Promise.allSettled([customer?.ktpPhoto, customer?.stnkPhoto].filter((value): value is string => Boolean(value)).map(removePhoto));
  }
  if (entity === 'personnel') { const p = db.personnel.find(p => p.id === id); if (p?.ktpPhoto) await Promise.allSettled([removePhoto(p.ktpPhoto)]); }
  if (entity === 'letters') { const letter = db.letters.find(l => l.id === id); if (letter?.pdfUrl) await Promise.allSettled([removePhoto(letter.pdfUrl)]); }
  return next;
}

export async function saveSettings(db: Database, settings: Settings): Promise<Database> {
  if (isGoogleConnected()) {
    const saved = await gasCall<Settings>('updateSettings', settings);
    return migrateDatabase({ ...JSON.parse(JSON.stringify(db)), settings: saved });
  }
  if (db.currentUser?.role !== 'Administrator') throw new Error('Hanya Administrator yang dapat mengubah pengaturan.');
  if (!settings.agency.trim() || !settings.signer.trim()) throw new Error('Nama agensi dan penandatangan wajib diisi.');
  validateNumber(settings.feeRate, 'Fee', 100); validateNumber(settings.partnerRate, 'Komisi', 100); validateNumber(settings.target, 'Target');
  validateNumber(settings.reportIntervalDays || 3, 'Interval laporan', 30);
  if (settings.logo && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(settings.logo) || settings.logo.length > 180000)) throw new Error('Logo tidak valid atau terlalu besar.');
  const next = { ...db, settings: { ...settings, reportIntervalDays: Math.max(1, Math.round(settings.reportIntervalDays || 3)) } }; persist(next); return next;
}

export async function importCustomers(db: Database, rows: Customer[], batchId: string): Promise<Database> {
  if (!/^[a-f0-9-]{36}$/.test(batchId) || !rows.length || rows.length > 300) throw new Error('Batch impor tidak valid.');
  if (isGoogleConnected()) {
    const result = await gasCall<Customer[]>('importCustomers', rows, batchId);
    const next = migrateDatabase(JSON.parse(JSON.stringify(db)));
    next.customers = [...result, ...next.customers.filter(c => !result.some(row => row.id === c.id))];
    return migrateDatabase(next);
  }
  const { validateImportedCustomer } = await import('./importDebtors');
  const current = await loadDatabase();
  const prefix = `CUS-BULK-${batchId}-`;
  const already = current.customers.filter(c => c.id.startsWith(prefix));
  if (already.length === rows.length && already.every(c => rows[Number(c.id.slice(prefix.length))]?.contract === c.contract)) return current;
  if (already.length) throw new Error('Batch sebelumnya berbeda. Muat ulang data dan pilih ulang spreadsheet.');
  const existing = new Set(current.customers.map(c => (c.contract || '').toLowerCase())), seen = new Set<string>();
  const checked = rows.map((r, i) => validateImportedCustomer(r as unknown as Record<string, unknown>, existing, seen, i + 2));
  const invalid = checked.filter(r => r.errors.length);
  if (invalid.length) throw new Error(`Baris ${invalid[0].row}: ${invalid[0].errors.join(' ')}`);
  const next = { ...current, customers: [...checked.map((r, i) => ({ ...r.data, id: prefix + i })), ...current.customers] };
  persist(next); return next;
}

export async function resetDemo() { await clearPhotos(); localStorage.removeItem(STORAGE_KEY); return createSeed(); }

export async function saveLetterPdf(db: Database, letterId: string, upload: PdfUpload, uploadId: string, expectedPdfUrl: string): Promise<{ db: Database; letter: Letter; refreshed: boolean }> {
  if (!/^[a-f0-9-]{36}$/.test(uploadId)) throw new Error('ID unggahan tidak valid. Pilih ulang PDF.');
  await pdfUploadBlob(upload);
  if (isGoogleConnected()) {
    const saved = await gasCall<Letter>('uploadSKPdf', letterId, upload, uploadId, expectedPdfUrl);
    const fresh = migrateDatabase({ ...db, letters: db.letters.some(l => l.id === saved.id) ? db.letters.map(l => l.id === saved.id ? saved : l) : [saved, ...db.letters] });
    return { db: fresh, letter: fresh.letters.find(l => l.id === saved.id) || saved, refreshed: true };
  }
  const current = await loadDatabase(), letter = current.letters.find(l => l.id === letterId);
  if (!letter || !letter.number) throw new Error('Simpan penugasan terlebih dahulu sebelum mengunggah PDF.');
  if (letter.pdfUploadId === uploadId) return { db: current, letter, refreshed: true };
  if ((letter.pdfUrl || '') !== expectedPdfUrl) throw new Error('PDF penugasan sudah berubah. Muat ulang workspace sebelum mengganti dokumen.');
  const reference = await storePdf(upload);
  const saved: Letter = { ...letter, pdfUrl: reference, pdfName: safePdfName(upload.name), pdfSize: upload.size, pdfUploadedAt: new Date().toISOString(), pdfUploadId: uploadId };
  const next = { ...current, letters: current.letters.map(l => l.id === letterId ? saved : l) };
  try { persist(next); }
  catch (error) { await Promise.allSettled([removePhoto(reference)]); throw error; }
  if (letter.pdfUrl) await Promise.allSettled([removePhoto(letter.pdfUrl)]);
  return { db: next, letter: saved, refreshed: true };
}