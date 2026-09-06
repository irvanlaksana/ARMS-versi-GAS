import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleHelp, Code2, Database, ExternalLink, FileCode2, FolderDown, Link2, LockKeyhole, MoreHorizontal, Plus, RefreshCw, Save, ShieldCheck, Upload, Users, X } from 'lucide-react';
import { useArms } from '../lib/context';
import { isGoogleConnected, resetDemo, saveSettings } from '../lib/api';
import { downloadFile, type Settings } from '../lib/data';
import { Avatar, Brand, Field, Modal, Spinner, StatusBadge } from './ui';
import { makeLogo } from '../lib/documents';

export function SettingsModule({ onHelp, initialTab = 'workspace' }: { onHelp: () => void; initialTab?: string }) {
  const { db, setDb, notify, openForm, openDetail } = useArms();
  const [tab, setTab] = useState('workspace');
  const [values, setValues] = useState<Settings>(db.settings);
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState('');
  const connected = isGoogleConnected();
  const isAdmin = !db.currentUser || db.currentUser.role === 'Administrator';
  useEffect(() => setValues(db.settings), [db.settings]);
  useEffect(() => setTab(initialTab), [initialTab]);
  const set = (key: keyof Settings, value: string | number) => setValues(previous => ({ ...previous, [key]: value }));
  async function uploadLogo(file?: File) {
    if (busy || !isAdmin) return; setBusy(true); setError('');
    try { const logo = file ? await makeLogo(file) : null; const next = { ...values, logo: logo?.dataUrl || '', logoName: logo?.name || '' }; setDb(await saveSettings(db, next)); notify(file ? 'Logo perusahaan berhasil diperbarui.' : 'Logo perusahaan dihapus.'); }
    catch (err) { setError((err as Error).message); notify((err as Error).message, 'error'); } finally { setBusy(false); }
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { setDb(await saveSettings(db, values)); notify('Pengaturan workspace berhasil disimpan.'); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function reset() {
    if (busy) return; setBusy(true);
    try { setDb(await resetDemo()); setResetOpen(false); notify('Workspace demo dikembalikan ke data awal.'); }
    catch (err) { notify((err as Error).message, 'error'); } finally { setBusy(false); }
  }
  return <div className="settings-layout"><div className="settings-nav"><div className="settings-branding"><Brand name={db.settings.agency} logo={db.settings.logo}/><label className={`button button-secondary logo-upload ${busy || !isAdmin ? 'disabled' : ''}`}>{busy ? <Spinner size={14}/> : <Upload size={14}/>}Upload Logo<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload logo perusahaan" disabled={busy || !isAdmin} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void uploadLogo(file); }}/></label><small>PNG, JPG, WebP. Maks. 2 MB.</small>{db.settings.logo && isAdmin && <button className="text-button" disabled={busy} onClick={() => void uploadLogo()}><X size={12}/>Hapus logo</button>}</div>{[{ id: 'workspace', label: 'Workspace', icon: Database }, { id: 'integrations', label: 'Integrasi & database', icon: Link2 }, ...(isAdmin ? [{ id: 'users', label: 'Pengguna & akses', icon: Users }] : [])].map(t => <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}><t.icon size={17}/>{t.label}<ChevronRight size={14}/></button>)}<div className="settings-help"><CircleHelp size={21}/><h3>Perlu panduan?</h3><p>Pelajari cara menyiapkan dan menggunakan ARMS.</p><button className="text-button" onClick={onHelp}>Buka panduan<ArrowUpRight size={14}/></button></div></div><div className="settings-content">
    {tab === 'workspace' && <form className="panel settings-form" onSubmit={save}><div className="panel-header"><div><h2>Informasi perusahaan</h2><p>Nama dan logo tampil sebagai identitas workspace.</p></div><Database size={20}/></div><fieldset disabled={busy || !isAdmin}><div className="settings-form-body"><div className="form-grid">
      <Field label="Nama perusahaan" required className="span-2"><input value={values.agency} onChange={e => set('agency', e.target.value)} required maxLength={150}/></Field>
      <Field label="Alamat perusahaan" className="span-2"><textarea value={values.address} onChange={e => set('address', e.target.value)} rows={2}/></Field>
      <Field label="Penandatangan default" required><input value={values.signer} onChange={e => set('signer', e.target.value)} required/></Field>
      <Field label="Jabatan penandatangan"><input value={values.signerPosition || ''} onChange={e => set('signerPosition', e.target.value)} placeholder="Contoh: Direktur"/></Field>
    </div><div className="form-section-label"><span>02</span>Fee, target & reminder SK</div><div className="form-grid">
      <Field label="Fee penagihan default (%)" required><input type="number" min="0" max="100" step="0.01" value={values.feeRate} onChange={e => set('feeRate', Number(e.target.value))} required/></Field>
      <Field label="Hak mitra default (%)" required><input type="number" min="0" max="100" step="0.01" value={values.partnerRate} onChange={e => set('partnerRate', Number(e.target.value))} required/></Field>
      <Field label="Target pembayaran bulanan (Rp)"><input type="number" min="0" value={values.target} onChange={e => set('target', Number(e.target.value))}/></Field>
      <Field label="Reminder laporan SK (hari)" hint="Jeda maksimal sejak SK terbit atau laporan/update terakhir."><input type="number" min="1" max="30" value={values.reportIntervalDays || 3} onChange={e => set('reportIntervalDays', Number(e.target.value))} required/></Field>
    </div><p className="form-note"><ShieldCheck size={15}/>Perubahan persentase hanya berlaku untuk pembayaran baru. Reminder muncul pada SK aktif.</p>{error && <div className="form-error" role="alert">{error}</div>}{!isAdmin && <p className="muted">Hanya Administrator yang dapat mengubah pengaturan.</p>}</div><footer className="modal-footer"><span className="secure-label"><LockKeyhole size={13}/>Khusus administrator</span><button type="submit" className="button button-primary" disabled={busy || !isAdmin}>{busy ? <Spinner/> : <Save size={15}/>}Simpan perubahan</button></footer></fieldset></form>}
    {tab === 'integrations' && <div className="module-stack">
      <section className="panel">
        <div className="panel-header"><div><h2>Koneksi database</h2><p>Sumber data operasional workspace Anda.</p></div><span className={`status-badge ${connected ? 'green' : 'amber'}`}><i/>{connected ? 'Terhubung' : 'Mode demo'}</span></div>
        <div className="integration-body"><div className="integration-heading"><span className="sheets-icon"><Database size={25}/></span><div><h3>Google Sheets</h3><p>{connected ? 'Terhubung melalui Google Apps Script.' : 'Pratinjau lokal. Belum terhubung ke Google Sheets.'}</p></div></div>
          <div className="integration-notice"><InfoIcon/>{connected ? 'Data dibaca dan disimpan melalui google.script.run. Foto KTP/STNK disimpan di folder Google Drive terbatas.' : 'Data contoh dan foto tersimpan hanya di browser ini. Deploy paket Google Apps Script untuk menggunakan Google Sheets dan Drive.'}</div>
          {connected && db.spreadsheetUrl && <a className="button button-secondary" href={db.spreadsheetUrl} target="_blank" rel="noopener noreferrer">Buka spreadsheet<ExternalLink size={14}/></a>}
          <div className="database-tables">{['Users', 'Clients', 'Customers', 'Cases', 'CollectionLogs', 'Personnel', 'SK', 'Payments', 'Executions', 'Accounts', 'Transactions'].map(table => <span key={table}><Check size={13}/>{table}</span>)}</div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2>Paket Google Apps Script</h2><p>Backend dan frontend modular, siap dipasang.</p></div><FolderDown size={21}/></div>
        <div className="deployment-files">{[
          { name: 'Code.gs', description: 'Backend, inisialisasi, CRUD, dan unggahan Drive', icon: Code2 },
          { name: 'Crm.gs', description: 'Validasi, migrasi master klien, kasus, dan collections log', icon: Code2 },
          { name: 'Workspace.gs', description: 'Impor batch, logo, KTP personel, dan arsip PDF penugasan', icon: Code2 },
          { name: 'Index.html', description: 'SPA dan layout utama aplikasi', icon: FileCode2 },
          { name: 'js_main.html', description: 'Interaksi, formulir, dan komunikasi server', icon: FileCode2 },
          { name: 'js_customer.html', description: 'Form debitur, pilihan wilayah, dan foto KTP/STNK', icon: FileCode2 },
          { name: 'js_crm.html', description: 'Master klien, New Recovery Case, dan log komunikasi', icon: FileCode2 },
          { name: 'js_operations.html', description: 'Tarik unit, rekening, status proses, dan perhitungan fee', icon: FileCode2 },
          { name: 'js_letters.html', description: 'Form penugasan, tautan generator, upload dan unduh PDF', icon: FileCode2 },
          { name: 'js_workspace.html', description: 'Branding, KTP personel, form klien ringkas, dan reminder SK', icon: FileCode2 },
          { name: 'js_bulk.html', description: 'Template Excel, pemeriksaan baris, dan impor bulk debitur', icon: FileCode2 },
          { name: 'css_main.html', description: 'Layout ringkas, form bertahap, dan dark mode', icon: FileCode2 },
          { name: 'appsscript.json', description: 'Konfigurasi runtime dan izin Google', icon: Code2 },
          { name: 'README.md', description: 'Panduan deployment, migrasi, dan keamanan', icon: FileCode2 },
        ].map(file => <a key={file.name} href={`/google-apps-script/${file.name}`} download={file.name}><span className="file-icon"><file.icon size={18}/></span><span><strong>{file.name}</strong><small>{file.description}</small></span><ArrowDownToLine size={16}/></a>)}</div>
        <div className="deployment-guide"><h3>Mulai dalam 4 langkah</h3><ol><li>Buat Google Sheets, lalu buka Extensions &gt; Apps Script.</li><li>Tambahkan seluruh file kode paket. README berisi panduan pemasangan.</li><li>Jalankan <code>initializeDatabase()</code> dan izinkan akses Sheets serta Drive.</li><li>Deploy sebagai Web App untuk pengguna internal organisasi.</li></ol>
          <p className="form-note">Pembaruan surat: tambahkan js_letters.html dan perbarui Code.gs, Workspace.gs, Index.html, js_main.html, serta CSS. Jalankan ulang initializeDatabase untuk kolom arsip PDF di sheet SK. Data lama tetap dipertahankan.</p>
          <a href="/google-apps-script/README.md" target="_blank" rel="noopener noreferrer" className="text-button">Baca panduan lengkap<ArrowUpRight size={15}/></a>
        </div>
      </section>
      <section className="panel"><div className="panel-header"><div><h2>Surat Tugas & Kuasa</h2><p>Generator eksternal dan arsip PDF penugasan.</p></div><Link2 size={19}/></div><div className="integration-body"><p className="form-note">Buka generator di tab baru dari samping Simpan Penugasan. Setelah dokumen selesai, unggah PDF melalui form pada penugasan terkait. Tidak ada generator tertanam atau pengiriman data otomatis ke situs eksternal.</p><div className="detail-quick-actions"><a href="https://generator-surat-new.vercel.app/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="button button-secondary"><ExternalLink size={14}/>Buka Generator Surat</a><a href="/google-apps-script/README.md" target="_blank" rel="noopener noreferrer" className="text-button">Panduan arsip PDF<ArrowUpRight size={14}/></a></div></div></section>
      <section className="panel"><div className="panel-header"><div><h2>Data workspace</h2><p>Cadangkan data sebelum melakukan perubahan besar.</p></div></div>
        <div className="data-actions"><div><h3>Ekspor cadangan JSON</h3><p>Berisi metadata, tanpa file foto atau PDF. Unduh dokumen dari modul terkait.</p></div><button className="button button-secondary" onClick={() => { downloadFile(`ARMS-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 2)); notify('Cadangan metadata diunduh. File foto dan PDF perlu diunduh terpisah.'); }}><ArrowDownToLine size={15}/>Ekspor data</button></div>
        {!connected && <div className="data-actions"><div><h3>Reset data demo</h3><p>Menghapus data, foto, dan PDF lokal, lalu memulihkan data contoh.</p></div><button className="button button-danger-ghost" onClick={() => setResetOpen(true)}><RefreshCw size={15}/>Reset demo</button></div>}
      </section>
    </div>}
    {tab === 'users' && <section className="panel"><div className="panel-header"><div><h2>Pengguna workspace</h2><p>Akses diberikan berdasarkan email akun Google.</p></div><button className="button button-primary button-small" onClick={() => openForm('users')}><Plus size={14}/>Tambah pengguna</button></div><div className="table-overflow"><table className="data-table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th/></tr></thead><tbody>{db.users.map((user, i) => <tr key={user.id}><td><div className="name-cell"><Avatar name={user.username.split('@')[0]} index={i}/><span><strong>{user.username}</strong><small>{user.id}</small></span></div></td><td><StatusBadge status={user.role}/></td><td><span className="emerald-text">Akses diizinkan</span></td><td><button className="icon-button" aria-label={`Kelola ${user.username}`} onClick={() => openDetail('users', user)}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div><div className="users-note"><ShieldCheck size={19}/><p>{connected ? 'Identitas pengguna diverifikasi melalui akun Google pada setiap request ke server.' : 'Pengguna di mode demo hanya untuk simulasi. Otorisasi akun Google aktif setelah aplikasi di-deploy di GAS.'}</p></div></section>}
  </div>{resetOpen && <Modal title="Reset workspace demo?" subtitle="Data dan dokumen lokal yang Anda tambahkan akan dihapus." onClose={() => !busy && setResetOpen(false)}><div className="modal-body"><p className="muted">Data contoh akan dipulihkan. Unduh cadangan JSON, foto KTP/STNK, serta PDF penugasan sebelum melanjutkan. File foto dan PDF tidak tercakup dalam cadangan JSON. Tindakan ini tidak memengaruhi Google Sheets atau Google Drive.</p></div><footer className="modal-footer"><button className="button button-secondary" onClick={() => setResetOpen(false)} disabled={busy}>Batal</button><button className="button button-danger" onClick={reset} disabled={busy}>{busy ? <Spinner/> : <RefreshCw size={15}/>}Reset data demo</button></footer></Modal>}</div>;
}

function InfoIcon() { return <CheckCircle2 size={17}/>; }

export function HelpModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { step: '01', title: 'Clients & Creditors Master', text: 'Daftarkan klien multifinance, perbankan, fintech, atau pemberi kuasa perorangan. Gunakan kode klien unik untuk setiap relasi.' },
    { step: '02', title: 'Debitur dalam tiga bagian', text: 'Isi domisili, angsuran, kendaraan, dan dokumen. Semua parameter tersimpan saat berpindah bagian.' },
    { step: '03', title: 'Recovery case & collections log', text: 'Pilih klien, debitur, layanan, dan PIC. Kontrak, agunan, principal, serta hari tunggakan terisi otomatis. Simpan log interaksi sebelum mencatat pembayaran terkait.' },
    { step: '04', title: 'Surat, PDF & reminder SK', text: 'Simpan penugasan, buka generator surat di tab baru, lalu unggah PDF final. Reminder di dashboard tetap mengingatkan laporan dan update SK aktif.' },
    { step: '05', title: 'Eksekusi / Tarik Unit', text: 'Kelola penugasan, dokumen sah, BAST, serta persentase fee perusahaan dan mitra.' },
    { step: '06', title: 'Rekening fee', text: 'Catat pemasukan dan pengeluaran aktual. Saldo rekening terpisah dari pokok piutang dan fee yang belum diterima.' },
  ];
  return <Modal title="Panduan ARMS" subtitle="Satu workspace untuk operasional penagihan yang lebih terarah." onClose={onClose}><div className="modal-body help-body">{steps.map(item => <div className="help-step" key={item.step}><span>{item.step}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}<div className="integration-notice"><Database size={18}/><span>Paket Google Apps Script, panduan pembaruan sheet, dan adapter generator tersedia di <strong>Pengaturan &gt; Integrasi & database</strong>.</span></div></div><footer className="modal-footer"><span className="secure-label">ARMS</span><button className="button button-primary" onClick={onClose}>Mulai bekerja<ArrowUpRight size={15}/></button></footer></Modal>;
}