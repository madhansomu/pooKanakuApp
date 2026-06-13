import { create } from 'zustand';

interface ConfirmState {
  open: boolean;
  message: string;
  onConfirm: () => void;
  showConfirm: (message: string) => Promise<boolean>;
  resolveConfirm: (result: boolean) => void;
}

let _resolve: ((value: boolean) => void) | null = null;

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  message: '',
  onConfirm: () => {},
  showConfirm: (message: string) => {
    return new Promise<boolean>((resolve) => {
      _resolve = resolve;
      set({ open: true, message });
    });
  },
  resolveConfirm: (result: boolean) => {
    set({ open: false, message: '' });
    _resolve?.(result);
    _resolve = null;
  },
}));
