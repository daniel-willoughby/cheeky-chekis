import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFriends,
  useFriendActivity,
  useIncomingRequests,
  useOutgoingRequestIds,
  searchProfiles,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  markFriendsSeen,
} from '../data/hooks';
import { useAuth } from '../data/auth';
import { ChekiGrid } from '../components/ChekiGrid';
import type { PublicProfile } from '../types';
import './common.css';
import './FriendsPage.css';

export function FriendsPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const friends = useFriends();
  const activity = useFriendActivity();
  const incoming = useIncomingRequests();
  const outgoingIds = useOutgoingRequestIds();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (userId) markFriendsSeen(userId);
  }, [userId, activity?.length]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !query.trim()) return;
    setSearching(true);
    const r = await searchProfiles(query, userId);
    setResults(r);
    setSearching(false);
  }

  const friendIds = new Set((friends ?? []).map((f) => f.id));

  return (
    <div className="screen">
      <h1 className="screen-title">Friends</h1>

      <form onSubmit={search} className="row" style={{ gap: 8 }}>
        <input
          className="pixel-select"
          style={{ flex: 1 }}
          placeholder="Search by username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" disabled={searching}>ADD</button>
      </form>
      {results.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {results.map((r) => {
            const already = friendIds.has(r.id) || outgoingIds?.has(r.id);
            return (
              <div key={r.id} className="row search-result pixel-box" style={{ padding: 10, justifyContent: 'space-between' }}>
                <span className="body-text">{r.emoji} @{r.username}</span>
                <button
                  className={`chip ${already ? '' : 'purple'}`}
                  disabled={already}
                  onClick={() => userId && sendFriendRequest(userId, r.id).then(() => setResults([]))}
                >
                  {already ? 'PENDING' : 'ADD'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {incoming && incoming.length > 0 && (
        <>
          <div className="section-label">FRIEND REQUESTS</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {incoming.map((req) => (
              <div key={req.id} className="row search-result pixel-box" style={{ padding: 10, justifyContent: 'space-between' }}>
                <span className="body-text">{req.from.emoji} @{req.from.username}</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="chip purple" onClick={() => acceptFriendRequest(req.id)}>ACCEPT</button>
                  <button className="chip" onClick={() => removeFriendship(req.id)}>DECLINE</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">MY FRIENDS</div>
      {friends && friends.length === 0 && <div className="empty pixel-box">No friends yet. Search above to add one.</div>}
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
      {activity && activity.length === 0 && <div className="empty pixel-box">No activity yet.</div>}

      <div style={{ display: 'grid', gap: 14 }}>
        {(activity ?? []).map((a) => (
          <div key={a.friend.id} className="share-card pixel-box" style={{ ['--accent' as string]: a.friend.color }}>
            <button className="share-card__head" onClick={() => navigate(`/friends/${a.friend.id}`)}>
              <span className="share-card__avatar">{a.friend.emoji}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="share-card__name">{a.friend.name} · {a.chekis.length} chekis</div>
              </div>
            </button>
            <div style={{ marginTop: 10 }}>
              <ChekiGrid chekis={a.chekis.slice(0, 6)} />
            </div>
            <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate(`/friends/${a.friend.id}`)}>
              VIEW {a.friend.name?.toUpperCase()}'S PROFILE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
