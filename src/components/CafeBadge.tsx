import type { Cafe } from '../types';

// A cafe's badge: its uploaded image if it has one, otherwise the mystery
// question-mark icon (the old default was a bow emoji). Any custom emoji a
// cafe still carries is preserved.
export function CafeBadge({ cafe, imgClass }: { cafe: Cafe; imgClass: string }) {
  if (cafe.imageUrl) return <img src={cafe.imageUrl} alt="" className={imgClass} />;
  if (cafe.emoji && cafe.emoji !== '🎀') return <>{cafe.emoji}</>;
  return <img src={`${import.meta.env.BASE_URL}icons/mystery.png`} alt="" className="cafe-badge__mystery" />;
}
