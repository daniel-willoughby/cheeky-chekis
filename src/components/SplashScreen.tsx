import { useEffect, useState } from 'react';
import './SplashScreen.css';

const MESSAGE = 'Are you ready to be cheeky?';
const SHOW_MS = 1500;
const FADE_MS = 350;

// Full-screen splash shown once per page load (mounted in main.tsx, so it
// never re-appears on in-app navigation). Fades out after ~1.5s.
export function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), SHOW_MS);
    const t2 = setTimeout(() => setGone(true), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`splash${leaving ? ' splash--leave' : ''}`}>
      <div className="splash__box">
        <img src={`${import.meta.env.BASE_URL}icons/logo.png`} alt="Cheeky Chekis" className="splash__logo" />
      </div>
      <p className="splash__text" aria-label={MESSAGE}>
        {MESSAGE.split('').map((ch, i) => (
          <span key={i} className="splash__char" style={{ animationDelay: `${i * 0.05}s` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
    </div>
  );
}
