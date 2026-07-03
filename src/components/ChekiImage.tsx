import { useEffect, useState } from 'react';
import type { Cheki } from '../types';
import { CHEKI_FALLBACK } from '../data/chekiArt';

// Renders a cheki's storage photo. Falls back to a placeholder if missing.
export function ChekiImage({ cheki, className }: { cheki: Cheki; className?: string }) {
  const [url, setUrl] = useState<string | undefined>(cheki.imageUrl);

  useEffect(() => setUrl(cheki.imageUrl), [cheki.imageUrl]);

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
