import { useParams, useNavigate } from 'react-router-dom';
import { useProfile, useBinder, useBinderChekis, setBinderDesign } from '../data/hooks';
import { useAuth } from '../data/auth';
import { DESIGNS, binderSwatchStyle } from '../data/designs';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import './common.css';
import './BinderPage.css';

export function BinderPage() {
  const { binderId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const profile = useProfile();
  const binder = useBinder(binderId);
  const chekis = useBinderChekis(binderId);

  const owned = profile?.ownedDesigns ?? [];
  const ownedDesigns = DESIGNS.filter((d) => owned.includes(d.id));
  const canEdit = binder?.ownerId === userId;

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
        </>
      )}

      {chekis && chekis.length === 0 && <div className="empty pixel-box">Nothing here yet (·•᷄∩•᷅ )</div>}
      <ChekiGrid chekis={chekis ?? []} />
    </div>
  );
}
