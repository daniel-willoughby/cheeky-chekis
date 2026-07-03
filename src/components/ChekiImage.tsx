import { useEffect, useState } from 'react';
import type { Cheki } from '../types';
import { CHEKI_FALLBACK } from '../data/chekiArt';

// Renders a cheki photo: object URL for uploaded blobs, else the seed image URL.
// Falls back to a placeholder if the file is missing.
export function ChekiImage({ cheki, className }: { cheki: Cheki; className?: string }) {
  const [url, setUrl] = useState<string | undefined>(cheki.imageUrl);

  useEffect(() => {
    if (cheki.image instanceof Blob) {
      const obj = URL.createObjectURL(cheki.image);
      setUrl(obj);
      return () => URL.revokeObjectURL(obj);
    }
    setUrl(cheki.imageUrl);
  }, [cheki.image, cheki.imageUrl]);

  return (
    <img
      src={url}
      alt={cheki.type}
      className={className}
      onError={() => { if (url !== CHEKI_FALLBACK) setUrl(CHEKI_FALLBACK); }}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
