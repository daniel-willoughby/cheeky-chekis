import { BackHeader } from '../components/BackHeader';
import './common.css';
import './DictionaryPage.css';

const ENTRIES = [
  { term: 'Cheki', color: 'purple', def: 'An instant photo with a maid. The core collectible.' },
  { term: 'Pin', color: 'gold', def: 'Small badge-style cheki. Often rare and limited.' },
  { term: 'Normal', color: 'blue', def: 'Standard single-shot instant photo.' },
  { term: '4-cut', color: 'purple', def: 'Photo strip of four poses in one frame.' },
  { term: 'Homework', color: 'pink', def: 'A cheki with a handwritten note from the maid.' },
  { term: 'Twin', color: 'good', def: 'One cheki with two maids. Tag both.' },
  { term: 'Group', color: 'purple', def: 'A cheki with several maids together.' },
  { term: 'Grid', color: 'blue', def: 'A multi-shot grid layout in one print.' },
  { term: 'On hand', color: 'good', def: 'You physically have this cheki.' },
  { term: 'On the way', color: 'blue', def: 'Bought or traded, still shipping to you.' },
  { term: 'Binder', color: 'purple', def: 'A themed album you sort chekis into.' },
  { term: 'Rarity', color: 'gold', def: 'Maid card tier: N, R, SR, SSR.' },
];

export function DictionaryPage() {
  return (
    <div className="screen">
      <BackHeader title="Cheki Dictionary" />
      <div style={{ display: 'grid', gap: 12 }}>
        {ENTRIES.map((e) => (
          <div key={e.term} className="dict-row pixel-box">
            <span className={`chip ${e.color}`}>{e.term}</span>
            <span className="body-text dict-row__def">{e.def}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
