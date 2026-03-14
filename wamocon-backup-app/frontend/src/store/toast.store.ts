import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: ToastItem[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;
}

let _id = 0;

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = ++_id;
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 4500);
    },
    removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));
