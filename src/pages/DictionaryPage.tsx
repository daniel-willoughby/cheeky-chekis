import { BackHeader } from '../components/BackHeader';
import './common.css';
import './DictionaryPage.css';

const ENTRIES = [
  { term: 'Cheki', color: 'purple', def: 'A Polaroid picture of maids.' },
  { term: 'Pin', color: 'gold', def: 'A cheki with no decoration.' },
  { term: '4-cut', color: 'purple', def: 'Photo strip of four poses in one frame.' },
  { term: 'Homework', color: 'pink', def: 'A cheki with special decoration.' },
  { term: 'Twin', color: 'purple', def: 'A cheki with two maids.' },
  { term: 'Group', color: 'purple', def: 'A cheki with several maids together.' },
  { term: 'Grid', color: 'blue', def: 'Four or more chekis that are decorated together by a maid to form a pattern.' },
  { term: 'Binder', color: 'purple', def: 'An album to sort all your chekis in.' },
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
