import { useState } from 'react';
import { useAuth } from '../data/auth';
import './common.css';
import './LoginPage.css';

// Shown when the user arrives via a password-reset email link (recovery
// session). They pick a new password and are dropped straight into the app.
export function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setError(error);
    // on success, recovering flips off and the app renders
  }

  return (
    <div className="screen login-screen">
      <div className="login-card pixel-box">
        <img src={`${import.meta.env.BASE_URL}icons/logo.png`} alt="" className="login-card__logo" />
        <h1 className="login-card__title">New Password</h1>
        <p className="body-text login-card__blurb">Pick a new password for your account.</p>
        <form onSubmit={submit}>
          <input
            className="pixel-select"
            style={{ width: '100%' }}
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <input
            className="pixel-select"
            style={{ width: '100%', marginTop: 10 }}
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="body-text login-card__error">{error}</p>}
          <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy}>
            {busy ? 'SAVING...' : 'SET PASSWORD'}
          </button>
        </form>
        <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={signOut}>
          CANCEL
        </button>
      </div>
    </div>
  );
}
