import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useArms } from '../lib/context';
import { importCustomers } from '../lib/api';
import { currency, exportCsv } from '../lib/data';
import { downloadDebtorTemplate, MAX_IMPORT_ROWS, parseDebtorFile, type ImportRow } from '../lib/importDebtors';
import { Modal, Spinner } from './ui';

export function BulkDebtorImport({ onClose }: { onClose: () => void }) {
  const { db, setDb, notify } = useArms();
  const [rows, setRows] = useState<ImportRow[]>([]), [filename, setFilename] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [phase, setPhase] = useState('');
  const batch = useRef(crypto.randomUUID());
  const lock = useRef(false);
  const invalid = rows.filter(r => r.errors.length), ready = rows.length > 0 && !invalid.length;
  async function choose(file: File) {
    if (busy) return; setBusy(true); setPhase('Memeriksa spreadsheet...'); setError(''); setRows([]); setFilename(file.name); batch.current = crypto.randomUUID();
    try { setRows(await parseDebtorFile(file, db.customers)); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function commit() {
    if (busy || lock.current || !ready) return; lock.current = true; setBusy(true); setPhase('Mengimpor seluruh debitur...'); setError('');
    try { setDb(await importCustomers(db, rows.map(r => r.data), batch.current)); notify(`${rows.length} debitur berhasil diimpor.`); onClose(); }
    catch (err) { setError((err as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  async function template() { if (busy) return; setBusy(true); setPhase('Menyiapkan template...'); try { await downloadDebtorTemplate(); } catch { setError('Template tidak dapat diunduh. Coba lagi.'); } finally { setBusy(false); } }
  return <Modal title="Import Bulk Debitor" subtitle="Impor debitur dari spreadsheet. Data diperiksa sebelum disimpan." onClose={() => !busy && onClose()} wide className="bulk-import-modal bounded-form-modal">
    <div className="modal-body"><div className="bulk-import-steps"><span>1. Unduh template</span><span>2. Isi spreadsheet</span><span>3. Periksa & impor</span></div>
      <div className="bulk-import-controls"><button className="button button-secondary" disabled={busy} onClick={template}><Download size={15}/>Template .xlsx</button><label className="button button-primary bulk-upload-button"><Upload size={15}/>Pilih Spreadsheet<input type="file" accept=".xlsx,.csv" disabled={busy} aria-label="Pilih file bulk debitur" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void choose(file); }}/></label></div>
      <p className="form-note">.xlsx atau .csv, maksimal 5 MB / {MAX_IMPORT_ROWS} baris. No. kontrak, telepon, dan NIK harus berupa Text. Foto diunggah setelah impor.</p>
      {busy && <div className="bulk-loading" role="status"><Spinner size={22}/>{phase}</div>}
      {filename && <div className="bulk-file-name"><FileSpreadsheet size={18}/><strong>{filename}</strong>{rows.length > 0 && <span>{rows.length} baris / {rows.length - invalid.length} valid</span>}</div>}
      {rows.length > 0 && <><div className={`bulk-validation ${ready ? 'valid' : 'invalid'}`}>{ready ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}<span>{ready ? 'Semua baris valid. Siap ditambahkan tanpa menimpa data lama.' : `${invalid.length} baris perlu diperbaiki. Tidak ada data yang akan diimpor sebelum semuanya valid.`}</span>{!!invalid.length && <button className="text-button" onClick={() => exportCsv('ARMS-kesalahan-impor.csv', [['Baris', 'No. Kontrak', 'Nama', 'Kesalahan'], ...invalid.map(r => [r.row, r.data.contract || '', r.data.name, r.errors.join('; ')])])}><Download size={13}/>Unduh error</button>}</div>
        <div className="table-overflow bulk-preview"><table className="data-table"><thead><tr><th>Baris</th><th>No. Kontrak / Nama</th><th>Domisili</th><th>Total Angsuran</th><th>Validasi</th></tr></thead><tbody>{rows.slice(0, 50).map(r => <tr key={r.row}><td>{r.row}</td><td>{r.data.contract}<div className="cell-secondary">{r.data.name}</div></td><td>{r.data.regency}</td><td>{currency(r.data.total)}</td><td><span className={r.errors.length ? 'bulk-row-error' : 'emerald-text'}>{r.errors.length ? r.errors.join(' ') : 'Valid'}</span></td></tr>)}</tbody></table></div>{rows.length > 50 && <p className="form-note">Menampilkan 50 baris pertama. Seluruh {rows.length} baris telah diperiksa.</p>}</>}
      {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
    </div><footer className="modal-footer"><button className="button button-secondary" onClick={onClose} disabled={busy}>Batal</button><button className="button button-primary" onClick={commit} disabled={busy || !ready}>{busy ? <Spinner/> : <Upload size={15}/>}Impor {rows.length || ''} Debitur</button></footer>
  </Modal>;
}