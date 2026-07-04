import { BackHeader } from '../components/BackHeader';
import { useSettings, textScalePercent, SCALE_STEP_COUNT } from '../data/settings';
import './common.css';
import './SettingsPage.css';

export function SettingsPage() {
  const font = useSettings((s) => s.font);
  const setFont = useSettings((s) => s.setFont);
  const scaleIndex = useSettings((s) => s.scaleIndex);
  const biggerText = useSettings((s) => s.biggerText);
  const smallerText = useSettings((s) => s.smallerText);

  return (
    <div className="screen">
      <BackHeader title="Settings" />

      <img src={`${import.meta.env.BASE_URL}icons/settings.png`} alt="" className="settings-logo" />

      <div className="section-label">ACCESSIBILITY</div>

      <div className="settings-row pixel-box">
        <div className="settings-row__label">FONT</div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className={`chip ${font === 'pixel' ? 'purple' : ''}`} onClick={() => setFont('pixel')}>PIXEL (DEFAULT)</button>
          <button className={`chip ${font === 'arial' ? 'purple' : ''}`} onClick={() => setFont('arial')}>ARIAL</button>
        </div>
      </div>

      <div className="settings-row pixel-box">
        <div className="settings-row__label">TEXT SIZE</div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <button className="chip" disabled={scaleIndex === 0} onClick={smallerText}>A-</button>
          <span className="body-text">{textScalePercent(scaleIndex)}%</span>
          <button className="chip" disabled={scaleIndex === SCALE_STEP_COUNT - 1} onClick={biggerText}>A+</button>
        </div>
      </div>

      <div className="section-label">DISCLAIMER</div>
      <div className="pixel-box" style={{ padding: 14 }}>
        <p className="body-text" style={{ margin: 0, lineHeight: 1.3 }}>
          All the material used from maids and cafes are available in their public Instagram profiles.
          All the icons and binder designs are by Bel. The app idea and all its contents belong to Bel (and Dan).
        </p>
      </div>
    </div>
  );
}
