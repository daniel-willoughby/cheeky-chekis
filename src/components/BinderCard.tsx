import type { Binder } from '../types';
import './BinderCard.css';

export function BinderCard({ binder, count, onClick }: { binder: Binder; count?: number; onClick?: () => void }) {
  return (
    <button className={`binder-card binder--${binder.design}`} onClick={onClick}>
      <div className="binder-card__spine" />
      <div className="binder-card__body">
        <span className="binder-card__name">{binder.name}</span>
        <span className="binder-card__count body-text">{count ?? 0} chekis</span>
      </div>
    </button>
  );
}
