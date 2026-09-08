import type { LetterPayload } from '../lib/letterPayload';
import { rupiahSurat, tanggalPanjang } from '../lib/letterPayload';

/** Baris label: nilai pada dokumen. Baris bernilai '-' dilewati agar surat tetap rapi. */
function Rows({ rows }: { rows: [string, string][] }) {
  return <dl>{rows.filter(([, value]) => value && value !== '-').map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

/**
 * Lembar surat tugas / kuasa A4. Struktur dan gaya mengikuti dokumen ARMS,
 * dilengkapi blok rincian angsuran (angsuran per bulan, angsuran belum dibayar,
 * denda, jatuh tempo terakhir, dan hari keterlambatan) serta identitas mitra DC
 * sebagai penagih — seluruhnya berasal dari payload otomatis.
 */
export function LetterPaper({ payload, logo, showStatus = true }: { payload: LetterPayload; logo?: string; showStatus?: boolean }) {
  const { penugasan, agensi, kreditur, debitur, kendaraan, angsuran, mitra } = payload;
  const kuasa = penugasan.jenis === 'Surat Kuasa';
  const dash = (value: string) => (String(value || '').trim() ? String(value).trim() : '-');
  return <>
    <header className="letterhead">
      <div className="paper-brand">{logo && /^data:image\/(png|jpeg|webp);base64,/.test(logo) ? <img src={logo} alt={`Logo ${agensi.nama}`} width={44}/> : null}<span><strong>{agensi.nama || 'ARMS'}</strong><span>ACCOUNT RECEIVABLES MANAGEMENT</span></span></div>
      <p>{dash(agensi.alamat)}</p>
    </header>
    <div className="paper-title">
      <h1>{kuasa ? 'SURAT KUASA PENAGIHAN' : 'SURAT TUGAS PENAGIHAN'}</h1>
      <p>Nomor: {penugasan.nomor || '[NOMOR OTOMATIS]'}</p>
      {showStatus && penugasan.status !== 'Aktif' && <span className="paper-status">{penugasan.status.toUpperCase()}</span>}
    </div>
    <div className="paper-body">
      <p>Yang bertanda tangan di bawah ini:</p>
      <Rows rows={[[kuasa ? 'Nama' : 'Perusahaan', kuasa ? kreditur.pic || kreditur.nama : kreditur.nama || '[Nama kreditur]'], [kuasa ? 'Alamat' : 'Diwakili oleh', kuasa ? kreditur.alamat : kreditur.pic || '[Perwakilan kreditur]']]} />
      <p>Selanjutnya disebut <strong>{kuasa ? 'Pemberi Kuasa' : 'Pemberi Tugas'}</strong>, dengan ini memberikan {kuasa ? 'kuasa' : 'tugas'} penagihan kepada mitra penagih:</p>
      <Rows rows={[['Nama', dash(mitra.nama)], ['NIK', mitra.nik ? dash(mitra.nik) : '-'], ['Jabatan', dash(mitra.jabatan)], ['Status', dash(mitra.tipe)], ['Agensi', dash(agensi.nama)]]} />
      <p>Untuk melakukan konfirmasi, penagihan, dan negosiasi penyelesaian kewajiban atas debitur <strong>{kreditur.nama || '[Kreditur]'}</strong> dengan data sebagai berikut:</p>
      <div className="paper-debtor">
        <Rows rows={[
          ['Nama debitur', dash(debitur.nama)], ['NIK', debitur.nik ? dash(debitur.nik) : '-'],
          ['No. kontrak', dash(debitur.kontrak)], ['No. handphone', dash(debitur.telepon)],
          ['Pekerjaan', dash(debitur.pekerjaan)], ['Alamat domisili', dash(debitur.alamatLengkap)],
          ['No. kasus', dash(penugasan.kasusNomor)],
          ['Merk / type', dash(kendaraan.merkType)], ['Nomor polisi', dash(kendaraan.nomorPolisi)],
        ]} />
      </div>
      <p>Rincian kewajiban angsuran debitur pada saat surat ini diterbitkan:</p>
      <div className="paper-debtor">
        <Rows rows={[
          ['Angsuran / bulan', rupiahSurat(angsuran.angsuranBulan)],
          ['Angsuran belum dibayar', `${rupiahSurat(angsuran.sisaAngsuran)}${angsuran.jumlahAngsuranBelumDibayar ? ` (${angsuran.jumlahAngsuranBelumDibayar}x angsuran)` : ''}`],
          ['Denda', rupiahSurat(angsuran.denda)],
          ['Sudah dibayar', rupiahSurat(angsuran.sudahDibayar)],
          ['Total angsuran', rupiahSurat(angsuran.totalAngsuran)],
          ['Jatuh tempo terakhir', tanggalPanjang(angsuran.jatuhTempo) || dash(angsuran.jatuhTempo)],
          ['Keterlambatan', `${angsuran.hariKeterlambatan} hari`],
        ]} />
      </div>
      <p>Penerima {kuasa ? 'kuasa' : 'tugas'} wajib melaksanakan penagihan secara profesional, mengutamakan musyawarah, tidak menerima pembayaran tunai di luar kanal resmi, menjaga kerahasiaan data debitur, serta mematuhi Kode Etik Penagihan dan peraturan perundang-undangan yang berlaku. Surat ini tidak memberikan kewenangan untuk melakukan intimidasi, kekerasan, atau pengambilan aset secara sepihak.</p>
      <p>Demikian {kuasa ? 'surat kuasa' : 'surat tugas'} ini dibuat untuk dipergunakan sebagaimana mestinya dan berlaku sesuai masa penugasan dalam sistem ARMS.</p>
      <div className="paper-date">{dash(penugasan.tempat)}, {tanggalPanjang(penugasan.tanggalTerbit) || dash(penugasan.tanggalTerbit)}</div>
      <div className="signatures">
        <div><span>{kuasa ? 'Pemberi Kuasa' : 'Pemberi Tugas'}</span><div className="signature-space"/><strong>{dash(agensi.penandatangan)}</strong>{agensi.jabatan && <em>{agensi.jabatan}</em>}</div>
        <div><span>{kuasa ? 'Penerima Kuasa' : 'Penerima Tugas'}</span><div className="signature-space"/><strong>{dash(mitra.nama)}</strong>{mitra.jabatan && <em>{mitra.jabatan}</em>}</div>
      </div>
    </div>
    <footer className="paper-footer"><span>Dokumen diterbitkan melalui ARMS</span><span>{penugasan.nomor || 'DRAFT'} | 1 / 1</span></footer>
  </>;
}
