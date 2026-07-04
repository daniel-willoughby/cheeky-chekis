import { useState } from 'react';
import { useAuth } from '../data/auth';
import './common.css';
import './LoginPage.css';

export function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setSending(false);
    if (error) setError(error);
    else setSent(true);
  }

  return (
    <div className="screen login-screen">
      <div className="login-card pixel-box">
        <img src={`${import.meta.env.BASE_URL}icons/logo.png`} alt="" className="login-card__logo" />
        <h1 className="login-card__title">Cheeky Chekis</h1>
        <p className="body-text login-card__blurb">
          Collect, tag and share your maid cafe chekis.
        </p>

        {sent ? (
          <div className="login-card__sent">
            <p className="body-text">
              Check <b>{email}</b> for a magic link — tap it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <input
              className="pixel-select"
              style={{ width: '100%' }}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="body-text login-card__error">{error}</p>}
            <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={sending}>
              {sending ? 'SENDING...' : 'SEND MAGIC LINK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
