export interface Region { id: string; name: string }
const BASE = 'https://www.emsifa.com/api-wilayah-indonesia/v2';
const cache = new Map<string, Promise<Region[]>>();

// A small verified fallback keeps the selector usable while the national list loads.
export const defaultRegencies: Region[] = [
  { id: '31.01', name: 'Kabupaten Administrasi Kepulauan Seribu' },
  { id: '31.71', name: 'Kota Administrasi Jakarta Pusat' },
  { id: '31.72', name: 'Kota Administrasi Jakarta Utara' },
  { id: '31.73', name: 'Kota Administrasi Jakarta Barat' },
  { id: '31.74', name: 'Kota Administrasi Jakarta Selatan' },
  { id: '31.75', name: 'Kota Administrasi Jakarta Timur' },
];
export const defaultDistricts: Record<string, Region[]> = {
  '31.74': ['Tebet', 'Setiabudi', 'Mampang Prapatan', 'Pasar Minggu', 'Kebayoran Lama', 'Cilandak', 'Kebayoran Baru', 'Pancoran', 'Jagakarsa', 'Pesanggrahan'].map((name, i) => ({ id: `31.74.${String(i + 1).padStart(2, '0')}`, name })),
};

function fetchRegions(path: string): Promise<Region[]> {
  if (cache.has(path)) return cache.get(path)!;
  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${BASE}/${path}.json`, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Referensi wilayah tidak dapat dimuat.');
      const json = await response.json();
      if (!Array.isArray(json.data)) throw new Error('Format referensi wilayah tidak valid.');
      return json.data.filter((row: Region) => row && typeof row.name === 'string' && row.id).map((row: Region) => ({ id: String(row.id), name: row.name }));
    } finally { clearTimeout(timeout); }
  })();
  cache.set(path, request);
  request.catch(() => cache.delete(path));
  return request;
}

let regenciesRequest: Promise<{ rows: Region[]; partial: boolean }> | undefined;
export function loadRegencies() {
  if (!regenciesRequest) {
    regenciesRequest = (async () => {
      const provinces = await fetchRegions('provinces');
      const results = await Promise.allSettled(provinces.map(p => fetchRegions(`regencies/${p.id}`)));
      const rows = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
      if (!rows.length) throw new Error('Daftar wilayah belum tersedia. Gunakan input manual atau coba lagi.');
      const unique = new Map([...defaultRegencies, ...rows].map(r => [r.id, r]));
      const partial = results.some(result => result.status === 'rejected');
      if (partial) regenciesRequest = undefined;
      return { rows: [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'id')), partial };
    })();
    regenciesRequest.catch(() => { regenciesRequest = undefined; });
  }
  return regenciesRequest;
}
export const loadDistricts = (regencyId: string) => fetchRegions(`districts/${encodeURIComponent(regencyId)}`);