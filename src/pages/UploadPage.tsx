import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { CropModal } from '../components/CropModal';
import { useCafes, useMaids, addCheki, formatKRW } from '../data/hooks';
import { useAuth } from '../data/auth';
import { supabase } from '../data/supabase';
import { CHEKI_TYPES } from '../data/chekiMeta';
import { MULTI_MAID_TYPES } from '../types';
import type { ChekiType, ChekiStatus } from '../types';
import './common.css';
import './UploadPage.css';

export function UploadPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const cafes = useCafes();
  const maids = useMaids();
  const fileRef = useRef<HTMLInputElement>(null);

  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string>();
  const [rawSrc, setRawSrc] = useState<string>();     // photo awaiting crop
  const [cafeId, setCafeId] = useState<string>('');
  const [maidIds, setMaidIds] = useState<string[]>([]);
  const [type, setType] = useState<ChekiType>('normal');
  const [status, setStatus] = useState<ChekiStatus>('on-hand');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [forSale, setForSale] = useState(false);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const multiMaid = MULTI_MAID_TYPES.includes(type);
  const cafeMaids = useMemo(
    () => (maids ?? []).filter((m) => !cafeId || m.cafeId === cafeId),
    [maids, cafeId],
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRawSrc(URL.createObjectURL(f));   // open cropper
    e.target.value = '';
  }

  function toggleMaid(id: string) {
    setMaidIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!multiMaid) return [id];        // single-maid types replace
      return [...prev, id];
    });
  }

  function pickType(t: ChekiType) {
    setType(t);
    if (!MULTI_MAID_TYPES.includes(t)) setMaidIds((prev) => prev.slice(0, 1));
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    const cafe = cafeId || (maidIds[0] ? maids?.find((m) => m.id === maidIds[0])?.cafeId : undefined);

    let imagePath: string | null = null;
    if (blob) {
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from('chekis').upload(path, blob, { contentType: 'image/jpeg' });
      if (!error) imagePath = path;
    }

    await addCheki(userId, {
      imagePath,
      maidIds,
      cafeId: cafe,
      date,
      type,
      status,
      forSale,
      price: forSale && price ? Number(price) : undefined,
    });
    navigate('/');
  }

  return (
    <div className="screen">
      <BackHeader title="Upload Cheki" />

      <button className="upload-drop pixel-box" onClick={() => fileRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="preview" className="upload-drop__img" />
        ) : (
          <div className="upload-drop__hint">
            <div style={{ fontSize: 44 }}>📸</div>
            <div className="body-text" style={{ fontSize: 20 }}>Tap to add + crop a photo</div>
          </div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <Field label="TYPE">
        <div className="row wrap">
          {CHEKI_TYPES.map((t) => (
            <button key={t} className={`chip ${type === t ? 'purple' : ''}`} onClick={() => pickType(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </Field>

      <Field label="STATUS">
        <div className="row">
          <button className={`chip ${status === 'on-hand' ? 'good' : ''}`} onClick={() => setStatus('on-hand')}>
            ON HAND
          </button>
          <button className={`chip ${status === 'on-the-way' ? 'blue' : ''}`} onClick={() => setStatus('on-the-way')}>
            ON THE WAY
          </button>
        </div>
      </Field>

      <Field label="CAFE">
        <select className="pixel-select" value={cafeId} onChange={(e) => { setCafeId(e.target.value); setMaidIds([]); }}>
          <option value="">Choose cafe</option>
          {(cafes ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label={multiMaid ? 'MAIDS (tap to add more)' : 'MAID'}>
        <div className="row wrap">
          {cafeMaids.map((m) => (
            <button
              key={m.id}
              className={`chip ${maidIds.includes(m.id) ? 'pink' : ''}`}
              onClick={() => toggleMaid(m.id)}
            >
              {maidIds.includes(m.id) ? '✓ ' : ''}{m.name}
            </button>
          ))}
          {cafeMaids.length === 0 && <span className="body-text" style={{ fontSize: 17 }}>Choose a cafe first.</span>}
        </div>
      </Field>

      <Field label="DATE">
        <input className="pixel-select" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="SELL THIS?">
        <div className="row wrap">
          <button className={`chip ${forSale ? 'pink' : ''}`} onClick={() => setForSale((v) => !v)}>
            {forSale ? 'FOR SALE ✓' : 'MARK FOR SALE'}
          </button>
          {forSale && (
            <input
              className="pixel-select"
              style={{ width: 130 }}
              inputMode="numeric"
              placeholder="Price KRW"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
            />
          )}
          {forSale && price && <span className="body-text" style={{ fontSize: 18 }}>{formatKRW(Number(price))}</span>}
        </div>
      </Field>

      <button className="btn" style={{ width: '100%', marginTop: 20 }} disabled={saving || maidIds.length === 0} onClick={save}>
        {saving ? 'SAVING...' : maidIds.length === 0 ? 'PICK A MAID' : 'ADD TO COLLECTION'}
      </button>

      {rawSrc && (
        <CropModal
          src={rawSrc}
          onCancel={() => setRawSrc(undefined)}
          onDone={(b, url) => {
            setBlob(b);
            setPreview(url);
            setRawSrc(undefined);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="upload-field">
      <div className="upload-field__label">{label}</div>
      {children}
    </div>
  );
}
