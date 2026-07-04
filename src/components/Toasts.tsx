import { useToasts } from '../data/toast';
import './Toasts.css';

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <button key={t.id} className={`toast toast--${t.kind} pixel-box`} onClick={() => dismiss(t.id)}>
          {t.kind === 'error' ? '⚠ ' : '✓ '}{t.message}
        </button>
      ))}
    </div>
  );
}
