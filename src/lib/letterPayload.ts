import { getCustomerPaid, isIsoDate, jakartaDate, overdueDays, vehicleSummary, type Database, type Letter } from './data';

/**
 * Payload surat & PDF: seluruh isian dokumen disusun otomatis dari data ARMS
 * (debitur, angsuran, mitra DC penagih, kreditur, dan identitas agensi) sehingga
 * operator tidak mengetik ulang. Blok `suratTugas` memakai nama field generator
 * surat eksternal agar payload dapat ditempel apa adanya ke generator tersebut.
 */
export const PAYLOAD_VERSION = 'arms.letter-payload/1';
/** Batas karakter payload yang disimpan pada kolom Generator Data. */
export const PAYLOAD_LIMIT = 60000;

export interface LetterAngsuran {
  /** Besar angsuran per bulan (Rp). */
  angsuranBulan: number;
  /** Jumlah angsuran yang belum dibayar (Rp) = total angsuran - sudah dibayar. */
  sisaAngsuran: number;
  /** Banyaknya angsuran yang belum dibayar (perkiraan dari sisa / angsuran per bulan). */
  jumlahAngsuranBelumDibayar: number;
  denda: number;
  totalAngsuran: number;
  sudahDibayar: number;
  /** Tanggal jatuh tempo pembayaran terakhir (ISO). */
  jatuhTempo: string;
  jatuhTempoTeks: string;
  /** Jumlah hari keterlambatan terhadap tanggal acuan. */
  hariKeterlambatan: number;
  acuanKeterlambatan: string;
}

export interface LetterPayload {
  versi: string;
  dibuatPada: string;
  sumber: string;
  penugasan: { id: string; nomor: string; jenis: string; kasusId: string; kasusNomor: string; status: string; tempat: string; tanggalTerbit: string; berlakuDari: string; berlakuSampai: string };
  agensi: { nama: string; alamat: string; penandatangan: string; jabatan: string };
  kreditur: { id: string; nama: string; industri: string; pic: string; telepon: string; email: string; alamat: string };
  debitur: { id: string; nama: string; nik: string; kontrak: string; telepon: string; pekerjaan: string; kontakDarurat: string; alamatLengkap: string; jalan: string; kelurahan: string; kecamatan: string; kabupaten: string };
  kendaraan: { merkType: string; nomorPolisi: string; ringkasan: string };
  angsuran: LetterAngsuran;
  mitra: { id: string; nama: string; nik: string; jabatan: string; tipe: string; rekening: string; sebagaiPenagih: boolean };
  /** Isian siap pakai untuk generator surat eksternal. */
  suratTugas: {
    nomor: string; perusahaan: string; pemberiNama: string; pemberiJabatan: string;
    petugasNama: string; petugasNik: string; petugasJabatan: string;
    noKontrak: string; nasabahNama: string; nasabahAlamat: string;
    jatuhTempo: string; noAngsuran: string; angsuranNilai: string; angsuranBulan: string;
    sisaAngsuran: string; denda: string; keterlambatan: string;
    merkType: string; noPolisi: string; berlakuDari: string; berlakuSampai: string; kota: string; tanggalSuratISO: string;
  };
}

export interface PayloadIssue { level: 'wajib' | 'periksa'; label: string; message: string }
export interface PayloadGroup { key: string; title: string; source: string; rows: { label: string; value: string }[] }
export interface LetterPayloadResult { payload: LetterPayload; groups: PayloadGroup[]; issues: PayloadIssue[] }

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const upper = (value: string) => String(value || '').trim().toUpperCase();
const kosong = (value: string) => (String(value || '').trim() ? String(value).trim() : '-');

