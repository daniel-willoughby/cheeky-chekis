import { useRef, useState } from 'react';
import { CropModal } from './CropModal';
import { uploadImage } from '../data/supabase';
import { pushToast } from '../data/toast';

// Pick a photo, crop it, upload to the shared images bucket, then hand the
// resulting storage path back to the caller. Shows its own busy/done state.
export function ImageUploadButton({
  folder,
  label = 'ADD PHOTO',
  onUploaded,
}: {
  folder: string;
  label?: string;
  onUploaded: (path: string) => Promise<void> | void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRawSrc(URL.createObjectURL(f));
    e.target.value = '';
  }

  async function onCropped(blob: Blob) {
    setRawSrc(undefined);
    setBusy(true);
    try {
      const { path, error } = await uploadImage(folder, blob);
      if (!path) {
        pushToast(error || 'Photo upload failed — run the latest SQL migration in Supabase.');
      } else {
        await onUploaded(path);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }
    } catch {
      // onUploaded already surfaces its own error toast
    }
    setBusy(false);
  }

  return (
    <>
      <button
        className={`chip ${done ? 'muted' : 'blue'}`}
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? 'UPLOADING...' : done ? 'SAVED ✓' : label}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      {rawSrc && (
        <CropModal src={rawSrc} onCancel={() => setRawSrc(undefined)} onDone={(b) => onCropped(b)} />
      )}
    </>
  );
}
