import type { BinderDesign } from '../types';

// Point rewards. Tweak here to rebalance the economy.
export const POINTS = {
  upload: 5,
  sold: 10,
  dailyLogin: 2,
} as const;

export interface DesignInfo {
  id: BinderDesign;
  name: string;
  price: number;      // Cheki Points, 0 = starter (owned by default)
  blurb: string;
}

// Placeholder catalog. Real art drops in later against these ids.
export const DESIGNS: DesignInfo[] = [
  { id: 'classic', name: 'Classic', price: 0, blurb: 'The default album.' },
  { id: 'sakura', name: 'Sakura', price: 50, blurb: 'Soft petal stripes.' },
  { id: 'candy', name: 'Candy Pop', price: 80, blurb: 'Sweet gold layers.' },
  { id: 'arcade', name: 'Arcade', price: 120, blurb: 'Blue and purple scanlines.' },
  { id: 'midnight', name: 'Midnight', price: 150, blurb: 'Deep dusk gradient.' },
];

export const STARTER_DESIGNS: BinderDesign[] = DESIGNS.filter((d) => d.price === 0).map((d) => d.id);

export const designPrice = (id: BinderDesign): number =>
  DESIGNS.find((d) => d.id === id)?.price ?? 0;

// UTC day string, matches the daily-ladder convention.
export const utcDay = (d = new Date()): string => d.toISOString().slice(0, 10);
