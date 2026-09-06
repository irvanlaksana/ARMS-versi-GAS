import { useEffect, useState } from 'react';
import { ArrowUpRight, BellRing, CheckCircle2, FilePenLine } from 'lucide-react';
import { useArms } from '../lib/context';
import { formatDate, jakartaDate } from '../lib/data';
import { letterReminders } from '../lib/reminders';
import { Pagination } from './ui';

export function LetterReminders() {
  const { db, openForm, openLetter } = useArms();
  const [page, setPage] = useState(1), [expanded, setExpanded] = useState(false), [today, setToday] = useState(jakartaDate());
  useEffect(() => { const timer = setInterval(() => setToday(jakartaDate()), 60000); return () => clearInterval(timer); }, []);
  const rows = letterReminders(db, today);
  useEffect(() => setPage(p => Math.min(p, Math.max(1, Math.ceil(rows.length / 5)))), [rows.length]);
  return <section className="panel letter-reminders"><div className="panel-header"><div><h2><BellRing size={16}/>Reminder Laporan & Update SK{rows.length > 0 && <span className="reminder-count">{rows.length}</span>}</h2><p>SK aktif perlu diperbarui setiap {db.settings.reportIntervalDays || 3} hari. Reminder menggunakan tanggal hari ini.</p></div>{rows.length > 3 && <button className="text-button" onClick={() => { setExpanded(!expanded); setPage(1); }}>{expanded ? 'Ringkas' : 'Lihat semua'}<ArrowUpRight size={14}/></button>}</div>
    {rows.length ? <div className="reminder-list">{rows.slice(expanded ? (page - 1) * 5 : 0, expanded ? page * 5 : 3).map(r => <div className="reminder-row" key={r.letter.id}><span className={`reminder-dot ${r.kind}`}/><div className="reminder-identity"><strong>{r.customerName}</strong><small>{r.letter.number} / {r.personnelName}</small></div><div className="reminder-reason"><span>{r.reason}</span><small>{r.kind === 'report' ? `Update terakhir ${formatDate(r.lastActivity)}` : `Terbit ${formatDate(r.letter.issuedAt)}`}{r.daysLate > 0 ? ` / lewat ${r.daysLate} hari` : ''}</small></div><div className="reminder-actions"><button className="button button-small button-secondary" onClick={() => openForm('collections', undefined, { caseId: r.letter.caseId, personnelId: r.letter.personnelId, letterId: r.letter.id, activityDate: today, actionPlan: 'Laporan perkembangan penugasan ' + r.letter.number })}><FilePenLine size={13}/>Buat laporan</button><button className="text-button" onClick={() => openLetter(r.letter)}>Update SK<ArrowUpRight size={13}/></button></div></div>)}</div> : <div className="reminder-clear"><CheckCircle2 size={17}/><span>Tidak ada SK yang perlu ditindaklanjuti saat ini.</span></div>}
    {expanded && <Pagination page={page} setPage={setPage} total={rows.length} perPage={5}/>}
  </section>;
}