/** "23 Maret 2018" — format tanggal panjang pada dokumen. */
export function tanggalPanjang(iso: string): string {
  if (!isIsoDate(iso)) return '';
  const date = new Date(`${iso}T00:00:00`);
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Rp. 652.000" — format nominal pada dokumen surat. */
export const rupiahSurat = (value: number) => `Rp. ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;

/** Banyaknya angsuran yang belum dibayar dari sisa tagihan dan angsuran per bulan. */
export function hitungAngsuranBelumDibayar(angsuranBulan: number, sisaAngsuran: number) {
  const bulanan = Math.round(Number(angsuranBulan) || 0), sisa = Math.max(0, Math.round(Number(sisaAngsuran) || 0));
  if (!sisa) return 0;
  if (bulanan <= 0) return 0;
  return Math.max(1, Math.ceil(sisa / bulanan));
}

/** Inisial perusahaan: singkatan dalam kurung bila ada, selain itu huruf awal tiap kata. */
export function initialsOf(name: string, max = 5) {
  const inBrackets = String(name || '').match(/\(([^)]+)\)/);
  if (inBrackets) {
    const short = inBrackets[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (short) return short.slice(0, max);
  }
  const skip = new Set(['PT', 'CV', 'TBK', 'LTD', 'LLC', 'THE', 'DAN']);
  const words = String(name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(word => word && !skip.has(word));
  return words.map(word => word[0]).join('').slice(0, max) || 'XX';
}

export const slugify = (value: string) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();

/** Nama file dokumen: ST-{inisial kreditur}-{nama debitur}-{kecamatan}. */
export function suratFileName(payload: LetterPayload) {
  const kreditur = payload.kreditur.nama.trim() ? slugify(initialsOf(payload.kreditur.nama)) : 'KREDITUR';
  const prefix = payload.penugasan.jenis === 'Surat Kuasa' ? 'SK' : 'ST';
  return [prefix, kreditur, slugify(payload.debitur.nama) || 'NAMA-DEBITUR', slugify(payload.debitur.kecamatan) || 'KECAMATAN'].filter(Boolean).join('-');
}

/** Cetak dokumen: judul halaman diganti sementara agar nama file PDF mengikuti nama surat. */
export function printLetter(fileName: string) {
  const previous = document.title;
  document.title = fileName;
  const restore = () => { document.title = previous; };
  window.addEventListener('afterprint', restore, { once: true });
  window.setTimeout(restore, 3000);
  window.print();
}

export const payloadJson = (payload: LetterPayload) => JSON.stringify(payload, null, 2);

export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fallback ke execCommand bila clipboard diblokir browser */ }
  const area = document.createElement('textarea');
  area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { copied = false; }
  area.remove();
  return copied;
}

/** Susun payload lengkap dari data debitur, kasus, klien, mitra DC, dan penugasan. */
export function buildLetterPayload(db: Database, draft: Letter, customerId: string): LetterPayloadResult {
  const c = db.cases.find(item => item.id === draft.caseId);
  const customer = db.customers.find(item => item.id === (customerId || c?.customerId || ''));
  const client = db.clients.find(item => item.id === c?.clientId);
  const petugas = db.personnel.find(item => item.id === draft.personnelId);
  const settings = db.settings;

  const totalAngsuran = Math.round(Number(customer?.total || 0));
  const sudahDibayar = customer ? getCustomerPaid(db, customer.id) : 0;
  const sisaAngsuran = Math.max(0, totalAngsuran - sudahDibayar);
  const angsuranBulan = Math.round(Number(customer?.installment || 0));
  const denda = Math.round(Number(customer?.penalty || 0));
  const jatuhTempo = isIsoDate(customer?.dueDate || '') ? customer!.dueDate! : isIsoDate(c?.dueDateSnapshot || '') ? c!.dueDateSnapshot! : '';
  const acuan = jakartaDate();
  const hariKeterlambatan = jatuhTempo ? overdueDays(jatuhTempo, acuan) ?? 0 : 0;
  const jumlahAngsuranBelumDibayar = hitungAngsuranBelumDibayar(angsuranBulan, sisaAngsuran);
  const jenis = c?.clientType === 'PERORANGAN' ? 'Surat Kuasa' : 'Surat Tugas';
  const berlakuDari = tanggalPanjang(draft.issuedAt) || draft.issuedAt;
  const berlakuSampai = tanggalPanjang(draft.validUntil || '') || 'tidak dibatasi';

  const angsuran: LetterAngsuran = {
    angsuranBulan, sisaAngsuran, jumlahAngsuranBelumDibayar, denda, totalAngsuran, sudahDibayar,
    jatuhTempo, jatuhTempoTeks: tanggalPanjang(jatuhTempo), hariKeterlambatan, acuanKeterlambatan: acuan,
  };

  const payload: LetterPayload = {
    versi: PAYLOAD_VERSION,
    dibuatPada: new Date().toISOString(),
    sumber: 'ARMS',
    penugasan: {
      id: draft.id, nomor: draft.number, jenis, kasusId: c?.id || '', kasusNomor: c?.number || '',
      status: draft.status, tempat: draft.place, tanggalTerbit: draft.issuedAt,
      berlakuDari, berlakuSampai: draft.validUntil ? berlakuSampai : '',
    },
    agensi: { nama: settings.agency, alamat: settings.address, penandatangan: draft.signer, jabatan: settings.signerPosition || '' },
    kreditur: {
      id: client?.id || '', nama: client?.name || c?.client || '', industri: client?.industry || c?.clientType || '',
      pic: client?.contactPerson || draft.clientRepresentative || '', telepon: client?.phone || '', email: client?.email || '', alamat: client?.address || draft.clientAddress || '',
    },
    debitur: {
      id: customer?.id || '', nama: customer?.name || c?.customerName || '', nik: customer?.nik || c?.customerNik || '',
      kontrak: customer?.contract || c?.contract || '', telepon: customer?.phone || '', pekerjaan: customer?.occupation || '',
      kontakDarurat: customer?.emergency || '', alamatLengkap: customer?.address || '',
      jalan: customer?.streetAddress || '', kelurahan: customer?.village || '', kecamatan: customer?.district || '', kabupaten: customer?.regency || '',
    },
    kendaraan: { merkType: customer?.brandType || '', nomorPolisi: customer?.plate || '', ringkasan: customer ? vehicleSummary(customer) : c?.asset || '' },
    angsuran,
    mitra: {
      id: petugas?.id || '', nama: petugas?.name || '', nik: petugas?.nik || '', jabatan: petugas?.position || '',
      tipe: petugas?.type || '', rekening: petugas?.bank || '', sebagaiPenagih: true,
    },
    suratTugas: {
      nomor: draft.number, perusahaan: settings.agency, pemberiNama: draft.signer, pemberiJabatan: settings.signerPosition || '',
      petugasNama: upper(petugas?.name || ''), petugasNik: petugas?.nik || '', petugasJabatan: petugas?.position || '',
      noKontrak: customer?.contract || c?.contract || '', nasabahNama: upper(customer?.name || c?.customerName || ''),
      nasabahAlamat: upper(customer?.address || ''),
      jatuhTempo: upper(tanggalPanjang(jatuhTempo)),
      noAngsuran: jumlahAngsuranBelumDibayar ? String(jumlahAngsuranBelumDibayar) : '',
      angsuranNilai: `${rupiahSurat(angsuranBulan)} / ${rupiahSurat(sisaAngsuran)}`,
      angsuranBulan: rupiahSurat(angsuranBulan), sisaAngsuran: rupiahSurat(sisaAngsuran), denda: rupiahSurat(denda),
      keterlambatan: hariKeterlambatan ? `${hariKeterlambatan} hari` : 'tidak ada keterlambatan',
      merkType: upper(customer?.brandType || ''), noPolisi: upper(customer?.plate || ''),
      berlakuDari, berlakuSampai, kota: draft.place, tanggalSuratISO: draft.issuedAt,
    },
  };

  const groups: PayloadGroup[] = [
    {
      key: 'penugasan', title: 'Penugasan & agensi', source: 'Form surat + Pengaturan',
      rows: [
        { label: 'Jenis surat', value: jenis },
        { label: 'Nomor surat', value: kosong(draft.number) },
        { label: 'Kasus piutang', value: kosong(c?.number || '') },
        { label: 'Tanggal terbit', value: kosong(tanggalPanjang(draft.issuedAt) || draft.issuedAt) },
        { label: 'Tempat', value: kosong(draft.place) },
        { label: 'Berlaku sampai', value: draft.validUntil ? kosong(tanggalPanjang(draft.validUntil) || draft.validUntil) : 'Tidak dibatasi' },
        { label: 'Agensi penagih', value: kosong(settings.agency) },
        { label: 'Penandatangan', value: `${kosong(draft.signer)}${settings.signerPosition ? ` (${settings.signerPosition})` : ''}` },
      ],
    },
    {
      key: 'kreditur', title: 'Kreditur / klien', source: 'Clients & Creditors Master',
      rows: [
        { label: 'Nama kreditur', value: kosong(payload.kreditur.nama) },
        { label: 'Industri', value: kosong(payload.kreditur.industri) },
        { label: 'Perwakilan / PIC', value: kosong(payload.kreditur.pic) },
        { label: 'Kontak', value: kosong([payload.kreditur.telepon, payload.kreditur.email].filter(Boolean).join(' / ')) },
        { label: 'Alamat', value: kosong(payload.kreditur.alamat) },
      ],
    },
    {
      key: 'debitur', title: 'Data debitur', source: 'Form debitur',
      rows: [
        { label: 'Nama debitur', value: kosong(payload.debitur.nama) },
        { label: 'NIK', value: kosong(payload.debitur.nik) },
        { label: 'No. kontrak', value: kosong(payload.debitur.kontrak) },
        { label: 'No. handphone', value: kosong(payload.debitur.telepon) },
        { label: 'Pekerjaan', value: kosong(payload.debitur.pekerjaan) },
        { label: 'Kontak darurat', value: kosong(payload.debitur.kontakDarurat) },
        { label: 'Alamat domisili', value: kosong(payload.debitur.alamatLengkap) },
      ],
    },
    {
      key: 'angsuran', title: 'Rincian angsuran', source: 'Form debitur + pembayaran kasus',
      rows: [
        { label: 'Angsuran / bulan', value: rupiahSurat(angsuranBulan) },
        { label: 'Angsuran belum dibayar', value: `${rupiahSurat(sisaAngsuran)}${jumlahAngsuranBelumDibayar ? ` (${jumlahAngsuranBelumDibayar}x angsuran)` : ''}` },
        { label: 'Denda', value: rupiahSurat(denda) },
        { label: 'Sudah dibayar', value: rupiahSurat(sudahDibayar) },
        { label: 'Total angsuran', value: rupiahSurat(totalAngsuran) },
        { label: 'Jatuh tempo terakhir', value: kosong(angsuran.jatuhTempoTeks || angsuran.jatuhTempo) },
        { label: 'Hari keterlambatan', value: `${hariKeterlambatan} hari (acuan ${tanggalPanjang(acuan) || acuan})` },
      ],
    },
    {
      key: 'kendaraan', title: 'Kendaraan jaminan', source: 'Form debitur',
      rows: [
        { label: 'Merk / type', value: kosong(payload.kendaraan.merkType) },
        { label: 'Nomor polisi', value: kosong(payload.kendaraan.nomorPolisi) },
      ],
    },
    {
      key: 'mitra', title: 'Mitra DC penagih', source: 'Tim & Mitra',
      rows: [
        { label: 'Nama penagih', value: kosong(payload.mitra.nama) },
        { label: 'Jenis personel', value: kosong(payload.mitra.tipe) },
        { label: 'NIK', value: kosong(payload.mitra.nik) },
        { label: 'Jabatan', value: kosong(payload.mitra.jabatan) },
        { label: 'Rekening', value: kosong(payload.mitra.rekening) },
      ],
    },
  ];

  const issues: PayloadIssue[] = [];
  const wajib = (label: string, message: string) => issues.push({ level: 'wajib', label, message });
  const periksa = (label: string, message: string) => issues.push({ level: 'periksa', label, message });
  if (!customer) wajib('Debitur', 'Pilih debitur agar seluruh isian surat terisi otomatis.');
  if (!c) wajib('Kasus piutang', 'Pilih kasus piutang debitur untuk menerbitkan penugasan.');
  if (!petugas) wajib('Mitra DC penagih', 'Pilih petugas penagih sebagai penerima tugas.');
  else if (petugas.type !== 'Mitra DC') periksa('Mitra DC penagih', `${petugas.name} berjenis ${petugas.type}, bukan Mitra DC.`);
  if (petugas && !petugas.nik) periksa('NIK penagih', 'NIK penagih kosong. Lengkapi pada menu Tim & Mitra.');
  if (!draft.issuedAt) wajib('Tanggal terbit', 'Tanggal terbit surat belum diisi.');
  if (!draft.number) periksa('Nomor surat', 'Nomor surat terbit otomatis setelah penugasan disimpan.');
  if (customer && !customer.nik) periksa('NIK debitur', 'NIK debitur kosong sehingga tidak tercetak pada surat.');
  if (customer && !customer.contract) periksa('No. kontrak', 'Nomor kontrak debitur kosong.');
  if (customer && !customer.address) periksa('Alamat debitur', 'Alamat domisili debitur belum lengkap.');
  if (!jatuhTempo) periksa('Jatuh tempo', 'Tanggal jatuh tempo pembayaran terakhir belum ada pada data debitur.');
  if (!angsuranBulan) periksa('Angsuran / bulan', 'Besar angsuran per bulan masih nol pada data debitur.');
  if (!sisaAngsuran) periksa('Angsuran belum dibayar', 'Tidak ada sisa angsuran; seluruh tagihan tercatat lunas.');
  if (!denda) periksa('Denda', 'Denda pada data debitur masih nol.');
  if (!hariKeterlambatan) periksa('Keterlambatan', 'Belum ada hari keterlambatan terhadap tanggal jatuh tempo.');
  if (customer && !customer.plate && !customer.brandType) periksa('Kendaraan', 'Merk/type dan nomor polisi kendaraan belum diisi.');
  if (!settings.signerPosition) periksa('Jabatan penandatangan', 'Jabatan penandatangan kosong. Lengkapi pada Pengaturan.');

  return { payload, groups, issues };
}
