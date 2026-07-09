import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCafes, useMaids, createCafe, formatKRW } from '../data/hooks';
import { CafeBadge } from '../components/CafeBadge';
import './common.css';
import './CafesPage.css';

export function CafesPage() {
  const navigate = useNavigate();
  const cafes = useCafes();
  const maids = useMaids();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', district: '', manager: '', vibe: '', chekiPrice: '' });
  const [saving, setSaving] = useState(false);
  const [maidSearch, setMaidSearch] = useState('');

  const cafeName = new Map((cafes ?? []).map((c) => [c.id, c.name]));
  const q = maidSearch.trim().toLowerCase();
  const maidResults = q
    ? (maids ?? []).filter((m) => m.name.toLowerCase().includes(q))
    : [];

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
              <button
                key={m.id}
                className="cafe-row pixel-box"
                onClick={() => navigate(`/maids/${m.id}`)}
              >
                <div className="cafe-row__info">
                  <div className="cafe-row__name">{m.name}</div>
                  <div className="body-text cafe-row__meta">{cafeName.get(m.cafeId ?? '') ?? 'Unknown cafe'}</div>
                </div>
              </button>
            ))
          )}
        </div>
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

      {q ? null : adding ? (
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
      )}
    </div>
  );
}
