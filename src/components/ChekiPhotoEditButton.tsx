import { useRef, useState } from 'react';
import { CropModal } from './CropModal';
import { supabase } from '../data/supabase';
import { setChekiImage } from '../data/hooks';
import { pushToast } from '../data/toast';

// Replace a cheki's photo: pick -> crop -> upload to the chekis bucket ->
// point the cheki at the new image.
export function ChekiPhotoEditButton({
  chekiId,
  userId,
  onDone,
}: {
  chekiId: string;
  userId: string;
  onDone?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string>();
  const [busy, setBusy] = useState(false);

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
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from('chekis').upload(path, blob, { contentType: 'image/jpeg' });
      if (error) {
        pushToast(error.message);
        return;
      }
      await setChekiImage(chekiId, path);
      pushToast('Photo updated', 'ok');
      onDone?.();
    } catch {
      // setChekiImage surfaces its own error toast
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="chip" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? 'UPLOADING...' : 'CHANGE PHOTO'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      {rawSrc && <CropModal src={rawSrc} onCancel={() => setRawSrc(undefined)} onDone={(b) => onCropped(b)} />}
    </>
  );
}
