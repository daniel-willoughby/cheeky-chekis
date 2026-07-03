import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(url, anonKey, {
  auth: { flowType: 'pkce' },
});

export function chekiPhotoUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return supabase.storage.from('chekis').getPublicUrl(path).data.publicUrl;
}
