import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpRight, Bell, BriefcaseBusiness, Building2, CalendarDays, CarFront, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, CircleHelp, Command, Database, FileCheck2, FileText, House, Landmark, LayoutDashboard, Menu, MessageSquareText, Plus, RefreshCw, Search, Settings2, ShieldCheck, Upload, Users, UsersRound, Wallet, X } from 'lucide-react';
import { ArmsContext } from './lib/context';
import { deleteRecord, isGoogleConnected, loadDatabase, recoverSavedRecord, saveRecord, SavedRecordRefreshError } from './lib/api';
import { canReceivePayment, createEmptyDatabase, createSeed, currency, exportCsv, getAssignee, getCustomer, type Database as DatabaseType, type Entity, type Letter, type Module, type RecordData, type SubmitOptions } from './lib/data';
import { Brand, Modal, Spinner, Toasts } from './components/ui';
import { Dashboard } from './components/Dashboard';
import { CaseTable, EntityTable, ModuleSummary, Reports } from './components/DataModules';
import { RecordDetail, RecordForm } from './components/Forms';
import { LetterEditor } from './components/LetterEditor';
import { HelpModal, SettingsModule } from './components/Settings';
import { AccountsModule, ExecutionsModule } from './components/FinanceModules';
import { ClientsModule, CollectionsModule } from './components/CrmModules';
import { BulkDebtorImport } from './components/BulkDebtorImport';

const moduleInfo: Record<Module, { title: string; subtitle: string; action?: string; entity?: Entity }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Pantau piutang, penagihan, dan kinerja tim Anda.', action: 'Tambah Kasus', entity: 'cases' },
  customers: { title: 'Debitur', subtitle: 'Kenali dan kelola seluruh data debitur dalam satu tempat.', action: 'Tambah Debitur', entity: 'customers' },
  clients: { title: 'Clients & Creditors Master', subtitle: 'Master data klien multifinance, perbankan, fintech, dan perorangan (pemberi kuasa).', action: 'Register Client', entity: 'clients' },
  cases: { title: 'Kasus Piutang', subtitle: 'Kelola portofolio piutang, dari penugasan hingga penyelesaian.', action: 'New Recovery Case', entity: 'cases' },
  collections: { title: 'Collections & Communications Log', subtitle: 'Catat interaksi, hasil penagihan, janji bayar, dan langkah berikutnya.', action: 'Catat Aktivitas', entity: 'collections' },
  letters: { title: 'Surat Tugas & Kuasa', subtitle: 'Terbitkan surat resmi dan kelola penugasan tim Anda.', action: 'Buat Surat', entity: 'letters' },
  payments: { title: 'Pembayaran', subtitle: 'Catat penerimaan, hitung fee, dan kelola hak komisi mitra.', action: 'Catat Pembayaran', entity: 'payments' },
  executions: { title: 'Eksekusi / Tarik Unit', subtitle: 'Kelola penugasan, serah terima unit, dan persentase fee.', action: 'Tambah Tarik Unit', entity: 'executions' },
  accounts: { title: 'Rekening', subtitle: 'Pantau pemasukan fee, pengeluaran, dan saldo rekening agensi.', action: 'Catat Transaksi', entity: 'transactions' },
  reports: { title: 'Laporan Keuangan', subtitle: 'Lihat gambaran utuh penerimaan dan kinerja keuangan Anda.', action: 'Ekspor Laporan' },
  personnel: { title: 'Tim & Mitra', subtitle: 'Orang-orang di balik setiap penagihan yang berhasil.', action: 'Tambah Personel', entity: 'personnel' },
  settings: { title: 'Pengaturan', subtitle: 'Sesuaikan workspace, koneksi database, dan akses tim Anda.' },
};
const navGroups = [
  { label: 'WORKSPACE', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'clients', label: 'Clients & Creditors Master', icon: Building2 }, { id: 'customers', label: 'Debitur', icon: Users }, { id: 'cases', label: 'Kasus Piutang', icon: BriefcaseBusiness }, { id: 'collections', label: 'Collections & Communications Log', icon: MessageSquareText }, { id: 'letters', label: 'Surat Tugas & Kuasa', icon: FileCheck2 }, { id: 'executions', label: 'Eksekusi / Tarik Unit', icon: CarFront }] },
  { label: 'KEUANGAN', items: [{ id: 'payments', label: 'Pembayaran', icon: Wallet }, { id: 'accounts', label: 'Rekening', icon: Landmark }, { id: 'reports', label: 'Laporan', icon: ChartNoAxesCombined }] },
  { label: 'MANAJEMEN', items: [{ id: 'personnel', label: 'Tim & Mitra', icon: UsersRound }, { id: 'settings', label: 'Pengaturan', icon: Settings2 }] },
] as const;

