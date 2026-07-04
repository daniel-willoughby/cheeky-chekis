import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontChoice = 'pixel' | 'arial';

const SCALE_STEPS = [100, 112, 124, 136] as const; // % of base rem size

interface SettingsState {
  font: FontChoice;
  scaleIndex: number; // index into SCALE_STEPS
  setFont: (font: FontChoice) => void;
  biggerText: () => void;
  smallerText: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      font: 'pixel',
      scaleIndex: 0,
      setFont: (font) => set({ font }),
      biggerText: () => set((s) => ({ scaleIndex: Math.min(s.scaleIndex + 1, SCALE_STEPS.length - 1) })),
      smallerText: () => set((s) => ({ scaleIndex: Math.max(s.scaleIndex - 1, 0) })),
    }),
    { name: 'cheeky-chekis-settings' },
  ),
);

export const textScalePercent = (scaleIndex: number): number => SCALE_STEPS[scaleIndex];
export const SCALE_STEP_COUNT = SCALE_STEPS.length;
