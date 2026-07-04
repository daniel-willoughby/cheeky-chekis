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
  { id: 'pastel-pink', name: 'Pastel Pink', price: 25, blurb: 'Soft solid pink.' },
  { id: 'pastel-blue', name: 'Pastel Blue', price: 25, blurb: 'Soft solid blue.' },
  { id: 'lilac', name: 'Lilac', price: 25, blurb: 'Soft solid lilac.' },
  { id: 'gingham', name: 'Gingham', price: 50, blurb: 'Cosy blue picnic check.', image: 'binders/gingham.png' },
  { id: 'crush', name: 'Make My Heart Go', price: 50, blurb: 'Little lilac hearts.', image: 'binders/crush.png' },
  { id: 'cheki-secret', name: 'Cheki Secret', price: 50, blurb: 'Rose pink candy stripes.', image: 'binders/cheki-secret.png' },
  { id: 'cross', name: 'Crosses', price: 50, blurb: 'Monochrome crosses.', image: 'binders/cross.png' },
  { id: 'matcha-bunny', name: 'Bunny Matcha', price: 100, blurb: 'Bunnies on matcha green.', image: 'binders/matcha-bunny.png' },
  { id: 'skull', name: 'Skulls', price: 100, blurb: 'Little skulls on deep purple.', image: 'binders/skull.png' },
  { id: 'lemonade', name: 'Make Lemonade', price: 100, blurb: 'Lemons and oranges.', image: 'binders/lemonade.png' },
  { id: 'butterfly', name: 'Butterfly', price: 100, blurb: 'Pink butterflies on blue.', image: 'binders/butterfly.png' },
  { id: 'cloud', name: 'Cloud', price: 60, blurb: 'Fluffy clouds on sky blue.', image: 'binders/cloud.png' },
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
  // These are single pre-made pattern canvases, not small tileable units —
  // scale each one to fill the swatch instead of repeating it (repeating
  // squished the whole canvas into a tiny tile and the seams looked awful).
  return {
    backgroundImage: `url(${base}${image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

// UTC day string, matches the daily-ladder convention.
export const utcDay = (d = new Date()): string => d.toISOString().slice(0, 10);