export default function App() {
  const [db, setDb] = useState<DatabaseType>(() => isGoogleConnected() ? createEmptyDatabase() : createSeed());
  const [module, setModule] = useState<Module>('dashboard');
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bucketFilter, setBucketFilter] = useState('');
  const [collectionCaseFilter, setCollectionCaseFilter] = useState('');
  const [period, setPeriod] = useState(isGoogleConnected() ? new Date().toISOString().slice(0, 7) : '2025-06');
  const [helpOpen, setHelpOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('workspace');
  const [form, setForm] = useState<{ entity: Entity; record?: RecordData; defaults?: Record<string, unknown> } | null>(null);
  const [detail, setDetail] = useState<{ entity: Entity; record: RecordData } | null>(null);
  const [deletion, setDeletion] = useState<{ entity: Entity; record: RecordData } | null>(null);
  const [letterWorkspace, setLetterWorkspace] = useState<{ letter?: Letter; caseId?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);
  const mutationLock = useRef(false);
  const connected = isGoogleConnected();

  useEffect(() => { let cancelled = false; loadDatabase().then(data => { if (!cancelled) setDb(data); }).catch(error => { if (!cancelled) setBootError(error.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setProfileOpen(false); setNotificationsOpen(false); setWorkspaceOpen(false); setMobileNav(false); }
    };
    const outside = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || t.closest('[data-popover], select, option, .modal, .search-select, .filter-popover')) return;
      setSearchOpen(false); setProfileOpen(false); setNotificationsOpen(false); setWorkspaceOpen(false);
    };
    document.addEventListener('keydown', keys); document.addEventListener('click', outside);
    return () => { document.removeEventListener('keydown', keys); document.removeEventListener('click', outside); };
  }, []);
  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId.current; setToasts(items => [...items.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(items => items.filter(item => item.id !== id)), 5000);
  }, []);
  const navigate = useCallback((next: Module) => { setModule(next); setDetail(null); setMobileNav(false); setWorkspaceOpen(false); setProfileOpen(false); if (next !== 'letters') setLetterWorkspace(null); if (next === 'settings') setSettingsInitialTab('workspace'); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const openForm = useCallback((entity: Entity, record?: RecordData, defaults?: Record<string, unknown>) => {
    if (['accounts', 'transactions'].includes(entity) && db.currentUser?.role === 'Collector') { notify('Mutasi rekening dikelola Administrator atau Supervisor.', 'info'); return; }
    if (entity === 'payments' && !record && defaults?.collectionLogId) {
      const receipt = db.payments.find(p => p.collectionLogId === defaults.collectionLogId);
      if (receipt) { setForm(null); setDetail({ entity: 'payments', record: receipt }); notify('Log ini sudah memiliki kuitansi.', 'info'); return; }
    }
    if (entity === 'payments' && !record && defaults?.caseId) {
      const c = db.cases.find(item => item.id === defaults.caseId);
      if (!c || !canReceivePayment(db, c)) { notify('Kasus sudah berhasil / selesai dan tidak menerima pembayaran baru.', 'info'); return; }
    }
    setForm({ entity, record, defaults }); setFormError(''); setDetail(null);
  }, [db, notify]);
  const openDetail = useCallback((entity: Entity, record: RecordData) => { setDetail({ entity, record }); setSearchOpen(false); setNotificationsOpen(false); }, []);
  const openLetter = useCallback((letter?: Letter, caseId?: string) => { setModule('letters'); setLetterWorkspace({ letter, caseId }); setDetail(null); setMobileNav(false); }, []);
  const requestDelete = useCallback((entity: Entity, record: RecordData) => { setDeletion({ entity, record }); setDetail(null); setFormError(''); }, []);
  function openIntegration() { setModule('settings'); setSettingsInitialTab('integrations'); setMobileNav(false); setWorkspaceOpen(false); }
  async function submitRecord(values: Partial<RecordData>, options?: SubmitOptions) {
    if (!form || mutationLock.current) return; mutationLock.current = true; setSaving(true); setFormError('');
    try {
      const result = await saveRecord(db, form.entity, values, form.record?.id);
      setDb(result); setForm(null); notify(form.record ? 'Perubahan berhasil disimpan.' : 'Data baru berhasil ditambahkan ke workspace.');
      if (form.entity === 'collections' && options?.afterSave === 'payment') {
        const log = form.record ? result.collections.find(l => l.id === form.record!.id) : result.collections.find(l => !db.collections.some(old => old.id === l.id));
        const c = result.cases.find(c => c.id === log?.caseId), receipt = result.payments.find(p => log && p.collectionLogId === log.id);
        if (receipt) setDetail({ entity: 'payments', record: receipt });
        else if (log && log.hasPayment && c && canReceivePayment(result, c)) setForm({ entity: 'payments', defaults: { caseId: log.caseId, collectionLogId: log.id, date: log.activityDate } });
        else notify('Log tersimpan. Kasus tidak tersedia untuk pembayaran baru.', 'info');
      }
    } catch (err) {
      if (err instanceof SavedRecordRefreshError) {
        setDb(recoverSavedRecord(db, err));
        setForm({ entity: err.entity, record: err.record });
        notify('Data tersimpan. Muat ulang workspace untuk menyinkronkan seluruh modul.', 'info');
      }
      setFormError((err as Error).message);
    } finally { mutationLock.current = false; setSaving(false); }
  }
  async function confirmDelete() {
    if (!deletion || mutationLock.current) return; mutationLock.current = true; setSaving(true); setFormError('');
    try { setDb(await deleteRecord(db, deletion.entity, deletion.record.id)); setDeletion(null); notify('Data berhasil dihapus dari workspace.'); }
    catch (err) { setFormError((err as Error).message); } finally { mutationLock.current = false; setSaving(false); }
  }
  async function refresh() {
    if (loading) return; setLoading(true); setBootError('');
    try { setDb(await loadDatabase()); notify('Data workspace berhasil dimuat ulang.'); }
    catch (err) { setBootError((err as Error).message); } finally { setLoading(false); }
  }
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    const customers = db.customers.filter(c => `${c.name} ${c.nik} ${c.phone}`.toLowerCase().includes(q)).slice(0, 3).map(c => ({ entity: 'customers' as Entity, record: c as RecordData, title: c.name, subtitle: `${c.id} / Debitur`, icon: Users }));
    const cases = db.cases.filter(c => `${c.number} ${c.client} ${getCustomer(db, c.customerId)?.name} ${c.contract}`.toLowerCase().includes(q)).slice(0, 3).map(c => ({ entity: 'cases' as Entity, record: c as RecordData, title: c.number, subtitle: `${getCustomer(db, c.customerId)?.name} / ${c.client}`, icon: BriefcaseBusiness }));
    const letters = db.letters.filter(l => l.number.toLowerCase().includes(q)).slice(0, 2).map(l => ({ entity: 'letters' as Entity, record: l as RecordData, title: l.number, subtitle: 'Surat Tugas & Kuasa', icon: FileText }));
    const clients = db.clients.filter(c => `${c.code} ${c.name} ${c.contactPerson}`.toLowerCase().includes(q)).slice(0, 2).map(c => ({ entity: 'clients' as Entity, record: c as RecordData, title: c.name, subtitle: `${c.code} / Client`, icon: Building2 }));
    return [...clients, ...customers, ...cases, ...letters];
  }, [db, search]);
  const info = moduleInfo[module];
  const activeCount = db.cases.filter(c => c.status !== 'Selesai').length;
  const latestPayments = [...db.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const periodKeys = [...new Set([new Date().toISOString().slice(0, 7), ...db.payments.map(p => p.date.slice(0, 7)), period])].sort().reverse();
  function primaryAction() {
    if (module === 'letters') openLetter();
    else if (module === 'collections') openForm('collections', undefined, collectionCaseFilter ? { caseId: collectionCaseFilter, personnelId: getAssignee(db, collectionCaseFilter)?.id || '' } : undefined);
    else if (module === 'reports') {
      const payments = db.payments.filter(p => p.date.startsWith(period));
      exportCsv(`ARMS-laporan-${period}.csv`, [['No Kuitansi', 'Tanggal', 'Pembayaran', 'Gross Fee', 'Pendapatan Perusahaan', 'Komisi Mitra', 'Biaya Tambahan'], ...payments.map(p => [p.number, p.date, p.amount, p.grossFee, p.companyRevenue, p.partnerCommission, p.manualTotal])]); notify('Laporan periode terpilih berhasil diekspor.');
    } else if (info.entity) openForm(info.entity);
  }

  return <MotionConfig reducedMotion="user"><ArmsContext.Provider value={{ db, setDb, module, navigate, openForm, openDetail, openLetter, requestDelete, notify, bucketFilter, setBucketFilter, period, setPeriod, collectionCaseFilter, setCollectionCaseFilter }}><div className="app-shell">
    {mobileNav && <div className="sidebar-scrim no-print" onClick={() => setMobileNav(false)}/>}
    <aside className={`sidebar no-print ${mobileNav ? 'mobile-open' : ''}`}><div className="sidebar-brand"><button className="brand-button" onClick={() => navigate('dashboard')} aria-label="ARMS Dashboard"><Brand name={db.settings.agency} logo={db.settings.logo}/></button><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X size={20}/></button></div>
      <div className="workspace-selector-wrap" data-popover><button className={`workspace-selector ${workspaceOpen ? 'open' : ''}`} onClick={() => setWorkspaceOpen(!workspaceOpen)} aria-expanded={workspaceOpen}><span className="workspace-icon"><Building2 size={18}/></span><span><strong>Workspace utama</strong><small>Agency workspace</small></span><ChevronDown size={14}/></button>{workspaceOpen && <div className="workspace-popover"><div><span className="workspace-icon"><Building2 size={18}/></span><span><strong>{db.settings.agency}</strong><small>{connected ? 'Google Workspace' : 'Workspace demo'}</small></span><Check size={15}/></div><button onClick={() => navigate('settings')}><Settings2 size={15}/>Pengaturan workspace</button><button onClick={openIntegration}><Database size={15}/>Kelola koneksi database</button></div>}</div>
      <nav className="sidebar-nav" aria-label="Navigasi utama">{navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map(item => <button key={item.id} className={`nav-item ${module === item.id ? 'active' : ''}`} onClick={() => { if (item.id === 'letters') setLetterWorkspace(null); navigate(item.id); }} aria-current={module === item.id ? 'page' : undefined}>{module === item.id && <motion.span className="nav-active-bg" layoutId="nav-active" transition={{ type: 'spring', stiffness: 370, damping: 34 }}/>}<item.icon size={18} strokeWidth={1.65}/><span>{item.label}</span>{item.id === 'cases' && <small className="nav-count">{activeCount}</small>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className="help-link" onClick={() => setHelpOpen(true)}><CircleHelp size={18}/><span>Pusat bantuan</span><ArrowUpRight size={15}/></button><button className="database-connection" onClick={openIntegration}><span className="sheets-mini"><FileText size={19}/></span><span><strong>Google Sheets</strong><small><i className={connected ? 'connected' : 'demo'}/>{connected ? 'Database terhubung' : 'Mode demo lokal'}</small></span><ChevronRight size={14}/></button><div className="sidebar-version"><span>ARMS v1.0</span><span>Made for better collections</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar no-print"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu size={22}/></button><button aria-label="Ke dashboard" onClick={() => navigate('dashboard')}><House size={16}/></button><span className="breadcrumb-slash">/</span><span className="breadcrumb-workspace">Workspace</span><ChevronRight size={12}/><strong>{module === 'dashboard' ? 'Overview' : moduleInfo[module].title}</strong></div><div className="topbar-right"><div className="global-search-wrap" data-popover><div className={`global-search ${searchOpen ? 'focused' : ''}`}><Search size={16}/><input ref={searchRef} aria-label="Pencarian global" placeholder="Cari debitur, kasus, atau surat..." value={search} onFocus={() => setSearchOpen(true)} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }} onKeyDown={e => { if (e.key === 'Enter' && searchResults[0]) openDetail(searchResults[0].entity, searchResults[0].record); }}/><kbd><Command size={11}/>K</kbd></div>{searchOpen && <div className="search-popover"><div className="search-popover-label">{search ? 'HASIL PENCARIAN' : 'PENCARIAN CEPAT'}</div>{!search ? <div className="search-hint"><Search size={21}/><p>Temukan debitur, nomor kasus, atau surat.<small>Mulai dengan nama atau nomor identitas.</small></p></div> : searchResults.length ? searchResults.map(result => <button key={`${result.entity}-${result.record.id}`} onClick={() => openDetail(result.entity, result.record)}><span className="search-result-icon"><result.icon size={17}/></span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ArrowUpRight size={14}/></button>) : <div className="search-hint"><Search size={21}/><p>Tidak ada hasil untuk "{search}".<small>Coba kata kunci yang berbeda.</small></p></div>}<div className="search-popover-footer"><span><kbd>Enter</kbd> untuk membuka hasil</span><span><kbd>Esc</kbd> tutup</span></div></div>}</div>
      <div className="notifications-wrap" data-popover><button className={`icon-button notification-button ${notificationsOpen ? 'selected' : ''}`} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} aria-label="Buka notifikasi" aria-expanded={notificationsOpen}><Bell size={19}/>{!notificationsRead && <i/>}</button>{notificationsOpen && <div className="notifications-popover"><div className="popover-heading"><h3>Notifikasi <span>{notificationsRead ? 0 : latestPayments.length}</span></h3><button onClick={() => setNotificationsRead(true)}>Tandai dibaca</button></div>{latestPayments.map((p, i) => <button className="notification-item" key={p.id} onClick={() => { openDetail('payments', p); setNotificationsRead(true); }}><span className="notification-type-icon"><Wallet size={17}/></span><span><strong>Pembayaran diterima</strong><p>{currency(p.amount)} dari {getCustomer(db, db.cases.find(c => c.id === p.caseId)?.customerId || '')?.name}</p><small>{p.date} / {i === 0 ? 'Transaksi terbaru' : 'Pembayaran terverifikasi'}</small></span>{!notificationsRead && <i/>}</button>)}{!latestPayments.length && <div className="search-hint">Belum ada notifikasi baru.</div>}<button className="popover-bottom-link" onClick={() => { navigate('payments'); setNotificationsOpen(false); }}>Lihat semua pembayaran<ArrowUpRight size={14}/></button></div>}</div>
      <span className="topbar-divider"/><div className="profile-wrap" data-popover><button className="profile-button" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-expanded={profileOpen}><span className="profile-avatar">AP</span><span className="profile-details"><strong>{db.settings.signer}</strong><small>{db.currentUser?.role || 'Administrator'}</small></span><ChevronDown size={13}/></button>{profileOpen && <div className="profile-popover"><div><strong>{db.settings.signer}</strong><small>{db.currentUser?.username || db.users[0]?.username || 'admin@arms.agency'}</small></div><button onClick={() => navigate('settings')}><Settings2 size={15}/>Pengaturan akun</button><button onClick={() => { setHelpOpen(true); setProfileOpen(false); }}><CircleHelp size={15}/>Panduan ARMS</button><span><ShieldCheck size={14}/>{connected ? 'Identitas Google terverifikasi' : 'Sesi demonstrasi lokal'}</span></div>}</div>
    </div></header>
    <main className={`main-content ${letterWorkspace && module === 'letters' ? 'is-letter-editor' : ''}`}><div className="page-heading no-print"><div><h1>{module === 'letters' && letterWorkspace ? letterWorkspace.letter ? 'Kelola Surat' : 'Buat Surat Baru' : info.title}</h1><p>{module === 'letters' && letterWorkspace ? 'Dokumen yang rapi. Penugasan yang jelas.' : info.subtitle}</p></div><div className="page-heading-actions">{(module === 'dashboard' || module === 'reports') && <div className="date-picker"><CalendarDays size={16}/><select aria-label="Pilih periode laporan" value={period} onChange={e => setPeriod(e.target.value)}>{periodKeys.map(key => { const date = new Date(`${key}-01T12:00:00`); const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); return <option value={key} key={key}>1 - {last} {date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>; })}</select><ChevronDown size={13}/></div>}{module === 'customers' && <button className="button button-secondary" onClick={() => setBulkOpen(true)}><Upload size={15}/>Import Bulk Debitor</button>}
{info.action && !(module === 'letters' && letterWorkspace) && <button className="button button-primary heading-primary" onClick={primaryAction}>{module === 'reports' ? <ArrowDownToLine size={16}/> : <Plus size={17}/>} {info.action}</button>}</div></div>
      {bootError && <div className="boot-error no-print"><span>Workspace tidak dapat dimuat: {bootError}</span><button onClick={refresh} disabled={loading}><RefreshCw size={15}/>Coba lagi</button></div>}
      {loading && connected ? <div className="workspace-loading"><Spinner size={32}/><h2>Menghubungkan workspace...</h2><p>Mengambil data dari Google Sheets.</p></div> : <>
        <div hidden={module !== 'dashboard'} className="module-section no-print"><Dashboard/></div>
        <div hidden={module !== 'clients'} className="module-section no-print"><ClientsModule/></div>
        <div hidden={module !== 'customers'} className="module-section no-print"><ModuleSummary entity="customers"/><EntityTable entity="customers"/></div>
        <div hidden={module !== 'cases'} className="module-section no-print"><ModuleSummary entity="cases"/><section className="panel"><CaseTable/></section></div>
        <div hidden={module !== 'collections'} className="module-section no-print"><CollectionsModule/></div>
        <div hidden={module !== 'letters'} className="module-section">{letterWorkspace ? <LetterEditor key={letterWorkspace.letter?.id || letterWorkspace.caseId || 'new'} letter={letterWorkspace.letter} caseId={letterWorkspace.caseId} onBack={() => setLetterWorkspace(null)}/> : <div className="no-print"><EntityTable entity="letters"/></div>}</div>
        <div hidden={module !== 'payments'} className="module-section no-print"><ModuleSummary entity="payments"/><EntityTable entity="payments"/></div>
        <div hidden={module !== 'executions'} className="module-section no-print"><ExecutionsModule/></div>
        <div hidden={module !== 'accounts'} className="module-section no-print"><AccountsModule/></div>
        <div hidden={module !== 'reports'} className="module-section no-print"><Reports/></div>
        <div hidden={module !== 'personnel'} className="module-section no-print"><ModuleSummary entity="personnel"/><EntityTable entity="personnel"/></div>
        <div hidden={module !== 'settings'} className="module-section no-print"><SettingsModule initialTab={settingsInitialTab} onHelp={() => setHelpOpen(true)}/></div>
      </>}
    </main></div>
    <AnimatePresence>{form && <RecordForm key={`${form.entity}-${form.record?.id || 'new'}`} entity={form.entity} record={form.record} defaults={form.defaults} busy={saving} error={formError} onClose={() => !saving && setForm(null)} onSubmit={submitRecord}/>} {detail && <RecordDetail key={`${detail.entity}-${detail.record.id}`} entity={detail.entity} record={detail.record} onClose={() => setDetail(null)}/>} {deletion && <Modal title="Data ini akan dihapus" subtitle="Tindakan ini tidak dapat dibatalkan." onClose={() => !saving && setDeletion(null)}><div className="modal-body"><p className="delete-description">Anda yakin ingin menghapus <strong>{'name' in deletion.record ? deletion.record.name : 'number' in deletion.record ? deletion.record.number : 'username' in deletion.record ? deletion.record.username : 'data ini'}</strong>? Data yang masih digunakan oleh modul lain tidak dapat dihapus.</p>{formError && <div className="form-error" role="alert">{formError}</div>}</div><footer className="modal-footer"><button className="button button-secondary" onClick={() => setDeletion(null)} disabled={saving}>Batal</button><button className="button button-danger" onClick={confirmDelete} disabled={saving}>{saving ? <Spinner/> : <X size={16}/>}Hapus data</button></footer></Modal>}{helpOpen && <HelpModal onClose={() => setHelpOpen(false)}/>}</AnimatePresence>
    <Toasts items={toasts} dismiss={id => setToasts(items => items.filter(item => item.id !== id))}/>
    {bulkOpen && <BulkDebtorImport onClose={() => setBulkOpen(false)}/>}
  </div></ArmsContext.Provider></MotionConfig>;
}
