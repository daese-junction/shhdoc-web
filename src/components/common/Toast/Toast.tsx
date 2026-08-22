"use client";

import { useEffect } from "react";
import { useToastStore, type Toast as ToastItem } from "@/stores/useToastStore";

const typeClasses = {
  info: "bg-gray-800",
  success: "bg-success",
  error: "bg-error",
};

const AUTO_DISMISS_MS = 5000;

export function Toast() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-2.5 text-left text-sm text-white shadow-lg sm:w-auto ${typeClasses[toast.type]}`}
    >
      {toast.message}
    </button>
  );
}
