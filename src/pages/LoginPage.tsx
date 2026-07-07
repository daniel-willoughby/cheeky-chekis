import { useState } from 'react';
import { useAuth } from '../data/auth';
import './common.css';
import './LoginPage.css';

export function LoginPage() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    if (mode === 'forgot') {
      setBusy(true);
      setError(null);
      const { error } = await requestPasswordReset(email);
      setBusy(false);
      if (error) setError(error);
      else setResetSent(true);
      return;
    }

    if (!password) return;
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    setError(null);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error, needsConfirm } = await signUp(email, password);
      if (error) setError(error);
      else if (needsConfirm) setConfirmMsg(true);
      // otherwise the auth state flips to a session and we're logged straight in
    }
    setBusy(false);
  }

  function switchMode(next: 'login' | 'signup' | 'forgot') {
    setMode(next);
    setError(null);
    setConfirmMsg(false);
    setResetSent(false);
  }

  return (
    <div className="screen login-screen">
      <div className="login-card pixel-box">
        <img src={`${import.meta.env.BASE_URL}icons/logo.png`} alt="" className="login-card__logo" />
        <h1 className="login-card__title">Cheeky Chekis</h1>
        <p className="body-text login-card__blurb">
          Welcome ૮ ˶ᵔ ᵕ ᵔ˶ ა Share your cheki magic with your cheeky friends!
        </p>

        {confirmMsg ? (
          <div className="login-card__sent">
            <p className="body-text">
              Almost there! Check <b>{email}</b> to confirm your account, then come back and log in.
            </p>
            <button className="btn ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => switchMode('login')}>
              BACK TO LOG IN
            </button>
          </div>
        ) : resetSent ? (
          <div className="login-card__sent">
            <p className="body-text">
              Sent! Check <b>{email}</b> for a link to reset your password.
            </p>
            <button className="btn ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => switchMode('login')}>
              BACK TO LOG IN
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <form onSubmit={submit}>
            <p className="body-text" style={{ margin: '0 0 10px' }}>
              Enter your email and we'll send a reset link.
            </p>
            <input
              className="pixel-select"
              style={{ width: '100%' }}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="body-text login-card__error">{error}</p>}
            <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy}>
              {busy ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => switchMode('login')}
            >
              BACK TO LOG IN
            </button>
          </form>
        ) : (
          <>
            <div className="login-tabs">
              <button
                type="button"
                className={`chip ${mode === 'login' ? 'purple' : ''}`}
                onClick={() => switchMode('login')}
              >
                LOG IN
              </button>
              <button
                type="button"
                className={`chip ${mode === 'signup' ? 'purple' : ''}`}
                onClick={() => switchMode('signup')}
              >
                SIGN UP
              </button>
            </div>
            <form onSubmit={submit}>
              <input
                className="pixel-select"
                style={{ width: '100%' }}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <input
                className="pixel-select"
                style={{ width: '100%', marginTop: 10 }}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="body-text login-card__error">{error}</p>}
              <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy}>
                {busy ? 'PLEASE WAIT...' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
              </button>
            </form>
            {mode === 'login' && (
              <button type="button" className="login-card__forgot" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
