import ExcelJS from 'exceljs';
import { isIsoDate, type Customer } from './data';

export const IMPORT_COLUMNS = ['No. Kontrak', 'Nama', 'Kabupaten/Kota', 'Kecamatan', 'Kelurahan / Desa', 'Alamat Lengkap', 'Tanggal Jatuh Tempo', 'Angsuran', 'Denda', 'Total Angsuran (Rp)', 'Nomor Handphone', 'Merk/Type', 'Nomor Polisi', 'NIK (Opsional)'];
export const IMPORT_KEYS = ['contract', 'name', 'regency', 'district', 'village', 'streetAddress', 'dueDate', 'installment', 'penalty', 'total', 'phone', 'brandType', 'plate', 'nik'] as const;
export interface ImportRow { row: number; data: Customer; errors: string[] }
export const MAX_IMPORT_ROWS = 300;
const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const headerAliases: Record<string, typeof IMPORT_KEYS[number]> = Object.create(null);
IMPORT_COLUMNS.forEach((c, i) => { headerAliases[normalizeHeader(c)] = IMPORT_KEYS[i]; headerAliases[normalizeHeader(IMPORT_KEYS[i])] = IMPORT_KEYS[i]; });
Object.assign(headerAliases, { nokontrak: 'contract', namadebitur: 'name', alamat: 'streetAddress', nomorhp: 'phone', nohp: 'phone', nokontak: 'phone', nomorkontak: 'phone', kontak: 'phone', merk: 'brandType', nopol: 'plate', nik: 'nik', totalangsuran: 'total', denda: 'penalty' });

export function validateImportedCustomer(raw: Record<string, unknown>, existing: Set<string>, seen: Set<string>, row: number): ImportRow {
  const errors: string[] = [];
  const text = (key: string, required = false) => {
    const value = raw[key];
    if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') { errors.push(`${key}: tipe sel tidak didukung.`); return ''; }
    const result = String(value ?? '').trim();
    if (required && !result) errors.push(`${IMPORT_COLUMNS[IMPORT_KEYS.indexOf(key as typeof IMPORT_KEYS[number])]} wajib diisi.`);
    if (result.length > 500) errors.push(`${key}: maksimal 500 karakter.`);
    return result;
  };
  const money = (key: string, required: boolean) => {
    const value = raw[key];
    if (required && (value === '' || value === undefined || value === null)) errors.push('Angsuran wajib diisi.');
    const cleaned = typeof value === 'number' ? value : String(value === '' || value === undefined || value === null ? '0' : value).replace(/^Rp\.?\s*/i, '').replace(/\s/g, '');
    let result: number;
    if (typeof cleaned === 'number') result = cleaned;
    else if (/^\d{1,3}(\.\d{3})+(,00)?$/.test(cleaned)) result = Number(cleaned.replace(/\./g, '').replace(',00', ''));
    else if (/^\d{1,3}(,\d{3})+(\.00)?$/.test(cleaned)) result = Number(cleaned.replace(/,/g, ''));
    else if (/^\d+([.,]0{1,2})?$/.test(cleaned)) result = Number(cleaned.replace(',', '.'));
    else result = NaN;
    if (!Number.isSafeInteger(result) || result < 0 || result > 1e15) { errors.push(`${key === 'installment' ? 'Angsuran' : key === 'penalty' ? 'Denda' : 'Total angsuran'} harus rupiah bulat positif.`); return 0; }
    return result;
  };
  const contract = text('contract', true), name = text('name', true), regency = text('regency', true), district = text('district', true), village = text('village', true), streetAddress = text('streetAddress', true);
  if (contract.length > 100 || name.length > 150) errors.push('No. kontrak maksimal 100 dan nama maksimal 150 karakter.');
  if (typeof raw.contract === 'number') errors.push('No. Kontrak harus bertipe Text agar angka nol awal tidak hilang.');
  const key = contract.toLowerCase();
  if (existing.has(key)) errors.push('No. kontrak sudah ada di database.');
  if (seen.has(key)) errors.push('No. kontrak duplikat dalam file.');
  if (key) seen.add(key);
  const phone = text('phone', true), nik = text('nik');
  if (typeof raw.phone === 'number' || typeof raw.nik === 'number') errors.push('Nomor handphone dan NIK harus berupa Text, bukan Number.');
  if (!/^[+0-9 ()-]{8,20}$/.test(phone)) errors.push('Nomor handphone tidak valid.');
  if (nik && !/^\d{16}$/.test(nik)) errors.push('NIK harus 16 digit atau dikosongkan.');
  const dateValue = raw.dueDate;
  let dueDate = dateValue instanceof Date && !isNaN(dateValue.getTime()) ? dateValue.toISOString().slice(0, 10) : text('dueDate', true);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) { const [day, month, year] = dueDate.split('/'); dueDate = `${year}-${month}-${day}`; }
  if (!isIsoDate(dueDate)) errors.push('Tanggal jatuh tempo harus YYYY-MM-DD, DD/MM/YYYY, atau sel tanggal Excel.');
  const installment = money('installment', true), penalty = money('penalty', false), total = installment + penalty;
  if (total > 1e15) errors.push('Total angsuran melebihi batas.');
  if (raw.total !== undefined && raw.total !== null && raw.total !== '' && money('total', false) !== total) errors.push('Total Angsuran tidak sama dengan Angsuran + Denda.');
  const brandType = text('brandType'), plate = text('plate').toUpperCase();
  return { row, errors, data: { id: '', contract, name, nik, regencyId: '', regency, districtId: '', district, village, streetAddress, address: [streetAddress, village, district, regency].join(', '), dueDate, phone, installment, penalty, total, brandType, plate, vehicle: [brandType, plate].filter(Boolean).join(' / '), occupation: '', emergency: '' } };
}

