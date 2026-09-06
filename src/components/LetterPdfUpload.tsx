import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Download, FileText, LockKeyhole, Upload, X } from 'lucide-react';
import { useArms } from '../lib/context';
import { gasCall, isGoogleConnected, saveLetterPdf } from '../lib/api';
import { getPdfBlob, pdfUploadBlob, readPdf, safePdfName } from '../lib/documents';
import { formatDate, type Letter, type PdfUpload } from '../lib/data';
import { Field, Spinner } from './ui';

export const LETTER_GENERATOR_URL = 'https://generator-surat-new.vercel.app/';
export const fileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;

export function LetterPdfDownload({ letter, disabled = false }: { letter: Letter; disabled?: boolean }) {
  const { notify } = useArms();
  const [busy, setBusy] = useState(false), lock = useRef(false);
  async function download() {
    if (!letter.pdfUrl || lock.current || disabled) return;
    lock.current = true; setBusy(true);
    try {
      let blob: Blob, name = letter.pdfName || 'surat-penugasan.pdf';
      if (isGoogleConnected()) { const result = await gasCall<PdfUpload>('getSKPdf', letter.id); blob = await pdfUploadBlob(result); name = result.name; }
      else blob = await getPdfBlob(letter.pdfUrl);
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = safePdfName(name); document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (error) { notify((error as Error).message, 'error'); }
    finally { lock.current = false; setBusy(false); }
  }
  return letter.pdfUrl ? <button type="button" className="text-button pdf-download" onClick={download} disabled={busy || disabled} aria-label={`Unduh PDF ${letter.number}`}>{busy ? <Spinner size={14}/> : <Download size={14}/>} {busy ? 'Mengambil PDF...' : 'Unduh PDF'}</button> : <span className="muted">Belum diunggah</span>;
}

export function LetterPdfUpload({ letter, disabled, onBusyChange, onUploaded }: { letter?: Letter; disabled: boolean; onBusyChange: (busy: boolean) => void; onUploaded: (letter: Letter) => void }) {
  const { db, setDb, notify } = useArms();
  const inputId = useId(), lock = useRef(false), mounted = useRef(true);
  const [selection, setSelection] = useState<{ upload: PdfUpload; id: string; previous: string } | null>(null);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null), [error, setError] = useState('');
  const blocked = disabled || !letter?.id || !!busy;
  useEffect(() => { setSelection(null); setError(''); }, [letter?.id, letter?.pdfUrl]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function choose(file: File) {
    if (blocked || lock.current) return;
    lock.current = true; setBusy('reading'); onBusyChange(true); setError(''); setSelection(null);
    try {
      const upload = await readPdf(file);
      if (mounted.current) setSelection({ upload, id: crypto.randomUUID(), previous: letter?.pdfUrl || '' });
    } catch (err) { if (mounted.current) setError((err as Error).message); }
    finally { lock.current = false; if (mounted.current) { setBusy(null); onBusyChange(false); } }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selection || !letter || blocked || lock.current) return;
    lock.current = true; setBusy('saving'); onBusyChange(true); setError('');
    try {
      const result = await saveLetterPdf(db, letter.id, selection.upload, selection.id, selection.previous);
      setDb(result.db); if (mounted.current) onUploaded(result.letter);
      if (mounted.current) setSelection(null);
      notify(result.refreshed ? 'PDF berhasil diunggah dan terhubung ke penugasan.' : 'PDF sudah tersimpan. Muat ulang workspace untuk menyinkronkan seluruh data.', result.refreshed ? 'success' : 'info');
    } catch (err) { if (mounted.current) setError((err as Error).message); }
    finally { lock.current = false; if (mounted.current) { setBusy(null); onBusyChange(false); } }
  }
  return <section className="panel letter-pdf-panel no-print" aria-labelledby="letter-pdf-heading">
    <div className="panel-header"><div><h2 id="letter-pdf-heading"><FileText size={17}/>Upload PDF Surat Tugas / Kuasa</h2><p>Simpan dokumen final yang dibuat melalui generator surat.</p></div>{letter?.pdfUrl && <span className="status-badge green"><i/>PDF tersimpan</span>}</div>
    <form onSubmit={submit}>
      <div className="letter-pdf-body">
        <Field label="Penugasan terkait"><input value={letter?.number || 'Simpan penugasan terlebih dahulu'} disabled/></Field>
        {letter?.pdfUrl && <div className="letter-pdf-current"><span className="pdf-file-icon"><FileText size={23}/></span><div><strong>{letter.pdfName || 'surat-penugasan.pdf'}</strong><small>{fileSize(letter.pdfSize || 0)}{letter.pdfUploadedAt ? ` / Diunggah ${formatDate(letter.pdfUploadedAt)}` : ''}</small></div><LetterPdfDownload letter={letter} disabled={!!busy}/></div>}
        <label htmlFor={inputId} className={`pdf-upload-area ${blocked ? 'is-disabled' : ''} ${selection ? 'has-file' : ''}`}>
          <input id={inputId} type="file" accept="application/pdf,.pdf" disabled={blocked} aria-label="Pilih PDF surat tugas atau kuasa" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void choose(file); }}/>
          <span className="pdf-upload-icon">{busy === 'reading' ? <Spinner size={24}/> : selection ? <CheckCircle2 size={25}/> : <Upload size={25}/>}</span>
          <span><strong>{busy === 'reading' ? 'Memeriksa dokumen...' : selection ? selection.upload.name : letter?.pdfUrl ? 'Pilih PDF pengganti' : 'Pilih PDF Surat Tugas / Kuasa'}</strong><small>{selection ? `${fileSize(selection.upload.size)} / Siap diunggah` : 'Format .pdf, maksimal 5 MB'}</small></span>
        </label>
        {selection && <div className="pdf-selection-actions"><span>Dokumen belum diunggah.</span><button type="button" className="text-button" disabled={!!busy} onClick={() => setSelection(null)}><X size={13}/>Batalkan pilihan</button></div>}
        <p className="form-note"><LockKeyhole size={14}/>{!letter?.id ? 'Simpan penugasan untuk mendapatkan nomor surat sebelum mengunggah PDF.' : disabled ? 'Simpan perubahan penugasan terlebih dahulu agar PDF terhubung ke data yang benar.' : isGoogleConnected() ? 'PDF disimpan di Google Drive terbatas. Unggahan tidak mengubah status atau catatan laporan SK.' : 'Mode demo: PDF disimpan di browser ini. Gunakan dokumen contoh dan unduh file sebelum mereset data.'}</p>
        {letter?.pdfUrl && selection && <p className="form-note amber-text">PDF lama akan diganti setelah unggahan baru berhasil. Simpan salinan dokumen lama jika diperlukan.</p>}
        {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
      </div>
      <footer className="letter-pdf-footer"><span>{letter?.pdfUrl ? 'Satu PDF final per penugasan.' : 'Unggah setelah PDF selesai dibuat.'}</span><button type="submit" className="button button-primary" disabled={blocked || !selection}>{busy === 'saving' ? <Spinner/> : <Upload size={15}/>} {busy === 'saving' ? 'Mengunggah PDF...' : letter?.pdfUrl ? 'Ganti PDF Surat' : 'Upload PDF Surat'}</button></footer>
    </form>
  </section>;
}