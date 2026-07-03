import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCafe, useMaidsByCafe, updateCafe, formatKRW } from '../data/hooks';
import { MaidCard } from '../components/MaidCard';
import { BackHeader } from '../components/BackHeader';
import './common.css';
import './CafeDetailPage.css';

export function CafeDetailPage() {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const cafe = useCafe(cafeId);
  const maids = useMaidsByCafe(cafeId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ district: '', manager: '', chekiPrice: '', vibe: '', rules: '' });

  if (!cafe) return <div className="screen"><BackHeader title="Cafe" /></div>;

  function startEdit() {
    if (!cafe) return;
    setDraft({
      district: cafe.district,
      manager: cafe.manager,
      chekiPrice: String(cafe.chekiPrice),
      vibe: cafe.vibe,
      rules: cafe.rules.join('\n'),
    });
    setEditing(true);
  }
  async function save() {
    if (!cafeId) return;
    await updateCafe(cafeId, {
      district: draft.district.trim(),
      manager: draft.manager.trim(),
      chekiPrice: Number(draft.chekiPrice) || 0,
      vibe: draft.vibe.trim(),
      rules: draft.rules.split('\n').map((r) => r.trim()).filter(Boolean),
    });
    setEditing(false);
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
        <EditField label="CHEKI PRICE (KRW)">
          <input className="pixel-select" inputMode="numeric" value={draft.chekiPrice} onChange={(e) => setDraft({ ...draft, chekiPrice: e.target.value.replace(/\D/g, '') })} />
        </EditField>
        <EditField label="HOW IT RUNS">
          <textarea className="pixel-select" rows={2} value={draft.vibe} onChange={(e) => setDraft({ ...draft, vibe: e.target.value })} />
        </EditField>
        <EditField label="RULES (one per line)">
          <textarea className="pixel-select" rows={4} value={draft.rules} onChange={(e) => setDraft({ ...draft, rules: e.target.value })} />
        </EditField>
        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>CANCEL</button>
          <button className="btn" style={{ flex: 1 }} onClick={save}>SAVE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <BackHeader title={cafe.name} />

      <div className="cafe-hero pixel-box" style={{ ['--accent' as string]: cafe.color }}>
        <div className="cafe-hero__emoji">{cafe.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="body-text cafe-detail__line"><b>Area:</b> {cafe.district}</div>
          <div className="body-text cafe-detail__line"><b>Manager:</b> {cafe.manager}</div>
          <div className="body-text cafe-detail__line"><b>Cheki:</b> {formatKRW(cafe.chekiPrice)}</div>
        </div>
        <button className="chip purple" onClick={startEdit}>EDIT</button>
      </div>

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
