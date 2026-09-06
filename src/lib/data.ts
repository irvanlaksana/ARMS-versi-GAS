export type Module = 'dashboard' | 'clients' | 'customers' | 'cases' | 'collections' | 'letters' | 'payments' | 'executions' | 'accounts' | 'reports' | 'personnel' | 'settings';
export type Entity = 'clients' | 'collections' | 'customers' | 'cases' | 'letters' | 'payments' | 'executions' | 'accounts' | 'transactions' | 'personnel' | 'users';
export type CaseStatus = 'Aktif' | 'Dalam Proses' | 'Selesai' | 'Ditunda';
export type ClientIndustry = 'MULTIFINANCE' | 'PERBANKAN' | 'FINTECH' | 'PERORANGAN';
export interface Client { id: string; code: string; name: string; industry: ClientIndustry; contactPerson: string; phone: string; email: string; address: string; streetAddress: string; regencyId: string; regency: string; districtId: string; district: string; village: string; createdAt: string }
export interface CollectionLog { id: string; number: string; caseId: string; activity: string; activityDate: string; personnelId: string; contactedParty: string; outcome: string; actionPlan: string; nextActionDate: string; report: string; hasPayment: boolean; createdAt: string; updatedAt: string; letterId?: string }
export interface SubmitOptions { afterSave?: 'payment' }
export interface PhotoUpload { name: string; mimeType: string; dataUrl: string }
export interface PdfUpload { name: string; mimeType: 'application/pdf'; dataUrl: string; size: number }
export interface Customer {
  id: string; name: string; nik: string; phone: string; address: string; occupation: string; emergency: string; vehicle: string; installment: number; penalty: number; total: number;
  contract?: string; regencyId?: string; regency?: string; districtId?: string; district?: string; village?: string; streetAddress?: string; dueDate?: string;
  ktpPhoto?: string; ktpPhotoName?: string; stnkPhoto?: string; stnkPhotoName?: string; brandType?: string; plate?: string;
  ktpUpload?: PhotoUpload | null; stnkUpload?: PhotoUpload | null;
}
export interface Case { id: string; number: string; client: string; clientType: ClientIndustry; customerId: string; contract: string; principal: number; overdue: number; bucket: string; asset: string; status: CaseStatus; createdAt: string; clientId?: string; service?: string; personnelId?: string; createdDate?: string; dueDateSnapshot?: string; customerName?: string; customerNik?: string; personnelName?: string; paymentClosed?: boolean }
export interface Personnel { id: string; name: string; type: 'Karyawan' | 'Mitra DC'; bank: string; position?: string; nik?: string; ktpPhoto?: string; ktpPhotoName?: string; ktpUpload?: PhotoUpload | null }
export interface Letter { id: string; number: string; caseId: string; personnelId: string; issuedAt: string; status: 'Aktif' | 'Draft' | 'Selesai' | 'Dicabut'; place: string; signer: string; clientRepresentative: string; clientAddress: string; validUntil?: string; generatorData?: string; updateNote?: string; updatedAt?: string; pdfUrl?: string; pdfName?: string; pdfSize?: number; pdfUploadedAt?: string; pdfUploadId?: string }
export interface ManualFee { id: string; label: string; amount: number; mode: 'company' | 'split'; partnerPercent: number }
export interface Payment { id: string; number: string; caseId: string; amount: number; grossFee: number; companyRevenue: number; partnerCommission: number; manualTotal: number; proof: string; date: string; feeRate: number; partnerRate: number; manualDetails: ManualFee[]; collectionLogId?: string }
export interface Execution { id: string; number: string; caseId: string; personnelId: string; date: string; location: string; method: 'Penyerahan Sukarela' | 'Eksekusi Sesuai Dokumen'; authorityRef: string; handoverRef: string; status: 'Dijadwalkan' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan'; feeBase: number; feeRate: number; partnerRate: number; grossFee: number; companyRevenue: number; partnerCommission: number; notes: string }
export interface BankAccount { id: string; name: string; bank: string; number: string; holder: string; openingBalance: number }
export type TransactionSource = 'manual' | 'multifinance' | 'payment' | 'execution' | 'case';
export interface AccountTransaction { id: string; number: string; accountId: string; date: string; type: 'Pemasukan' | 'Pengeluaran'; category: string; sourceType: TransactionSource; sourceId: string; caseId: string; client: string; clientId?: string; amount: number; reference: string; description: string }
export interface User { id: string; username: string; role: 'Administrator' | 'Supervisor' | 'Collector' }
export interface Settings { agency: string; address: string; signer: string; feeRate: number; partnerRate: number; target: number; logo?: string; logoName?: string; signerPosition?: string; reportIntervalDays?: number }
export interface Database { clients: Client[]; collections: CollectionLog[]; customers: Customer[]; cases: Case[]; personnel: Personnel[]; letters: Letter[]; payments: Payment[]; executions: Execution[]; accounts: BankAccount[]; transactions: AccountTransaction[]; users: User[]; settings: Settings; currentUser?: User; spreadsheetUrl?: string }
export type RecordData = Client | CollectionLog | Customer | Case | Personnel | Letter | Payment | Execution | BankAccount | AccountTransaction | User;
export interface Activity { id: string; text: string; detail: string; type: 'payment' | 'case' | 'letter' | 'customer'; time: string }

export const currency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, ' ');
export const compactCurrency = (value: number) => value >= 1e9 ? `Rp ${(value / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M` : value >= 1e6 ? `Rp ${(value / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Jt` : currency(value);
export const numberFormat = (n: number) => n.toLocaleString('id-ID');
export const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString('id-ID', options || { day: 'numeric', month: 'short', year: 'numeric' });
export const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function jakartaDate(value: string | Date = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}-${parts.find(p => p.type === 'day')!.value}`;
}
export const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function overdueDays(dueDate: string, createdDate: string) {
  if (!isIsoDate(dueDate) || !isIsoDate(createdDate)) return null;
  return Math.max(0, Math.floor((Date.parse(createdDate) - Date.parse(dueDate)) / 86400000));
}
export function vehicleSummary(customer: Customer) {
  const description = String(customer.brandType || customer.vehicle || '').trim(), plate = String(customer.plate || '').trim();
  return !plate || description.toUpperCase().endsWith(plate.toUpperCase()) ? description : [description, plate].filter(Boolean).join(' / ');
}
export const getBucket = (days: number) => days <= 30 ? '1-30 hari' : days <= 60 ? '31-60 hari' : days <= 90 ? '61-90 hari' : '>90 hari';
export const bucketColors = ['#8b78ed', '#5996e8', '#dba956', '#df7e87'];
export const buckets = ['1-30 hari', '31-60 hari', '61-90 hari', '>90 hari'];

export function calculatePayment(amount: number, feeRate: number, partnerRate: number, manualDetails: ManualFee[]) {
  const grossFee = Math.round(amount * feeRate / 100);
  let partnerCommission = Math.round(grossFee * partnerRate / 100);
  let companyRevenue = grossFee - partnerCommission;
  let manualTotal = 0;
  manualDetails.forEach(row => {
    const partner = row.mode === 'split' ? Math.round(row.amount * row.partnerPercent / 100) : 0;
    manualTotal += row.amount;
    partnerCommission += partner;
    companyRevenue += row.amount - partner;
  });
  return { grossFee, partnerCommission, companyRevenue, manualTotal };
}

const firstNames = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Rudi', 'Indah', 'Agus', 'Rina', 'Dedi', 'Maya', 'Fajar', 'Putri', 'Eko', 'Dian', 'Hendra', 'Nanda', 'Yoga', 'Wulan', 'Rizky', 'Fitri'];
const lastNames = ['Santoso', 'Rahmawati', 'Hidayat', 'Lestari', 'Hartono', 'Permata', 'Setiawan', 'Wijaya'];
const clientNames = ['Adira Finance', 'FIFGROUP', 'WOM Finance', 'BCA Finance', 'Bambang Wijaya'];

export function createSeed(): Database {
  const clients: Client[] = [...clientNames, 'Bank Nusantara', 'Fintech Sejahtera'].map((name, i) => ({
    id: `CLI-${String(i + 1).padStart(4, '0')}`, code: ['ADIRA', 'FIF', 'WOM', 'BCAF', 'BW', 'BNUSA', 'FSEJA'][i], name,
    industry: i === 4 ? 'PERORANGAN' : i === 5 ? 'PERBANKAN' : i === 6 ? 'FINTECH' : 'MULTIFINANCE',
    contactPerson: ['Rani Prasetyo', 'Arif Setiawan', 'Dina Putri', 'Sari Lestari', 'Bambang Wijaya', 'Rizal Pratama', 'Nadia Putri'][i],
    phone: `0812000000${10 + i}`, email: `client${i + 1}@arms-demo.example`, streetAddress: `Jl. Sudirman No. ${10 + i}`,
    regencyId: '31.74', regency: 'Kota Administrasi Jakarta Selatan', districtId: '31.74.07', district: 'Kebayoran Baru', village: 'Senayan',
    address: `Jl. Sudirman No. ${10 + i}, Senayan, Kebayoran Baru, Jakarta Selatan`, createdAt: '2025-01-01T02:00:00.000Z',
  }));
  const personnel: Personnel[] = [
    { id: 'PER-001', name: 'Andi Saputra', type: 'Karyawan', bank: 'BCA - 0123456701' },
    { id: 'PER-002', name: 'Dimas Pratama', type: 'Mitra DC', bank: 'Mandiri - 1234567802' },
    { id: 'PER-003', name: 'Rizal Maulana', type: 'Karyawan', bank: 'BNI - 0987654303' },
    { id: 'PER-004', name: 'Fajar Nugroho', type: 'Mitra DC', bank: 'BRI - 1234506704' },
    { id: 'PER-005', name: 'Nadia Putri', type: 'Karyawan', bank: 'BCA - 0123456705' },
    { id: 'PER-006', name: 'Arif Wibowo', type: 'Mitra DC', bank: 'Mandiri - 1234567806' },
  ];
  personnel.forEach((p, i) => { p.position = i === 0 ? 'Supervisor Penagihan' : 'Petugas Penagihan'; });
  const customers: Customer[] = Array.from({ length: 156 }, (_, i) => {
    const installment = [24000000, 18000000, 31000000, 15000000, 42000000][i] || (18000000 + ((i * 1730000) % 19000000));
    const penalty = [500000, 750000, 1000000, 200000, 800000][i] || (i % 5) * 150000;
    return {
      id: `CUS-${String(i + 1).padStart(4, '0')}`,
      name: i < 5 ? ['Budi Santoso', 'Siti Rahmawati', 'Ahmad Hidayat', 'Dewi Lestari', 'Rudi Hartono'][i] : `${firstNames[i % 20]} ${lastNames[Math.floor(i / 20)]}`,
      nik: `000000${String(i + 1).padStart(10, '0')}`,
      phone: `0812${String(10000000 + i * 137)}`, address: `Jl. Melati No. ${i + 1}, ${['Jakarta Selatan', 'Bekasi', 'Tangerang', 'Depok'][i % 4]}`,
      contract: `CTR-${2025001000 + i}`, streetAddress: `Jl. Melati No. ${i + 1}`, regency: ['Jakarta Selatan', 'Bekasi', 'Tangerang', 'Depok'][i % 4],
      dueDate: `2025-06-${String(5 + i % 20).padStart(2, '0')}`, brandType: ['Honda Vario 160, 2023', 'Yamaha NMAX, 2022', 'Toyota Avanza, 2021', 'Honda Beat, 2023', 'Suzuki Ertiga, 2020'][i % 5], plate: '',
      occupation: ['Wiraswasta', 'Karyawan swasta', 'Pedagang', 'Pegawai negeri'][i % 4], emergency: `Istri / Suami - 0813${String(20000000 + i * 91)}`,
      vehicle: ['Honda Vario 160, 2023', 'Yamaha NMAX, 2022', 'Toyota Avanza, 2021', 'Honda Beat, 2023', 'Suzuki Ertiga, 2020'][i % 5], installment, penalty, total: installment + penalty,
    };
  });
  const cases: Case[] = customers.map((customer, i) => {
    const overdue = i < 5 ? [45, 72, 95, 28, 60][i] : i < 49 ? 14 + i % 17 : i < 86 ? 32 + i % 29 : i < 112 ? 62 + i % 29 : 95 + i % 48;
    const createdDate = `2025-06-${String(Math.max(1, 20 - Math.floor(i / 8))).padStart(2, '0')}`;
    customer.dueDate = new Date(Date.parse(createdDate) - overdue * 86400000).toISOString().slice(0, 10);
    return {
      id: `CAS-${String(i + 1).padStart(4, '0')}`, number: `CS-2025-${String(156 - i).padStart(4, '0')}`,
      client: clients[i % 5].name, clientType: clients[i % 5].industry, clientId: clients[i % 5].id, customerId: customer.id,
      service: 'Penagihan Piutang', personnelId: personnel[i % personnel.length].id, createdDate, dueDateSnapshot: customer.dueDate,
      contract: `CTR-${2025001000 + i}`, principal: customer.total, overdue, bucket: getBucket(overdue), asset: customer.vehicle,
      status: i >= 128 ? 'Selesai' : i % 3 === 1 ? 'Dalam Proses' : 'Aktif',
      createdAt: `${createdDate}T09:30:00.000Z`,
    };
  });
  const letters: Letter[] = Array.from({ length: 128 }, (_, i) => ({
    id: `SK-${String(i + 1).padStart(4, '0')}`, number: `${cases[i].clientType === 'PERORANGAN' ? 'SK' : 'ST'}/ARMS/2025/06/${String(128 - i).padStart(4, '0')}`,
    caseId: cases[i].id, personnelId: personnel[i % personnel.length].id,
    issuedAt: `2025-06-${String(Math.max(1, 20 - Math.floor(i / 8))).padStart(2, '0')}`, status: 'Aktif', place: 'Jakarta', signer: 'Admin Pratama', clientRepresentative: cases[i].clientType === 'PERORANGAN' ? 'Bambang Wijaya' : 'Direktur Operasional', clientAddress: 'Jakarta, Indonesia',
  }));
  const monthlyTotals = [148000000, 186500000, 168000000, 268000000, 340800000, 384500000];
  const payments: Payment[] = [];
  monthlyTotals.forEach((total, month) => {
    for (let j = 0; j < 32; j++) {
      const amount = j === 31 ? total - Math.floor(total / 32) * 31 : Math.floor(total / 32);
      let index = (month * 32 + j) % cases.length;
      while (cases[index].principal - payments.filter(p => p.caseId === cases[index].id).reduce((sum, p) => sum + p.amount, 0) < amount) index = (index + 1) % cases.length;
      payments.push({
        id: `PAY-${month + 1}-${j + 1}`, number: `KW/ARMS/2025/${String(month + 1).padStart(2, '0')}/${String(j + 1).padStart(4, '0')}`,
        caseId: cases[index].id, amount, ...calculatePayment(amount, 20, 50, []), proof: '',
        date: `2025-${String(month + 1).padStart(2, '0')}-${String(Math.min(20, 1 + Math.floor(j * 19 / 31))).padStart(2, '0')}`, feeRate: 20, partnerRate: 50, manualDetails: [],
      });
    }
  });
  cases.filter(c => c.status === 'Selesai').forEach(c => {
    const customer = customers.find(item => item.id === c.customerId)!;
    const paid = payments.filter(p => p.caseId === c.id).reduce((sum, p) => sum + p.amount, 0);
    customer.installment = Math.max(0, paid - customer.penalty);
    customer.total = customer.installment + customer.penalty;
    c.principal = customer.total;
  });
  const currentUser: User = { id: 'USR-001', username: 'admin@arms.agency', role: 'Administrator' };
  const executions: Execution[] = [2, 5, 8].map((index, i) => ({ id: `EXE-${i + 1}`, number: `TU-2025-000${i + 1}`, caseId: cases[index].id, personnelId: personnel[i].id, date: `2025-06-${18 + i}`, location: customers[index].address, method: 'Penyerahan Sukarela', authorityRef: `ST/ARMS/2025/06/00${i + 1}`, handoverRef: i === 2 ? 'BAST-DEMO-003' : '', status: (['Dijadwalkan', 'Dalam Proses', 'Selesai'] as const)[i], feeBase: 20000000, feeRate: 10, partnerRate: 40, ...calculatePayment(20000000, 10, 40, []), notes: 'Data demonstrasi. Verifikasi dokumen sebelum penugasan.' }));
  const accounts: BankAccount[] = [{ id: 'ACC-001', name: 'Rekening Operasional', bank: 'BCA', number: '0123456789', holder: 'ARMS Agency', openingBalance: 10000000 }];
  const transactions: AccountTransaction[] = [
    { id: 'TRX-001', number: 'TRX-2025-0001', accountId: 'ACC-001', date: '2025-06-19', type: 'Pemasukan', category: 'Fee Klien', sourceType: 'multifinance', sourceId: '', caseId: '', client: 'Adira Finance', amount: 2500000, reference: 'INV-DEMO-001', description: 'Penerimaan fee penagihan dari klien (demo)' },
    { id: 'TRX-002', number: 'TRX-2025-0002', accountId: 'ACC-001', date: '2025-06-20', type: 'Pengeluaran', category: 'Operasional', sourceType: 'manual', sourceId: '', caseId: '', client: '', amount: 250000, reference: 'OPS-DEMO-001', description: 'Biaya transportasi tim (demo)' },
  ];
  transactions[0].clientId = clients[0].id;
  const collections: CollectionLog[] = [0, 1, 2, 3].map((index, i) => ({
    id: `LOG-${i + 1}`, number: `LOG-2025-000${i + 1}`, caseId: cases[index].id, activity: i % 2 ? 'WhatsApp & Chat' : 'Kunjungan Lapangan',
    activityDate: '2025-06-20', personnelId: cases[index].personnelId!, contactedParty: 'Debitur Langsung',
    outcome: ['Janji Bayar (Promise to Pay)', 'Sepakat Mediasi Kantor', 'Unit Ditemukan / Teridentifikasi', 'Debitur Tidak di Rumah / Nomor Tidak Aktif'][i],
    actionPlan: ['Konfirmasi pembayaran sesuai kesepakatan.', 'Jadwalkan mediasi bersama klien.', 'Verifikasi dokumen dan kondisi unit.', 'Hubungi kembali melalui kanal terdaftar.'][i],
    nextActionDate: `2025-06-${21 + i}`, report: 'Catatan demonstrasi: tindak lanjut dilakukan secara profesional sesuai kesepakatan dengan debitur dan ketentuan klien.', hasPayment: false,
    createdAt: `2025-06-20T0${5 + i}:00:00.000Z`, updatedAt: `2025-06-20T0${5 + i}:00:00.000Z`,
  }));
  return { clients, collections, customers, cases, personnel, letters, payments, executions, accounts, transactions, users: [currentUser], currentUser, settings: { agency: 'ARMS Agency', address: 'Jl. Jenderal Sudirman No. 28, Jakarta Selatan', signer: 'Admin Pratama', feeRate: 20, partnerRate: 50, target: 500000000 } };
}

export function createEmptyDatabase(): Database {
  return { clients: [], collections: [], customers: [], cases: [], personnel: [], letters: [], payments: [], executions: [], accounts: [], transactions: [], users: [], settings: { agency: 'ARMS Agency', address: '', signer: 'ARMS Workspace', feeRate: 10, partnerRate: 40, target: 500000000 } };
}

export const getCustomer = (db: Database, id: string) => db.customers.find(c => c.id === id);
export const getCase = (db: Database, id: string) => db.cases.find(c => c.id === id);
export const getAssignee = (db: Database, caseId: string) => {
  const assigned = db.personnel.find(p => p.id === db.cases.find(c => c.id === caseId)?.personnelId);
  if (assigned) return assigned;
  const letter = db.letters.filter(l => l.caseId === caseId && l.status === 'Aktif').slice(-1)[0];
  return db.personnel.find(p => p.id === letter?.personnelId);
};
export const getPaid = (db: Database, caseId: string, excludeId?: string) => db.payments.filter(p => p.caseId === caseId && p.id !== excludeId).reduce((sum, p) => sum + Number(p.amount), 0);
export const isCaseSuccessful = (db: Database, c: Case) => c.status === 'Selesai' || (c.principal > 0 && getPaid(db, c.id) >= c.principal);
export const canReceivePayment = (db: Database, c: Case) => !isCaseSuccessful(db, c) && c.principal - getPaid(db, c.id) > 0;
export function syncPaymentStatus(db: Database) {
  db.cases = db.cases.map(c => {
    const complete = c.principal > 0 && getPaid(db, c.id) >= c.principal;
    if (complete && c.status !== 'Selesai') return { ...c, status: 'Selesai', paymentClosed: true };
    if (!complete && c.paymentClosed) return { ...c, status: 'Dalam Proses', paymentClosed: false };
    return c;
  });
  return db;
}
export const PROCESS_LABELS = ['Baru', 'Dalam penagihan', 'Janji bayar', 'Mediasi', 'Pembayaran sebagian', 'Tarik unit', 'Unit ditarik', 'Berhasil', 'Ditunda'];
export function customerProcess(db: Database, customerId: string): { label: string; progress: number; detail: string } {
  const cases = db.cases.filter(c => c.customerId === customerId);
  if (!cases.length) return { label: 'Baru', progress: 10, detail: 'Belum memiliki kasus' };
  if (cases.every(c => isCaseSuccessful(db, c))) return { label: 'Berhasil', progress: 100, detail: 'Seluruh kasus selesai' };
  const active = cases.filter(c => !isCaseSuccessful(db, c));
  const executions = db.executions.filter(e => active.some(c => c.id === e.caseId) && e.status !== 'Dibatalkan');
  if (executions.some(e => e.status !== 'Selesai')) return { label: 'Tarik unit', progress: 70, detail: 'Penugasan penarikan berjalan' };
  if (executions.some(e => e.status === 'Selesai')) return { label: 'Unit ditarik', progress: 85, detail: 'Menunggu penyelesaian kasus' };
  const paid = active.reduce((sum, c) => sum + getPaid(db, c.id), 0);
  if (paid > 0) return { label: 'Pembayaran sebagian', progress: Math.min(90, Math.max(30, Math.round(paid / active.reduce((sum, c) => sum + c.principal, 0) * 100))), detail: `${currency(paid)} diterima` };
  if (active.every(c => c.status === 'Ditunda')) return { label: 'Ditunda', progress: 20, detail: 'Penanganan ditunda' };
  const latest = [...db.collections].filter(log => active.some(c => c.id === log.caseId)).sort((a, b) => b.activityDate.localeCompare(a.activityDate) || b.createdAt.localeCompare(a.createdAt))[0];
  if (latest?.outcome === 'Janji Bayar (Promise to Pay)') return { label: 'Janji bayar', progress: 45, detail: `Target ${formatDate(latest.nextActionDate)}` };
  if (latest?.outcome === 'Sepakat Mediasi Kantor') return { label: 'Mediasi', progress: 40, detail: latest.actionPlan || 'Menunggu mediasi kantor' };
  return { label: 'Dalam penagihan', progress: 25, detail: `${active.length} kasus aktif` };
}
export const accountBalance = (db: Database, id: string) => (db.accounts.find(a => a.id === id)?.openingBalance || 0) + db.transactions.filter(t => t.accountId === id).reduce((sum, t) => sum + (t.type === 'Pemasukan' ? t.amount : -t.amount), 0);
export const postedFee = (db: Database, sourceType: TransactionSource, sourceId: string, type: AccountTransaction['type'], excludeId?: string) => db.transactions.filter(t => t.sourceType === sourceType && t.sourceId === sourceId && t.type === type && t.id !== excludeId).reduce((sum, t) => sum + t.amount, 0);
export function feeSources(db: Database) {
  return [
    ...db.payments.map(p => ({ id: p.id, type: 'payment' as const, number: p.number, caseId: p.caseId, date: p.date, amount: p.grossFee + p.manualTotal, partner: p.partnerCommission })),
    ...db.executions.filter(e => e.status === 'Selesai').map(e => ({ id: e.id, type: 'execution' as const, number: e.number, caseId: e.caseId, date: e.date, amount: e.grossFee, partner: e.partnerCommission })),
  ].map(source => ({ ...source, recorded: postedFee(db, source.type, source.id, 'Pemasukan'), remaining: Math.max(0, source.amount - postedFee(db, source.type, source.id, 'Pemasukan')) }));
}

export function exportCsv(filename: string, rows: (string | number)[][]) {
  const text = '\uFEFF' + rows.map(row => row.map(value => {
    const string = String(value);
    return `"${(/^[=+@-]/.test(string) && typeof value !== 'number' ? "'" : '') + string.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n');
  downloadFile(filename, text, 'text/csv;charset=utf-8;');
}

export function downloadFile(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}