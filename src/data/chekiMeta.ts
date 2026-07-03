import type { Maid, ChekiType } from '../types';

// Chip colour per cheki type. Keeps the palette to pink/purple/blue (+ gold/mint accents).
export const TYPE_CLASS: Record<ChekiType, string> = {
  pin: 'gold',
  normal: 'blue',
  '4-cut': 'purple',
  homework: 'pink',
  twin: 'good',
  group: 'purple',
  grid: 'blue',
};

export const CHEKI_TYPES: ChekiType[] = ['pin', 'normal', '4-cut', 'homework', 'twin', 'group', 'grid'];

// Display name for one or more maids on a cheki.
export function maidNames(maids?: Maid[]): string {
  if (!maids || maids.length === 0) return 'Unknown';
  if (maids.length === 1) return maids[0].name;
  if (maids.length === 2) return `${maids[0].name} + ${maids[1].name}`;
  return `${maids[0].name} +${maids.length - 1}`;
}
