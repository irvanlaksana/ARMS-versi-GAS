import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Calculator, Check, CircleHelp, ExternalLink, FileText, LockKeyhole, Pencil, Plus, Save, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import { useArms } from '../lib/context';
import { calculatePayment, canReceivePayment, currency, customerProcess, formatDate, getAssignee, getCase, getCustomer, getPaid, isoToday, postedFee, type Case, type Customer, type Entity, type Letter, type ManualFee, type Payment, type Personnel, type RecordData, type SubmitOptions } from '../lib/data';
import { Field, Modal, Spinner, StatusBadge } from './ui';
import { CustomerForm } from './CustomerForm';
import { CustomerDocument } from './CustomerDocument';
import { FinanceDetail, FinanceForm, type FinanceEntity } from './FinanceModules';
import { ClientForm, CollectionForm, RecoveryCaseForm } from './CrmForms';
import { CaseConnections, CrmDetail } from './CrmModules';
import { PersonnelDocument, PersonnelForm } from './PersonnelForm';
import { LetterPdfDownload } from './LetterPdfUpload';

const labels: Record<Entity, string> = { clients: 'Client', collections: 'Log Komunikasi', customers: 'Debitur', cases: 'Kasus', payments: 'Pembayaran', personnel: 'Personel', letters: 'Surat', users: 'Pengguna', executions: 'Tarik Unit', accounts: 'Rekening', transactions: 'Transaksi' };
type FormValue = string | number | ManualFee[];

