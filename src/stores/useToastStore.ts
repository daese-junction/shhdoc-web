import { create } from "zustand";

type ToastType = "info" | "success" | "error";

/** 되돌리기처럼 토스트에서 바로 실행하는 동작 */
interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  type?: ToastType;
  /** ms, 0이면 자동으로 닫지 않는다 */
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, options?: ToastType | ToastOptions) => number;
  dismiss: (id: number) => void;
}

/** duration 을 따로 주지 않았을 때 닫히는 시간 */
const DEFAULT_DURATION = 5000;

let nextId = 0;

const toOptions = (options?: ToastType | ToastOptions): ToastOptions =>
  typeof options === "string" ? { type: options } : (options ?? {});

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, options) => {
    const {
      type = "info",
      duration = DEFAULT_DURATION,
      action,
    } = toOptions(options);
    const id = nextId++;

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, action }],
    }));

    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }

    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
