import { create } from 'zustand';

// Bumped after every mutation so hooks watching it know to refetch.
// Simpler than wiring Postgres realtime for a small friend-group app.
export const useDataVersion = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
