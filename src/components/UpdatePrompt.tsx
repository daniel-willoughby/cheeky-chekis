import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdatePrompt.css';

// Shows a toast when a new version of the app has been built and is
// waiting to take over. Refresh applies it immediately.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-toast">
      <span className="update-toast-emoji">✨</span>
      <div className="update-toast-text">
        <p className="update-toast-title">New version ready!</p>
        <p className="update-toast-sub">Refresh to get the latest Cheeky Chekis.</p>
      </div>
      <div className="update-toast-actions">
        <button className="btn pink" onClick={() => updateServiceWorker(true)}>
          Refresh
        </button>
        <button className="btn ghost" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    </div>
  );
}
