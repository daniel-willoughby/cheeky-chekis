import { useState } from 'react';
import { BackHeader } from '../components/BackHeader';
import { useSettings, textScalePercent, SCALE_STEP_COUNT } from '../data/settings';
import { useProfile, updateUsername, useActivityLog, usePublicProfilesByIds } from '../data/hooks';
import { useAuth } from '../data/auth';
import { pushToast } from '../data/toast';
import './common.css';
import './SettingsPage.css';

export function SettingsPage() {
  const font = useSettings((s) => s.font);
  const setFont = useSettings((s) => s.setFont);
  const scaleIndex = useSettings((s) => s.scaleIndex);
  const biggerText = useSettings((s) => s.biggerText);
  const smallerText = useSettings((s) => s.smallerText);
  const { userId } = useAuth();
  const profile = useProfile();
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const isAdmin = profile?.isAdmin ?? false;
  const activity = useActivityLog(50);
  const actors = usePublicProfilesByIds(
    isAdmin ? [...new Set((activity ?? []).map((a) => a.userId).filter(Boolean) as string[])] : [],
  );

  function startEditUsername() {
    setUsernameDraft(profile?.username ?? '');
    setEditingUsername(true);
  }

  async function saveUsername() {
    if (!userId) return;
    setSaving(true);
    try {
      await updateUsername(userId, usernameDraft);
      pushToast('Username saved', 'ok');
      setEditingUsername(false);
    } catch {
      // error toast already shown; keep the form open so nothing is lost
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <BackHeader title="Settings" />

      <img src={`${import.meta.env.BASE_URL}icons/settings.png`} alt="" className="settings-logo" />

      <div className="section-label">ACCOUNT</div>

      <div className="settings-row pixel-box">
        <div className="settings-row__label">USERNAME</div>
        {editingUsername ? (
          <div style={{ width: '100%' }}>
            <input
              className="pixel-select"
              style={{ width: '100%' }}
              maxLength={20}
              value={usernameDraft}
              onChange={(e) => setUsernameDraft(e.target.value)}
              placeholder="username"
              autoFocus
            />
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setEditingUsername(false)}>CANCEL</button>
              <button className="btn" style={{ flex: 1 }} disabled={saving || !usernameDraft.trim()} onClick={saveUsername}>SAVE</button>
            </div>
          </div>
        ) : (
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="body-text">@{profile?.username}</span>
            <button className="chip purple" onClick={startEditUsername}>EDIT</button>
          </div>
        )}
      </div>

      <div className="section-label">ACCESSIBILITY</div>

      <div className="settings-row pixel-box">
        <div className="settings-row__label">FONT</div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className={`chip ${font === 'pixel' ? 'purple' : ''}`} onClick={() => setFont('pixel')}>PIXEL (DEFAULT)</button>
          <button className={`chip ${font === 'arial' ? 'purple' : ''}`} onClick={() => setFont('arial')}>ARIAL</button>
        </div>
      </div>

      <div className="settings-row pixel-box">
        <div className="settings-row__label">TEXT SIZE</div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <button className="chip" disabled={scaleIndex === 0} onClick={smallerText}>A-</button>
          <span className="body-text">{textScalePercent(scaleIndex)}%</span>
          <button className="chip" disabled={scaleIndex === SCALE_STEP_COUNT - 1} onClick={biggerText}>A+</button>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="section-label">ACTIVITY LOG</div>
          <div className="pixel-box" style={{ padding: 12 }}>
            {!activity || activity.length === 0 ? (
              <p className="body-text" style={{ margin: 0, fontSize: 16 }}>Nothing logged yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {activity.map((a) => (
                  <div key={a.id} className="body-text" style={{ fontSize: 15, lineHeight: 1.3 }}>
                    <b>{a.action}</b>
                    {' · '}
                    {a.userId ? `@${actors?.get(a.userId)?.username ?? '...'}` : 'unknown'}
                    {' · '}
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="section-label">DISCLAIMER</div>
      <div className="pixel-box" style={{ padding: 14 }}>
        <p className="body-text" style={{ margin: 0, lineHeight: 1.3 }}>
          All the material used from maids and cafes are available in their public Instagram profiles.
          All the icons and binder designs are by Bel. All assets were created by Bel (and Dan)
        </p>
      </div>
    </div>
  );
}
