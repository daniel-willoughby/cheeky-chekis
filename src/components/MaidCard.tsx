import type { Maid } from '../types';
import './MaidCard.css';

export function MaidCard({
  maid,
  cafeName,
  onClick,
  compact,
  highlighted,
}: {
  maid: Maid;
  cafeName?: string;
  onClick?: () => void;
  compact?: boolean;
  highlighted?: boolean;
}) {
  return (
    <button
      className={`maid-card${compact ? ' maid-card--compact' : ''}${highlighted ? ' maid-card--hl' : ''}`}
      style={{ ['--accent' as string]: maid.color }}
      onClick={onClick}
    >
      {highlighted && <span className="maid-card__star">★</span>}
      <div className="maid-card__portrait">
        {maid.imageUrl ? (
          <img src={maid.imageUrl} alt="" className="maid-card__portrait-img" />
        ) : (
          <span className="maid-card__emoji">{maid.emoji}</span>
        )}
      </div>
      <div className="maid-card__name">{maid.name}</div>
      {!compact && (
        <>
          <div className="maid-card__specialty body-text">{maid.specialty}</div>
          {cafeName && <div className="maid-card__cafe body-text">{cafeName}</div>}
        </>
      )}
    </button>
  );
}
