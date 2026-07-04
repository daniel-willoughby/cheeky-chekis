import type { Cheki, Maid } from '../types';
import { ChekiImage } from './ChekiImage';
import { formatKRW } from '../data/hooks';
import { TYPE_CLASS, maidNames } from '../data/chekiMeta';
import './ChekiCard.css';

export function ChekiCard({
  cheki,
  maids,
  onClick,
  likeCount = 0,
  liked = false,
  onToggleLike,
}: {
  cheki: Cheki;
  maids?: Maid[];
  onClick?: () => void;
  likeCount?: number;
  liked?: boolean;
  onToggleLike?: () => void;
}) {
  return (
    <button className="cheki-card" onClick={onClick}>
      <div className="cheki-card__photo">
        <ChekiImage cheki={cheki} />
        {cheki.status === 'on-the-way' && (
          <span className="cheki-card__ship chip blue">ON THE WAY</span>
        )}
        {cheki.sold ? (
          <span className="cheki-card__sale chip gold">SOLD</span>
        ) : (
          cheki.forSale && <span className="cheki-card__sale chip pink">FOR SALE</span>
        )}
      </div>
      <div className="cheki-card__foot">
        <span className={`chip ${TYPE_CLASS[cheki.type]}`}>{cheki.type.toUpperCase()}</span>
        <span className="cheki-card__name body-text">{maidNames(maids)}</span>
        {cheki.forSale && <span className="cheki-card__price body-text">{formatKRW(cheki.price)}</span>}
        {onToggleLike && (
          <span
            className={`cheki-card__like${liked ? ' is-liked' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
          >
            {liked ? '♥' : '♡'} {likeCount > 0 ? likeCount : ''}
          </span>
        )}
      </div>
    </button>
  );
}
