import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCafe, useMaidsByCafe, updateCafe, setCafeImage, createMaid, formatKRW } from '../data/hooks';
import { CHEKI_TYPES } from '../data/chekiMeta';
import type { ChekiType } from '../types';
import { MaidCard } from '../components/MaidCard';
import { BackHeader } from '../components/BackHeader';
import { ImageUploadButton } from '../components/ImageUploadButton';
import './common.css';
import './CafeDetailPage.css';

export function CafeDetailPage() {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const cafe = useCafe(cafeId);
  const maids = useMaidsByCafe(cafeId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ district: '', manager: '', chekiPrice: '', vibe: '', rules: '' });
  const [typePrices, setTypePrices] = useState<Partial<Record<ChekiType, string>>>({});
  const [addingMaid, setAddingMaid] = useState(false);
  const [maidDraft, setMaidDraft] = useState({ name: '', specialty: '', bio: '' });
  const [savingMaid, setSavingMaid] = useState(false);

  if (!cafe) return <div className="screen"><BackHeader title="Cafe" /></div>;

  async function saveMaid() {
    if (!cafeId || !maidDraft.name.trim()) return;
    setSavingMaid(true);
    await createMaid({
      cafeId,
      name: maidDraft.name.trim(),
      specialty: maidDraft.specialty.trim(),
      bio: maidDraft.bio.trim(),
    });
    setSavingMaid(false);
    setAddingMaid(false);
    setMaidDraft({ name: '', specialty: '', bio: '' });
  }

  function startEdit() {
    if (!cafe) return;
    setDraft({
      district: cafe.district,
      manager: cafe.manager,
      chekiPrice: String(cafe.chekiPrice),
      vibe: cafe.vibe,
      rules: cafe.rules.join('\n'),
    });
    const tp: Partial<Record<ChekiType, string>> = {};
    for (const t of CHEKI_TYPES) {
      const v = cafe.typePrices[t];
      if (v != null) tp[t] = String(v);
    }
    setTypePrices(tp);
    setEditing(true);
  }
  async function save() {
    if (!cafeId) return;
    const tp: Partial<Record<ChekiType, number>> = {};
    for (const t of CHEKI_TYPES) {
      const n = Number(typePrices[t]);
      if (typePrices[t] && n > 0) tp[t] = n;
    }
    try {
      await updateCafe(cafeId, {
        district: draft.district.trim(),
        manager: draft.manager.trim(),
        chekiPrice: Number(draft.chekiPrice) || 0,
        typePrices: tp,
        vibe: draft.vibe.trim(),
        rules: draft.rules.split('\n').map((r) => r.trim()).filter(Boolean),
      });
      setEditing(false);
    } catch { /* error toast shown */ }
  }

  if (editing) {
    return (
      <div className="screen">
        <BackHeader title={`Edit ${cafe.name}`} />
        <EditField label="AREA">
          <input className="pixel-select" value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} />
        </EditField>
        <EditField label="MANAGER">
          <input className="pixel-select" value={draft.manager} onChange={(e) => setDraft({ ...draft, manager: e.target.value })} />
        </EditField>
        <EditField label="BASE CHEKI PRICE (KRW)">
          <input className="pixel-select" inputMode="numeric" value={draft.chekiPrice} onChange={(e) => setDraft({ ...draft, chekiPrice: e.target.value.replace(/\D/g, '') })} />
        </EditField>
        <EditField label="PRICE PER TYPE (KRW, optional)">
          <div style={{ display: 'grid', gap: 8 }}>
            {CHEKI_TYPES.map((t) => (
              <div key={t} className="row" style={{ gap: 10, alignItems: 'center' }}>
                <span className="body-text" style={{ width: 90, textTransform: 'uppercase', fontSize: 16 }}>{t}</span>
                <input
                  className="pixel-select"
                  style={{ flex: 1 }}
                  inputMode="numeric"
                  placeholder="—"
                  value={typePrices[t] ?? ''}
                  onChange={(e) => setTypePrices({ ...typePrices, [t]: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            ))}
          </div>
        </EditField>
        <EditField label="HOW IT RUNS">
          <textarea className="pixel-select" rows={2} value={draft.vibe} onChange={(e) => setDraft({ ...draft, vibe: e.target.value })} />
        </EditField>
        <EditField label="RULES (one per line)">
          <textarea className="pixel-select" rows={4} value={draft.rules} onChange={(e) => setDraft({ ...draft, rules: e.target.value })} />
        </EditField>
        <EditField label="CAFE PHOTO">
          <ImageUploadButton folder={`cafes/${cafeId}`} onUploaded={(path) => { if (cafeId) return setCafeImage(cafeId, path); }} />
        </EditField>
        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>DONE</button>
          <button className="btn" style={{ flex: 1 }} onClick={save}>SAVE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <BackHeader title={cafe.name} />

      <div className="cafe-hero pixel-box" style={{ ['--accent' as string]: cafe.color }}>
        <div className="cafe-hero__emoji">
          {cafe.imageUrl ? <img src={cafe.imageUrl} alt="" className="cafe-hero__img" /> : cafe.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div className="body-text cafe-detail__line"><b>Area:</b> {cafe.district}</div>
          <div className="body-text cafe-detail__line"><b>Manager:</b> {cafe.manager}</div>
          <div className="body-text cafe-detail__line"><b>Cheki:</b> {formatKRW(cafe.chekiPrice)}</div>
        </div>
        <button className="chip purple" onClick={startEdit}>EDIT</button>
      </div>

      {CHEKI_TYPES.some((t) => cafe.typePrices[t] != null) && (
        <>
          <div className="section-label">CHEKI PRICES</div>
          <div className="row wrap">
            {CHEKI_TYPES.filter((t) => cafe.typePrices[t] != null).map((t) => (
              <span key={t} className="chip gold">{t.toUpperCase()} {formatKRW(cafe.typePrices[t])}</span>
            ))}
          </div>
        </>
      )}

      <div className="section-label">HOW IT RUNS</div>
      <p className="body-text" style={{ fontSize: 19 }}>{cafe.vibe}</p>
      <ul className="cafe-rules">
        {cafe.rules.map((r, i) => (
          <li key={i} className="body-text">{r}</li>
        ))}
      </ul>

      <div className="section-label">MAIDS ({maids?.length ?? 0})</div>
      <div className="card-grid">
        {(maids ?? []).map((m) => (
          <MaidCard key={m.id} maid={m} onClick={() => navigate(`/maids/${m.id}`)} />
        ))}
      </div>

      {addingMaid ? (
        <div className="pixel-box" style={{ padding: 14, marginTop: 14 }}>
          <div className="section-label" style={{ marginTop: 0 }}>NEW MAID</div>
          <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Name" value={maidDraft.name} onChange={(e) => setMaidDraft({ ...maidDraft, name: e.target.value })} autoFocus />
          <input className="pixel-select" style={{ width: '100%', marginBottom: 8 }} placeholder="Specialty (e.g. Song requests)" value={maidDraft.specialty} onChange={(e) => setMaidDraft({ ...maidDraft, specialty: e.target.value })} />
          <textarea className="pixel-select" style={{ width: '100%' }} rows={2} placeholder="Short bio" value={maidDraft.bio} onChange={(e) => setMaidDraft({ ...maidDraft, bio: e.target.value })} />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setAddingMaid(false)}>CANCEL</button>
            <button className="btn" style={{ flex: 1 }} disabled={savingMaid || !maidDraft.name.trim()} onClick={saveMaid}>
              {savingMaid ? 'SAVING...' : 'ADD MAID'}
            </button>
          </div>
          <p className="body-text" style={{ fontSize: 15, opacity: 0.7, marginTop: 8 }}>Add a photo from the maid's page after creating.</p>
        </div>
      ) : (
        <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={() => setAddingMaid(true)}>
          + ADD MAID
        </button>
      )}
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="upload-field__label" style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
