import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cheki, Maid, Cafe } from '../types';
import { ChekiImage } from './ChekiImage';
import { toggleForSale, markSold, formatKRW } from '../data/hooks';
import { POINTS } from '../data/designs';
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
  const [price, setPrice] = useState(String(cheki.price ?? ''));
  const mine = cheki.ownerId === 'me';

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet pixel-box" onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close btn ghost" onClick={onClose}>X</button>
        <div className="sheet__photo">
          <ChekiImage cheki={cheki} />
        </div>
        <div className="sheet__body">
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="chip purple">{cheki.type.toUpperCase()}</span>
            <span className={`chip ${cheki.status === 'on-hand' ? 'good' : 'blue'}`}>
              {cheki.status === 'on-hand' ? 'ON HAND' : 'ON THE WAY'}
            </span>
            {cheki.forSale && <span className="chip pink">{formatKRW(cheki.price)}</span>}
            {cheki.sold && <span className="chip gold">SOLD</span>}
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

          {mine && !cheki.sold && (
            <div className="sheet__sell">
              {cheki.forSale ? (
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn ghost" style={{ flex: 1 }} onClick={() => toggleForSale(cheki)}>
                    UNLIST
                  </button>
                  <button className="btn pink" style={{ flex: 1 }} onClick={() => { markSold(cheki); onClose(); }}>
                    SOLD +{POINTS.sold}
                  </button>
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
                  <button className="btn" onClick={() => toggleForSale(cheki, price ? Number(price) : undefined)}>
                    SELL
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
