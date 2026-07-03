import { useState } from 'react';
import { useForSaleChekis, useMaids, useFriends, formatKRW } from '../data/hooks';
import { ChekiCard } from '../components/ChekiCard';
import { ChekiSheet } from '../components/ChekiSheet';
import { CHEKI_TYPES } from '../data/chekiMeta';
import type { Cheki, Maid, ChekiType } from '../types';
import './common.css';

const FILTERS: (ChekiType | 'all')[] = ['all', ...CHEKI_TYPES];

export function SalesPage() {
  const forSale = useForSaleChekis();
  const maids = useMaids();
  const friends = useFriends();
  const [filter, setFilter] = useState<ChekiType | 'all'>('all');
  const [open, setOpen] = useState<Cheki | null>(null);

  const maidMap = new Map((maids ?? []).map((m) => [m.id, m]));
  const maidsFor = (c: Cheki): Maid[] => c.maidIds.map((id) => maidMap.get(id)).filter(Boolean) as Maid[];
  const sellerName = (ownerId: string) =>
    ownerId === 'me' ? 'You' : friends?.find((f) => f.id === ownerId)?.name ?? 'Friend';

  const items = (forSale ?? []).filter((c) => filter === 'all' || c.type === filter);
  const total = items.reduce((s, c) => s + (c.price ?? 0), 0);

  return (
    <div className="screen">
      <h1 className="screen-title">For Sale Market</h1>
      <p className="body-text" style={{ fontSize: 18, marginTop: -6 }}>
        The shared binder everyone sells from.
      </p>

      <div className="scroll-x" style={{ marginTop: 8 }}>
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? 'purple' : ''}`} onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', margin: '12px 0' }}>
        <span className="chip blue">{items.length} LISTED</span>
        <span className="chip gold">TOTAL {formatKRW(total)}</span>
      </div>

      {items.length === 0 && <div className="empty pixel-box">Nothing for sale here yet.</div>}
      <div className="cheki-grid">
        {items.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ChekiCard cheki={c} maids={maidsFor(c)} onClick={() => setOpen(c)} />
            <span className="chip pink" style={{ alignSelf: 'flex-start' }}>@{sellerName(c.ownerId)}</span>
          </div>
        ))}
      </div>

      {open && (
        <ChekiSheet
          cheki={open}
          maids={maidsFor(open)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
