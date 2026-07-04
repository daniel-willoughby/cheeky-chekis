import { useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedBlob } from '../data/cropImage';
import './CropModal.css';

// Crop a freshly-picked photo. The selection box is fully draggable and
// resizable (drag any corner/edge) — no fixed aspect.
export function CropModal({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (blob: Blob, previewUrl: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // start with a centered box covering ~80% of the photo
    const c: Crop = {
      unit: 'px',
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: height * 0.8,
    };
    setCrop(c);
    setCompleted({ x: c.x, y: c.y, width: c.width, height: c.height, unit: 'px' } as PixelCrop);
  }

  async function confirm() {
    if (!imgRef.current || !completed || completed.width === 0) return;
    setBusy(true);
    const blob = await getCroppedBlob(imgRef.current, completed);
    onDone(blob, URL.createObjectURL(blob));
  }

  return (
    <div className="crop-backdrop">
      <div className="crop-modal pixel-box">
        <div className="crop-title">CROP YOUR PHOTO</div>
        <div className="crop-stage">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompleted(c)}
            keepSelection
          >
            <img ref={imgRef} src={src} alt="" onLoad={onImageLoad} className="crop-img" />
          </ReactCrop>
        </div>
        <p className="body-text crop-hint">Drag the corners to resize the crop window.</p>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>CANCEL</button>
          <button className="btn" style={{ flex: 1 }} onClick={confirm} disabled={busy || !completed}>
            {busy ? '...' : 'USE PHOTO'}
          </button>
        </div>
      </div>
    </div>
  );
}
