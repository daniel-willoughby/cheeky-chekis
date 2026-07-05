import { useProfile, buyDesign } from '../data/hooks';
import { useAuth } from '../data/auth';
import { DESIGNS, POINTS, binderSwatchStyle } from '../data/designs';
import { BackHeader } from '../components/BackHeader';
import './common.css';
import './ShopPage.css';

export function ShopPage() {
  const { userId } = useAuth();
  const profile = useProfile();
  const owned = profile?.ownedDesigns ?? [];
  const points = profile?.points ?? 0;

  return (
    <div className="screen">
      <BackHeader title="Binder Shop" />

      <div className="shop-balance pixel-box">
        <span className="shop-balance__label">CHEKI MONS</span>
        <span className="shop-balance__value">♥ {points}</span>
      </div>

      <div className="shop-earn body-text">
        Earn Cheki Mons: log in daily +{POINTS.dailyLogin}, upload a cheki +{POINTS.upload}, sell a cheki +{POINTS.sold}.
      </div>

      <div className="section-label">BINDER DESIGNS</div>
      <div className="card-grid">
        {DESIGNS.map((d) => {
          const isOwned = owned.includes(d.id);
          const canBuy = !isOwned && points >= d.price;
          return (
            <div key={d.id} className="shop-item pixel-box">
              <div className={`shop-item__swatch binder--${d.id}`} style={binderSwatchStyle(d.id)} />
              <div className="shop-item__name">{d.name}</div>
              <div className="body-text shop-item__blurb">{d.blurb}</div>
              {isOwned ? (
                <span className="chip blue" style={{ width: '100%', textAlign: 'center' }}>OWNED ✓</span>
              ) : (
                <button
                  className={`btn ${canBuy ? '' : 'ghost'}`}
                  style={{ width: '100%', opacity: canBuy ? 1 : 0.6 }}
                  disabled={!canBuy || !userId}
                  onClick={() => userId && buyDesign(userId, d.id)}
                >
                  ♥ {d.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="body-text shop-note">
        There are more coming...
        <br />
        Have a request? Let Bel know ꕤ(˶˃ ᵕ ˂˶*)ꕤ
      </p>
    </div>
  );
}
