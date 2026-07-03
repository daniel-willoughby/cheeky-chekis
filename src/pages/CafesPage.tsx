import { useNavigate } from 'react-router-dom';
import { useCafes, useMaids, formatKRW } from '../data/hooks';
import './common.css';
import './CafesPage.css';

export function CafesPage() {
  const navigate = useNavigate();
  const cafes = useCafes();
  const maids = useMaids();

  return (
    <div className="screen">
      <h1 className="screen-title">Maid Cafes</h1>
      <div style={{ display: 'grid', gap: 14 }}>
        {(cafes ?? []).map((cafe) => {
          const count = (maids ?? []).filter((m) => m.cafeId === cafe.id).length;
          return (
            <button
              key={cafe.id}
              className="cafe-row pixel-box"
              style={{ ['--accent' as string]: cafe.color }}
              onClick={() => navigate(`/cafes/${cafe.id}`)}
            >
              <div className="cafe-row__badge">{cafe.emoji}</div>
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
    </div>
  );
}
