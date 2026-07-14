import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCafes,
  useMaids,
  createCafe,
  formatKRW,
  useProfile,
  usePendingRequests,
  createContentRequest,
  approveRequest,
  dismissRequest,
} from '../data/hooks';
import type { ContentRequest } from '../data/hooks';
import { useAuth } from '../data/auth';
import { pushToast } from '../data/toast';
import { CafeBadge } from '../components/CafeBadge';
import './common.css';
import './CafesPage.css';

export function CafesPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const cafes = useCafes();
  const maids = useMaids();
  const isAdmin = useProfile()?.isAdmin ?? false;
  const requests = usePendingRequests();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', district: '', manager: '', vibe: '', chekiPrice: '' });
  const [saving, setSaving] = useState(false);
  const [maidSearch, setMaidSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // non-admin "request a cafe/maid"
  const [reqOpen, setReqOpen] = useState(false);
  const [reqKind, setReqKind] = useState<'cafe' | 'maid'>('cafe');
  const [reqCafe, setReqCafe] = useState({ name: '', district: '', manager: '', vibe: '', chekiPrice: '' });
  const [reqMaid, setReqMaid] = useState({ cafeId: '', name: '', bio: '' });
  const [reqBusy, setReqBusy] = useState(false);

  const cafeName = new Map((cafes ?? []).map((c) => [c.id, c.name]));
  const q = maidSearch.trim().toLowerCase();
  const maidResults = q ? (maids ?? []).filter((m) => m.name.toLowerCase().includes(q)) : [];

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true);
    const id = await createCafe({
      name: draft.name.trim(),
      district: draft.district.trim(),
      manager: draft.manager.trim(),
      vibe: draft.vibe.trim(),
      chekiPrice: Number(draft.chekiPrice) || 0,
    });
    setSaving(false);
    setAdding(false);
    setDraft({ name: '', district: '', manager: '', vibe: '', chekiPrice: '' });
    navigate(`/cafes/${id}`);
  }

  async function submitRequest() {
    if (!userId) return;
    if (reqKind === 'cafe' && !reqCafe.name.trim()) return;
    if (reqKind === 'maid' && (!reqMaid.cafeId || !reqMaid.name.trim())) return;
    const payload =
      reqKind === 'cafe'
        ? {
            name: reqCafe.name.trim(),
            district: reqCafe.district.trim(),
            manager: reqCafe.manager.trim(),
            vibe: reqCafe.vibe.trim(),
            chekiPrice: Number(reqCafe.chekiPrice) || 0,
          }
        : { cafeId: reqMaid.cafeId, name: reqMaid.name.trim(), bio: reqMaid.bio.trim() };
    setReqBusy(true);
    try {
      await createContentRequest(userId, reqKind, payload);
      pushToast('Request sent to admins', 'ok');
      setReqOpen(false);
      setReqCafe({ name: '', district: '', manager: '', vibe: '', chekiPrice: '' });
      setReqMaid({ cafeId: '', name: '', bio: '' });
    } catch {
      /* toast shown */
    } finally {
      setReqBusy(false);
    }
  }

  async function approve(req: ContentRequest) {
    setBusyId(req.id);
    try {
      await approveRequest(req);
      pushToast('Approved', 'ok');
    } catch {
      /* toast shown */
    } finally {
      setBusyId(null);
    }
  }

  async function dismiss(id: string) {
    setBusyId(id);
    try {
      await dismissRequest(id);
    } catch {
      /* toast shown */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="screen">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>Maid Cafes</h1>
        <button className="chip purple" onClick={() => navigate('/dictionary')}>📖 DICTIONARY</button>
      </div>

      <input
        className="pixel-select"
        style={{ width: '100%', marginTop: 14 }}
        placeholder="Search maids"
        value={maidSearch}
        onChange={(e) => setMaidSearch(e.target.value)}
      />

      {q && (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {maidResults.length === 0 ? (
            <div className="empty pixel-box">No maids match.</div>
          ) : (
            maidResults.map((m) => (
              <button key={m.id} className="cafe-row pixel-box" onClick={() => navigate(`/maids/${m.id}`)}>
                <div className="cafe-row__info">
                  <div className="cafe-row__name">{m.name}</div>
                  <div className="body-text cafe-row__meta">{cafeName.get(m.cafeId ?? '') ?? 'Unknown cafe'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {!q && isAdmin && requests && requests.length > 0 && (
        <>
          <div className="section-label">REQUESTS ({requests.length})</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {requests.map((req) => (
              <div key={req.id} className="pixel-box" style={{ padding: 12 }}>
                <div className="body-text" style={{ fontSize: 17 }}>
                  {req.kind === 'cafe'
                    ? `New cafe: ${req.payload.name}${req.payload.district ? ` (${req.payload.district})` : ''}`
                    : `New maid: ${req.payload.name} @ ${cafeName.get(String(req.payload.cafeId)) ?? 'a cafe'}`}
                </div>
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <button className="btn" style={{ flex: 1 }} disabled={busyId === req.id} onClick={() => approve(req)}>
                    {busyId === req.id ? '...' : 'APPROVE'}
                  </button>
                  <button className="btn ghost" style={{ flex: 1 }} disabled={busyId === req.id} onClick={() => dismiss(req.id)}>
                    DISMISS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: q ? 'none' : 'grid', gap: 14, marginTop: 14 }}>
        {(cafes ?? []).map((cafe) => {
          const count = (maids ?? []).filter((m) => m.cafeId === cafe.id).length;
          return (
            <button
              key={cafe.id}
              className="cafe-row pixel-box"
              style={{ ['--accent' as string]: cafe.color }}
              onClick={() => navigate(`/cafes/${cafe.id}`)}
            >
              <div className="cafe-row__badge">
                <CafeBadge cafe={cafe} imgClass="cafe-row__badge-img" />
              </div>
              <div className="cafe-row__info">
                <div className="cafe-row__name">{cafe.name}</div>
                <div className="body-text cafe-row__meta">{cafe.district}</div>
                <div className="body-text cafe-row__vibe">{cafe.vibe}</div>
                <div className="row wrap" style={{ marginTop: 4 }}>
                  <span className="chip blue">{count} MAIDS</span>
                  <span className="chip gold">{formatKRW(cafe.chekiPrice)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* admin: add a cafe directly. non-admin: request one. */}
      {q ? null : isAdmin ? (
        adding ? (
          <div className="pixel-box" style={{ padding: 14, marginTop: 16 }}>
            <div className="section-label" style={{ marginTop: 0 }}>NEW CAFE</div>
            <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Cafe name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Area (e.g. Hongdae, Seoul)" value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} />
            <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Manager" value={draft.manager} onChange={(e) => setDraft({ ...draft, manager: e.target.value })} />
            <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} inputMode="numeric" placeholder="Cheki price (KRW)" value={draft.chekiPrice} onChange={(e) => setDraft({ ...draft, chekiPrice: e.target.value.replace(/\D/g, '') })} />
            <textarea className="pixel-select" style={{ width: '100%' }} rows={2} placeholder="How it runs" value={draft.vibe} onChange={(e) => setDraft({ ...draft, vibe: e.target.value })} />
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setAdding(false)}>CANCEL</button>
              <button className="btn" style={{ flex: 1 }} disabled={saving || !draft.name.trim()} onClick={save}>
                {saving ? 'SAVING...' : 'ADD CAFE'}
              </button>
            </div>
            <p className="body-text" style={{ fontSize: 15, opacity: 0.7, marginTop: 8 }}>Add a photo and maids after creating.</p>
          </div>
        ) : (
          <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={() => setAdding(true)}>
            + ADD CAFE
          </button>
        )
      ) : reqOpen ? (
        <div className="pixel-box" style={{ padding: 14, marginTop: 16 }}>
          <div className="section-label" style={{ marginTop: 0 }}>REQUEST</div>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            <button className={`chip ${reqKind === 'cafe' ? 'purple' : ''}`} onClick={() => setReqKind('cafe')}>A CAFE</button>
            <button className={`chip ${reqKind === 'maid' ? 'purple' : ''}`} onClick={() => setReqKind('maid')}>A MAID</button>
          </div>
          {reqKind === 'cafe' ? (
            <>
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Cafe name" value={reqCafe.name} onChange={(e) => setReqCafe({ ...reqCafe, name: e.target.value })} autoFocus />
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Area" value={reqCafe.district} onChange={(e) => setReqCafe({ ...reqCafe, district: e.target.value })} />
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Manager" value={reqCafe.manager} onChange={(e) => setReqCafe({ ...reqCafe, manager: e.target.value })} />
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} inputMode="numeric" placeholder="Cheki price (KRW)" value={reqCafe.chekiPrice} onChange={(e) => setReqCafe({ ...reqCafe, chekiPrice: e.target.value.replace(/\D/g, '') })} />
              <textarea className="pixel-select" style={{ width: '100%' }} rows={2} placeholder="How it runs" value={reqCafe.vibe} onChange={(e) => setReqCafe({ ...reqCafe, vibe: e.target.value })} />
            </>
          ) : (
            <>
              <select className="pixel-select" style={{ width: '100%', marginBottom: 8 }} value={reqMaid.cafeId} onChange={(e) => setReqMaid({ ...reqMaid, cafeId: e.target.value })}>
                <option value="">Which cafe?</option>
                {(cafes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Maid name" value={reqMaid.name} onChange={(e) => setReqMaid({ ...reqMaid, name: e.target.value })} />
              <textarea className="pixel-select" style={{ width: '100%' }} rows={2} placeholder="Short bio" value={reqMaid.bio} onChange={(e) => setReqMaid({ ...reqMaid, bio: e.target.value })} />
            </>
          )}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setReqOpen(false)}>CANCEL</button>
            <button
              className="btn"
              style={{ flex: 1 }}
              disabled={reqBusy || (reqKind === 'cafe' ? !reqCafe.name.trim() : !reqMaid.cafeId || !reqMaid.name.trim())}
              onClick={submitRequest}
            >
              {reqBusy ? 'SENDING...' : 'SEND REQUEST'}
            </button>
          </div>
          <p className="body-text" style={{ fontSize: 15, opacity: 0.7, marginTop: 8 }}>An admin will review and add it.</p>
        </div>
      ) : (
        <button className="btn ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => setReqOpen(true)}>
          REQUEST A CAFE OR MAID
        </button>
      )}
    </div>
  );
}
