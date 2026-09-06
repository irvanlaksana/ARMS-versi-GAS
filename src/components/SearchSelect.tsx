import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchOption { value: string; label: string; description?: string }
export function SearchSelect({ value, onChange, options, placeholder, required = false, disabled = false, label }: { value: string; onChange: (value: string) => void; options: SearchOption[]; placeholder: string; required?: boolean; disabled?: boolean; label: string }) {
  const id = useId(); const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [highlight, setHighlight] = useState(0);
  const selected = options.find(o => o.value === value);
  const visible = options.filter(o => `${o.label} ${o.description || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  function choose(option: SearchOption) { onChange(option.value); setOpen(false); setQuery(''); input.current?.focus(); }
  return <div className={`search-select ${open ? 'open' : ''}`} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setOpen(false); setQuery(''); } }}>
    <div className="search-select-control"><Search size={15}/><input ref={input} aria-label={label} role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open && visible[highlight] ? `${id}-${highlight}` : undefined} value={open ? query : selected?.label || ''} placeholder={selected && open ? selected.label : placeholder} required={required && !selected} disabled={disabled} onFocus={() => { if (!open) { setOpen(true); setQuery(''); setHighlight(0); } }} onChange={e => { setQuery(e.target.value); setHighlight(0); setOpen(true); onChange(''); }} onKeyDown={e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight(i => Math.max(0, Math.min(i + 1, visible.length - 1))); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(i => Math.max(0, i - 1)); }
      if (e.key === 'Enter' && open) { e.preventDefault(); if (visible[highlight]) choose(visible[highlight]); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); setQuery(''); }
    }}/>{selected && !disabled ? <button type="button" aria-label={`Hapus pilihan ${label}`} onClick={() => { onChange(''); setQuery(''); }}><X size={13}/></button> : <ChevronDown size={13}/>}</div>
    {open && !disabled && <div className="search-select-options" role="listbox" id={id}>{visible.length ? visible.map((o, i) => <button type="button" role="option" id={`${id}-${i}`} aria-selected={o.value === value} key={o.value} className={i === highlight ? 'highlighted' : ''} onMouseDown={e => e.preventDefault()} onClick={() => choose(o)} onMouseEnter={() => setHighlight(i)}><span><strong>{o.label}</strong>{o.description && <small>{o.description}</small>}</span>{o.value === value && <Check size={14}/>}</button>) : <p>Tidak ada data ditemukan.</p>}{options.length > 60 && <small className="search-select-hint">Ketik untuk mempersempit hasil pencarian.</small>}</div>}
  </div>;
}