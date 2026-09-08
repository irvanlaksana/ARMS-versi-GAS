import { useState } from 'react';
import { AlertTriangle, Check, Copy, Download, ExternalLink, FileJson, Printer, RefreshCw } from 'lucide-react';
import { useArms } from '../lib/context';
import { downloadFile } from '../lib/data';
import { copyText, payloadJson, printLetter, suratFileName, type LetterPayloadResult } from '../lib/letterPayload';
import { LetterPaper } from './LetterPaper';
import { LETTER_GENERATOR_URL } from './LetterPdfUpload';

/**
 * Panel payload surat: seluruh isian disusun otomatis dari data debitur,
 * rincian angsuran, dan mitra DC penagih, lalu dipakai untuk pratinjau/cetak
 * dokumen serta disimpan bersama penugasan (kolom Generator Data).
 */
export function LetterPayloadPanel({ result, onRefresh }: { result: LetterPayloadResult; onRefresh?: () => void }) {
  const { db, notify } = useArms();
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const { payload, groups, issues } = result;
  const wajib = issues.filter(issue => issue.level === 'wajib');
  const periksa = issues.filter(issue => issue.level === 'periksa');
  const fileName = suratFileName(payload);
  const json = payloadJson(payload);
  async function copy() {
    if (await copyText(json)) { setCopied(true); setTimeout(() => setCopied(false), 2200); notify('Payload JSON disalin ke clipboard.'); }
    else notify('Browser menolak akses clipboard. Gunakan tombol Unduh JSON.', 'error');
  }
  return <section className="panel letter-payload-panel" aria-labelledby="letter-payload-heading">
    <div className="panel-header no-print">
      <div>
        <h2 id="letter-payload-heading"><FileJson size={17}/>Payload Surat & PDF (Otomatis)</h2>
        <p>Diisi otomatis dari data debitur, rincian angsuran, dan mitra DC sebagai penagih — tanpa mengetik ulang.</p>
      </div>
      <span className={`status-badge ${wajib.length ? 'red' : periksa.length ? 'amber' : 'green'}`}><i/>{wajib.length ? `${wajib.length} wajib dilengkapi` : periksa.length ? `${periksa.length} perlu diperiksa` : 'Payload lengkap'}</span>
    </div>
    <div className="letter-payload-body">
      <div className="payload-source no-print">
        {issues.length > 0 && <div className="payload-issues" role="status">
          <span className="payload-issues-title"><AlertTriangle size={13}/>{wajib.length ? `${wajib.length} isian wajib belum lengkap` : `${periksa.length} isian perlu diperiksa`}</span>
          <ul>{issues.slice(0, 8).map(issue => <li key={`${issue.level}-${issue.label}`} className={issue.level}><strong>{issue.label}</strong>{issue.message}</li>)}</ul>
          {issues.length > 8 && <small>{issues.length - 8} catatan lain disembunyikan.</small>}
        </div>}
        {groups.map(group => <div className="payload-group" key={group.key}>
          <div className="payload-group-head"><h3>{group.title}</h3><span>{group.source}</span></div>
          <dl>{group.rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
        </div>)}
        <div className="payload-json">
          <button type="button" className="text-button" onClick={() => setShowJson(value => !value)}>{showJson ? 'Sembunyikan JSON' : 'Lihat JSON payload'}</button>
          {showJson && <pre><code>{json}</code></pre>}
        </div>
      </div>
      <div className="payload-preview">
        <div className="paper-preview-label no-print"><span><i className="live-dot"/>Pratinjau dokumen · A4 portrait</span><span>{fileName}.pdf</span></div>
        <div className="paper-viewport"><article className="a4-paper"><LetterPaper payload={payload} logo={db.settings.logo}/></article></div>
      </div>
    </div>
    <footer className="letter-payload-footer no-print">
      <span>Payload tersimpan otomatis pada penugasan saat Anda menekan <strong>Simpan Penugasan</strong>.</span>
      <div className="letter-payload-actions">
        {onRefresh && <button type="button" className="button button-secondary" onClick={onRefresh}><RefreshCw size={14}/>Muat ulang data</button>}
        <button type="button" className="button button-secondary" onClick={copy}>{copied ? <Check size={14}/> : <Copy size={14}/>}{copied ? 'Payload disalin' : 'Salin Payload JSON'}</button>
        <button type="button" className="button button-secondary" onClick={() => downloadFile(`${fileName}.json`, json)}><Download size={14}/>Unduh JSON</button>
        <a className="button button-secondary" href={LETTER_GENERATOR_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><ExternalLink size={14}/>Generator Eksternal</a>
        <button type="button" className="button button-primary" onClick={() => printLetter(fileName)}><Printer size={15}/>Cetak / Simpan PDF</button>
      </div>
    </footer>
  </section>;
}
