import { BackHeader } from '../components/BackHeader';
import './common.css';
import './DictionaryPage.css';

const ENTRIES = [
  { term: 'Cheki', color: 'purple', def: 'An instant photo with a maid. The core collectible.' },
  { term: 'Pin', color: 'gold', def: 'A cheki with no decoration.' },
  { term: 'Normal', color: 'blue', def: 'Standard single-shot instant photo.' },
  { term: '4-cut', color: 'purple', def: 'Photo strip of four poses in one frame.' },
  { term: 'Homework', color: 'pink', def: 'A cheki with special decoration.' },
  { term: 'Twin', color: 'purple', def: 'One cheki with two maids. Tag both.' },
  { term: 'Group', color: 'purple', def: 'A cheki with several maids together.' },
  { term: 'Grid', color: 'blue', def: '4 or more oshis that are decorated together to make a design.' },
  { term: 'On hand', color: 'purple', def: 'You physically have this cheki.' },
  { term: 'On the way', color: 'blue', def: 'Bought or traded, still shipping to you.' },
  { term: 'Binder', color: 'purple', def: 'A themed album you sort chekis into.' },
  { term: 'Oshi', color: 'pink', def: 'Your favourite maid.' },
  { term: 'Kamioshi', color: 'gold', def: 'Your super favourite maid.' },
  { term: 'Nioshi', color: 'purple', def: 'Your second favourite maid.' },
  { term: 'Cheki settlement', color: 'blue', def: 'Instagram story where you share your cheki and a message for the maid.' },
  { term: 'Event', color: 'pink', def: 'Special day where the maids usually wear special outfits.' },
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
