import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedBlob, type PixelCrop } from '../data/cropImage';
import './CropModal.css';

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: 'FREE', value: undefined },
  { label: '3:4', value: 3 / 4 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
];

// Crop a freshly-picked photo before saving. Aspect can be chosen freely.
export function CropModal({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (blob: Blob, previewUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(3 / 4);
  const [areaPixels, setAreaPixels] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: unknown, pixels: PixelCrop) => {
    setAreaPixels(pixels);
  }, []);

  async function confirm() {
    if (!areaPixels) return;
    setBusy(true);
    const blob = await getCroppedBlob(src, areaPixels);
    onDone(blob, URL.createObjectURL(blob));
  }

  return (
    <div className="crop-backdrop">
      <div className="crop-modal pixel-box">
        <div className="crop-title">CROP YOUR PHOTO</div>
        <div className="crop-stage">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="row wrap" style={{ gap: 6, justifyContent: 'center', marginTop: 10 }}>
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              className={`chip ${aspect === a.value ? 'purple' : ''}`}
              onClick={() => setAspect(a.value)}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="crop-zoom">
          <span className="crop-zoom__label">ZOOM</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>CANCEL</button>
          <button className="btn" style={{ flex: 1 }} onClick={confirm} disabled={busy}>
            {busy ? '...' : 'USE PHOTO'}
          </button>
        </div>
      </div>
    </div>
  );
}
