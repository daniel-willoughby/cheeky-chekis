import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useProfile,
  useMyChekis,
  useMyBinders,
  useBinderChekiCounts,
  useMaids,
  useCafes,
  updateProfile,
  setProfileAvatar,
  createBinder,
} from '../data/hooks';
import { useAuth } from '../data/auth';
import { MAX_HIGHLIGHTS } from '../types';
import type { BinderDesign, ChekiType } from '../types';
import { CHEKI_TYPES } from '../data/chekiMeta';
import { DESIGNS } from '../data/designs';
import { MaidCard } from '../components/MaidCard';
import { ChekiGrid } from '../components/ChekiGrid';
import { BinderCard } from '../components/BinderCard';
import { ImageUploadButton } from '../components/ImageUploadButton';
import { pushToast } from '../data/toast';
import './common.css';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { userId, signOut } = useAuth();
  const profile = useProfile();
  const chekis = useMyChekis();
  const binders = useMyBinders();
  const binderCounts = useBinderChekiCounts(userId ?? undefined);
  const maids = useMaids();
  const cafes = useCafes();
  const [filterType, setFilterType] = useState<ChekiType | 'all'>('all');
  const [filterMaid, setFilterMaid] = useState('');
  const [filterCafe, setFilterCafe] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [newBinder, setNewBinder] = useState(false);
  const [binderName, setBinderName] = useState('');
  const [binderDesign, setBinderDesign] = useState<BinderDesign>('classic');
  const ownedDesigns = DESIGNS.filter((d) => (profile?.ownedDesigns ?? []).includes(d.id));

  async function saveBinder() {
    if (!userId || !binderName.trim()) return;
    await createBinder(userId, binderName.trim(), binderDesign);
    setBinderName('');
    setBinderDesign('classic');
    setNewBinder(false);
  }

  const maidMap = new Map((maids ?? []).map((m) => [m.id, m]));
  const highlights = (profile?.favouriteMaidIds ?? [])
    .map((id) => maidMap.get(id))
    .filter(Boolean);
  const onHand = (chekis ?? []).filter((c) => c.status === 'on-hand').length;
  const onWay = (chekis ?? []).filter((c) => c.status === 'on-the-way').length;

  // maids/cafes that actually appear in the collection, for the filter dropdowns
  const ownMaidIds = new Set((chekis ?? []).flatMap((c) => c.maidIds));
  const ownCafeIds = new Set((chekis ?? []).map((c) => c.cafeId).filter(Boolean));
  const filteredChekis = useMemo(
    () =>
      (chekis ?? []).filter(
        (c) =>
          (filterType === 'all' || c.type === filterType) &&
          (!filterMaid || c.maidIds.includes(filterMaid)) &&
          (!filterCafe || c.cafeId === filterCafe),
      ),
    [chekis, filterType, filterMaid, filterCafe],
  );

  function startEdit() {
    setNameDraft(profile?.name ?? '');
    setBioDraft(profile?.bio ?? '');
    setEditing(true);
  }
  async function saveEdit() {
    if (!userId) return;
    try {
      await updateProfile(userId, { name: nameDraft.trim() || profile?.name, bio: bioDraft.trim() });
      pushToast('Profile saved', 'ok');
      setEditing(false);
    } catch {
      // error toast already shown; keep the form open so nothing is lost
    }
  }

  return (
    <div className="screen">
      <div className="profile-hero pixel-box">
        <div className="profile-hero__avatar">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="profile-hero__avatar-img" />
          ) : (
            profile?.emoji ?? '🎮'
          )}
        </div>
        <div className="profile-hero__info">
          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <h1 className="profile-hero__name">{profile?.name ?? 'You'}</h1>
            <button className="chip purple" style={{ flexShrink: 0 }} onClick={startEdit}>EDIT</button>
          </div>
          {editing ? (
            <div style={{ marginTop: 6 }}>
              <input
                className="pixel-select"
                style={{ width: '100%', marginBottom: 8 }}
                maxLength={30}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Display name"
              />
              <textarea
                className="pixel-select"
                rows={2}
                maxLength={90}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Your bio"
              />
              {userId && (
                <div className="row" style={{ marginTop: 8 }}>
                  <ImageUploadButton
                    folder={`avatars/${userId}`}
                    label="CHANGE PHOTO"
                    onUploaded={(path) => setProfileAvatar(userId, path)}
                  />
                </div>
              )}
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>DONE</button>
                <button className="btn" style={{ flex: 1 }} onClick={saveEdit}>SAVE</button>
              </div>
            </div>
          ) : (
            <>
              <p className="body-text" style={{ margin: '0 0 2px', opacity: 0.7 }}>@{profile?.username}</p>
              <p className="body-text profile-hero__bio">{profile?.bio}</p>
            </>
          )}
          <div className="row wrap" style={{ marginTop: 6 }}>
            <button className="chip gold" onClick={() => navigate('/shop')}>★ {profile?.points ?? 0} PTS</button>
            <span className="chip purple">{onHand} ON HAND</span>
            {onWay > 0 && <span className="chip blue">{onWay} ON THE WAY</span>}
          </div>
        </div>
      </div>

      <div className="section-label">HIGHLIGHTED MAIDS ({highlights.length}/{MAX_HIGHLIGHTS})</div>
      {highlights.length === 0 ? (
        <div className="empty pixel-box">Pick up to 3 from any maid profile.</div>
      ) : (
        <div className="hl-grid">
          {highlights.map((m) => (
            <MaidCard key={m!.id} maid={m!} compact highlighted onClick={() => navigate(`/maids/${m!.id}`)} />
          ))}
        </div>
      )}

      <div className="section-label">MY BINDERS</div>
      <div className="card-grid">
        {(binders ?? []).map((b) => (
          <BinderCard key={b.id} binder={b} count={binderCounts?.get(b.id)} onClick={() => navigate(`/binder/${b.id}`)} />
        ))}
      </div>

      {newBinder ? (
        <div className="pixel-box" style={{ padding: 12, marginTop: 12 }}>
          <input
            className="pixel-select"
            style={{ width: '100%' }}
            maxLength={30}
            placeholder="Binder name"
            value={binderName}
            onChange={(e) => setBinderName(e.target.value)}
            autoFocus
          />
          <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
            {ownedDesigns.map((d) => (
              <button
                key={d.id}
                className={`binder-designs__swatch binder--${d.id}${binderDesign === d.id ? ' is-active' : ''}`}
                title={d.name}
                onClick={() => setBinderDesign(d.id)}
              />
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setNewBinder(false)}>CANCEL</button>
            <button className="btn" style={{ flex: 1 }} disabled={!binderName.trim()} onClick={saveBinder}>CREATE</button>
          </div>
        </div>
      ) : (
        <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setNewBinder(true)}>
          + NEW BINDER
        </button>
      )}
      <button className="btn pink" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/shop')}>
        BINDER SHOP
      </button>

      <div className="section-label">MY CHEKIS ({filteredChekis.length})</div>
      {chekis && chekis.length > 0 && (
        <>
          <div className="scroll-x">
            {(['all', ...CHEKI_TYPES] as (ChekiType | 'all')[]).map((t) => (
              <button key={t} className={`chip ${filterType === t ? 'purple' : ''}`} onClick={() => setFilterType(t)}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 10, marginTop: 10 }}>
            <select className="pixel-select" value={filterMaid} onChange={(e) => setFilterMaid(e.target.value)}>
              <option value="">All maids</option>
              {(maids ?? []).filter((m) => ownMaidIds.has(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="pixel-select" value={filterCafe} onChange={(e) => setFilterCafe(e.target.value)}>
              <option value="">All cafes</option>
              {(cafes ?? []).filter((c) => ownCafeIds.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}
      {chekis && chekis.length === 0 && (
        <div className="empty pixel-box">No chekis yet. Tap Upload to add one.</div>
      )}
      {chekis && chekis.length > 0 && filteredChekis.length === 0 && (
        <div className="empty pixel-box" style={{ marginTop: 12 }}>No chekis match.</div>
      )}
      <div style={{ marginTop: 12 }}>
        <ChekiGrid chekis={filteredChekis} />
      </div>

      <button className="btn ghost" style={{ marginTop: 22, width: '100%' }} onClick={signOut}>
        SIGN OUT
      </button>
    </div>
  );
}
