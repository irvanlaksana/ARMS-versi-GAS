import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpDown, ArrowUpRight, ChevronDown, FileText, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import { useArms } from '../lib/context';
import { compactCurrency, currency, customerProcess, exportCsv, formatDate, getAssignee, getCase, getCustomer, getCustomerOutstanding, getCustomerPaid, getPaid, isCaseSuccessful, PROCESS_LABELS, buckets, type Entity, type RecordData } from '../lib/data';
import { Avatar, EmptyState, Pagination, Select, StatusBadge } from './ui';
import { CollectionChart } from './Dashboard';
import { CLIENT_INDUSTRIES } from '../lib/crm';
import { PersonnelDocument } from './PersonnelForm';
import { LetterPdfDownload } from './LetterPdfUpload';

export function CaseTable({ compact = false }: { compact?: boolean }) {
  const { db, openDetail, openForm, bucketFilter, setBucketFilter, notify } = useArms();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Semua kasus');
  const [clientType, setClientType] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [localBucket, setLocalBucket] = useState('');
  const perPage = compact ? 5 : 10;
  const bucket = compact ? localBucket : bucketFilter;
  const updateBucket = compact ? setLocalBucket : setBucketFilter;
  useEffect(() => { setPage(1); setSelected([]); }, [query, status, bucket, clientType, db.cases.length]);
  const filtered = useMemo(() => {
    let result = db.cases.filter(c => {
      const customer = getCustomer(db, c.customerId);
      return (status === 'Semua kasus' || c.status === status) && (!bucket || c.bucket === bucket) && (!clientType || c.clientType === clientType) && `${c.number} ${c.client} ${customer?.name || ''} ${customer?.nik || ''} ${c.contract}`.toLowerCase().includes(query.toLowerCase());
    });
    if (sortAsc !== null) result = [...result].sort((a, b) => sortAsc ? a.principal - b.principal : b.principal - a.principal);
    return result;
  }, [db, query, status, bucket, clientType, sortAsc]);
  useEffect(() => setPage(current => Math.min(current, Math.max(1, Math.ceil(filtered.length / perPage)))), [filtered.length, perPage]);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const tabs = ['Semua kasus', 'Aktif', 'Dalam Proses', 'Selesai'];
  function exportCases() {
    const data = selected.length ? filtered.filter(c => selected.includes(c.id)) : filtered;
    exportCsv('ARMS-kasus.csv', [['No Kasus', 'Debitur', 'Klien', 'Industri', 'No Kontrak', 'Layanan', 'Principal Outstanding', 'Terbayar', 'DPD Saat Dibuat', 'Tanggal Dibuat', 'Jatuh Tempo', 'Petugas', 'Agunan', 'Status'], ...data.map(c => [c.number, getCustomer(db, c.customerId)?.name || '', c.client, c.clientType, c.contract, c.service || '', c.principal, getPaid(db, c.id), c.overdue, c.createdDate || '', c.dueDateSnapshot || '', getAssignee(db, c.id)?.name || '', c.asset, c.status])]);
    notify(`${data.length} kasus diekspor ke CSV.`);
  }
  return <><div className="case-toolbar"><div className="table-tabs">{tabs.map(tab => <button className={status === tab ? 'active' : ''} onClick={() => setStatus(tab)} key={tab}>{tab === 'Dalam Proses' ? 'Dalam proses' : tab}<span>{tab === 'Semua kasus' ? db.cases.length : db.cases.filter(c => c.status === tab).length}</span></button>)}</div><div className="table-tools"><div className="table-search"><Search size={15}/><input aria-label="Cari kasus" placeholder="Cari kasus..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={13}/></button>}</div><div className="filter-wrap" data-popover><button className={`button button-small button-secondary ${bucket || clientType ? 'filter-active' : ''}`} onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={14}/>Filter{(bucket || clientType) && <span className="filter-count">{Number(Boolean(bucket)) + Number(Boolean(clientType))}</span>}</button>{filterOpen && <div className="filter-popover"><h3>Filter kasus</h3><div className="field"><span className="field-label">Umur tunggakan</span><select value={bucket} onChange={e => updateBucket(e.target.value)}><option value="">Semua DPD</option>{buckets.map(b => <option key={b}>{b}</option>)}</select></div><div className="field"><span className="field-label">Tipe klien</span><select value={clientType} onChange={e => setClientType(e.target.value)}><option value="">Semua klien</option>{CLIENT_INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div><div className="filter-actions"><button className="text-button" onClick={() => { updateBucket(''); setClientType(''); }}>Reset</button><button className="button button-primary button-small" onClick={() => setFilterOpen(false)}>Terapkan</button></div></div>}</div>{!compact && <button className="button button-small button-secondary export-icon" onClick={exportCases} aria-label="Ekspor kasus"><ArrowDownToLine size={15}/></button>}</div></div>
    {selected.length > 0 && <div className="selection-bar"><span>{selected.length} kasus dipilih</span><button onClick={exportCases}><ArrowDownToLine size={14}/>Ekspor pilihan</button><button onClick={() => setSelected([])} aria-label="Batal memilih"><X size={15}/></button></div>}
    <div className="table-overflow"><table className="data-table cases-table"><thead><tr><th className="check-cell"><input type="checkbox" aria-label="Pilih semua kasus di halaman" checked={visible.length > 0 && visible.every(c => selected.includes(c.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(c => c.id)])] : selected.filter(id => !visible.some(c => c.id === id)))}/></th><th>Kasus / Debitur</th><th>Klien</th><th><button className="th-sort" onClick={() => setSortAsc(sortAsc === null ? false : !sortAsc)}>Outstanding<ArrowUpDown size={12}/></button></th><th>DPD</th><th>Petugas</th><th>Status</th><th className="action-cell"/></tr></thead><tbody>{visible.map((c, i) => {
      const customer = getCustomer(db, c.customerId); const person = getAssignee(db, c.id);
      return <tr key={c.id} className={selected.includes(c.id) ? 'selected-row' : ''}><td className="check-cell"><input type="checkbox" aria-label={`Pilih ${c.number}`} checked={selected.includes(c.id)} onChange={e => setSelected(e.target.checked ? [...selected, c.id] : selected.filter(id => id !== c.id))}/></td><td><button className="case-link" onClick={() => openDetail('cases', c)}>{c.number}</button><div className="cell-secondary customer-name">{customer?.name || 'Debitur tidak ditemukan'}</div></td><td><div className="client-cell"><span className={`client-logo client-${['Adira Finance', 'FIFGROUP', 'WOM Finance', 'BCA Finance'].indexOf(c.client)}`}>{c.client === 'Adira Finance' ? 'a' : c.client === 'FIFGROUP' ? 'F' : c.client === 'WOM Finance' ? 'w' : c.client === 'BCA Finance' ? 'B' : 'P'}</span><span>{c.client}</span></div></td><td className="money-cell">{currency(c.principal)}</td><td><span className={`dpd-badge ${c.overdue > 90 ? 'red' : c.overdue > 60 ? 'orange' : c.overdue > 30 ? 'amber' : 'green'}`}>{c.overdue} hari</span></td><td><div className="person-cell">{person ? <><Avatar name={person.name} index={i} small/><span>{person.name.split(' ').slice(0, 2).join(' ')}</span></> : <span className="muted">Belum ditugaskan</span>}</div></td><td><StatusBadge status={c.status}/></td><td className="action-cell"><button className="icon-button row-more" aria-label={`Lihat detail ${c.number}`} onClick={() => openDetail('cases', c)}><MoreHorizontal size={18}/></button></td></tr>;
    })}</tbody></table></div>
    {!filtered.length && <EmptyState title="Tidak ada kasus ditemukan" description="Coba kata kunci lain atau ubah filter pencarian." action={<button className="button button-secondary" onClick={() => { setQuery(''); setStatus('Semua kasus'); updateBucket(''); setClientType(''); }}>Reset pencarian</button>}/>}
    {!db.cases.length && <div className="empty-add"><button className="button button-primary" onClick={() => openForm('cases')}><Plus size={15}/>Tambah kasus pertama</button></div>}
    <Pagination page={page} setPage={setPage} total={filtered.length} perPage={perPage}/>
  </>;
}

