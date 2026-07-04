import { useState } from 'react';
import type { Cheki, Maid } from '../types';
import { ChekiCard } from './ChekiCard';
import { ChekiSheet } from './ChekiSheet';
import { useMaids, useCafes, useChekiLikes, toggleChekiLike } from '../data/hooks';
import { useAuth } from '../data/auth';

export function ChekiGrid({ chekis }: { chekis: Cheki[] }) {
  const { userId } = useAuth();
  const maids = useMaids();
  const cafes = useCafes();
  const likes = useChekiLikes(chekis.map((c) => c.id));
  const [open, setOpen] = useState<Cheki | null>(null);

  const maidMap = new Map((maids ?? []).map((m) => [m.id, m]));
  const cafeMap = new Map((cafes ?? []).map((c) => [c.id, c]));
  const maidsFor = (c: Cheki): Maid[] =>
    c.maidIds.map((id) => maidMap.get(id)).filter(Boolean) as Maid[];

  return (
    <>
      <div className="cheki-grid">
        {chekis.map((c) => {
          const liked = !!(userId && likes?.likedBy.get(c.id)?.has(userId));
          return (
            <ChekiCard
              key={c.id}
              cheki={c}
              maids={maidsFor(c)}
              onClick={() => setOpen(c)}
              likeCount={likes?.counts.get(c.id) ?? 0}
              liked={liked}
              onToggleLike={userId ? () => toggleChekiLike(c.id, userId, liked) : undefined}
            />
          );
        })}
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
