import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(url, anonKey, {
  // Implicit flow returns tokens in the URL hash, so a magic link works even
  // when opened in a different browser than the one that requested it.
  auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true },
});

export function chekiPhotoUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return supabase.storage.from('chekis').getPublicUrl(path).data.publicUrl;
}

// Public URL for an asset in the shared 'images' bucket (avatars, cafe/maid photos).
export function imageUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
}

// Uploads a blob to the shared 'images' bucket. Returns the storage path,
// or an error message the caller can surface.
export async function uploadImage(
  folder: string,
  blob: Blob,
): Promise<{ path: string | null; error?: string }> {
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('images').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) return { path: null, error: error.message };
  return { path };
}