interface RecordFormProps { entity: Entity; record?: RecordData; defaults?: Record<string, unknown>; busy: boolean; error: string; onClose: () => void; onSubmit: (data: Partial<RecordData>, options?: SubmitOptions) => void }
export function RecordForm(props: RecordFormProps) {
  useEffect(() => { if (props.error) document.querySelector('.modal [role="alert"]')?.scrollIntoView({ block: 'nearest' }); }, [props.error]);
  if (props.entity === 'clients') return <ClientForm {...props}/>;
  if (props.entity === 'cases') return <RecoveryCaseForm {...props}/>;
  if (props.entity === 'collections') return <CollectionForm {...props}/>;
  if (props.entity === 'personnel') return <PersonnelForm {...props} record={props.record as Personnel | undefined}/>;
  if (['executions', 'accounts', 'transactions'].includes(props.entity)) return <FinanceForm {...props} entity={props.entity as FinanceEntity}/>;
  return props.entity === 'customers' ? <CustomerForm {...props} record={props.record as Customer | undefined}/> : <OperationalForm {...props}/>;
}
function OperationalForm({ entity, record, defaults, busy, error, onClose, onSubmit }: RecordFormProps) {
  const { db: workspaceDb } = useArms();
  const logId = String(defaults?.collectionLogId || (record as Payment)?.collectionLogId || '');
  const sourceLog = workspaceDb.collections.find(l => l.id === logId);
  const db = entity === 'payments' ? { ...workspaceDb, cases: workspaceDb.cases.filter(c => (canReceivePayment(workspaceDb, c) || c.id === (record as Payment)?.caseId) && (!logId || c.id === sourceLog?.caseId)) } : workspaceDb;
  const initial: Record<Entity, Record<string, FormValue>> = {
    customers: { name: '', nik: '', phone: '', address: '', occupation: '', emergency: '', vehicle: '', installment: 0, penalty: 0 },
    cases: { client: '', clientType: 'MULTIFINANCE', customerId: '', contract: '', overdue: 0, asset: '', status: 'Aktif' },
    payments: { caseId: '', amount: 0, feeRate: db.settings.feeRate, partnerRate: db.settings.partnerRate, date: isoToday(), proof: '', manualDetails: [] },
    personnel: { name: '', type: 'Karyawan', bank: '' }, users: { username: '', role: 'Collector' }, letters: {}, executions: {}, accounts: {}, transactions: {}, clients: {}, collections: {},
  };
  const [values, setValues] = useState<Record<string, FormValue>>({ ...initial[entity], ...(record as unknown as Record<string, FormValue> || {}), ...(defaults as Record<string, FormValue> || {}) });
  const set = (key: string, value: FormValue) => setValues(previous => ({ ...previous, [key]: value }));
  const string = (key: string) => String(values[key] ?? '');
  const num = (key: string) => Number(values[key] || 0);
  const input = (key: string, options: { type?: string; placeholder?: string; required?: boolean; min?: number; max?: number; pattern?: string; maxLength?: number; list?: string } = {}) => <input {...options} step={options.type === 'number' && options.max === 100 ? '0.01' : undefined} value={string(key)} onChange={e => set(key, options.type === 'number' ? e.target.value === '' ? '' : Number(e.target.value) : e.target.value)}/>;
  const select = (key: string, options: { value: string; label: string }[]) => <select value={string(key)} onChange={e => set(key, e.target.value)} required>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  const options = (items: string[]) => items.map(value => ({ value, label: value }));
  const selectedCase = getCase(db, string('caseId'));
  const remaining = selectedCase ? Math.max(0, selectedCase.principal - getPaid(db, selectedCase.id, record?.id)) : 0;
  const manual = (values.manualDetails || []) as ManualFee[];
  const totals = calculatePayment(num('amount'), num('feeRate'), num('partnerRate'), manual);
  const updateManual = (id: string, key: keyof ManualFee, value: string | number) => set('manualDetails', manual.map(row => row.id === id ? { ...row, [key]: value } : row));
  const subtitle = entity === 'customers' ? 'Data debitur yang lengkap untuk penagihan yang lebih terarah.' : entity === 'cases' ? 'Hubungkan klien dan debitur dalam satu kasus piutang.' : entity === 'payments' ? 'Catat penerimaan dan hitung pembagian fee secara otomatis.' : entity === 'personnel' ? 'Kelola data karyawan dan mitra penagihan Anda.' : 'Berikan akses workspace ke akun Google yang terverifikasi.';
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const data = { ...values };
    if (entity === 'payments') Object.assign(data, totals);
    onSubmit(data as unknown as Partial<RecordData>);
  }
  return <Modal title={`${record ? 'Edit' : entity === 'payments' ? 'Catat' : 'Tambah'} ${labels[entity]}`} subtitle={subtitle} onClose={onClose} wide={entity === 'payments'}><form onSubmit={submit}><fieldset disabled={busy} className="form-fieldset"><div className="modal-body">
    {entity === 'payments' && <p className="payment-eligibility-note"><ShieldCheck size={14}/>Hanya kasus aktif yang belum berhasil / lunas ditampilkan. Pembayaran sebagian tetap dapat dilanjutkan.</p>}
    {entity === 'payments' && sourceLog && <div className="crm-linked-summary"><span><FileText size={14}/>Berasal dari {sourceLog.number}</span><span>{sourceLog.activity} / {formatDate(sourceLog.activityDate)}</span></div>}
    {entity === 'payments' && <><div className="form-section-label"><span>01</span>Informasi pembayaran</div><div className="form-grid"><Field label="Kasus piutang" required className="span-2"><select required value={string('caseId')} onChange={e => set('caseId', e.target.value)}><option value="">Pilih kasus yang menerima pembayaran</option>{db.cases.map(c => <option key={c.id} value={c.id}>{c.number} - {getCustomer(db, c.customerId)?.name} ({c.client})</option>)}</select></Field>{selectedCase && <div className="payment-case-info span-2"><span>Sisa piutang yang dapat dibayarkan</span><strong>{currency(remaining)}</strong></div>}<Field label="Nominal pembayaran (Rp)" required>{input('amount', { type: 'number', min: 1, max: selectedCase ? remaining : 1e15, required: true })}</Field><Field label="Tanggal pembayaran" required>{input('date', { type: 'date', required: true })}</Field><Field label="Fee penagihan (%)" hint="Persentase dari nominal pembayaran." required>{input('feeRate', { type: 'number', min: 0, max: 100, required: true })}</Field><Field label="Hak mitra dari fee (%)" hint="Sisanya menjadi hak perusahaan." required>{input('partnerRate', { type: 'number', min: 0, max: 100, required: true })}</Field></div><div className="form-section-label manual-heading"><div><span>02</span>Biaya tambahan manual</div><button type="button" className="text-button" onClick={() => set('manualDetails', [...manual, { id: crypto.randomUUID(), label: '', amount: 0, mode: 'company', partnerPercent: num('partnerRate') }])}><Plus size={14}/>Tambah biaya</button></div>{!manual.length && <div className="manual-empty"><CircleHelp size={17}/><span>Tambahkan biaya administrasi, transportasi, atau biaya lainnya jika diperlukan.</span></div>}{manual.map((row, i) => <div className="manual-row" key={row.id}><div className="manual-row-heading"><span>Biaya tambahan {i + 1}</span><button type="button" className="icon-button danger" aria-label={`Hapus biaya ${i + 1}`} onClick={() => set('manualDetails', manual.filter(f => f.id !== row.id))}><Trash2 size={15}/></button></div><div className="form-grid"><Field label="Keterangan biaya" required><input required value={row.label} placeholder="Contoh: Biaya administrasi" onChange={e => updateManual(row.id, 'label', e.target.value)}/></Field><Field label="Nominal (Rp)" required><input type="number" min="0" required value={row.amount} onChange={e => updateManual(row.id, 'amount', Number(e.target.value))}/></Field><Field label="Pembagian biaya"><select value={row.mode} onChange={e => updateManual(row.id, 'mode', e.target.value)}><option value="company">100% Hak Perusahaan</option><option value="split">Split dengan Mitra</option></select></Field>{row.mode === 'split' && <Field label="Hak mitra (%)"><input type="number" min="0" max="100" required value={row.partnerPercent} onChange={e => updateManual(row.id, 'partnerPercent', Number(e.target.value))}/></Field>}</div></div>)}<div className="payment-calculation"><div className="payment-calculation-heading"><Calculator size={17}/><h3>Ringkasan pembagian</h3><span>Otomatis</span></div><div className="payment-calculation-grid"><div><span>Gross fee</span><strong>{currency(totals.grossFee)}</strong></div><div><span>Total biaya tambahan</span><strong>{currency(totals.manualTotal)}</strong></div><div className="company-total"><span>Pendapatan perusahaan</span><strong>{currency(totals.companyRevenue)}</strong></div><div><span>Hak komisi mitra</span><strong>{currency(totals.partnerCommission)}</strong></div></div><p><Check size={13}/>Total pendapatan + komisi = gross fee + biaya tambahan</p></div><Field label="Bukti transfer" hint="Tautan HTTPS ke file bukti transfer. Pastikan akses file dibatasi untuk tim.">{input('proof', { type: 'url', placeholder: 'https://drive.google.com/file/d/...' })}</Field></>}
    {entity === 'personnel' && <div className="form-grid"><Field label="Nama lengkap" required className="span-2">{input('name', { required: true, placeholder: 'Nama karyawan atau mitra' })}</Field><Field label="Tipe personel" required>{select('type', options(['Karyawan', 'Mitra DC']))}</Field><Field label="Rekening bank" required>{input('bank', { required: true, placeholder: 'BCA - 0123456789 a.n. Nama' })}</Field></div>}
    {entity === 'users' && <><div className="form-grid"><Field label="Email akun Google" required className="span-2">{input('username', { type: 'email', placeholder: 'nama@perusahaan.com', required: true })}</Field><Field label="Peran workspace" required className="span-2">{select('role', options(['Administrator', 'Supervisor', 'Collector']))}</Field></div><div className="role-description"><ShieldCheck size={18}/><p><strong>{string('role')}</strong>{string('role') === 'Administrator' ? 'Akses penuh, termasuk pengguna, pengaturan, dan penghapusan data.' : string('role') === 'Supervisor' ? 'Mengelola operasional, laporan, serta menghapus data tanpa mengubah akses pengguna.' : 'Melihat dan memperbarui data operasional. Tidak dapat menghapus data.'}</p></div></>}
    {error && <div className="form-error" role="alert"><AlertCircle size={16}/>{error}</div>}
  </div><footer className="modal-footer"><span className="secure-label"><LockKeyhole size={13}/>Data tersimpan aman di workspace</span><div><button type="button" className="button button-secondary" onClick={onClose}>Batal</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <Spinner/> : <Save size={16}/>} {busy ? 'Menyimpan...' : `Simpan ${labels[entity]}`}</button></div></footer></fieldset></form></Modal>;
}

