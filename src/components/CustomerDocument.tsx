import { useState } from 'react';
import { Download } from 'lucide-react';
import { gasCall, isGoogleConnected } from '../lib/api';
import { downloadPhoto } from '../lib/documents';
import { useArms } from '../lib/context';
import type { Customer, PhotoUpload } from '../lib/data';
import { Spinner } from './ui';

export function CustomerDocument({ customer, kind }: { customer: Customer; kind: 'ktp' | 'stnk' }) {
  const { notify } = useArms();
  const [loading, setLoading] = useState(false);
  const reference = customer[`${kind}Photo`];
  if (!reference) return <span className="muted">Belum diunggah</span>;
  async function download() {
    if (loading) return; setLoading(true);
    try {
      if (isGoogleConnected()) {
        const photo = await gasCall<PhotoUpload>('getCustomerDocument', customer.id, kind);
        const response = await fetch(photo.dataUrl);
        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = photo.name; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else await downloadPhoto(reference!, customer[`${kind}PhotoName`] || `${kind.toUpperCase()}.jpg`);
    } catch (error) { notify((error as Error).message, 'error'); } finally { setLoading(false); }
  }
  return <button type="button" className="text-button document-download" onClick={download} disabled={loading}>{loading ? <Spinner size={13}/> : <Download size={13}/>}<span>{loading ? 'Mengambil foto...' : customer[`${kind}PhotoName`] || `Unduh ${kind.toUpperCase()}`}</span></button>;
}