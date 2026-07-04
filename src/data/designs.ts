import type { CSSProperties } from 'react';
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
  image?: string;     // path under public/ for pattern-art designs, else CSS gradient
}

export const DESIGNS: DesignInfo[] = [
  { id: 'classic', name: 'Classic', price: 0, blurb: 'The default album.' },
  { id: 'sakura', name: 'Sakura', price: 50, blurb: 'Soft petal stripes.' },
  { id: 'candy', name: 'Candy Pop', price: 80, blurb: 'Sweet gold layers.' },
  { id: 'arcade', name: 'Arcade', price: 120, blurb: 'Blue and purple scanlines.' },
  { id: 'midnight', name: 'Midnight', price: 150, blurb: 'Deep dusk gradient.' },
  { id: 'gingham', name: 'Gingham', price: 60, blurb: 'Cosy blue picnic check.', image: 'binders/gingham.png' },
  { id: 'cloud', name: 'Cloud', price: 60, blurb: 'Fluffy clouds on sky blue.', image: 'binders/cloud.png' },
  { id: 'crush', name: 'Crush', price: 70, blurb: 'Little lilac hearts.', image: 'binders/crush.png' },
  { id: 'butterfly', name: 'Butterfly', price: 90, blurb: 'Pink butterflies on blue.', image: 'binders/butterfly.png' },
  { id: 'matcha-bunny', name: 'Matcha Bunny', price: 90, blurb: 'Bunnies on matcha green.', image: 'binders/matcha-bunny.png' },
  { id: 'lemonade', name: 'Make Lemonade', price: 100, blurb: 'Lemons and oranges.', image: 'binders/lemonade.png' },
  { id: 'cheki-secret', name: 'Cheki Secret', price: 110, blurb: 'Rose pink candy stripes.', image: 'binders/cheki-secret.png' },
  { id: 'cross', name: 'Cross', price: 130, blurb: 'Monochrome crosses.', image: 'binders/cross.png' },
  { id: 'skull', name: 'Skull', price: 130, blurb: 'Little skulls on deep purple.', image: 'binders/skull.png' },
];

export const STARTER_DESIGNS: BinderDesign[] = DESIGNS.filter((d) => d.price === 0).map((d) => d.id);

export const designPrice = (id: BinderDesign): number =>
  DESIGNS.find((d) => d.id === id)?.price ?? 0;

export const designImage = (id: BinderDesign): string | undefined =>
  DESIGNS.find((d) => d.id === id)?.image;

export function binderSwatchStyle(id: BinderDesign): CSSProperties | undefined {
  const image = designImage(id);
  if (!image) return undefined;
  const base = import.meta.env.BASE_URL;
  return { backgroundImage: `url(${base}${image})`, backgroundSize: '48px 48px' };
}

// UTC day string, matches the daily-ladder convention.
export const utcDay = (d = new Date()): string => d.toISOString().slice(0, 10);
