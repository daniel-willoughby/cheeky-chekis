import type { Binder } from '../types';
import './BinderCard.css';

export function BinderCard({ binder, onClick }: { binder: Binder; onClick?: () => void }) {
  return (
    <button className={`binder-card binder--${binder.design}`} onClick={onClick}>
      <div className="binder-card__spine" />
      <div className="binder-card__body">
        <span className="binder-card__name">{binder.name}</span>
        <span className="binder-card__count body-text">{binder.chekiIds.length} chekis</span>
      </div>
    </button>
  );
}
