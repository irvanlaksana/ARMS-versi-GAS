import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Inbox, LoaderCircle, X } from 'lucide-react';

export function Brand({ compact = false, name, logo }: { compact?: boolean; name?: string; logo?: string }) {
  return <div className={`brand ${name ? 'company-brand' : ''}`}><div className="brand-mark">{logo && /^data:image\/(png|jpeg|webp);base64,/.test(logo) ? <img src={logo} alt="Logo perusahaan"/> : <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 2 29 7v12c0 7-13 15-13 15S3 26 3 19V7L16 2Z" stroke="currentColor" strokeWidth="2.2"/><path d="m9 23 7-15 7 15m-11-5h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{!compact && <div className="brand-type"><span>{name || <>ARMS<span className="brand-dot">.</span></>}</span><small>{name ? 'ARMS / Collection Workspace' : <>Account Receivables<br/>Management System</>}</small></div>}</div>;
}
export function Spinner({ size = 16 }: { size?: number }) { return <LoaderCircle className="spinner" size={size} aria-label="Memuat"/>; }
export function StatusBadge({ status }: { status: string }) {
  const color = ['Aktif', 'Berhasil', 'Administrator'].includes(status) ? 'green' : ['Dalam Proses', 'Draft', 'Supervisor', 'Sebagian', 'Pembayaran sebagian', 'Tarik unit', 'Janji bayar'].includes(status) ? 'amber' : ['Selesai', 'Karyawan', 'Unit ditarik', 'Mediasi'].includes(status) ? 'purple' : ['Dicabut', 'Dibatalkan'].includes(status) ? 'red' : 'blue';
  return <span className={`status-badge ${color}`}><i/>{status}</span>;
}
export function Avatar({ name, index = 0, small = false }: { name: string; index?: number; small?: boolean }) {
  return <span className={`avatar avatar-${index % 6} ${small ? 'small' : ''}`}>{name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}</span>;
}
export function EmptyState({ title = 'Belum ada data', description = 'Data yang Anda tambahkan akan muncul di sini.', action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Inbox size={25}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Field({ label, children, hint, required, className = '' }: { label: string; children: ReactNode; hint?: string; required?: boolean; className?: string }) {
  return <label className={`field ${className}`}><span className="field-label">{label}{required && <span className="required"> *</span>}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
export function Modal({ title, subtitle, children, onClose, wide = false, className = '' }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => ref.current?.querySelector<HTMLElement>('input:not([disabled]), select, button')?.focus(), 50);
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0 && !node.closest('[hidden]'));
        if (!nodes?.length) return;
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handle);
    return () => { clearTimeout(timer); document.body.style.overflow = originalOverflow; document.removeEventListener('keydown', handle); previous?.focus(); };
  }, []);
  return <motion.div className="modal-backdrop no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: .2 }}>
      <header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Tutup dialog"><X size={20}/></button></header>{children}
    </motion.div>
  </motion.div>;
}
export function Pagination({ page, setPage, total, perPage = 10 }: { page: number; setPage: (page: number) => void; total: number; perPage?: number }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  return <div className="pagination"><span>Menampilkan <strong>{total ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, total)}</strong> dari <strong>{total}</strong> data</span><div><button className="pagination-arrow" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya"><ArrowLeft size={15}/></button>{Array.from({ length: Math.min(pages, 5) }, (_, i) => { const value = pages > 5 && page > 3 ? Math.min(page - 2, pages - 4) + i : i + 1; return <button key={value} onClick={() => setPage(value)} className={page === value ? 'current' : ''} aria-label={`Halaman ${value}`}>{value}</button>; })}{pages > 5 && page < pages - 2 && <span>...</span>}<button className="pagination-arrow" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya"><ArrowRight size={15}/></button></div></div>;
}
export function Select({ value, onChange, options, className = '', label }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; className?: string; label: string }) {
  return <div className={`select-wrap ${className}`}><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14}/></div>;
}
export function Toasts({ items, dismiss }: { items: { id: number; message: string; type: string }[]; dismiss: (id: number) => void }) {
  return <div className="toast-stack no-print" aria-live="polite"><AnimatePresence>{items.map(item => <motion.div key={item.id} className={`toast ${item.type}`} initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 25 }}><span className="toast-icon">{item.type === 'error' ? <X size={16}/> : <Check size={16}/>}</span><p>{item.message}</p><button aria-label="Tutup notifikasi" onClick={() => dismiss(item.id)}><X size={14}/></button></motion.div>)}</AnimatePresence></div>;
}