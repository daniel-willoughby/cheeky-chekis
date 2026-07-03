import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useProfile, setBinderDesign } from '../data/hooks';
import { DESIGNS } from '../data/designs';
import { ChekiGrid } from '../components/ChekiGrid';
import { BackHeader } from '../components/BackHeader';
import './common.css';
import './BinderPage.css';

export function BinderPage() {
  const { binderId } = useParams();
  const navigate = useNavigate();
  const profile = useProfile();
  const binder = useLiveQuery(() => (binderId ? db.binders.get(binderId) : undefined), [binderId]);
  const chekis = useLiveQuery(
    async () => (binder ? (await db.chekis.bulkGet(binder.chekiIds)).filter(Boolean) : []),
    [binder?.chekiIds.join(',')],
  );

  const owned = profile?.ownedDesigns ?? [];
  const ownedDesigns = DESIGNS.filter((d) => owned.includes(d.id));
  const canEdit = binder?.ownerId === 'me' && binder?.system !== 'sales';

  return (
    <div className="screen">
      <BackHeader title={binder?.name ?? 'Binder'} />
      <div className={`binder--${binder?.design ?? 'classic'}`} style={{ height: 8, border: '3px solid var(--ink)', marginBottom: 16 }} />

      {binder && canEdit && (
        <>
          <div className="binder-designs">
            {ownedDesigns.map((d) => (
              <button
                key={d.id}
                className={`binder-designs__swatch binder--${d.id}${binder.design === d.id ? ' is-active' : ''}`}
                title={d.name}
                onClick={() => setBinderDesign(binder.id, d.id)}
              />
            ))}
            <button className="binder-designs__shop" onClick={() => navigate('/shop')}>+</button>
          </div>
        </>
      )}

      {chekis && chekis.length === 0 && <div className="empty pixel-box">This binder is empty.</div>}
      <ChekiGrid chekis={(chekis ?? []) as never} />
    </div>
  );
}
