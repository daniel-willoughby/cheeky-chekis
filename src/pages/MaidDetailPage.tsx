import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMaid, useCafe, useProfile, useMyChekis, toggleHighlight, updateMaid, setMaidImage, deleteMaid } from '../data/hooks';
import { useAuth } from '../data/auth';
import { MAX_HIGHLIGHTS } from '../types';
import { MaidCard } from '../components/MaidCard';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import { ImageUploadButton } from '../components/ImageUploadButton';
import './common.css';

export function MaidDetailPage() {
  const { maidId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const maid = useMaid(maidId);
  const cafe = useCafe(maid?.cafeId);
  const profile = useProfile();
  const allMyChekis = useMyChekis();
  const myChekis = maidId ? (allMyChekis ?? []).filter((c) => c.maidIds.includes(maidId)) : [];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', bio: '', graduated: false });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!maid) return <div className="screen"><BackHeader title="Maid" /></div>;
  const highlights = profile?.favouriteMaidIds ?? [];
  const isHighlighted = highlights.includes(maid.id);
  const full = !isHighlighted && highlights.length >= MAX_HIGHLIGHTS;

  function startEdit() {
    if (!maid) return;
    setDraft({ name: maid.name, bio: maid.bio, graduated: maid.graduated });
    setEditing(true);
  }
  async function save() {
    if (!maidId) return;
    await updateMaid(maidId, {
      name: draft.name.trim(),
      bio: draft.bio.trim(),
      graduated: draft.graduated,
    });
    setEditing(false);
  }
  async function remove() {
    if (!maidId) return;
    setDeleting(true);
    try {
      await deleteMaid(maidId);
      navigate(cafe ? `/cafes/${cafe.id}` : '/cafes');
    } catch {
      setDeleting(false);
      setConfirmDelete(false); // error toast already shown
    }
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
              <textarea className="pixel-select" style={{ width: '100%', marginBottom: 8 }} rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Bio" />
              <div className="row" style={{ marginBottom: 8 }}>
                <ImageUploadButton folder={`maids/${maidId}`} label="MAID PHOTO" onUploaded={(path) => { if (maidId) return setMaidImage(maidId, path); }} />
              </div>
              <button
                className={`chip ${draft.graduated ? 'gold' : ''}`}
                style={{ marginBottom: 8 }}
                onClick={() => setDraft({ ...draft, graduated: !draft.graduated })}
              >
                {draft.graduated ? '🎓 GRADUATED' : 'MARK AS GRADUATED'}
              </button>
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>DONE</button>
                <button className="btn" style={{ flex: 1 }} onClick={save}>SAVE</button>
              </div>
              {confirmDelete ? (
                <div className="row" style={{ gap: 8 }}>
                  <span className="body-text" style={{ fontSize: 15, flex: 1 }}>Delete {maid.name} for good?</span>
                  <button className="btn ghost" disabled={deleting} onClick={() => setConfirmDelete(false)}>NO</button>
                  <button className="btn pink" disabled={deleting} onClick={remove}>{deleting ? '...' : 'DELETE'}</button>
                </div>
              ) : (
                <button className="chip pink" onClick={() => setConfirmDelete(true)}>DELETE MAID</button>
              )}
            </>
          ) : (
            <>
              <p className="body-text" style={{ fontSize: 19, marginTop: 0 }}>{maid.bio}</p>
              <div className="row wrap" style={{ marginBottom: 10 }}>
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
        <div className="empty pixel-box">This is too empty ૮₍•᷄ ࡇ •᷅₎ა</div>
      )}
      <ChekiGrid chekis={myChekis} />
    </div>
  );
}
