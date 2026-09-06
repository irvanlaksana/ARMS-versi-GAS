import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, FileImage, LockKeyhole, MapPin, RefreshCw, Save, ShieldCheck, Upload, X } from 'lucide-react';
import { useArms } from '../lib/context';
import { currency, type Customer, type PhotoUpload, type RecordData } from '../lib/data';
import { isGoogleConnected } from '../lib/api';
import { defaultDistricts, defaultRegencies, loadDistricts, loadRegencies, type Region } from '../lib/regions';
import { readPhoto } from '../lib/documents';
import { Field, Modal, Spinner } from './ui';

interface Props { record?: Customer; defaults?: Record<string, unknown>; busy: boolean; error: string; onClose: () => void; onSubmit: (data: Partial<RecordData>) => void }
export function CustomerForm({ record, defaults, busy, error, onClose, onSubmit }: Props) {
  const { db } = useArms();
  const [values, setValues] = useState<Partial<Customer>>(() => ({
    name: '', nik: '', occupation: '', emergency: '', regencyId: '', regency: '', districtId: '', district: '', village: '', dueDate: '', phone: '', plate: '', installment: 0, penalty: 0,
    ...record, contract: record?.contract || db.cases.find(c => c.customerId === record?.id)?.contract || '',
    streetAddress: record?.streetAddress ?? record?.address ?? '', brandType: record?.brandType ?? record?.vehicle ?? '', ...defaults,
  }));
  const [regencies, setRegencies] = useState<Region[]>(defaultRegencies);
  const [districts, setDistricts] = useState<Region[]>(defaultDistricts[record?.regencyId || ''] || []);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [regionError, setRegionError] = useState('');
  const [districtError, setDistrictError] = useState('');
  const [manualRegion, setManualRegion] = useState(Boolean(record?.regency && !record.regencyId));
  const [retry, setRetry] = useState(0);
  const [uploading, setUploading] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const stepLabels = ['Debitur & domisili', 'Angsuran & kendaraan', 'Dokumen'];
  const pendingUploads = useRef(new Set<string>());
  const mounted = useRef(true);
  const saving = busy || uploading.length > 0;
  const text = (key: keyof Customer) => String(values[key] ?? '');
  const update = (key: keyof Customer, value: string | number) => setValues(v => ({ ...v, [key]: value }));
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    let active = true; setCitiesLoading(true); setRegionError('');
    loadRegencies().then(result => { if (active) { setRegencies(result.rows); if (result.partial) setRegionError('Sebagian wilayah belum dimuat. Gunakan input manual jika tidak ditemukan.'); } })
      .catch(() => { if (active) setRegionError('Daftar nasional belum tersedia. Gunakan input manual untuk wilayah lainnya.'); })
      .finally(() => { if (active) setCitiesLoading(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    const id = values.regencyId;
    setDistrictError(''); setDistricts(defaultDistricts[id || ''] || []);
    if (!id || manualRegion) { setDistrictsLoading(false); return; }
    setDistrictsLoading(true);
    loadDistricts(id).then(rows => { if (active) setDistricts(rows); })
      .catch(() => { if (active) setDistrictError('Kecamatan belum dapat dimuat. Pilih input manual atau coba lagi.'); })
      .finally(() => { if (active) setDistrictsLoading(false); });
    return () => { active = false; };
  }, [values.regencyId, manualRegion, retry]);

  async function selectPhoto(kind: 'ktp' | 'stnk', file: File) {
    if (pendingUploads.current.has(kind)) return;
    pendingUploads.current.add(kind); setUploading([...pendingUploads.current]); setUploadError('');
    try {
      const photo = await readPhoto(file);
      if (mounted.current) setValues(v => ({ ...v, [`${kind}Upload`]: photo }));
    } catch (err) { if (mounted.current) setUploadError((err as Error).message); }
    finally { pendingUploads.current.delete(kind); if (mounted.current) setUploading([...pendingUploads.current]); }
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (saving || pendingUploads.current.size) return;
    if (step < 2) { changeStep(step + 1); return; }
    const invalid = Array.from(formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') || []).find(input => !input.checkValidity());
    if (invalid) { setStep(Number(invalid.closest<HTMLElement>('[data-customer-step]')?.dataset.customerStep || 0)); setTimeout(() => invalid.reportValidity(), 50); return; }
    const installment = Math.round(Number(values.installment || 0)), penalty = Math.round(Number(values.penalty || 0));
    onSubmit({ ...values, installment, penalty, total: installment + penalty,
      address: [values.streetAddress, values.village, values.district, values.regency].filter(Boolean).join(', '),
      vehicle: [values.brandType, values.plate].filter(Boolean).join(' / '),
    });
  }
  function changeStep(next: number) {
    if (saving) return;
    if (next > step) {
      const inputs = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-customer-step="${step}"] input, [data-customer-step="${step}"] select, [data-customer-step="${step}"] textarea`);
      const invalid = Array.from(inputs || []).find(input => !input.checkValidity());
      if (invalid) { invalid.reportValidity(); return; }
    }
    setStep(next); formRef.current?.querySelector('.modal-body')?.scrollTo({ top: 0 });
  }
  return <Modal title={`${record ? 'Edit' : 'Tambah'} Debitur`} subtitle="Tiga bagian ringkas. Semua data tetap tersimpan saat berpindah bagian." onClose={() => !saving && onClose()} wide className="customer-modal customer-modal--steps">
    <form ref={formRef} onSubmit={submit} noValidate><fieldset disabled={busy} className="form-fieldset">
      <nav className="customer-step-nav" aria-label="Bagian form debitur">{stepLabels.map((label, index) => <button key={label} type="button" className={step === index ? 'active' : ''} onClick={() => changeStep(index)} aria-current={step === index ? 'step' : undefined}><span>{index < step ? <Check size={12}/> : index + 1}</span>{label}</button>)}</nav>
      <div className="modal-body customer-form-body">
      <div data-customer-step="0" hidden={step !== 0}>
      <div className="form-grid">
        <Field label="No. Kontrak" required><input name="contract" value={text('contract')} onChange={e => update('contract', e.target.value)} placeholder="Masukkan nomor kontrak" required maxLength={100}/></Field>
        <Field label="Nama" required><input name="name" value={text('name')} onChange={e => update('name', e.target.value)} placeholder="Nama lengkap debitur" required maxLength={150}/></Field>
      </div>
      <div className="customer-section-title"><h3><MapPin size={15}/>Alamat Domisili Debitur</h3><button type="button" className="text-button" onClick={() => { setManualRegion(!manualRegion); if (manualRegion) setValues(v => ({ ...v, regencyId: '', regency: '', districtId: '', district: '', village: '' })); else setValues(v => ({ ...v, regencyId: '', districtId: '' })); }}>{manualRegion ? 'Pilih dari daftar' : 'Isi wilayah manual'}</button></div>
      <div className="form-grid">
        <Field label="Kabupaten/Kota" required>{manualRegion ? <input name="regency" value={text('regency')} placeholder="Nama kabupaten/kota" onChange={e => update('regency', e.target.value)} required/> : <select name="regencyId" required value={text('regencyId')} onChange={e => { const selected = regencies.find(r => r.id === e.target.value); setValues(v => ({ ...v, regencyId: selected?.id || '', regency: selected?.name || '', districtId: '', district: '', village: '' })); }}><option value="">Pilih Kabupaten/Kota</option>{values.regencyId && !regencies.some(r => r.id === values.regencyId) && <option value={values.regencyId}>{values.regency}</option>}{regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}</Field>
        <Field label="Kecamatan" required>{manualRegion ? <input name="district" value={text('district')} placeholder="Nama kecamatan" onChange={e => update('district', e.target.value)} required/> : <select name="districtId" required disabled={!values.regencyId || (districtsLoading && !districts.length)} value={text('districtId')} onChange={e => { const selected = districts.find(r => r.id === e.target.value); setValues(v => ({ ...v, districtId: selected?.id || '', district: selected?.name || '', village: '' })); }}><option value="">{districtsLoading && !districts.length ? 'Memuat kecamatan...' : 'Pilih Kecamatan'}</option>{values.districtId && !districts.some(r => r.id === values.districtId) && <option value={values.districtId}>{values.district}</option>}{districts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}</Field>
        <Field label="Kelurahan / Desa" required className="span-2"><input name="village" value={text('village')} placeholder="Nama kelurahan atau desa" onChange={e => update('village', e.target.value)} required/></Field>
        <Field label="Alamat lengkap (jalan, nomor rumah, RT/RW, kode pos)" required className="span-2"><textarea name="streetAddress" value={text('streetAddress')} placeholder="Contoh: Jl. Melati No. 12, RT 002/RW 005, 12810" onChange={e => update('streetAddress', e.target.value)} rows={2} required maxLength={500}/></Field>
      </div>
      {!manualRegion && (citiesLoading || regionError || districtError) && <div className="region-feedback" role="status">{citiesLoading ? <><Spinner size={12}/><span>Memuat daftar kabupaten/kota Indonesia...</span></> : <><AlertCircle size={13}/><span>{districtError || regionError}</span><button type="button" className="text-button" onClick={() => setRetry(v => v + 1)}><RefreshCw size={12}/>Coba lagi</button></>}</div>}
      </div>
      <div data-customer-step="1" hidden={step !== 1}>
      <div className="form-grid"><Field label="Tanggal Jatuh Tempo" required hint="mm/dd/yyyy"><input name="dueDate" type="date" lang="en-US" value={text('dueDate')} onChange={e => update('dueDate', e.target.value)} required/></Field><Field label="Nomor Handphone" required><input name="phone" type="tel" inputMode="tel" value={text('phone')} onChange={e => update('phone', e.target.value)} placeholder="08xxxxxxxxxx" required pattern={'[+0-9\\s\\(\\)\\-]{8,20}'} maxLength={20}/></Field></div>
      <div className="customer-section-title"><h3>Rincian angsuran</h3></div>
      <div className="form-grid customer-finance-grid">
        <Field label="Angsuran" required hint="Nominal angsuran dalam rupiah."><input name="installment" type="number" min="0" max="1000000000000000" value={values.installment ?? ''} onChange={e => update('installment', e.target.value)} required/></Field>
        <Field label="Total Angsuran (Rp)" hint="Otomatis: angsuran + denda."><div className="locked-input"><input name="total" value={currency(Number(values.installment || 0) + Number(values.penalty || 0))} readOnly aria-readonly="true"/><LockKeyhole size={14}/></div></Field>
        <Field label="DENDA"><input name="penalty" type="number" min="0" max="1000000000000000" value={values.penalty ?? ''} onChange={e => update('penalty', e.target.value)}/></Field>
      </div>
      <div className="customer-section-title"><h3>Spesifikasi Kendaraan</h3></div>
      <div className="form-grid"><Field label="Merk/Type"><input name="brandType" value={text('brandType')} onChange={e => update('brandType', e.target.value)} placeholder="Contoh: Honda / Vario 160" maxLength={150}/></Field><Field label="Nomor Polisi"><input name="plate" value={text('plate')} onChange={e => update('plate', e.target.value.toUpperCase())} placeholder="Contoh: B 1234 ABC" maxLength={20}/></Field></div>
      <p className="form-note"><LockKeyhole size={13}/>Total Angsuran disinkronkan otomatis ke principal kasus.</p>
      </div>
      <div data-customer-step="2" hidden={step !== 2}>
      <p className="customer-document-intro">Lampirkan dokumen pendukung. Foto dapat ditambahkan sekarang atau dilengkapi nanti.</p>
      <div className="form-grid customer-photos">
        {(['ktp', 'stnk'] as const).map(kind => <PhotoPicker key={kind} label={kind === 'ktp' ? 'Foto KTP' : 'Foto STNK'} upload={values[`${kind}Upload`]} existingName={values[`${kind}PhotoName`] || (values[`${kind}Photo`] ? `${kind.toUpperCase()} tersimpan` : '')} disabled={busy} loading={uploading.includes(kind)} onSelect={file => selectPhoto(kind, file)} onRemove={() => setValues(v => ({ ...v, [`${kind}Upload`]: null }))}/>) }
      </div>
      <p className="form-note"><ShieldCheck size={13}/>{isGoogleConnected() ? 'Foto disimpan di Google Drive terbatas saat debitur disimpan.' : 'Mode demo: gunakan foto contoh. Foto disimpan lokal di perangkat ini.'}</p>
      <dl className="customer-final-summary"><div><dt>Debitur</dt><dd>{text('name') || '-'}</dd></div><div><dt>No. kontrak</dt><dd>{text('contract') || '-'}</dd></div><div><dt>Total angsuran</dt><dd>{currency(Number(values.installment || 0) + Number(values.penalty || 0))}</dd></div></dl>
      </div>
      {(error || uploadError) && <div className="form-error" role="alert"><AlertCircle size={15}/>{uploadError || error}</div>}
    </div><footer className="modal-footer"><span className="step-counter">Bagian {step + 1} dari 3</span><div><button type="button" className="button button-secondary" onClick={() => step ? changeStep(step - 1) : onClose()} disabled={saving}>{step > 0 && <ArrowLeft size={14}/>} {step ? 'Kembali' : 'Batal'}</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <Spinner/> : step === 2 ? <Save size={15}/> : <ArrowRight size={15}/>} {busy ? 'Menyimpan...' : uploading.length ? 'Membaca foto...' : step === 2 ? 'Simpan Debitur' : 'Lanjutkan'}</button></div></footer></fieldset></form>
  </Modal>;
}

export function PhotoPicker({ label, upload, existingName, loading, disabled, onSelect, onRemove }: { label: string; upload?: PhotoUpload | null; existingName: string; loading: boolean; disabled: boolean; onSelect: (file: File) => void; onRemove: () => void }) {
  const inputId = useId();
  const attached = upload ? upload.name : upload === null ? '' : existingName;
  return <div className="photo-field"><span className="field-label">{label}</span><label className={`photo-upload ${attached ? 'has-photo' : ''} ${loading ? 'is-loading' : ''}`} htmlFor={inputId}>
    <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Upload ${label}`} disabled={disabled || loading} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onSelect(file); }}/>
    <span className="photo-upload-icon">{loading ? <Spinner size={20}/> : attached ? <FileImage size={21}/> : <Upload size={21}/>}</span>
    <span><strong>{loading ? 'Membaca foto...' : attached || `Upload ${label}`}</strong><small>{attached ? 'Klik untuk mengganti foto' : 'JPG, PNG, WebP. Maks. 2 MB'}</small></span>
    {attached && !loading && <Check className="photo-check" size={15}/>}
  </label>{attached && <button type="button" className="photo-remove text-button" onClick={onRemove} disabled={disabled || loading}><X size={12}/>Hapus foto</button>}</div>;
}