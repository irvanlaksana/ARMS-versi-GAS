import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, ChevronDown, CircleDollarSign, Info, TrendingUp, Wallet } from 'lucide-react';
import { useArms } from '../lib/context';
import { isGoogleConnected } from '../lib/api';
import { bucketColors, buckets, compactCurrency, currency, getPaid, type Module } from '../lib/data';
import { CaseTable } from './DataModules';
import { Select } from './ui';
import { LetterReminders } from './LetterReminders';

export function Dashboard() {
  const { db, navigate, period } = useArms();
  const currentPayments = db.payments.filter(p => p.date.startsWith(period));
  const prior = new Date(`${period}-01T12:00:00`); prior.setMonth(prior.getMonth() - 1);
  const previousPeriod = `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, '0')}`;
  const priorPayments = db.payments.filter(p => p.date.startsWith(previousPeriod));
  const collected = currentPayments.reduce((sum, p) => sum + p.amount, 0);
  const previousCollected = priorPayments.reduce((sum, p) => sum + p.amount, 0);
  const revenue = currentPayments.reduce((sum, p) => sum + p.companyRevenue, 0);
  const previousRevenue = priorPayments.reduce((sum, p) => sum + p.companyRevenue, 0);
  const active = db.cases.filter(c => c.status !== 'Selesai');
  const outstanding = active.reduce((sum, c) => sum + Math.max(0, c.principal - getPaid(db, c.id)), 0);
  const growth = (a: number, b: number) => b ? `${((a - b) / b * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : 'Baru';
  const stats: { label: string; value: string; icon: typeof Wallet; iconClass: string; detail: string; change?: string; to: Module }[] = [
    { label: 'Total Piutang', value: compactCurrency(outstanding), icon: Wallet, iconClass: 'purple', detail: `dari ${active.length} kasus berjalan`, to: 'cases' },
    { label: 'Kasus Aktif', value: String(active.length), icon: BriefcaseBusiness, iconClass: 'blue', detail: `${db.cases.filter(c => c.status === 'Dalam Proses').length} kasus dalam proses penagihan`, to: 'cases' },
    { label: 'Pembayaran Diterima', value: compactCurrency(collected), icon: ArrowDownLeft, iconClass: 'green', detail: 'dari bulan lalu', change: growth(collected, previousCollected), to: 'payments' },
    { label: 'Pendapatan Perusahaan', value: compactCurrency(revenue), icon: CircleDollarSign, iconClass: 'amber', detail: 'dari bulan lalu', change: growth(revenue, previousRevenue), to: 'reports' },
  ];
  return <div className="dashboard-content"><div className="stats-grid">{stats.map((stat, i) => <motion.button className="stat-panel" key={stat.label} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * .055, duration: .35 }} onClick={() => navigate(stat.to)}>
    <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.iconClass}`}><stat.icon size={18} strokeWidth={1.7}/></span></div><div className="stat-value">{stat.value}</div><div className="stat-bottom">{stat.change ? <span className={`stat-change ${stat.change.startsWith('-') ? 'negative' : ''}`}><TrendingUp size={12}/>{stat.change}</span> : <span className={`tiny-dot ${stat.iconClass}`}/>}<span>{stat.detail}</span></div>
  </motion.button>)}</div>
    <LetterReminders/>
    <div className="charts-grid"><CollectionChart/><DPDChart/></div>
    <section className="panel recent-cases"><div className="panel-header"><div><h2>Kasus terbaru</h2><p>Kelola dan pantau perkembangan kasus piutang Anda.</p></div><button className="text-button" onClick={() => navigate('cases')}>Lihat semua kasus <ArrowUpRight size={16}/></button></div><CaseTable compact/></section>
    <div className="dashboard-footer"><span>ARMS <span className="footer-separator">/</span> Lebih teratur. Lebih terkendali.</span><span><span className="live-dot"/> {isGoogleConnected() ? 'Tersinkron dengan Google Sheets' : 'Data demo tersimpan di perangkat'}</span></div>
  </div>;
}

