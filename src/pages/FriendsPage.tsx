import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useShares,
  useFriends,
  useChekisByIds,
  markSharesSeen,
} from '../data/hooks';
import { ChekiGrid } from '../components/ChekiGrid';
import './common.css';
import './FriendsPage.css';

export function FriendsPage() {
  const navigate = useNavigate();
  const shares = useShares();
  const friends = useFriends();

  useEffect(() => {
    markSharesSeen();
  }, [shares?.length]);

  const friendMap = new Map((friends ?? []).map((f) => [f.id, f]));

  return (
    <div className="screen">
      <h1 className="screen-title">Friends</h1>

      <div className="scroll-x">
        {(friends ?? []).map((f) => (
          <button
            key={f.id}
            className="friend-chip pixel-box"
            style={{ ['--accent' as string]: f.color }}
            onClick={() => navigate(`/friends/${f.id}`)}
          >
            <span className="friend-chip__emoji">{f.emoji}</span>
            <span className="friend-chip__name">{f.name}</span>
          </button>
        ))}
      </div>

      <div className="section-label">RECENT UPLOADS</div>
      {shares && shares.length === 0 && <div className="empty pixel-box">No activity yet.</div>}

      <div style={{ display: 'grid', gap: 14 }}>
        {(shares ?? []).map((s) => {
          const friend = friendMap.get(s.fromFriendId);
          return (
            <div key={s.id} className="share-card pixel-box" style={{ ['--accent' as string]: friend?.color }}>
              <button className="share-card__head" onClick={() => navigate(`/friends/${s.fromFriendId}`)}>
                <span className="share-card__avatar">{friend?.emoji}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="share-card__name">{friend?.name} uploaded {s.chekiIds.length}</div>
                  {s.message && <div className="body-text share-card__msg">{s.message}</div>}
                </div>
                {!s.seen && <span className="chip purple">NEW</span>}
              </button>
              <SharePreview chekiIds={s.chekiIds} />
              <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate(`/friends/${s.fromFriendId}`)}>
                VIEW {friend?.name?.toUpperCase()}'S PROFILE
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SharePreview({ chekiIds }: { chekiIds: string[] }) {
  const chekis = useChekisByIds(chekiIds);
  return <div style={{ marginTop: 10 }}><ChekiGrid chekis={chekis ?? []} /></div>;
}
