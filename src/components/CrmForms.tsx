import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowUpRight, BriefcaseBusiness, CalendarDays, Link2, LockKeyhole, Save, ShieldCheck, Wallet } from 'lucide-react';
import { useArms } from '../lib/context';
import { canReceivePayment, currency, formatDate, getAssignee, getCase, getCustomer, jakartaDate, overdueDays, vehicleSummary, type Case, type Client, type CollectionLog, type RecordData, type SubmitOptions } from '../lib/data';
import { CLIENT_INDUSTRIES, COLLECTION_CHANNELS, COLLECTION_OUTCOMES, CONTACTED_PARTIES, RECOVERY_SERVICES } from '../lib/crm';
import { Field, Modal, Spinner } from './ui';
import { RegionFields } from './RegionFields';
import { SearchSelect } from './SearchSelect';

export interface CrmFormProps { record?: RecordData; defaults?: Record<string, unknown>; busy: boolean; error: string; onClose: () => void; onSubmit: (data: Partial<RecordData>, options?: SubmitOptions) => void }

export function ClientForm({ record, defaults, busy, error, onClose, onSubmit }: CrmFormProps) {
  const [values, setValues] = useState<Client>({ id: '', code: '', name: '', industry: 'MULTIFINANCE', contactPerson: '', phone: '', email: '', address: '', streetAddress: '', regencyId: '', regency: '', districtId: '', district: '', village: '', createdAt: '', ...(record as Partial<Client> | undefined), ...defaults });
  const [step, setStep] = useState(0); const formRef = useRef<HTMLFormElement>(null);
  const update = (key: keyof Client, value: string) => setValues(v => ({ ...v, [key]: value }));
  function changeStep(next: number) {
    if (busy) return;
    if (next > step) { const invalid = Array.from(formRef.current?.querySelectorAll<HTMLInputElement>('[data-client-step="0"] input') || []).find(input => !input.checkValidity()); if (invalid) { invalid.reportValidity(); return; } }
    setStep(next); formRef.current?.querySelector('.modal-body')?.scrollTo({ top: 0 });
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!step) { changeStep(1); return; }
    const invalid = Array.from(formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') || []).find(input => !input.checkValidity());
    if (invalid) { setStep(Number(invalid.closest<HTMLElement>('[data-client-step]')?.dataset.clientStep || 0)); setTimeout(() => invalid.reportValidity(), 40); return; }
    onSubmit(values);
  }
  return <Modal title={record ? 'Edit Client / Pemberi Kuasa' : 'Register Client / Pemberi Kuasa'} subtitle="Dua bagian ringkas: identitas klien dan domisili kantor." onClose={onClose} wide className="bounded-form-modal crm-form-modal client-modal--steps">
    <form ref={formRef} onSubmit={submit} noValidate><fieldset disabled={busy} className="form-fieldset"><nav className="customer-step-nav" aria-label="Bagian form klien"><button type="button" className={step === 0 ? 'active' : ''} onClick={() => changeStep(0)}><span>1</span>Identitas & Kontak</button><button type="button" className={step === 1 ? 'active' : ''} onClick={() => changeStep(1)}><span>2</span>Alamat Domisili</button></nav><div className="modal-body">
      <div data-client-step="0" hidden={step !== 0}>
      <div className="form-grid">
        <Field label="Kode Perusahaan Klien" required hint="Kode unik, contoh: ADIRA-JKT atau PK-001."><input required value={values.code} maxLength={30} pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" onChange={e => update('code', e.target.value.toUpperCase())} placeholder="Kode klien"/></Field>
        <Field label="Industri" required><select value={values.industry} onChange={e => update('industry', e.target.value)}>{CLIENT_INDUSTRIES.map(i => <option key={i} value={i}>{i === 'PERORANGAN' ? 'PERORANGAN (Pemberi Kuasa)' : i}</option>)}</select></Field>
        <Field label={values.industry === 'PERORANGAN' ? 'Nama Lengkap Pemberi Kuasa' : 'Nama Perusahaan Lengkap'} required className="span-2"><input required value={values.name} maxLength={200} onChange={e => update('name', e.target.value)} placeholder={values.industry === 'PERORANGAN' ? 'Nama sesuai identitas pemberi kuasa' : 'Nama lengkap perusahaan klien'}/></Field>
        <Field label="Contact Person" required><input required value={values.contactPerson} maxLength={150} onChange={e => update('contactPerson', e.target.value)} placeholder="Nama PIC klien"/></Field>
        <Field label="No. Phone / WhatsApp" required><input required type="tel" pattern={'[+0-9\\s\\(\\)\\-]{8,20}'} maxLength={20} value={values.phone} onChange={e => update('phone', e.target.value)} placeholder="08xxxxxxxxxx"/></Field>
        <Field label="Email (Opsional)" className="span-2"><input type="email" value={values.email} maxLength={254} onChange={e => update('email', e.target.value)} placeholder="pic@perusahaan.com"/></Field>
      </div>
      </div><div data-client-step="1" hidden={step !== 1}>
      <RegionFields value={values} onChange={patch => setValues(v => ({ ...v, ...patch }))}/>
      <p className="form-note"><Link2 size={13}/>Kode klien unik. Perubahan identitas klien disinkronkan ke kasus terkait.</p>
      </div>
      {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
    </div><footer className="modal-footer"><span className="step-counter">Bagian {step + 1} dari 2</span><div><button type="button" className="button button-secondary" onClick={() => step ? changeStep(0) : onClose()}>{step ? 'Kembali' : 'Batal'}</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <Spinner/> : <Save size={15}/>} {busy ? 'Menyimpan...' : step ? 'Simpan Client' : 'Lanjutkan'}</button></div></footer></fieldset></form>
  </Modal>;
}