export function RecordDetail(props: { entity: Entity; record: RecordData; onClose: () => void }) {
  if (props.entity === 'clients' || props.entity === 'collections') return <CrmDetail {...props} entity={props.entity}/>;
  if (['executions', 'accounts', 'transactions'].includes(props.entity)) return <FinanceDetail {...props} entity={props.entity as FinanceEntity}/>;
  return <BasicRecordDetail {...props}/>;
}
function BasicRecordDetail({ entity, record, onClose }: { entity: Entity; record: RecordData; onClose: () => void }) {
  const { db, openForm, openLetter, requestDelete, openDetail } = useArms();
  let title = `Detail ${labels[entity]}`;
  let details: { label: string; value: React.ReactNode }[] = [];
  const current = (db[entity] as RecordData[]).find(r => r.id === record.id) || record;
  if (entity === 'customers') {
    const c = current as typeof db.customers[number]; title = c.name;
    details = [
      { label: 'Proses penanganan', value: <StatusBadge status={customerProcess(db, c.id).label}/> }, { label: 'Perkembangan', value: customerProcess(db, c.id).detail },
      { label: 'No. Kontrak', value: c.contract || db.cases.find(item => item.customerId === c.id)?.contract || '-' }, { label: 'Nama', value: c.name },
      { label: 'Kabupaten/Kota', value: c.regency || '-' }, { label: 'Kecamatan', value: c.district || '-' }, { label: 'Kelurahan / Desa', value: c.village || '-' },
      { label: 'Alamat Domisili Debitur', value: c.address || '-' }, { label: 'Tanggal Jatuh Tempo', value: c.dueDate ? formatDate(c.dueDate) : '-' }, { label: 'Nomor Handphone', value: c.phone },
      { label: 'Foto KTP', value: <CustomerDocument customer={c} kind="ktp"/> }, { label: 'Foto STNK', value: <CustomerDocument customer={c} kind="stnk"/> },
      { label: 'Angsuran', value: currency(c.installment) }, { label: 'Total Angsuran (Rp)', value: <strong className="purple-text">{currency(c.total)}</strong> },
      { label: 'DENDA', value: currency(c.penalty) }, { label: 'Merk/Type', value: c.brandType || c.vehicle || '-' }, { label: 'Nomor Polisi', value: c.plate || '-' },
    ];
  } else if (entity === 'cases') {
    const c = current as Case; title = c.number;
    const customer = getCustomer(db, c.customerId);
    details = [{ label: 'Debitur', value: <button className="text-button" onClick={() => customer && openDetail('customers', customer)}>{customer?.name}<ArrowRight size={14}/></button> }, { label: 'Klien', value: c.client }, { label: 'Tipe klien', value: c.clientType }, { label: 'Nomor kontrak', value: c.contract }, { label: 'Principal outstanding', value: currency(c.principal) }, { label: 'Pembayaran diterima', value: currency(getPaid(db, c.id)) }, { label: 'Sisa piutang', value: <strong className="purple-text">{currency(Math.max(0, c.principal - getPaid(db, c.id)))}</strong> }, { label: 'Overdue / DPD bucket', value: `${c.overdue} hari / ${c.bucket}` }, { label: 'Petugas', value: getAssignee(db, c.id)?.name || 'Belum ditugaskan' }, { label: 'Status', value: <StatusBadge status={c.status}/> }, { label: 'Ringkasan aset', value: c.asset || '-' }, { label: 'Tanggal dibuat', value: formatDate(c.createdAt) }];
    details.push({ label: 'Layanan', value: c.service || '-' }, { label: 'Jatuh tempo acuan', value: c.dueDateSnapshot ? formatDate(c.dueDateSnapshot) : '-' });
  } else if (entity === 'payments') {
    const p = current as Payment; title = p.number;
    const c = getCase(db, p.caseId);
    details = [{ label: 'Kasus', value: c?.number || '-' }, { label: 'Debitur', value: getCustomer(db, c?.customerId || '')?.name || '-' }, { label: 'Tanggal pembayaran', value: formatDate(p.date) }, { label: 'Nominal pembayaran', value: currency(p.amount) }, { label: `Gross fee (${p.feeRate}%)`, value: currency(p.grossFee) }, { label: 'Biaya tambahan manual', value: currency(p.manualTotal) }, { label: 'Pendapatan perusahaan', value: <strong className="emerald-text">{currency(p.companyRevenue)}</strong> }, { label: 'Komisi mitra', value: currency(p.partnerCommission) }, { label: 'Bukti transfer', value: p.proof ? <a className="text-button" href={/^https:\/\//i.test(p.proof) ? p.proof : undefined} target="_blank" rel="noopener noreferrer">Lihat bukti transfer<ExternalLink size={13}/></a> : 'Belum dilampirkan' }];
    const log = db.collections.find(l => l.id === p.collectionLogId);
    if (log) details.push({ label: 'Log penagihan terkait', value: <button className="text-button" onClick={() => openDetail('collections', log)}>{log.number}<ArrowRight size={13}/></button> });
  } else if (entity === 'personnel') {
    const p = current as typeof db.personnel[number]; title = p.name; details = [{ label: 'ID Personel', value: p.id }, { label: 'Tipe', value: <StatusBadge status={p.type}/> }, { label: 'Rekening bank', value: p.bank }, { label: 'Surat tugas aktif', value: db.letters.filter(l => l.personnelId === p.id && l.status === 'Aktif').length }];
    details.push({ label: 'Kasus ditugaskan', value: db.cases.filter(c => getAssignee(db, c.id)?.id === p.id && c.status !== 'Selesai').length }, { label: 'Log aktivitas', value: db.collections.filter(l => l.personnelId === p.id).length });
    details.push({ label: 'Posisi / Jabatan', value: p.position || '-' }, { label: 'KTP', value: <PersonnelDocument person={p}/> });
  } else if (entity === 'letters') {
    const l = current as Letter; title = l.number; details = [{ label: 'Kasus', value: getCase(db, l.caseId)?.number }, { label: 'Petugas', value: db.personnel.find(p => p.id === l.personnelId)?.name }, { label: 'Tanggal terbit', value: formatDate(l.issuedAt) }, { label: 'Tempat', value: l.place }, { label: 'Penandatangan', value: l.signer }, { label: 'Status', value: <StatusBadge status={l.status}/> }];
    details.push({ label: 'Dokumen PDF', value: <LetterPdfDownload letter={l}/> }, { label: 'Nama file', value: l.pdfName || 'Belum diunggah' });
  } else {
    const u = current as typeof db.users[number]; title = u.username; details = [{ label: 'ID Pengguna', value: u.id }, { label: 'Email Google', value: u.username }, { label: 'Peran', value: <StatusBadge status={u.role}/> }];
  }
  return <Modal title={title} subtitle={`Detail ${labels[entity].toLowerCase()} dan informasi terkait.`} onClose={onClose}><div className="modal-body">
    <div className="detail-grid">{details.map(d => <div key={d.label}><span>{d.label}</span><div>{d.value}</div></div>)}</div>
    {entity === 'payments' && (current as Payment).manualDetails.length > 0 && <div className="detail-manual"><h3>Rincian biaya tambahan</h3>{(current as Payment).manualDetails.map(row => <div key={row.id}><span>{row.label}<small>{row.mode === 'company' ? '100% Hak Perusahaan' : `Split mitra ${row.partnerPercent}%`}</small></span><strong>{currency(row.amount)}</strong></div>)}</div>}
    {entity === 'cases' && <><CaseConnections caseId={current.id}/><div className="detail-quick-actions"><button className="button button-secondary" onClick={() => { onClose(); openLetter(undefined, current.id); }}><FileText size={16}/>Buat surat tugas</button>{canReceivePayment(db, current as Case) && <button className="button button-secondary" onClick={() => { onClose(); openForm('payments', undefined, { caseId: current.id }); }}><Wallet size={16}/>Catat pembayaran</button>}</div></>}
    {entity === 'customers' && <div className="crm-related-list"><div className="crm-section-heading"><h3>Kasus & riwayat debitur</h3><button className="text-button" onClick={() => { onClose(); openForm('cases', undefined, { customerId: current.id }); }}><Plus size={14}/>Buat Kasus</button></div>{db.cases.filter(c => c.customerId === current.id).map(c => <button key={c.id} className="crm-related-row" onClick={() => openDetail('cases', c)}><FileText size={15}/><span><strong>{c.number}</strong><small>{c.client}</small></span><StatusBadge status={c.status}/></button>)}</div>}
    {entity === 'personnel' && <div className="crm-related-list"><div className="crm-section-heading"><h3>Kasus penugasan aktif</h3></div>{db.cases.filter(c => getAssignee(db, c.id)?.id === current.id && c.status !== 'Selesai').slice(0, 6).map(c => <button key={c.id} className="crm-related-row" onClick={() => openDetail('cases', c)}><FileText size={15}/><span><strong>{c.number}</strong><small>{getCustomer(db, c.customerId)?.name} / {c.client}</small></span><ArrowRight size={14}/></button>)}</div>}
    {entity === 'payments' && db.currentUser?.role !== 'Collector' && <div className="detail-quick-actions"><button className="button button-secondary" onClick={() => { onClose(); const p = current as Payment; openForm('transactions', undefined, { sourceType: 'payment', sourceId: p.id, amount: Math.max(0, p.grossFee + p.manualTotal - postedFee(db, 'payment', p.id, 'Pemasukan')), description: `Penerimaan fee ${p.number}` }); }}><Wallet size={15}/>Catat fee ke rekening</button></div>}
  </div><footer className="modal-footer">{db.currentUser?.role !== 'Collector' ? <button className="button button-danger-ghost" onClick={() => requestDelete(entity, current)}><Trash2 size={15}/>Hapus {labels[entity].toLowerCase()}</button> : <span/>}<button className="button button-primary" onClick={() => { onClose(); entity === 'letters' ? openLetter(current as Letter) : openForm(entity, current); }}>{entity === 'letters' ? <FileText size={16}/> : <Pencil size={16}/>} {entity === 'letters' ? 'Kelola surat' : `Edit ${labels[entity]}`}</button></footer></Modal>;
}