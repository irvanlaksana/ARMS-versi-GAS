import type { PdfUpload, PhotoUpload } from './data';

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DB_NAME = 'arms-private-documents';
const PREFIX = 'local-document:';

export async function readPhoto(file: File): Promise<PhotoUpload> {
  if (!TYPES.includes(file.type)) throw new Error('Gunakan foto JPG, PNG, atau WebP.');
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error('Ukuran foto maksimal 2 MB per file.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca. Pilih ulang file.'));
    reader.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => { image.src = ''; resolve(); };
    image.onerror = () => reject(new Error('File bukan gambar yang valid atau sudah rusak.'));
    image.src = dataUrl;
  });
  return { name: file.name.slice(0, 150), mimeType: file.type, dataUrl };
}

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('Penyimpanan dokumen tidak didukung browser ini.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Penyimpanan dokumen lokal tidak tersedia. Periksa izin browser.'));
    request.onblocked = () => reject(new Error('Tutup tab ARMS lainnya dan coba lagi.'));
  });
}

export async function storePhoto(upload: PhotoUpload): Promise<string> {
  if (!TYPES.includes(upload.mimeType) || !upload.dataUrl.startsWith(`data:${upload.mimeType};base64,`)) throw new Error('Format foto tidak valid.');
  const encoded = upload.dataUrl.split(',')[1];
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) throw new Error('Ukuran foto maksimal 2 MB.');
  const db = await openStore();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      transaction.objectStore('photos').put(new Blob([bytes], { type: upload.mimeType }), id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Foto gagal disimpan. Penyimpanan browser mungkin penuh.'));
      transaction.onabort = () => reject(new Error('Penyimpanan foto dibatalkan.'));
    });
    return PREFIX + id;
  } finally { db.close(); }
}

export async function getPhotoBlob(reference: string): Promise<Blob> {
  if (!reference.startsWith(PREFIX)) throw new Error('Referensi dokumen lokal tidak valid.');
  const db = await openStore();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const request = db.transaction('photos', 'readonly').objectStore('photos').get(reference.slice(PREFIX.length));
      request.onsuccess = () => request.result instanceof Blob ? resolve(request.result) : reject(new Error('Dokumen tidak ditemukan di perangkat ini. Silakan unggah ulang.'));
      request.onerror = () => reject(new Error('Dokumen tidak dapat dibaca dari penyimpanan lokal.'));
    });
  } finally { db.close(); }
}

export async function removePhoto(reference: string) {
  if (!reference.startsWith(PREFIX)) return;
  const db = await openStore();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').delete(reference.slice(PREFIX.length));
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('Foto lama tidak dapat dihapus.'));
    });
  } finally { db.close(); }
}
export async function clearPhotos() {
  const db = await openStore();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').clear();
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('Penyimpanan foto tidak dapat dibersihkan.'));
    });
  } finally { db.close(); }
}

export async function downloadPhoto(reference: string, name: string) {
  const blob = await getPhotoBlob(reference);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name || 'dokumen-debitur.jpg'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function makeLogo(file: File): Promise<PhotoUpload> {
  const source = await readPhoto(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Logo tidak dapat dibaca.')); image.src = source.dataUrl; });
  const scale = Math.min(1, 320 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  let dataUrl = canvas.toDataURL('image/png');
  if (dataUrl.length > 180000) dataUrl = canvas.toDataURL('image/webp', .8);
  if (dataUrl.length > 180000) throw new Error('Logo terlalu kompleks. Gunakan gambar sederhana maksimal 320 px.');
  return { name: file.name, mimeType: dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/webp', dataUrl };
}

export function blobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Dokumen tidak dapat dibaca.')); reader.readAsDataURL(blob); });
}

export function safePdfName(name: string) {
  const cleaned = String(name || '').replace(/[\\/\x00-\x1f\x7f]/g, '_').trim();
  if (!/\.pdf$/i.test(cleaned)) throw new Error('Nama file harus berakhiran .pdf.');
  return cleaned.slice(0, -4).slice(0, 145) + '.pdf';
}

export async function validatePdfBlob(blob: Blob) {
  if (!blob.size || blob.size > MAX_PDF_BYTES) throw new Error('Ukuran PDF harus lebih dari 0 dan maksimal 5 MB.');
  const header = new TextDecoder().decode(await blob.slice(0, 8).arrayBuffer());
  const tail = new TextDecoder().decode(await blob.slice(Math.max(0, blob.size - 4096)).arrayBuffer());
  if (!/^%PDF-\d\.\d/.test(header) || !tail.includes('%%EOF')) throw new Error('File bukan PDF yang valid atau dokumennya belum lengkap.');
}

export async function readPdf(file: File): Promise<PdfUpload> {
  const name = safePdfName(file.name);
  if (file.type && file.type !== 'application/pdf') throw new Error('Hanya dokumen PDF yang dapat diunggah.');
  await validatePdfBlob(file);
  const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
  return { name, mimeType: 'application/pdf', dataUrl: await blobAsDataUrl(blob), size: blob.size };
}

export async function pdfUploadBlob(upload: PdfUpload): Promise<Blob> {
  safePdfName(upload.name);
  if (upload.mimeType !== 'application/pdf' || typeof upload.dataUrl !== 'string' || upload.dataUrl.length > 7000000 || !/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(upload.dataUrl)) throw new Error('Format unggahan PDF tidak valid.');
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(upload.dataUrl.split(',')[1]), c => c.charCodeAt(0)); }
  catch { throw new Error('Data PDF tidak dapat dibaca. Pilih ulang file.'); }
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  if (Number(upload.size) !== blob.size) throw new Error('Ukuran PDF tidak sesuai. Pilih ulang file.');
  await validatePdfBlob(blob);
  return blob;
}

export async function storePdf(upload: PdfUpload): Promise<string> {
  const blob = await pdfUploadBlob(upload), db = await openStore(), id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('PDF gagal disimpan. Periksa kapasitas penyimpanan browser.'));
      tx.onabort = () => reject(new Error('Penyimpanan PDF dibatalkan.'));
    });
    return PREFIX + id;
  } finally { db.close(); }
}

export async function getPdfBlob(reference: string) {
  const blob = await getPhotoBlob(reference);
  if (blob.type !== 'application/pdf') throw new Error('Dokumen tersimpan bukan PDF.');
  await validatePdfBlob(blob);
  return blob;
}