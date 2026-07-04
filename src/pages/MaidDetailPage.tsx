import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMaid, useCafe, useProfile, useMyChekis, toggleHighlight, updateMaid, setMaidImage } from '../data/hooks';
import { useAuth } from '../data/auth';
import { MAX_HIGHLIGHTS } from '../types';
import { MaidCard } from '../components/MaidCard';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import { ImageUploadButton } from '../components/ImageUploadButton';
import './common.css';

export function MaidDetailPage() {
  const { maidId } = useParams();
  const { userId } = useAuth();
  const maid = useMaid(maidId);
  const cafe = useCafe(maid?.cafeId);
  const profile = useProfile();
  const allMyChekis = useMyChekis();
  const myChekis = maidId ? (allMyChekis ?? []).filter((c) => c.maidIds.includes(maidId)) : [];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', specialty: '', bio: '' });

  if (!maid) return <div className="screen"><BackHeader title="Maid" /></div>;
  const highlights = profile?.favouriteMaidIds ?? [];
  const isHighlighted = highlights.includes(maid.id);
  const full = !isHighlighted && highlights.length >= MAX_HIGHLIGHTS;

  function startEdit() {
    if (!maid) return;
    setDraft({ name: maid.name, specialty: maid.specialty, bio: maid.bio });
    setEditing(true);
  }
  async function save() {
    if (!maidId) return;
    await updateMaid(maidId, { name: draft.name.trim(), specialty: draft.specialty.trim(), bio: draft.bio.trim() });
    setEditing(false);
  }

  return (
    <div className="screen">
      <BackHeader title={maid.name} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <MaidCard maid={maid} cafeName={cafe?.name} highlighted={isHighlighted} />
        <div>
          {editing ? (
            <>
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" />
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} placeholder="Specialty" />
              <textarea className="pixel-select" style={{ width: '100%', marginBottom: 8 }} rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Bio" />
              <div className="row" style={{ marginBottom: 8 }}>
                <ImageUploadButton folder={`maids/${maidId}`} label="MAID PHOTO" onUploaded={(path) => { if (maidId) return setMaidImage(maidId, path); }} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>DONE</button>
                <button className="btn" style={{ flex: 1 }} onClick={save}>SAVE</button>
              </div>
            </>
          ) : (
            <>
              <p className="body-text" style={{ fontSize: 19, marginTop: 0 }}>{maid.bio}</p>
              <div className="row wrap" style={{ marginBottom: 10 }}>
                <span className="chip purple">{maid.specialty}</span>
                {cafe && <span className="chip blue">{cafe.name}</span>}
              </div>
              <button
                className={`btn ${isHighlighted ? 'pink' : 'ghost'}`}
                style={{ width: '100%', opacity: full ? 0.5 : 1, marginBottom: 8 }}
                disabled={full || !userId}
                onClick={() => userId && toggleHighlight(userId, maid.id)}
              >
                {isHighlighted ? '★ HIGHLIGHTED' : full ? 'HIGHLIGHTS FULL' : 'HIGHLIGHT'}
              </button>
              <button className="chip purple" onClick={startEdit}>EDIT MAID</button>
            </>
          )}
        </div>
      </div>

      <div className="section-label">MY CHEKIS OF {maid.name.toUpperCase()}</div>
      {myChekis.length === 0 && (
        <div className="empty pixel-box">None yet. Go collect one!</div>
      )}
      <ChekiGrid chekis={myChekis} />
    </div>
  );
}