export function RecoveryCaseForm({ record, defaults, busy, error, onClose, onSubmit }: CrmFormProps) {
  const { db, openForm } = useArms(); const old = record as Case | undefined;
  const [values, setValues] = useState<Partial<Case>>({ clientId: '', customerId: '', service: RECOVERY_SERVICES[0], personnelId: '', status: 'Aktif', ...old, ...defaults });
  const customer = getCustomer(db, values.customerId || ''), client = db.clients.find(c => c.id === values.clientId);
  const creation = old?.createdDate || (old?.createdAt ? jakartaDate(old.createdAt) : jakartaDate());
  const days = overdueDays(customer?.dueDate || '', creation);
  const asset = customer ? vehicleSummary(customer) : '';
  const set = (key: keyof Case, value: string) => setValues(v => ({ ...v, [key]: value }));
  function submit(event: FormEvent) { event.preventDefault(); if (!busy) onSubmit({ ...values, contract: customer?.contract || '', principal: customer?.total || 0, asset, overdue: days || 0 }); }
  return <Modal title={record ? 'Edit Recovery Case' : 'New Recovery Case'} subtitle="Hubungkan creditor, debitur, dan personel dalam satu berkas penanganan." onClose={onClose} wide className="bounded-form-modal crm-form-modal">
    <form onSubmit={submit}><fieldset disabled={busy} className="form-fieldset"><div className="modal-body">
      {!db.clients.length && <div className="crm-prerequisite"><BriefcaseBusiness size={17}/><span>Master klien masih kosong.</span><button type="button" className="text-button" onClick={() => { onClose(); openForm('clients'); }}>Register Client<ArrowUpRight size={13}/></button></div>}
      <div className="form-grid">
        <Field label="Client / Creditor" required className="span-2"><SearchSelect value={values.clientId || ''} onChange={value => set('clientId', value)} options={db.clients.map(c => ({ value: c.id, label: `${c.code} / ${c.name}`, description: `${c.industry} / ${c.contactPerson || 'PIC belum dilengkapi'}` }))} label="Client / Creditor" placeholder="Pilih klien multifinance, perbankan, fintech, atau perorangan" required/></Field>
        <Field label="Debitur" required className="span-2"><SearchSelect value={values.customerId || ''} onChange={value => set('customerId', value)} options={db.customers.map(c => ({ value: c.id, label: c.name, description: c.contract || c.id }))} label="Debitur kasus" placeholder="Ketik nama debitur atau nomor kontrak" required/></Field>
        <Field label="Nomor Kontrak / Bukti Hutang" hint="Diambil dari data debitur."><div className="locked-input"><input value={customer?.contract || ''} placeholder="Pilih debitur terlebih dahulu" disabled/><LockKeyhole size={14}/></div></Field>
        <Field label="Layanan" required><select value={values.service} onChange={e => set('service', e.target.value)} required>{RECOVERY_SERVICES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Principal Outstanding (Rp)" hint="Total Angsuran debitur, tervalidasi di server."><div className="locked-input"><input disabled value={currency(customer?.total || 0)}/><LockKeyhole size={14}/></div></Field>
        <Field label="Hari Tunggakan" hint={customer?.dueDate ? `Jatuh tempo ${formatDate(customer.dueDate)} sampai ${formatDate(creation)}.` : 'Tanggal jatuh tempo debitur wajib tersedia.'}><div className="locked-input"><input disabled value={days === null ? 'Belum dapat dihitung' : `${days} hari`}/><CalendarDays size={14}/></div></Field>
        <Field label="Assign To Personnel / Mitra" required className="span-2"><select required value={values.personnelId || ''} onChange={e => set('personnelId', e.target.value)}><option value="">Pilih personel / mitra penanggung jawab</option>{db.personnel.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Asset Collateral Description (Unit Agunan Fidusia)" hint="Diambil otomatis dari Merk/Type dan Nomor Polisi debitur." className="span-2"><textarea value={asset} placeholder="Data kendaraan debitur belum tersedia" readOnly rows={2}/></Field>
        {record && <Field label="Status kasus" className="span-2"><select value={values.status} onChange={e => set('status', e.target.value)}><option>Aktif</option><option>Dalam Proses</option><option>Selesai</option><option>Ditunda</option></select></Field>}
      </div>
      {client && <p className="form-note"><ShieldCheck size={13}/>{client.industry} / {client.contactPerson || 'Lengkapi PIC di master klien'} / {client.phone || 'Telepon belum tersedia'}</p>}
      {customer && (days === null || !customer.contract) && <div className="form-error"><AlertCircle size={15}/>Lengkapi tanggal jatuh tempo dan nomor kontrak debitur sebelum membuat kasus.</div>}
      {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
    </div><footer className="modal-footer"><span className="secure-label">Tunggakan dihitung per tanggal kasus dibuat.</span><div><button type="button" className="button button-secondary" onClick={onClose}>Batal</button><button type="submit" className="button button-primary" disabled={busy || !values.clientId || !values.customerId || days === null}>{busy ? <Spinner/> : <Save size={15}/>} {busy ? 'Menyimpan...' : 'Simpan Kasus'}</button></div></footer></fieldset></form>
  </Modal>;
}

export function CollectionForm({ record, defaults, busy, error, onClose, onSubmit }: CrmFormProps) {
  const { db, openDetail } = useArms(); const old = record as CollectionLog | undefined;
  const [values, setValues] = useState<Partial<CollectionLog>>({ caseId: '', activity: '', activityDate: jakartaDate(), personnelId: '', contactedParty: 'Debitur Langsung', outcome: '', actionPlan: '', nextActionDate: '', report: '', hasPayment: false, ...old, ...defaults });
  const c = getCase(db, values.caseId || ''), customer = getCustomer(db, c?.customerId || '');
  const receipt = old ? db.payments.find(p => p.collectionLogId === old.id) : undefined;
  const eligible = c ? canReceivePayment(db, c) : false;
  const set = (key: keyof CollectionLog, value: string | boolean) => setValues(v => ({ ...v, [key]: value }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    onSubmit(values, submitter?.value === 'payment' ? { afterSave: 'payment' } : undefined);
  }
  return <Modal title={old ? 'Edit Collection & Communication' : 'Catat Collection & Communication'} subtitle="Satu catatan untuk interaksi, hasil tindakan, dan tindak lanjut kasus." onClose={onClose} wide className="bounded-form-modal crm-form-modal collection-form-modal">
    <form onSubmit={submit}><fieldset disabled={busy} className="form-fieldset"><div className="modal-body">
      <div className="form-grid">
        <Field label="Pilih Berkas Perkara / Kasus (Ketik untuk mencari)" required className="span-2"><SearchSelect required disabled={!!receipt || !!values.letterId} value={values.caseId || ''} onChange={id => setValues(v => ({ ...v, caseId: id, personnelId: getAssignee(db, id)?.id || '' }))} label="Berkas perkara / kasus log" placeholder="Cari nomor kasus, kontrak, debitur, atau klien..." options={db.cases.map(c => ({ value: c.id, label: `${c.number} / ${getCustomer(db, c.customerId)?.name || '-'}`, description: `${c.client} / ${c.contract}` }))}/></Field>
        {values.letterId && <div className="crm-linked-summary span-2"><FileCheckIcon/>Laporan untuk {db.letters.find(l => l.id === values.letterId)?.number || values.letterId}</div>}
        {c && <div className="crm-linked-summary span-2"><span><Link2 size={14}/>{c.client}</span><span>{customer?.contract || c.contract}</span><strong>{currency(Math.max(0, c.principal - db.payments.filter(p => p.caseId === c.id).reduce((sum, p) => sum + p.amount, 0)))} sisa piutang</strong></div>}
        <Field label="Pilih Tipe Aktivitas & Kanal Interaksi" required><select required value={values.activity} onChange={e => set('activity', e.target.value)}><option value="">Pilih aktivitas / kanal</option>{COLLECTION_CHANNELS.map(a => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Tanggal Aktivitas" required><input type="date" required max={jakartaDate()} min={c?.createdDate || undefined} value={values.activityDate} onChange={e => set('activityDate', e.target.value)}/></Field>
        <Field label="Petugas / Mitra Lapangan / PIC" required><select required disabled={!!values.letterId} value={values.personnelId || ''} onChange={e => set('personnelId', e.target.value)}><option value="">Pilih petugas / PIC</option>{db.personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Pihak yang Ditemui / Dihubungi" required><select required value={values.contactedParty} onChange={e => set('contactedParty', e.target.value)}>{CONTACTED_PARTIES.map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Hasil Tindakan / Outcome" required className="span-2"><select required value={values.outcome} onChange={e => setValues(v => ({ ...v, outcome: e.target.value, hasPayment: e.target.value === COLLECTION_OUTCOMES[1] ? true : v.hasPayment }))}><option value="">Pilih hasil tindakan</option>{COLLECTION_OUTCOMES.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Tindak Lanjut / Action Plan"><input value={values.actionPlan} onChange={e => set('actionPlan', e.target.value)} placeholder="Rencana tindakan berikutnya" maxLength={1500}/></Field>
        <Field label="Target Tanggal Janji Bayar / Next Action" required={values.outcome === COLLECTION_OUTCOMES[0]}><input type="date" min={values.activityDate} required={values.outcome === COLLECTION_OUTCOMES[0]} value={values.nextActionDate} onChange={e => set('nextActionDate', e.target.value)}/></Field>
        <Field label="Laporan Rinci Pembicaraan & Situasi Lapangan" required className="span-2" hint="Minimal 10 karakter. Catat fakta, kesepakatan, dan situasi secara profesional."><textarea required rows={3} minLength={10} maxLength={5000} value={values.report} onChange={e => set('report', e.target.value)} placeholder="Tuliskan hasil pembicaraan, kondisi lapangan, serta kesepakatan yang diperoleh..."/></Field>
      </div>
      <div className="collection-payment-question"><div><h3>Apakah ada pembayaran?</h3><p>Log disimpan terlebih dahulu. Kuitansi dicatat melalui modul pembayaran.</p></div><label><input type="checkbox" checked={!!values.hasPayment} disabled={!!receipt || values.outcome === COLLECTION_OUTCOMES[1]} onChange={e => set('hasPayment', e.target.checked)}/>Ya, ada pembayaran</label></div>
      {receipt && <div className="crm-receipt-link"><Wallet size={15}/><span>Pembayaran telah terhubung.</span><button type="button" className="text-button" onClick={() => { onClose(); openDetail('payments', receipt); }}>{receipt.number}<ArrowUpRight size={13}/></button></div>}
      {values.hasPayment && !receipt && !eligible && <p className="form-note">Kasus sudah selesai / belum dipilih. Pembayaran baru hanya tersedia untuk kasus aktif dengan sisa piutang.</p>}
      {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
    </div><footer className="modal-footer collection-form-footer"><button type="button" className="button button-secondary" onClick={onClose}>Batal</button><div><button type="submit" className="button button-secondary" disabled={busy || !values.caseId}>{busy ? <Spinner/> : <Save size={15}/>}Simpan Log</button>{values.hasPayment && !receipt && <button type="submit" value="payment" className="button button-primary" disabled={busy || !eligible}>{busy ? <Spinner/> : <Wallet size={15}/>}Simpan & Catat Pembayaran</button>}</div></footer></fieldset></form>
  </Modal>;
}
function FileCheckIcon() { return <Link2 size={14}/>; }