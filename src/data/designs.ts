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
  { id: 'pastel-pink', name: 'Pastel Pink', price: 25, blurb: 'Solid colour background.' },
  { id: 'pastel-blue', name: 'Pastel Blue', price: 25, blurb: 'Solid colour background.' },
  { id: 'lilac', name: 'Lilac', price: 25, blurb: 'Solid colour background.' },
  { id: 'gingham', name: 'Picnic Core', price: 50, blurb: 'Blue gingham pattern.', image: 'binders/gingham.png' },
  { id: 'crush', name: 'Make My Heart Go', price: 50, blurb: 'Lilac hearts on lilac.', image: 'binders/crush.png' },
  { id: 'cheki-secret', name: 'Cheki Secret', price: 50, blurb: "Inspired by Victoria's.", image: 'binders/cheki-secret.png' },
  { id: 'cross', name: 'Cross My Heart', price: 50, blurb: 'Cross shapes over black.', image: 'binders/cross.png' },
  { id: 'matcha-bunny', name: 'Bunny Matcha', price: 100, blurb: 'Famed bunny over green.', image: 'binders/matcha-bunny.png' },
  { id: 'skull', name: 'Cute but Deadly', price: 100, blurb: 'Skull designs on purple.', image: 'binders/skull.png' },
  { id: 'lemonade', name: 'Make Lemonade', price: 100, blurb: 'Summery lemons and oranges.', image: 'binders/lemonade.png' },
  { id: 'butterfly', name: 'Give Me Butterflies', price: 100, blurb: 'Pinky butterflies on a pastel blue.', image: 'binders/butterfly.png' },
  { id: 'cloud', name: 'Cloud 9', price: 60, blurb: 'Cute clouds on a blue sky.', image: 'binders/cloud.png' },
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