export function CollectionChart({ report = false }: { report?: boolean }) {
  const { db, period } = useArms();
  const [range, setRange] = useState('6');
  const [hover, setHover] = useState<number | null>(null);
  const count = Number(range);
  const points = useMemo(() => Array.from({ length: count }, (_, i) => {
    const date = new Date(`${period}-01T12:00:00`); date.setMonth(date.getMonth() - count + 1 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { month: date.toLocaleDateString('id-ID', { month: 'short' }), label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), total: db.payments.filter(p => p.date.startsWith(key)).reduce((sum, p) => sum + p.amount, 0) };
  }), [count, db.payments, period]);
  const chartMax = Math.max(400000000, Math.ceil(Math.max(...points.map(p => p.total), db.settings.target * .8) / 100000000) * 100000000);
  const width = 720, height = 196, left = 62, right = 24, top = 17, bottom = 32;
  const coords = points.map((p, i) => ({ x: left + i * (width - left - right) / (count - 1), y: height - bottom - p.total / chartMax * (height - top - bottom) }));
  // A monotone cubic curve keeps the graph smooth without overshooting payment values.
  const path = coords.reduce((result, p, i) => {
    if (!i) return `M${p.x},${p.y}`;
    const prev = coords[i - 1]; const mid = (prev.x + p.x) / 2;
    return `${result} C${mid},${prev.y} ${mid},${p.y} ${p.x},${p.y}`;
  }, '');
  const area = `${path} L${coords[count - 1].x},${height - bottom} L${left},${height - bottom} Z`;
  const targetY = height - bottom - Math.min(chartMax, db.settings.target * .8) / chartMax * (height - top - bottom);
  return <section className={`panel collection-chart ${report ? 'report-chart' : ''}`}><div className="panel-header"><div><h2>Tren pembayaran <span className="heading-info" title="Total pembayaran diterima berdasarkan tanggal kuitansi"><Info size={13}/></span></h2><p>Performa penerimaan pembayaran dari waktu ke waktu.</p></div><Select label="Rentang grafik" value={range} onChange={setRange} options={[{ value: '6', label: '6 bulan terakhir' }, { value: '3', label: '3 bulan terakhir' }]} className="chart-range"/></div>
    <div className="chart-legend"><span><i className="legend-dot purple"/>Pembayaran diterima</span><span><i className="legend-dash"/>80% target bulanan</span></div>
    <div className="line-chart-wrap"><svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik tren penerimaan pembayaran bulanan">
      <defs><linearGradient id={report ? 'area-report' : 'area-dashboard'} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8a75f2" stopOpacity=".23"/><stop offset="100%" stopColor="#8a75f2" stopOpacity=".01"/></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(i => { const y = top + i * (height - top - bottom) / 4; return <g key={i}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#2a2c35" strokeDasharray="3 5"/><text x={left - 13} y={y + 4} textAnchor="end" fill="#7e828f" fontSize="10">{Math.round(chartMax * (4 - i) / 4 / 1e6)} Jt</text></g>; })}
      <line x1={left} x2={width - right} y1={targetY} y2={targetY} stroke="#777987" strokeWidth="1" strokeDasharray="5 5" opacity=".65"/>
      <motion.path key={`area-${range}-${period}`} d={area} fill={`url(#${report ? 'area-report' : 'area-dashboard'})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8 }}/>
      <motion.path key={`line-${range}-${period}`} d={path} fill="none" stroke="#9b87fc" strokeWidth="2.8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.15, ease: 'easeOut' }}/>
      {points.map((p, i) => <g key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} role="img" aria-label={`${p.label}: ${currency(p.total)}`}><rect x={coords[i].x - 35} y={top} width="70" height={height - top} fill="transparent"/><circle cx={coords[i].x} cy={coords[i].y} r={hover === i ? 5 : 3.6} fill="#a38dfb" stroke="#1a1c24" strokeWidth="2.5"/><text x={coords[i].x} y={height - 8} textAnchor="middle" fill="#858894" fontSize="11">{p.month}</text></g>)}
      {hover !== null && <g pointerEvents="none"><line x1={coords[hover].x} x2={coords[hover].x} y1={top} y2={height - bottom} stroke="#a38dfb" opacity=".3" strokeDasharray="4 4"/><rect x={Math.max(65, Math.min(coords[hover].x - 75, width - 178))} y={Math.max(8, coords[hover].y - 60)} rx="6" width="150" height="46" fill="#292b36" stroke="#404251"/><text x={Math.max(77, Math.min(coords[hover].x - 63, width - 166))} y={Math.max(25, coords[hover].y - 43)} fontSize="10" fill="#a9aab7">{points[hover].label}</text><text x={Math.max(77, Math.min(coords[hover].x - 63, width - 166))} y={Math.max(43, coords[hover].y - 25)} fontSize="12" fontWeight="600" fill="#f1f0f7">{currency(points[hover].total)}</text></g>}
    </svg></div>
  </section>;
}

export function DPDChart() {
  const { db, navigate, setBucketFilter } = useArms();
  const [showInfo, setShowInfo] = useState(false);
  const active = db.cases.filter(c => c.status !== 'Selesai');
  const counts = buckets.map(bucket => active.filter(c => c.bucket === bucket).length);
  const r = 65, circumference = 2 * Math.PI * r;
  let cumulative = 0;
  function openBucket(bucket: string) { setBucketFilter(bucket); navigate('cases'); }
  return <section className="panel dpd-panel"><div className="panel-header"><div><h2>Distribusi DPD</h2><p>Umur tunggakan kasus aktif.</p></div><button className="icon-button subtle" aria-label="Informasi DPD" onClick={() => setShowInfo(!showInfo)}><Info size={16}/></button></div>
    {showInfo && <div className="dpd-info">Days Past Due adalah jumlah hari keterlambatan. Klik kategori untuk melihat daftar kasusnya.<button onClick={() => setShowInfo(false)}><ChevronDown size={14}/></button></div>}
    <div className="donut-wrap"><svg viewBox="0 0 184 184" role="img" aria-label="Distribusi umur tunggakan"><circle cx="92" cy="92" r={r} stroke="#2b2d38" strokeWidth="20" fill="none"/>{counts.map((count, i) => {
      const length = active.length ? count / active.length * circumference : 0;
      const offset = cumulative; cumulative += length;
      return <motion.circle key={buckets[i]} cx="92" cy="92" r={r} stroke={bucketColors[i]} strokeWidth="20" fill="none" strokeDasharray={`${Math.max(0, length - 5)} ${circumference - Math.max(0, length - 5)}`} strokeDashoffset={-offset} transform="rotate(-90 92 92)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 + i * .12, duration: .5 }} className="donut-segment" onClick={() => openBucket(buckets[i])}><title>{buckets[i]}: {count} kasus</title></motion.circle>;
    })}<text x="92" y="90" textAnchor="middle" fill="#f2f1f8" fontSize="30" fontWeight="600" letterSpacing="-1">{active.length}</text><text x="92" y="110" textAnchor="middle" fill="#9394a3" fontSize="11">Kasus aktif</text></svg></div>
    <div className="donut-legend">{buckets.map((bucket, i) => <button key={bucket} onClick={() => openBucket(bucket)}><span><i style={{ backgroundColor: bucketColors[i] }}/>{bucket.replace('-', ' - ')}</span><strong>{counts[i]} <small>{active.length ? (counts[i] / active.length * 100).toFixed(0) : 0}%</small></strong></button>)}</div>
  </section>;
}