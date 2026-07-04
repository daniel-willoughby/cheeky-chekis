import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  kind: 'error' | 'ok';
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, kind?: Toast['kind']) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = 'error') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// non-hook helper for use inside data-layer functions
export const pushToast = (message: string, kind: Toast['kind'] = 'error') =>
  useToasts.getState().push(message, kind);
