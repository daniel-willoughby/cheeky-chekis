import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { Cheki, Maid, Cafe, ChekiType } from '../types';
import { MULTI_MAID_TYPES } from '../types';
import { ChekiImage } from './ChekiImage';
import {
  toggleForSale,
  markSold,
  requestChekiTransfer,
  cancelChekiTransfer,
  updateCheki,
  setChekiBinder,
  deleteCheki,
  useChekiBinderId,
  useMaidsByCafe,
  useMyBinders,
  useFriends,
  useChekiLikes,
  toggleChekiLike,
  useSettlementsOf,
  usePublicProfilesByIds,
  isSettlementsBinder,
  formatKRW,
} from '../data/hooks';
import { useAuth } from '../data/auth';
import { POINTS } from '../data/designs';
import { CHEKI_TYPES } from '../data/chekiMeta';
import { SettlementUploadButton } from './SettlementUploadButton';
import './ChekiSheet.css';

export function ChekiSheet({
  cheki,
  maids = [],
  cafe,
  onClose,
}: {
  cheki: Cheki;
  maids?: Maid[];
  cafe?: Cafe;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [price, setPrice] = useState(String(cheki.price ?? ''));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askFriend, setAskFriend] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mine = cheki.ownerId === userId;

  const cafeMaids = useMaidsByCafe(cheki.cafeId);
  const binders = useMyBinders();
  const currentBinderId = useChekiBinderId(cheki.id);
  const friends = useFriends();
  const settlements = useSettlementsOf(cheki.settlementOf ? undefined : cheki.id);
  const likes = useChekiLikes([cheki.id]);
  const likeCount = likes?.counts.get(cheki.id) ?? 0;
  const liked = !!(userId && likes?.likedBy.get(cheki.id)?.has(userId));
  const givers = usePublicProfilesByIds(cheki.receivedFrom ? [cheki.receivedFrom] : []);
  const giver = cheki.receivedFrom ? givers?.get(cheki.receivedFrom) : undefined;
  const pendingRecipients = usePublicProfilesByIds(cheki.transferPendingTo ? [cheki.transferPendingTo] : []);
  const pendingFriendName = cheki.transferPendingTo ? pendingRecipients?.get(cheki.transferPendingTo)?.username : undefined;

  const [draftType, setDraftType] = useState<ChekiType>(cheki.type);
  const [draftMaidIds, setDraftMaidIds] = useState<string[]>(cheki.maidIds);
  const [draftDate, setDraftDate] = useState(cheki.date ?? '');
  const [draftBinderId, setDraftBinderId] = useState('');

  // Run a mutation, show a grey confirmation, then close.
  async function withFeedback(label: string, fn: () => Promise<void>, close = true) {
    setBusy(true);
    try {
      await fn();
      setFeedback(label);
      if (close) setTimeout(onClose, 700);
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setDraftType(cheki.type);
    setDraftMaidIds(cheki.maidIds);
    setDraftDate(cheki.date ?? '');
    setDraftBinderId(currentBinderId ?? '');
    setEditing(true);
  }

  function toggleDraftMaid(id: string) {
    setDraftMaidIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!MULTI_MAID_TYPES.includes(draftType)) return [id];
      return [...prev, id];
    });
  }

  async function saveEdit() {
    if (draftMaidIds.length === 0) return;
    setBusy(true);
    try {
      await updateCheki(cheki.id, { type: draftType, maidIds: draftMaidIds, date: draftDate || undefined });
      await setChekiBinder(cheki.id, draftBinderId || null);
      setEditing(false);
    } catch {
      // error toast already shown
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteCheki(cheki.id);
      onClose();
    } catch {
      setDeleting(false);
      setConfirmDelete(false); // error toast already shown
    }
  }

  const sheet = (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet pixel-box" onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close btn ghost" onClick={onClose}>X</button>
        <div className="sheet__photo">
          <ChekiImage cheki={cheki} />
        </div>
        <div className="sheet__body">
          {editing ? (
            <>
              <div className="row wrap" style={{ gap: 6 }}>
                {CHEKI_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`chip ${draftType === t ? 'purple' : ''}`}
                    onClick={() => {
                      setDraftType(t);
                      if (!MULTI_MAID_TYPES.includes(t)) setDraftMaidIds((prev) => prev.slice(0, 1));
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {cheki.cafeId && (
                <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                  {(cafeMaids ?? []).map((m) => (
                    <button
                      key={m.id}
                      className={`chip ${draftMaidIds.includes(m.id) ? 'pink' : ''}`}
                      onClick={() => toggleDraftMaid(m.id)}
                    >
                      {draftMaidIds.includes(m.id) ? '✓ ' : ''}{m.name}
                    </button>
                  ))}
                </div>
              )}

              <input
                className="pixel-select"
                style={{ width: '100%', marginTop: 8 }}
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />

              <select
                className="pixel-select"
                style={{ width: '100%', marginTop: 8 }}
                value={draftBinderId}
                onChange={(e) => setDraftBinderId(e.target.value)}
              >
                <option value="">No binder</option>
                {(binders ?? []).filter((b) => !isSettlementsBinder(b)).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setEditing(false)}>CANCEL</button>
                <button className="btn" style={{ flex: 1 }} disabled={busy || draftMaidIds.length === 0} onClick={saveEdit}>
                  {busy ? '...' : 'SAVE'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="chip purple">{cheki.type.toUpperCase()}</span>
                <span className={`chip ${cheki.status === 'on-hand' ? 'purple' : 'blue'}`}>
                  {cheki.status === 'on-hand' ? 'ON HAND' : 'ON THE WAY'}
                </span>
                {cheki.forSale && <span className="chip pink">{formatKRW(cheki.price)}</span>}
                {cheki.receivedFrom ? (
                  <span className="chip gold">SECOND LIFE</span>
                ) : cheki.transferPendingTo ? (
                  <span className="chip blue">PENDING TRANSFER</span>
                ) : (
                  cheki.sold && <span className="chip gold">SOLD</span>
                )}
                {userId && (
                  <button
                    className={`sheet__like body-text${liked ? ' is-liked' : ''}`}
                    onClick={() => toggleChekiLike(cheki.id, userId, liked)}
                  >
                    <img src={`${import.meta.env.BASE_URL}icons/like.png`} alt="" className="sheet__like-icon" />
                    {likeCount > 0 ? likeCount : ''}
                  </button>
                )}
              </div>

              {maids.length > 0 && (
                <div className="row wrap" style={{ gap: 8 }}>
                  {maids.map((m) => (
                    <button key={m.id} className="sheet__link body-text" onClick={() => { onClose(); navigate(`/maids/${m.id}`); }}>
                      ♥ {m.name}
                    </button>
                  ))}
                </div>
              )}
              {cafe && <div className="body-text sheet__muted">{cafe.name}</div>}
              {cheki.date && <div className="body-text sheet__muted">Taken {cheki.date}</div>}
              {giver && (
                <button className="sheet__link body-text" onClick={() => { onClose(); navigate(`/friends/${giver.id}`); }}>
                  Second life from @{giver.username}
                </button>
              )}

              {mine && !cheki.sold && !cheki.transferPendingTo && !cheki.settlementOf && (
                <button className="chip purple" style={{ alignSelf: 'flex-start' }} onClick={startEdit}>EDIT</button>
              )}

              {mine && cheki.transferPendingTo && (
                <div className="sheet__sell">
                  <span className="body-text" style={{ fontSize: 17 }}>
                    {pendingFriendName ? `Waiting for @${pendingFriendName} to accept...` : 'Waiting for them to accept...'}
                  </span>
                  <button
                    className="btn ghost"
                    style={{ width: '100%', marginTop: 8 }}
                    disabled={busy}
                    onClick={async () => { setBusy(true); try { await cancelChekiTransfer(cheki.id); } finally { setBusy(false); } }}
                  >
                    {busy ? '...' : 'CANCEL REQUEST'}
                  </button>
                </div>
              )}

              {mine && !cheki.sold && !cheki.transferPendingTo && !cheki.settlementOf && (
                <div className="sheet__sell">
                  {feedback ? (
                    <button className="btn muted" style={{ width: '100%' }} disabled>
                      {feedback} ✓
                    </button>
                  ) : askFriend ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span className="body-text" style={{ fontSize: 17 }}>Which friend?</span>
                      <select className="pixel-select" value={friendId} onChange={(e) => setFriendId(e.target.value)}>
                        <option value="">Choose a friend</option>
                        {(friends ?? []).map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setAskFriend(false)}>BACK</button>
                        <button
                          className="btn pink"
                          style={{ flex: 1 }}
                          disabled={busy || !friendId}
                          onClick={() => withFeedback('REQUEST SENT', () => requestChekiTransfer(cheki, friendId))}
                        >
                          {busy ? '...' : 'CONFIRM'}
                        </button>
                      </div>
                    </div>
                  ) : cheki.forSale ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span className="body-text" style={{ fontSize: 17 }}>Was it sold to one of your friends?</span>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => withFeedback('UNLISTED', () => toggleForSale(cheki))}>
                          UNLIST
                        </button>
                        <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => withFeedback('SOLD', () => markSold(cheki))}>
                          NO, +{POINTS.sold}
                        </button>
                        <button className="btn pink" style={{ flex: 1 }} disabled={busy} onClick={() => setAskFriend(true)}>
                          YES
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="row" style={{ gap: 8 }}>
                      <input
                        className="pixel-select"
                        style={{ flex: 1 }}
                        inputMode="numeric"
                        placeholder="Price KRW"
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
                      />
                      <button className="btn" disabled={busy} onClick={() => withFeedback('LISTED', () => toggleForSale(cheki, price ? Number(price) : undefined))}>
                        SELL
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!cheki.settlementOf && ((settlements && settlements.length > 0) || mine) && (
                <div className="sheet__settlements">
                  <div className="section-label" style={{ marginTop: 4 }}>
                    CHEKI SETTLEMENTS{settlements && settlements.length > 0 ? ` (${settlements.length})` : ''}
                  </div>
                  {settlements && settlements.length > 0 && (
                    <div className="sheet__settlements-strip">
                      {settlements.map((s) => (
                        <div key={s.id} className="sheet__settlement-thumb">
                          <ChekiImage cheki={s} />
                        </div>
                      ))}
                    </div>
                  )}
                  {mine && userId && (
                    <SettlementUploadButton parent={cheki} userId={userId} />
                  )}
                </div>
              )}
            </>
          )}

          {mine && !editing && (
            <div style={{ marginTop: 14 }}>
              {confirmDelete ? (
                <div className="row" style={{ gap: 8 }}>
                  <span className="body-text" style={{ fontSize: 15, flex: 1 }}>
                    Are you sure you want to delete this cheki? ｡°(°¯᷄◠¯᷅°)°｡
                  </span>
                  <button className="btn ghost" disabled={deleting} onClick={() => setConfirmDelete(false)}>NO</button>
                  <button className="btn pink" disabled={deleting} onClick={remove}>{deleting ? '...' : 'DELETE'}</button>
                </div>
              ) : (
                <button className="chip pink" onClick={() => setConfirmDelete(true)}>DELETE CHEKI</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
