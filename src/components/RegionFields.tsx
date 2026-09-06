import { useEffect, useState } from 'react';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { defaultDistricts, defaultRegencies, loadDistricts, loadRegencies, type Region } from '../lib/regions';
import { Field, Spinner } from './ui';

export interface AddressValues { regencyId: string; regency: string; districtId: string; district: string; village: string; streetAddress: string }
export function RegionFields({ value, onChange }: { value: AddressValues; onChange: (patch: Partial<AddressValues>) => void }) {
  const [manual, setManual] = useState(Boolean(value.regency && !value.regencyId));
  const [cities, setCities] = useState<Region[]>(defaultRegencies);
  const [districts, setDistricts] = useState<Region[]>(defaultDistricts[value.regencyId] || []);
  const [loading, setLoading] = useState(true);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [error, setError] = useState('');
  const [districtError, setDistrictError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    loadRegencies().then(result => { if (active) { setCities(result.rows); if (result.partial) setError('Sebagian wilayah belum dimuat. Gunakan input manual bila diperlukan.'); } }).catch(() => { if (active) setError('Referensi wilayah belum tersedia. Gunakan input manual.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true; setDistrictError(''); setDistricts(defaultDistricts[value.regencyId] || []);
    if (!value.regencyId || manual) { setDistrictLoading(false); return; }
    setDistrictLoading(true);
    loadDistricts(value.regencyId).then(rows => { if (active) setDistricts(rows); }).catch(() => { if (active) setDistrictError('Kecamatan belum dapat dimuat. Gunakan input manual atau coba lagi.'); }).finally(() => { if (active) setDistrictLoading(false); });
    return () => { active = false; };
  }, [value.regencyId, manual, retry]);
  return <>
    <div className="customer-section-title"><h3><MapPin size={14}/>Alamat Domisili / Kantor</h3><button type="button" className="text-button" onClick={() => { setManual(!manual); onChange(manual ? { regencyId: '', regency: '', districtId: '', district: '', village: '' } : { regencyId: '', districtId: '' }); }}>{manual ? 'Pilih dari daftar' : 'Isi wilayah manual'}</button></div>
    <div className="form-grid">
      <Field label="Kabupaten/Kota" required>{manual ? <input value={value.regency} required maxLength={150} placeholder="Nama kabupaten/kota" onChange={e => onChange({ regency: e.target.value })}/> : <select value={value.regencyId} required onChange={e => { const c = cities.find(c => c.id === e.target.value); onChange({ regencyId: c?.id || '', regency: c?.name || '', districtId: '', district: '', village: '' }); }}><option value="">Pilih Kabupaten/Kota</option>{value.regencyId && !cities.some(c => c.id === value.regencyId) && <option value={value.regencyId}>{value.regency}</option>}{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>
      <Field label="Kecamatan" required>{manual ? <input value={value.district} required maxLength={150} placeholder="Nama kecamatan" onChange={e => onChange({ district: e.target.value })}/> : <select required value={value.districtId} disabled={!value.regencyId || (districtLoading && !districts.length)} onChange={e => { const d = districts.find(d => d.id === e.target.value); onChange({ districtId: d?.id || '', district: d?.name || '', village: '' }); }}><option value="">{districtLoading && !districts.length ? 'Memuat kecamatan...' : 'Pilih Kecamatan'}</option>{value.districtId && !districts.some(d => d.id === value.districtId) && <option value={value.districtId}>{value.district}</option>}{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}</Field>
      <Field label="Kelurahan / Desa" required className="span-2"><input required value={value.village} maxLength={150} placeholder="Nama kelurahan atau desa" onChange={e => onChange({ village: e.target.value })}/></Field>
      <Field label="Alamat Domisili / Kantor" required className="span-2"><textarea required rows={2} maxLength={500} value={value.streetAddress} placeholder="Jalan, nomor gedung/rumah, RT/RW, kode pos" onChange={e => onChange({ streetAddress: e.target.value })}/></Field>
    </div>
    {!manual && (loading || error || districtError) && <div className="region-feedback" role="status">{loading ? <><Spinner size={12}/>Memuat referensi wilayah...</> : <><AlertCircle size={13}/><span>{districtError || error}</span><button type="button" className="text-button" onClick={() => setRetry(r => r + 1)}><RefreshCw size={12}/>Coba lagi</button></>}</div>}
  </>;
}