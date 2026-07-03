import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useFriend,
  useChekisByOwner,
  useBindersByOwner,
  useMaids,
  useCafes,
} from '../data/hooks';
import { CHEKI_TYPES } from '../data/chekiMeta';
import { BackHeader } from '../components/BackHeader';
import { BinderCard } from '../components/BinderCard';
import { ChekiGrid } from '../components/ChekiGrid';
import type { ChekiType } from '../types';
import './common.css';
import './FriendProfilePage.css';

export function FriendProfilePage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const friend = useFriend(friendId);
  const chekis = useChekisByOwner(friendId);
  const binders = useBindersByOwner(friendId);
  const maids = useMaids();
  const cafes = useCafes();

  const [type, setType] = useState<ChekiType | 'all'>('all');
  const [maidId, setMaidId] = useState('');
  const [cafeId, setCafeId] = useState('');

  // only maids/cafes that appear in this friend's collection
  const ownMaidIds = new Set((chekis ?? []).flatMap((c) => c.maidIds));
  const ownCafeIds = new Set((chekis ?? []).map((c) => c.cafeId).filter(Boolean));
  const maidOptions = (maids ?? []).filter((m) => ownMaidIds.has(m.id));
  const cafeOptions = (cafes ?? []).filter((c) => ownCafeIds.has(c.id));

  const filtered = useMemo(
    () =>
      (chekis ?? []).filter(
        (c) =>
          (type === 'all' || c.type === type) &&
          (!maidId || c.maidIds.includes(maidId)) &&
          (!cafeId || c.cafeId === cafeId),
      ),
    [chekis, type, maidId, cafeId],
  );

  if (!friend) return <div className="screen"><BackHeader title="Friend" /></div>;

  return (
    <div className="screen">
      <BackHeader title={friend.name} />

      <div className="friend-hero pixel-box" style={{ ['--accent' as string]: friend.color }}>
        <div className="friend-hero__avatar">{friend.emoji}</div>
        <div>
          <div className="friend-hero__name">{friend.name}</div>
          {friend.bio && <p className="body-text friend-hero__bio">{friend.bio}</p>}
          <span className="chip blue">{chekis?.length ?? 0} CHEKIS</span>
        </div>
      </div>

      <div className="section-label">THEIR BINDERS</div>
      {binders && binders.length === 0 && <div className="empty pixel-box">No binders.</div>}
      <div className="card-grid">
        {(binders ?? []).map((b) => (
          <BinderCard key={b.id} binder={b} onClick={() => navigate(`/binder/${b.id}`)} />
        ))}
      </div>

      <div className="section-label">ALL CHEKIS</div>
      <div className="scroll-x">
        {(['all', ...CHEKI_TYPES] as (ChekiType | 'all')[]).map((t) => (
          <button key={t} className={`chip ${type === t ? 'purple' : ''}`} onClick={() => setType(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <select className="pixel-select" value={maidId} onChange={(e) => setMaidId(e.target.value)}>
          <option value="">All maids</option>
          {maidOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="pixel-select" value={cafeId} onChange={(e) => setCafeId(e.target.value)}>
          <option value="">All cafes</option>
          {cafeOptions.map((c) => <option key={c!.id} value={c!.id}>{c!.name}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        {filtered.length === 0 ? (
          <div className="empty pixel-box">No chekis match.</div>
        ) : (
          <ChekiGrid chekis={filtered} />
        )}
      </div>
    </div>
  );
}
