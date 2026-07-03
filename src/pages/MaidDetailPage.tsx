import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useMaid, useCafe, useProfile, toggleHighlight } from '../data/hooks';
import { MAX_HIGHLIGHTS } from '../types';
import { MaidCard } from '../components/MaidCard';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import './common.css';

export function MaidDetailPage() {
  const { maidId } = useParams();
  const maid = useMaid(maidId);
  const cafe = useCafe(maid?.cafeId);
  const profile = useProfile();
  const myChekis = useLiveQuery(
    async () => (maidId ? (await db.chekis.where('ownerId').equals('me').toArray()).filter((c) => c.maidIds.includes(maidId)) : []),
    [maidId],
  );

  if (!maid) return <div className="screen"><BackHeader title="Maid" /></div>;
  const highlights = profile?.favouriteMaidIds ?? [];
  const isHighlighted = highlights.includes(maid.id);
  const full = !isHighlighted && highlights.length >= MAX_HIGHLIGHTS;

  return (
    <div className="screen">
      <BackHeader title={maid.name} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <MaidCard maid={maid} cafeName={cafe?.name} highlighted={isHighlighted} />
        <div>
          <p className="body-text" style={{ fontSize: 19, marginTop: 0 }}>{maid.bio}</p>
          <div className="row wrap" style={{ marginBottom: 10 }}>
            <span className="chip purple">{maid.specialty}</span>
            {cafe && <span className="chip blue">{cafe.name}</span>}
          </div>
          <button
            className={`btn ${isHighlighted ? 'pink' : 'ghost'}`}
            style={{ width: '100%', opacity: full ? 0.5 : 1 }}
            disabled={full}
            onClick={() => toggleHighlight(maid.id)}
          >
            {isHighlighted ? '★ HIGHLIGHTED' : full ? 'HIGHLIGHTS FULL' : 'HIGHLIGHT'}
          </button>
        </div>
      </div>

      <div className="section-label">MY CHEKIS OF {maid.name.toUpperCase()}</div>
      {myChekis && myChekis.length === 0 && (
        <div className="empty pixel-box">None yet. Go collect one!</div>
      )}
      <ChekiGrid chekis={(myChekis ?? []) as never} />
    </div>
  );
}
