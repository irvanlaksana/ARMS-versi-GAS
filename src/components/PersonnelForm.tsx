import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Download, Save, ShieldCheck } from 'lucide-react';
import { useArms } from '../lib/context';
import { gasCall, isGoogleConnected } from '../lib/api';
import { downloadPhoto, readPhoto } from '../lib/documents';
import type { Personnel, PhotoUpload, RecordData } from '../lib/data';
import { PhotoPicker } from './CustomerForm';
import { Field, Modal, Spinner } from './ui';

export function PersonnelForm({ record, defaults, busy, error, onClose, onSubmit }: { record?: Personnel; defaults?: Record<string, unknown>; busy: boolean; error: string; onClose: () => void; onSubmit: (data: Partial<RecordData>) => void }) {
  const [values, setValues] = useState<Partial<Personnel>>({ name: '', position: '', nik: '', type: 'Karyawan', bank: '', ...record, ...defaults });
  const [reading, setReading] = useState(false), [photoError, setPhotoError] = useState(''); const pending = useRef(false);
  async function choose(file: File) { if (pending.current) return; pending.current = true; setReading(true); setPhotoError(''); try { const upload = await readPhoto(file); setValues(v => ({ ...v, ktpUpload: upload })); } catch (err) { setPhotoError((err as Error).message); } finally { pending.current = false; setReading(false); } }
  function submit(event: FormEvent) { event.preventDefault(); if (!busy && !reading) onSubmit(values); }
  return <Modal title={record ? 'Edit Personel' : 'Tambah Personel'} subtitle="Identitas tim, posisi/jabatan, dan dokumen KTP." onClose={() => !busy && !reading && onClose()} className="bounded-form-modal personnel-modal"><form onSubmit={submit}><fieldset disabled={busy} className="form-fieldset"><div className="modal-body"><div className="form-grid"><Field label="Nama lengkap" required className="span-2"><input value={values.name} required maxLength={150} onChange={e => setValues(v => ({ ...v, name: e.target.value }))}/></Field><Field label="Posisi / Jabatan" required><input required value={values.position} maxLength={150} onChange={e => setValues(v => ({ ...v, position: e.target.value }))} placeholder="Contoh: Petugas Penagihan"/></Field><Field label="Jenis personel"><select value={values.type} onChange={e => setValues(v => ({ ...v, type: e.target.value as Personnel['type'] }))}><option value="Karyawan">Karyawan</option><option value="Mitra DC">Mitra</option></select></Field><Field label="Rekening bank" required className="span-2"><input value={values.bank} required onChange={e => setValues(v => ({ ...v, bank: e.target.value }))} placeholder="Bank / nomor rekening / atas nama"/></Field><Field label="NIK (Opsional)" className="span-2" hint="Untuk isian generator surat. Foto KTP tidak dibaca otomatis/OCR."><input value={values.nik} pattern="[0-9]{16}" maxLength={16} onChange={e => setValues(v => ({ ...v, nik: e.target.value }))}/></Field><div className="span-2"><PhotoPicker label="KTP" upload={values.ktpUpload} existingName={values.ktpPhotoName || (values.ktpPhoto ? 'KTP tersimpan' : '')} disabled={busy} loading={reading} onSelect={file => void choose(file)} onRemove={() => setValues(v => ({ ...v, ktpUpload: null }))}/></div></div><p className="form-note"><ShieldCheck size={14}/>Dokumen hanya tersimpan setelah Simpan Personel. Akses KTP dibatasi ke pengguna workspace.</p>{(error || photoError) && <div className="form-error" role="alert"><AlertCircle size={15}/>{photoError || error}</div>}</div><footer className="modal-footer"><button className="button button-secondary" type="button" onClick={onClose} disabled={busy || reading}>Batal</button><button className="button button-primary" type="submit" disabled={busy || reading}>{busy || reading ? <Spinner/> : <Save size={15}/>}Simpan Personel</button></footer></fieldset></form></Modal>;
}
export function PersonnelDocument({ person }: { person: Personnel }) {
  const { notify } = useArms(); const [loading, setLoading] = useState(false);
  async function download() {
    if (loading || !person.ktpPhoto) return; setLoading(true);
    try {
      if (isGoogleConnected()) { const p = await gasCall<PhotoUpload>('getPersonnelDocument', person.id); const response = await fetch(p.dataUrl); const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = p.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      else await downloadPhoto(person.ktpPhoto, person.ktpPhotoName || 'KTP-personel.jpg');
    } catch (err) { notify((err as Error).message, 'error'); } finally { setLoading(false); }
  }
  return person.ktpPhoto ? <button className="text-button" onClick={download} disabled={loading}>{loading ? <Spinner size={13}/> : <Download size={13}/>}Unduh KTP</button> : <span className="muted">Belum diunggah</span>;
}