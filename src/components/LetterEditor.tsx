import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ExternalLink, FileCheck2, FileText, Save } from 'lucide-react';
import { useArms } from '../lib/context';
import { recoverSavedRecord, saveRecord, SavedRecordRefreshError } from '../lib/api';
import { getAssignee, getCase, getCustomer, isoToday, type Letter } from '../lib/data';
import { Field, Spinner } from './ui';
import { LETTER_GENERATOR_URL, LetterPdfUpload } from './LetterPdfUpload';

export function LetterEditor({ letter, caseId, onBack }: { letter?: Letter; caseId?: string; onBack: () => void }) {
  const { db, setDb, notify } = useArms();
  const initialCase = getCase(db, caseId || '');
  const initialClient = db.clients.find(c => c.id === initialCase?.clientId);
  const [values, setValues] = useState<Letter>(letter || { id: '', number: '', caseId: caseId || '', personnelId: initialCase ? getAssignee(db, initialCase.id)?.id || '' : '', issuedAt: isoToday(), status: 'Aktif', place: 'Jakarta', signer: db.settings.signer, clientRepresentative: initialClient?.industry === 'PERORANGAN' ? initialClient.name : initialClient?.contactPerson || '', clientAddress: initialClient?.address || '' });
  const [customerId, setCustomerId] = useState(getCase(db, letter?.caseId || caseId || '')?.customerId || '');
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const saveLock = useRef(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(Boolean(letter));
  const c = getCase(db, values.caseId), customer = getCustomer(db, customerId);
  const isMulti = c?.clientType !== 'PERORANGAN';
  const storedLetter = db.letters.find(l => l.id === values.id);
  const working = busy || pdfBusy;
  const relationLocked = !!storedLetter?.pdfUrl || db.collections.some(log => values.id && log.letterId === values.id);
  function update(key: keyof Letter, value: string) { setValues(v => ({ ...v, [key]: value })); setSaved(false); }
  function chooseCase(id: string) {
    const c = getCase(db, id), client = db.clients.find(client => client.id === c?.clientId);
    setValues(v => ({ ...v, caseId: id, personnelId: getAssignee(db, id)?.id || '', clientRepresentative: client?.industry === 'PERORANGAN' ? client.name : client?.contactPerson || '', clientAddress: client?.address || '' }));
    setSaved(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (working || saveLock.current) return;
    saveLock.current = true; setBusy(true); setError('');
    try {
      const data: Partial<Letter> = { caseId: values.caseId, personnelId: values.personnelId, issuedAt: values.issuedAt, status: values.status, place: values.place, signer: values.signer, clientRepresentative: values.clientRepresentative, clientAddress: values.clientAddress, validUntil: values.validUntil || '', updateNote: values.updateNote || '' };
      const result = await saveRecord(db, 'letters', data, values.id || undefined);
      const persisted = values.id ? result.letters.find(l => l.id === values.id) : result.letters.find(l => !db.letters.some(previous => previous.id === l.id));
      if (persisted) setValues(persisted);
      setDb(result); setSaved(true); notify('Penugasan tersimpan. PDF surat dapat diunggah pada form di bawah.');
    } catch (err) {
      if (err instanceof SavedRecordRefreshError) { setDb(recoverSavedRecord(db, err)); setValues(err.record as Letter); setSaved(true); }
      setError((err as Error).message);
    } finally { saveLock.current = false; setBusy(false); }
  }
  return <div className="letter-editor module-stack">
    <div className="letter-editor-toolbar no-print"><button className="text-button muted" onClick={onBack} disabled={working}><ArrowLeft size={16}/>Kembali ke daftar surat</button><span><FileText size={14}/>Penugasan & arsip PDF</span></div>
    <form className="letter-form panel no-print external-letter-form" onSubmit={save}>
      <div className="panel-header"><div><h2>Parameter Surat Tugas & Kuasa</h2><p>Data debitur diambil dari database, tanpa mengetik ulang.</p></div><FileCheck2 size={20}/></div>
      <fieldset disabled={working}><div className="letter-form-body">
        <Field label="Debitur" required><select value={customerId} disabled={relationLocked} onChange={e => { setCustomerId(e.target.value); const linked = db.cases.find(c => c.customerId === e.target.value); chooseCase(linked?.id || ''); }} required><option value="">Pilih debitur</option>{db.customers.map(item => <option key={item.id} value={item.id}>{item.name} / {item.contract || item.id}</option>)}</select></Field>
        <Field label="Kasus piutang" hint={relationLocked ? 'Relasi dikunci karena penugasan memiliki PDF atau laporan.' : customer && !db.cases.some(item => item.customerId === customerId) ? 'Buat kasus terlebih dahulu untuk menyimpan penugasan.' : undefined}><select value={values.caseId} onChange={e => chooseCase(e.target.value)} disabled={!customer || relationLocked}><option value="">Pilih kasus terkait</option>{db.cases.filter(item => item.customerId === customerId).map(item => <option key={item.id} value={item.id}>{item.number} / {item.client}</option>)}</select></Field>
        <Field label="Nomor surat"><input value={values.number || 'Otomatis setelah penugasan disimpan'} disabled/></Field>
        <Field label="Status surat"><select value={values.status} onChange={e => update('status', e.target.value)}><option>Aktif</option><option>Draft</option><option>Selesai</option><option>Dicabut</option></select></Field>
        <Field label="Tanggal terbit" required><input type="date" value={values.issuedAt} onChange={e => update('issuedAt', e.target.value)} required/></Field>
        <Field label="Tempat" required><input value={values.place} onChange={e => update('place', e.target.value)} required/></Field>
        <Field label="Petugas / penerima kuasa" required><select value={values.personnelId} disabled={relationLocked} onChange={e => update('personnelId', e.target.value)} required><option value="">Pilih petugas</option>{db.personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Penandatangan agensi" required><input value={values.signer} onChange={e => update('signer', e.target.value)} required/></Field>
        <Field label={isMulti ? 'Jabatan / perwakilan klien' : 'Nama pemberi kuasa'} required className="span-2"><input value={values.clientRepresentative} onChange={e => update('clientRepresentative', e.target.value)} required/></Field>
        {!isMulti && <Field label="Alamat pemberi kuasa" required className="span-2"><textarea rows={2} value={values.clientAddress} onChange={e => update('clientAddress', e.target.value)} required/></Field>}
        <Field label="Berlaku sampai (Opsional)"><input type="date" min={values.issuedAt} value={values.validUntil || ''} onChange={e => update('validUntil', e.target.value)}/></Field>
        <Field label="Catatan update SK" hint="Isi perkembangan untuk memperbarui reminder laporan."><textarea rows={2} maxLength={2000} value={values.updateNote || ''} onChange={e => update('updateNote', e.target.value)}/></Field>
        {error && <div className="form-error span-2" role="alert"><AlertCircle size={15}/>{error}</div>}
      </div><footer className="letter-form-footer"><span className={`letter-save-status ${saved ? 'saved' : ''}`}><span/>{saved ? 'Penugasan tersimpan' : 'Belum disimpan'}</span><div className="letter-save-actions"><a href={LETTER_GENERATOR_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="button button-secondary"><ExternalLink size={15}/>Buka Generator Surat</a><button type="submit" className="button button-primary" disabled={working || !values.caseId}>{busy ? <Spinner/> : <Save size={15}/>} {busy ? 'Menyimpan...' : 'Simpan Penugasan'}</button></div></footer></fieldset>
    </form>
    <LetterPdfUpload letter={storedLetter} disabled={busy || !saved} onBusyChange={setPdfBusy} onUploaded={updated => setValues(updated)}/>
  </div>;
}