import { calculatePayment, canReceivePayment, isCaseSuccessful, postedFee, type AccountTransaction, type BankAccount, type Database, type Entity, type Execution, type RecordData } from './data';

function amount(value: unknown, label: string, max = 1e15) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error(`${label} tidak valid.`);
  return max === 100 ? n : Math.round(n);
}
function required(value: unknown, label: string) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} wajib diisi.`);
  return text;
}
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Tanggal tidak valid.');
  return value;
}

export function validateFinanceRecord(db: Database, entity: Entity, record: RecordData, existing?: RecordData) {
  if (entity === 'executions') {
    const e = record as Execution;
    const c = db.cases.find(c => c.id === e.caseId);
    if (!c) throw new Error('Pilih kasus penarikan.');
    if ((!existing || (existing as Execution).caseId !== e.caseId) && !canReceivePayment(db, c)) throw new Error('Kasus sudah selesai dan tidak dapat ditugaskan untuk penarikan.');
    if (!db.personnel.some(p => p.id === e.personnelId)) throw new Error('Pilih petugas terdaftar.');
    if (!['Penyerahan Sukarela', 'Eksekusi Sesuai Dokumen'].includes(e.method)) throw new Error('Metode penarikan tidak valid.');
    if (!['Dijadwalkan', 'Dalam Proses', 'Selesai', 'Dibatalkan'].includes(e.status)) throw new Error('Status penarikan tidak valid.');
    if (e.status !== 'Dibatalkan' && db.executions.some(r => r.caseId === e.caseId && r.id !== e.id && r.status !== 'Dibatalkan')) throw new Error('Kasus sudah memiliki penugasan penarikan. Edit penugasan tersebut.');
    e.date = date(e.date); e.location = required(e.location, 'Lokasi'); e.authorityRef = required(e.authorityRef, 'Referensi kuasa / dokumen penarikan');
    if (e.status === 'Selesai') e.handoverRef = required(e.handoverRef, 'Nomor BAST / bukti serah terima');
    e.feeBase = amount(e.feeBase, 'Dasar perhitungan fee'); e.feeRate = amount(e.feeRate, 'Persentase fee', 100); e.partnerRate = amount(e.partnerRate, 'Hak mitra', 100);
    Object.assign(e, calculatePayment(e.feeBase, e.feeRate, e.partnerRate, []));
    e.number = (existing as Execution)?.number || `TU-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const related = db.transactions.filter(t => t.sourceType === 'execution' && t.sourceId === e.id);
    if (related.length && (e.status !== 'Selesai' || (existing as Execution).caseId !== e.caseId)) throw new Error('Penarikan sudah memiliki mutasi fee. Hapus atau koreksi mutasi terlebih dahulu.');
    if (postedFee(db, 'execution', e.id, 'Pemasukan') > e.grossFee || postedFee(db, 'execution', e.id, 'Pengeluaran') > e.partnerCommission) throw new Error('Fee baru lebih kecil dari mutasi yang telah dicatat.');
  }
  if (entity === 'accounts') {
    const a = record as BankAccount;
    a.name = required(a.name, 'Nama rekening'); a.bank = required(a.bank, 'Bank / kas'); a.number = required(a.number, 'Nomor rekening / kode kas'); a.holder = required(a.holder, 'Nama pemilik'); a.openingBalance = amount(a.openingBalance, 'Saldo awal');
    if (db.accounts.some(r => r.id !== a.id && r.bank.toLowerCase() === a.bank.toLowerCase() && r.number === a.number)) throw new Error('Rekening sudah terdaftar.');
  }
  if (entity === 'transactions') {
    const t = record as AccountTransaction;
    if (!db.accounts.some(a => a.id === t.accountId)) throw new Error('Tambahkan dan pilih rekening terlebih dahulu.');
    if (!['Pemasukan', 'Pengeluaran'].includes(t.type)) throw new Error('Jenis mutasi tidak valid.');
    if (!['manual', 'multifinance', 'payment', 'execution', 'case'].includes(t.sourceType)) throw new Error('Sumber mutasi tidak valid.');
    t.amount = amount(t.amount, 'Nominal'); if (!t.amount) throw new Error('Nominal harus lebih dari nol.');
    t.date = date(t.date); t.description = required(t.description, 'Keterangan'); t.reference = required(t.reference, 'Referensi transaksi'); t.category = required(t.category, 'Kategori');
    if (db.transactions.some(r => r.id !== t.id && r.accountId === t.accountId && r.type === t.type && r.reference.toLowerCase() === t.reference.toLowerCase())) throw new Error('Referensi transaksi sudah dicatat di rekening ini.');
    if (t.sourceType === 'payment' || t.sourceType === 'execution') {
      const source = t.sourceType === 'payment' ? db.payments.find(p => p.id === t.sourceId) : db.executions.find(e => e.id === t.sourceId && e.status === 'Selesai');
      if (!source) throw new Error('Pilih pembayaran atau penarikan selesai sebagai sumber fee.');
      t.caseId = source.caseId; t.client = db.cases.find(c => c.id === source.caseId)?.client || '';
      t.clientId = db.cases.find(c => c.id === source.caseId)?.clientId || '';
      const expected = t.type === 'Pemasukan' ? source.grossFee + ('manualTotal' in source ? source.manualTotal : 0) : source.partnerCommission;
      const posted = postedFee(db, t.sourceType, source.id, t.type, t.id);
      if (t.amount > Math.max(0, expected - posted)) throw new Error('Nominal melebihi sisa fee / komisi sumber yang belum dicatat.');
      t.category = t.type === 'Pengeluaran' ? 'Komisi Mitra' : t.sourceType === 'execution' ? 'Fee Tarik Unit' : 'Fee Penagihan';
    } else if (t.sourceType === 'case') {
      const c = db.cases.find(c => c.id === t.sourceId);
      if (!c || !isCaseSuccessful(db, c)) throw new Error('Pilih kasus yang sudah terselesaikan.');
      t.caseId = c.id; t.client = c.client; t.clientId = c.clientId || '';
    } else {
      t.sourceId = ''; t.caseId = '';
      if (t.sourceType === 'multifinance') {
        const client = db.clients.find(c => c.id === t.clientId);
        if (!client) throw new Error('Pilih klien / creditor dari master klien.');
        t.client = client.name;
      } else t.clientId = '';
    }
    t.number = (existing as AccountTransaction)?.number || `TRX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }
}