import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useProfile,
  useMyChekis,
  useMyBinders,
  useBinderChekiCounts,
  useMaids,
  updateProfile,
} from '../data/hooks';
import { useAuth } from '../data/auth';
import { MAX_HIGHLIGHTS } from '../types';
import { MaidCard } from '../components/MaidCard';
import { ChekiGrid } from '../components/ChekiGrid';
import { BinderCard } from '../components/BinderCard';
import './common.css';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { userId, signOut } = useAuth();
  const profile = useProfile();
  const chekis = useMyChekis();
  const binders = useMyBinders();
  const binderCounts = useBinderChekiCounts(userId ?? undefined);
  const maids = useMaids();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');

  const maidMap = new Map((maids ?? []).map((m) => [m.id, m]));
  const highlights = (profile?.favouriteMaidIds ?? [])
    .map((id) => maidMap.get(id))
    .filter(Boolean);
  const onHand = (chekis ?? []).filter((c) => c.status === 'on-hand').length;
  const onWay = (chekis ?? []).filter((c) => c.status === 'on-the-way').length;

  function startEdit() {
    setNameDraft(profile?.name ?? '');
    setBioDraft(profile?.bio ?? '');
    setEditing(true);
  }
  async function saveEdit() {
    if (!userId) return;
    await updateProfile(userId, { name: nameDraft.trim() || profile?.name, bio: bioDraft.trim() });
    setEditing(false);
  }

  return (
    <div className="screen">
      <div className="profile-hero pixel-box">
        <div className="profile-hero__avatar">{profile?.emoji ?? '🎮'}</div>
        <div className="profile-hero__info">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h1 className="profile-hero__name">{profile?.name ?? 'You'}</h1>
            <button className="chip purple" onClick={startEdit}>EDIT</button>
          </div>
          {editing ? (
            <div style={{ marginTop: 6 }}>
              <input
                className="pixel-select"
                style={{ width: '100%', marginBottom: 8 }}
                maxLength={30}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Display name"
              />
              <textarea
                className="pixel-select"
                rows={2}
                maxLength={90}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Your bio"
              />
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>CANCEL</button>
                <button className="btn" style={{ flex: 1 }} onClick={saveEdit}>SAVE</button>
              </div>
            </div>
          ) : (
            <>
              <p className="body-text" style={{ margin: '0 0 2px', opacity: 0.7 }}>@{profile?.username}</p>
              <p className="body-text profile-hero__bio">{profile?.bio}</p>
            </>
          )}
          <div className="row wrap" style={{ marginTop: 6 }}>
            <button className="chip gold" onClick={() => navigate('/shop')}>★ {profile?.points ?? 0} PTS</button>
            <span className="chip good">{onHand} ON HAND</span>
            {onWay > 0 && <span className="chip blue">{onWay} ON THE WAY</span>}
          </div>
        </div>
      </div>

      <div className="section-label">HIGHLIGHTED MAIDS ({highlights.length}/{MAX_HIGHLIGHTS})</div>
      {highlights.length === 0 ? (
        <div className="empty pixel-box">Pick up to 3 from any maid profile.</div>
      ) : (
        <div className="hl-grid">
          {highlights.map((m) => (
            <MaidCard key={m!.id} maid={m!} compact highlighted onClick={() => navigate(`/maids/${m!.id}`)} />
          ))}
        </div>
      )}

      <div className="section-label">MY BINDERS</div>
      <div className="card-grid">
        {(binders ?? []).map((b) => (
          <BinderCard key={b.id} binder={b} count={binderCounts?.get(b.id)} onClick={() => navigate(`/binder/${b.id}`)} />
        ))}
      </div>
      <button className="btn pink" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/shop')}>
        BINDER SHOP
      </button>

      <div className="section-label">MY CHEKIS ({chekis?.length ?? 0})</div>
      {chekis && chekis.length === 0 && (
        <div className="empty pixel-box">No chekis yet. Tap Upload to add one.</div>
      )}
      <ChekiGrid chekis={chekis ?? []} />

      <button className="btn ghost" style={{ marginTop: 22, width: '100%' }} onClick={() => navigate('/dictionary')}>
        CHEKI DICTIONARY
      </button>
      <button className="btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={signOut}>
        SIGN OUT
      </button>
    </div>
  );
}
