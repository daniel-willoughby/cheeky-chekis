import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile, useBinder, useBinderChekis, useMaids, setBinderDesign, renameBinder, deleteBinder, isSettlementsBinder } from '../data/hooks';
import { useAuth } from '../data/auth';
import { DESIGNS, binderSwatchStyle } from '../data/designs';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import { pushToast } from '../data/toast';
import './common.css';
import './BinderPage.css';

export function BinderPage() {
  const { binderId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const profile = useProfile();
  const binder = useBinder(binderId);
  const chekis = useBinderChekis(binderId);
  const maids = useMaids();
  const [maidId, setMaidId] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const owned = profile?.ownedDesigns ?? [];
  const ownedDesigns = DESIGNS.filter((d) => owned.includes(d.id));
  const canEdit = binder?.ownerId === userId;
  // the system settlements binder can't be renamed or deleted
  const isSystem = binder ? isSettlementsBinder(binder) : false;

  async function saveName() {
    if (!binder || !nameDraft.trim()) return;
    if (isSettlementsBinder({ name: nameDraft.trim() })) {
      pushToast('That name is reserved ٩(๑˃́ꇴ˂̀๑)۶');
      return;
    }
    setBusy(true);
    try {
      await renameBinder(binder.id, nameDraft.trim());
      setRenaming(false);
    } catch { /* toast shown */ } finally { setBusy(false); }
  }

  async function removeBinder() {
    if (!binder) return;
    setBusy(true);
    try {
      await deleteBinder(binder.id);
      navigate('/');
    } catch { setBusy(false); }
  }

  const inBinderMaidIds = new Set((chekis ?? []).flatMap((c) => c.maidIds));
  const maidOptions = (maids ?? []).filter((m) => inBinderMaidIds.has(m.id));
  const filtered = (chekis ?? []).filter((c) => !maidId || c.maidIds.includes(maidId));

  return (
    <div className="screen">
      <BackHeader title={binder?.name ?? 'Binder'} />
      <div
        className={`binder--${binder?.design ?? 'classic'}`}
        style={{ height: 8, border: '3px solid var(--ink)', marginBottom: 16, ...binderSwatchStyle(binder?.design ?? 'classic') }}
      />

      {binder && canEdit && (
        <>
          <div className="binder-designs">
            {ownedDesigns.map((d) => (
              <button
                key={d.id}
                className={`binder-designs__swatch binder--${d.id}${binder.design === d.id ? ' is-active' : ''}`}
                style={binderSwatchStyle(d.id)}
                title={d.name}
                onClick={() => setBinderDesign(binder.id, d.id)}
              />
            ))}
            <button className="binder-designs__shop" onClick={() => navigate('/shop')}>+</button>
          </div>
          {!isSystem && (
            <div style={{ marginBottom: 16 }}>
              {renaming ? (
                <div className="row" style={{ gap: 8 }}>
                  <input
                    className="pixel-select"
                    style={{ flex: 1 }}
                    maxLength={30}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoFocus
                  />
                  <button className="btn ghost" disabled={busy} onClick={() => setRenaming(false)}>CANCEL</button>
                  <button className="btn" disabled={busy || !nameDraft.trim()} onClick={saveName}>SAVE</button>
                </div>
              ) : confirmDelete ? (
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="body-text" style={{ flex: 1, fontSize: 16 }}>Delete this binder? Your chekis stay.</span>
                  <button className="btn ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>NO</button>
                  <button className="btn pink" disabled={busy} onClick={removeBinder}>{busy ? '...' : 'DELETE'}</button>
                </div>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <button className="chip purple" onClick={() => { setNameDraft(binder.name); setRenaming(true); }}>EDIT NAME</button>
                  <button className="chip pink" onClick={() => setConfirmDelete(true)}>DELETE BINDER</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {maidOptions.length > 0 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <select className="pixel-select" value={maidId} onChange={(e) => setMaidId(e.target.value)}>
            <option value="">All maids</option>
            {maidOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {chekis && chekis.length === 0 && <div className="empty pixel-box">Nothing here yet (·•᷄∩•᷅ )</div>}
      {chekis && chekis.length > 0 && filtered.length === 0 && (
        <div className="empty pixel-box">No chekis match.</div>
      )}
      <ChekiGrid chekis={filtered} />
    </div>
  );
}
