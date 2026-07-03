import { useState } from 'react';
import type { Cheki, Maid } from '../types';
import { ChekiCard } from './ChekiCard';
import { ChekiSheet } from './ChekiSheet';
import { useMaids, useCafes } from '../data/hooks';

export function ChekiGrid({ chekis }: { chekis: Cheki[] }) {
  const maids = useMaids();
  const cafes = useCafes();
  const [open, setOpen] = useState<Cheki | null>(null);

  const maidMap = new Map((maids ?? []).map((m) => [m.id, m]));
  const cafeMap = new Map((cafes ?? []).map((c) => [c.id, c]));
  const maidsFor = (c: Cheki): Maid[] =>
    c.maidIds.map((id) => maidMap.get(id)).filter(Boolean) as Maid[];

  return (
    <>
      <div className="cheki-grid">
        {chekis.map((c) => (
          <ChekiCard key={c.id} cheki={c} maids={maidsFor(c)} onClick={() => setOpen(c)} />
        ))}
      </div>
      {open && (
        <ChekiSheet
          cheki={open}
          maids={maidsFor(open)}
          cafe={open.cafeId ? cafeMap.get(open.cafeId) : undefined}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
