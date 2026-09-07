export interface Region { id: string; name: string }

// Wilayah yang ditampilkan pada form kabupaten/kota otomatis:
// hanya Banyumas, Purbalingga, Cilacap, dan Banjarnegara (Jawa Tengah),
// lengkap dengan seluruh kecamatannya. Data statis agar cepat dan
// tidak bergantung pada jaringan saat form dibuka.
export const defaultRegencies: Region[] = [
  { id: '33.02', name: 'Kabupaten Banyumas' },
  { id: '33.03', name: 'Kabupaten Purbalingga' },
  { id: '33.01', name: 'Kabupaten Cilacap' },
  { id: '33.04', name: 'Kabupaten Banjarnegara' },
];
const kecamatan = (regencyId: string, names: string[]): Region[] => names.map((name, i) => ({ id: `${regencyId}.${String(i + 1).padStart(2, '0')}`, name }));

export const defaultDistricts: Record<string, Region[]> = {
  '33.01': kecamatan('33.01', ['Kedungreja', 'Kesugihan', 'Adipala', 'Binangun', 'Nusawungu', 'Kroya', 'Maos', 'Jeruklegi', 'Kawunganten', 'Gandrungmangu', 'Sidareja', 'Karangpucung', 'Cimanggu', 'Majenang', 'Wanareja', 'Dayeuhluhur', 'Sampang', 'Cipari', 'Patimuan', 'Bantarsari', 'Cilacap Selatan', 'Cilacap Tengah', 'Cilacap Utara', 'Kampung Laut']),
  '33.02': kecamatan('33.02', ['Lumbir', 'Wangon', 'Jatilawang', 'Rawalo', 'Kebasen', 'Kemranjen', 'Sumpiuh', 'Tambak', 'Somagede', 'Kalibagor', 'Banyumas', 'Patikraja', 'Purwojati', 'Ajibarang', 'Gumelar', 'Pekuncen', 'Cilongok', 'Karanglewas', 'Sokaraja', 'Kembaran', 'Sumbang', 'Baturraden', 'Kedungbanteng', 'Purwokerto Selatan', 'Purwokerto Barat', 'Purwokerto Timur', 'Purwokerto Utara']),
  '33.03': kecamatan('33.03', ['Kemangkon', 'Bukateja', 'Kejobong', 'Kaligondang', 'Purbalingga', 'Kalimanah', 'Kutasari', 'Mrebet', 'Bobotsari', 'Karangreja', 'Karanganyar', 'Karangmoncol', 'Rembang', 'Bojongsari', 'Padamara', 'Pengadegan', 'Karangjambu', 'Kertanegara']),
  '33.04': kecamatan('33.04', ['Susukan', 'Purworeja Klampok', 'Mandiraja', 'Purwanegara', 'Bawang', 'Banjarnegara', 'Sigaluh', 'Madukara', 'Banjarmangu', 'Wanadadi', 'Rakit', 'Punggelan', 'Karangkobar', 'Pagentan', 'Pejawaran', 'Batur', 'Wanayasa', 'Kalibening', 'Pandanarum', 'Pagedongan']),
};

/** Daftar wilayah kini disediakan langsung dari data aplikasi (tanpa jaringan). */
export function loadRegencies(): Promise<{ rows: Region[]; partial: boolean }> {
  return Promise.resolve({ rows: defaultRegencies, partial: false });
}
export function loadDistricts(regencyId: string): Promise<Region[]> {
  return Promise.resolve(defaultDistricts[regencyId] || []);
}