function parseCsv(text: string): string[][] {
  const delimiter = text.split(/\r?\n/)[0].split(';').length > text.split(/\r?\n/)[0].split(',').length ? ';' : ',';
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += char;
    if (rows.length > MAX_IMPORT_ROWS + 1) throw new Error(`Maksimal ${MAX_IMPORT_ROWS} baris per impor.`);
  }
  if (quoted) throw new Error('Tanda kutip pada CSV tidak berpasangan.');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export async function parseDebtorFile(file: File, existing: Customer[]): Promise<ImportRow[]> {
  if (file.size > 5 * 1024 * 1024 || !file.size) throw new Error('File harus berukuran 1 byte sampai 5 MB.');
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error('Gunakan file .xlsx atau .csv sesuai template.');
  let rows: unknown[][];
  if (/\.csv$/i.test(file.name)) rows = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
  else {
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.getWorksheet('Debitur') || workbook.worksheets[0];
    if (!sheet) throw new Error('Spreadsheet tidak memiliki worksheet.');
    if (sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > 60) throw new Error(`Worksheet maksimal ${MAX_IMPORT_ROWS} baris data dan 60 kolom.`);
    rows = [];
    sheet.eachRow({ includeEmpty: true }, row => {
      const values: unknown[] = [];
      for (let col = 1; col <= sheet.columnCount; col++) { const cell = row.getCell(col); if (cell.type === ExcelJS.ValueType.Formula) throw new Error(`Sel ${cell.address} berisi formula. Ubah menjadi nilai sebelum impor.`); values.push(cell.value && typeof cell.value === 'object' && 'richText' in cell.value ? cell.text : cell.value); }
      rows.push(values);
    });
  }
  if (rows.length < 2) throw new Error('File harus memiliki header dan sedikitnya satu baris data.');
  const mapping = rows[0].map(v => headerAliases[normalizeHeader(String(v || ''))]);
  for (const key of ['contract', 'name', 'regency', 'district', 'village', 'streetAddress', 'dueDate', 'installment', 'phone']) if (!mapping.includes(key as typeof IMPORT_KEYS[number])) throw new Error(`Kolom ${IMPORT_COLUMNS[IMPORT_KEYS.indexOf(key as typeof IMPORT_KEYS[number])]} tidak ditemukan. Gunakan template.`);
  const known = mapping.filter(Boolean); if (new Set(known).size !== known.length) throw new Error('Ada kolom duplikat yang merujuk field yang sama.');
  const seen = new Set<string>(), contracts = new Set(existing.map(c => (c.contract || '').trim().toLowerCase()));
  const result = rows.slice(1).map((row, index) => ({ row, index })).filter(({ row }) => row.some(v => v !== null && v !== undefined && v !== '')).map(({ row, index }) => {
    const data: Record<string, unknown> = {}; mapping.forEach((key, i) => { if (key) data[key] = row[i]; });
    return validateImportedCustomer(data, contracts, seen, index + 2);
  });
  if (!result.length || result.length > MAX_IMPORT_ROWS) throw new Error(`Isi antara 1 dan ${MAX_IMPORT_ROWS} baris debitur.`);
  return result;
}

export async function downloadDebtorTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Debitur'); sheet.addRow(IMPORT_COLUMNS);
  sheet.addRow(['CTR-CONTOH-001', 'Nama Debitur Contoh', 'Kota Jakarta Selatan', 'Tebet', 'Tebet Barat', 'Jl. Contoh No. 1 RT 001 RW 002, 12810', '2026-01-15', 1000000, 50000, 1050000, '081234567890', 'Honda / Vario 160', 'B 1234 ABC', '']);
  sheet.columns.forEach((column, i) => { column.width = i === 5 ? 48 : 26; if (![7, 8, 9].includes(i)) column.numFmt = '@'; });
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6750A4' } }; sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const guide = workbook.addWorksheet('Panduan');
  ['Hapus baris contoh sebelum impor.', 'Maksimal 300 baris dan ukuran 5 MB. Impor menambah data, tidak menimpa debitur.', 'No. Kontrak, Nomor Handphone, NIK harus bertipe Text.', 'Tanggal: YYYY-MM-DD, DD/MM/YYYY, atau sel Date Excel.', 'Angsuran/Denda berupa angka rupiah bulat. Total opsional, dihitung Angsuran + Denda.', 'Tidak menerima formula. Copy lalu Paste Values terlebih dahulu.', 'Foto KTP/STNK diunggah melalui edit debitur setelah impor.'].forEach(text => guide.addRow([text])); guide.getColumn(1).width = 105;
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ARMS-Template-Bulk-Debitur.xlsx'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}