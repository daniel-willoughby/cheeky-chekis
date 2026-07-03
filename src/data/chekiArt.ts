// Generates a polaroid-style pixel cheki as an SVG data URI.
// Used for seed chekis and as a fallback when a real photo is not uploaded.

const BG_PAIRS: Record<string, [string, string]> = {
  blue: ['#5b8def', '#3a5fc4'],
  pink: ['#ff8fc7', '#e85fa6'],
  purple: ['#9b6cff', '#6f42d9'],
  mint: ['#5fd0a0', '#33a97c'],
  gold: ['#ffd35b', '#e0ab2a'],
};

export function chekiArt(
  emoji: string,
  colorKey: keyof typeof BG_PAIRS = 'pink',
  caption = '',
): string {
  const [c1, c2] = BG_PAIRS[colorKey] ?? BG_PAIRS.pink;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='260' viewBox='0 0 200 260' shape-rendering='crispEdges'>
    <rect width='200' height='260' fill='#fdf6ff'/>
    <rect x='8' y='8' width='184' height='4' fill='#241b3a'/>
    <rect x='8' y='248' width='184' height='4' fill='#241b3a'/>
    <rect x='16' y='16' width='168' height='168' fill='${c1}'/>
    <rect x='16' y='16' width='168' height='168' fill='none' stroke='#241b3a' stroke-width='4'/>
    <rect x='16' y='120' width='168' height='64' fill='${c2}'/>
    <circle cx='100' cy='96' r='34' fill='#241b3a' opacity='0.12'/>
    <text x='100' y='112' font-size='64' text-anchor='middle'>${emoji}</text>
    <text x='100' y='222' font-family='monospace' font-size='16' fill='#241b3a' text-anchor='middle'>${caption}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Real decorated cheki photos, dropped into public/chekis/ by the user.
// Seed data cycles through these; falls back to placeholder.svg if missing.
const base = import.meta.env.BASE_URL;

export const REAL_CHEKIS = [
  `${base}chekis/cheki-01.jpg`,
  `${base}chekis/cheki-02.jpg`,
  `${base}chekis/cheki-03.jpg`,
  `${base}chekis/cheki-04.jpg`,
];

export const CHEKI_FALLBACK = `${base}chekis/placeholder.svg`;

export const colorKeyForMaid = (accent: string): keyof typeof BG_PAIRS => {
  if (accent.includes('8def')) return 'blue';
  if (accent.includes('6cff') || accent.includes('42d9')) return 'purple';
  if (accent.includes('d0a0')) return 'mint';
  if (accent.includes('d35b')) return 'gold';
  return 'pink';
};