const entityLabels: Record<string, string> = { customers: 'debitur', payments: 'pembayaran', letters: 'surat', personnel: 'personel' };
export function EntityTable({ entity }: { entity: 'customers' | 'payments' | 'letters' | 'personnel' }) {
  const { db, openDetail, openForm, openLetter, notify } = useArms();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const label = entityLabels[entity];
  useEffect(() => setPage(1), [query, filter, sort, db[entity].length]);
  const rows = useMemo(() => {
    const records = [...db[entity]] as RecordData[];
    const filtered = records.filter(record => {
      let content = Object.values(record).filter(v => typeof v !== 'object').join(' ');
      if ('caseId' in record) { const c = getCase(db, record.caseId); content += ` ${c?.number} ${getCustomer(db, c?.customerId || '')?.name}`; }
      if (!content.toLowerCase().includes(query.toLowerCase())) return false;
      return !filter || (entity === 'customers' && customerProcess(db, record.id).label === filter) || ('status' in record && record.status === filter) || ('type' in record && record.type === filter);
    });
    if (sort === 'name') filtered.sort((a, b) => ('name' in a ? a.name : 'number' in a ? a.number : '').localeCompare('name' in b ? b.name : 'number' in b ? b.number : ''));
    if (entity === 'payments' && sort === 'newest') filtered.sort((a, b) => ('date' in b ? b.date : '').localeCompare('date' in a ? a.date : ''));
    return filtered;
  }, [db, entity, query, filter, sort]);
  useEffect(() => setPage(current => Math.min(current, Math.max(1, Math.ceil(rows.length / 10)))), [rows.length]);
  const visible = rows.slice((page - 1) * 10, page * 10);
  function exportRows() {
    let data: (string | number)[][] = [];
    if (entity === 'customers') data = [['ID', 'No. Kontrak', 'Nama', 'Kabupaten/Kota', 'Kecamatan', 'Kelurahan / Desa', 'Alamat Lengkap', 'Tanggal Jatuh Tempo', 'Nomor Handphone', 'Angsuran', 'Total Angsuran', 'Sudah Dibayar', 'Total Angsuran Belum Dibayar', 'Denda', 'Merk/Type', 'Nomor Polisi', 'Foto KTP', 'Foto STNK', 'Proses Debitur'], ...rows.map(r => { const c = r as typeof db.customers[number]; return [c.id, c.contract || db.cases.find(item => item.customerId === c.id)?.contract || '', c.name, c.regency || '', c.district || '', c.village || '', c.streetAddress || c.address, c.dueDate || '', c.phone, c.installment, c.total, getCustomerPaid(db, c.id), getCustomerOutstanding(db, c.id), c.penalty, c.brandType || c.vehicle, c.plate || '', c.ktpPhoto || '', c.stnkPhoto || '', customerProcess(db, c.id).label]; })];
    if (entity === 'payments') data = [['Kuitansi', 'Tanggal', 'Kasus', 'Pembayaran', 'Gross Fee', 'Pendapatan', 'Komisi', 'Biaya Manual'], ...rows.map(r => { const p = r as typeof db.payments[number]; return [p.number, p.date, getCase(db, p.caseId)?.number || '', p.amount, p.grossFee, p.companyRevenue, p.partnerCommission, p.manualTotal]; })];
    if (entity === 'letters') data = [['No Surat', 'Kasus', 'Petugas', 'Tanggal', 'Status', 'Nama PDF', 'PDF Diunggah'], ...rows.map(r => { const l = r as typeof db.letters[number]; return [l.number, getCase(db, l.caseId)?.number || '', db.personnel.find(p => p.id === l.personnelId)?.name || '', l.issuedAt, l.status, l.pdfName || '', l.pdfUploadedAt || '']; })];
    if (entity === 'personnel') data = [['ID', 'Nama', 'Posisi / Jabatan', 'Jenis', 'Rekening', 'KTP'], ...rows.map(r => { const p = r as typeof db.personnel[number]; return [p.id, p.name, p.position || '', p.type === 'Mitra DC' ? 'Mitra' : p.type, p.bank, p.ktpPhotoName || '']; })];
    exportCsv(`ARMS-${label}.csv`, data); notify(`${rows.length} ${label} berhasil diekspor.`);
  }
  return <section className="panel entity-panel"><div className="entity-toolbar"><div className="table-search"><Search size={16}/><input aria-label={`Cari ${label}`} placeholder={`Cari ${label}...`} value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={14}/></button>}</div><div className="entity-toolbar-right">{(entity === 'letters' || entity === 'personnel' || entity === 'customers') && <Select label={`Filter ${label}`} value={filter} onChange={setFilter} options={[{ value: '', label: entity === 'personnel' ? 'Semua tipe' : 'Semua proses' }, ...(entity === 'customers' ? PROCESS_LABELS : entity === 'letters' ? ['Aktif', 'Draft', 'Selesai', 'Dicabut'] : ['Karyawan', 'Mitra DC']).map(v => ({ value: v, label: v }))]}/>}<Select label="Urutkan data" value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Terbaru' }, { value: 'name', label: 'A - Z' }]}/><button className="button button-secondary button-small" onClick={exportRows}><ArrowDownToLine size={14}/>Ekspor</button></div></div>
    <div className="table-overflow"><table className="data-table"><thead><tr>
      {entity === 'customers' && <><th>Debitur</th><th>No. Kontrak</th><th>Nomor Handphone</th><th>Jatuh tempo</th><th>Total angsuran</th><th>Sisa angsuran</th><th>Proses debitur</th><th>Kendaraan</th></>}
      {entity === 'payments' && <><th>Kuitansi / Tanggal</th><th>Kasus / Debitur</th><th>Pembayaran</th><th>Gross fee</th><th>Pendapatan perusahaan</th><th>Komisi mitra</th><th>Penyelesaian kasus</th></>}
      {entity === 'letters' && <><th>Nomor surat</th><th>Jenis surat</th><th>Kasus / Debitur</th><th>Petugas</th><th>Tanggal terbit</th><th>Status</th><th>PDF Surat</th></>}
      {entity === 'personnel' && <><th>Nama personel</th><th>Posisi / Jabatan</th><th>Rekening bank</th><th>KTP</th><th>Penugasan aktif</th><th>Total portofolio</th></>}
      <th className="action-cell"/></tr></thead><tbody>{visible.map((record, i) => {
        const action = <td className="action-cell"><button className="icon-button" aria-label={`Detail ${label}`} onClick={() => openDetail(entity, record)}><MoreHorizontal size={18}/></button></td>;
        if (entity === 'customers') { const c = record as typeof db.customers[number]; const process = customerProcess(db, c.id); return <tr key={c.id}><td><button className="name-cell" onClick={() => openDetail('customers', c)}><Avatar name={c.name} index={i}/><span><strong>{c.name}</strong><small>{c.regency || c.id}</small></span></button></td><td className="mono">{c.contract || db.cases.find(item => item.customerId === c.id)?.contract || '-'}</td><td>{c.phone}</td><td>{c.dueDate ? formatDate(c.dueDate) : '-'}</td><td className="money-cell">{currency(c.total)}</td><td className="money-cell"><strong className={getCustomerOutstanding(db, c.id) > 0 ? '' : 'emerald-text'}>{currency(getCustomerOutstanding(db, c.id))}</strong><div className="cell-secondary">Terbayar {currency(getCustomerPaid(db, c.id))}</div></td><td><div className="customer-process" title={process.detail}><StatusBadge status={process.label}/><span className={`process-track ${process.label === 'Berhasil' ? 'complete' : ''}`} role="progressbar" aria-label={process.detail} aria-valuenow={process.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${process.progress}%` }}/></span></div></td><td>{c.brandType || c.vehicle || '-'}{c.plate && <div className="cell-secondary">{c.plate}</div>}</td>{action}</tr>; }
        if (entity === 'payments') { const p = record as typeof db.payments[number]; const c = getCase(db, p.caseId); return <tr key={p.id}><td><button className="case-link" onClick={() => openDetail('payments', p)}>{p.number}</button><div className="cell-secondary">{formatDate(p.date)}</div></td><td><span>{c?.number}</span><div className="cell-secondary">{getCustomer(db, c?.customerId || '')?.name}</div></td><td className="money-cell">{currency(p.amount)}</td><td>{currency(p.grossFee)}</td><td className="emerald-text">{currency(p.companyRevenue)}</td><td>{currency(p.partnerCommission)}</td><td><StatusBadge status={c && isCaseSuccessful(db, c) ? 'Berhasil' : 'Sebagian'}/></td>{action}</tr>; }
        if (entity === 'letters') { const l = record as typeof db.letters[number]; const c = getCase(db, l.caseId); const person = db.personnel.find(p => p.id === l.personnelId); return <tr key={l.id}><td><button className="document-cell" onClick={() => openLetter(l)}><span className="document-icon"><FileText size={18}/></span><span className="case-link">{l.number}</span></button></td><td>{c?.clientType === 'PERORANGAN' ? 'Surat Kuasa' : 'Surat Tugas'}</td><td>{c?.number}<div className="cell-secondary">{getCustomer(db, c?.customerId || '')?.name}</div></td><td><div className="person-cell"><Avatar name={person?.name || '-'} index={i} small/>{person?.name}</div></td><td>{formatDate(l.issuedAt)}</td><td><StatusBadge status={l.status}/></td><td>{l.pdfUrl ? <LetterPdfDownload letter={l}/> : <button className="text-button" onClick={() => openLetter(l)}><Upload size={13}/>Upload PDF</button>}</td><td><button className="icon-button" aria-label="Detail surat" onClick={() => openDetail('letters', l)}><MoreHorizontal size={18}/></button></td></tr>; }
        const p = record as typeof db.personnel[number]; const assignments = db.letters.filter(l => l.personnelId === p.id && l.status === 'Aktif'); const assignedCases = db.cases.filter(c => c.status !== 'Selesai' && getAssignee(db, c.id)?.id === p.id); return <tr key={p.id}><td><button className="name-cell" onClick={() => openDetail('personnel', p)}><Avatar name={p.name} index={i}/><span><strong>{p.name}</strong><small>{p.id}</small></span></button></td><td>{p.position || <span className="muted">Belum dilengkapi</span>}<div className="cell-secondary">{p.type === 'Mitra DC' ? 'Mitra' : p.type}</div></td><td>{p.bank}</td><td><div className="personnel-document-actions">{p.ktpPhoto && <PersonnelDocument person={p}/>}<button className="text-button" onClick={() => openForm('personnel', p)}><Upload size={13}/>{p.ktpPhoto ? 'Ganti KTP' : 'Upload KTP'}</button></div></td><td>{assignedCases.length} kasus aktif<div className="cell-secondary">{assignments.length} surat / {db.collections.filter(l => l.personnelId === p.id).length} log</div></td><td className="money-cell">{currency(assignedCases.reduce((sum, c) => sum + c.principal, 0))}</td>{action}</tr>;
      })}</tbody></table></div>
    {!rows.length && <EmptyState title={query || filter ? `Tidak ada ${label} ditemukan` : `Belum ada ${label}`} description={query || filter ? 'Coba ubah kata kunci atau filter Anda.' : `Tambahkan ${label} pertama untuk mulai mengelola operasional.`} action={<button className="button button-primary" onClick={() => entity === 'letters' ? openLetter() : openForm(entity)}><Plus size={15}/>Tambah {label}</button>}/>}
    <Pagination page={page} setPage={setPage} total={rows.length}/>
  </section>;
}

export function Reports() {
  const { db, period, notify } = useArms();
  const payments = db.payments.filter(p => p.date.startsWith(period));
  const clientNames = [...new Set(payments.map(p => getCase(db, p.caseId)?.client || 'Lainnya'))];
  const report = clientNames.map(client => { const list = payments.filter(p => getCase(db, p.caseId)?.client === client); return { client, count: list.length, amount: list.reduce((s, p) => s + p.amount, 0), gross: list.reduce((s, p) => s + p.grossFee, 0), revenue: list.reduce((s, p) => s + p.companyRevenue, 0), partner: list.reduce((s, p) => s + p.partnerCommission, 0) }; });
  const total = (key: 'amount' | 'companyRevenue' | 'partnerCommission') => payments.reduce((sum, p) => sum + p[key], 0);
  function download() { exportCsv(`ARMS-laporan-${period}.csv`, [['Klien', 'Transaksi', 'Pembayaran', 'Gross Fee', 'Pendapatan Perusahaan', 'Komisi Mitra'], ...report.map(r => [r.client, r.count, r.amount, r.gross, r.revenue, r.partner])]); notify('Laporan keuangan berhasil diekspor.'); }
  return <div className="module-stack"><div className="report-stats">{[{ label: 'Total pembayaran', value: total('amount'), sub: `${payments.length} transaksi diterima` }, { label: 'Pendapatan perusahaan', value: total('companyRevenue'), sub: 'Termasuk biaya manual perusahaan' }, { label: 'Hak komisi mitra', value: total('partnerCommission'), sub: 'Termasuk pembagian biaya manual' }].map((s, i) => <div className="report-stat" key={s.label}><span>{s.label}</span><strong className={i === 1 ? 'emerald-text' : ''}>{compactCurrency(s.value)}</strong><small>{s.sub}</small></div>)}</div><CollectionChart report/><section className="panel"><div className="panel-header"><div><h2>Ringkasan per klien</h2><p>Rincian penerimaan dan pembagian fee pada periode terpilih.</p></div><button className="button button-secondary button-small" onClick={download}><ArrowDownToLine size={15}/>Ekspor CSV</button></div><div className="table-overflow"><table className="data-table report-table"><thead><tr><th>Klien</th><th>Transaksi</th><th>Pembayaran diterima</th><th>Gross fee</th><th>Pendapatan perusahaan</th><th>Komisi mitra</th></tr></thead><tbody>{report.map(r => <tr key={r.client}><td className="money-cell">{r.client}</td><td>{r.count}</td><td>{currency(r.amount)}</td><td>{currency(r.gross)}</td><td className="emerald-text">{currency(r.revenue)}</td><td>{currency(r.partner)}</td></tr>)}</tbody><tfoot><tr><td>Total</td><td>{payments.length}</td><td>{currency(total('amount'))}</td><td>{currency(payments.reduce((sum, p) => sum + p.grossFee, 0))}</td><td>{currency(total('companyRevenue'))}</td><td>{currency(total('partnerCommission'))}</td></tr></tfoot></table></div>{!payments.length && <EmptyState title="Belum ada pembayaran pada periode ini" description="Pilih periode lain atau catat pembayaran baru."/>}</section><div className="report-note"><FileText size={16}/><p>Gross fee = pembayaran x persentase fee. Pendapatan perusahaan + komisi mitra = gross fee + total biaya manual.</p></div></div>;
}

export function ModuleSummary({ entity }: { entity: Entity }) {
  const { db, bucketFilter, setBucketFilter } = useArms();
  if (entity === 'cases' && bucketFilter) return <div className="active-filter-banner"><span><Filter size={15}/>Menampilkan kasus dengan DPD <strong>{bucketFilter}</strong></span><button className="text-button" onClick={() => setBucketFilter('')}>Hapus filter<X size={14}/></button></div>;
  if (entity === 'customers') return <div className="module-description"><span className="live-dot"/><strong>{db.customers.length}</strong> debitur terdaftar<span className="description-divider"/>Total angsuran tersinkron otomatis ke kasus<ArrowUpRight size={14}/></div>;
  if (entity === 'personnel') return <div className="module-description"><span className="live-dot"/><strong>{db.personnel.filter(p => p.type === 'Karyawan').length}</strong> karyawan<span className="description-divider"/><strong>{db.personnel.filter(p => p.type === 'Mitra DC').length}</strong> mitra DC<span className="description-divider"/>{db.letters.filter(l => l.status === 'Aktif').length} penugasan aktif</div>;
  if (entity === 'payments') return <div className="module-description"><span className="live-dot"/>Perhitungan fee otomatis<span className="description-divider"/>Transparan untuk perusahaan dan mitra<ChevronDown size={13}/></div>;
  return null;
}