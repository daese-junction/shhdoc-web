"use client";

import { useToastStore } from "@/stores/useToastStore";

const typeClasses = {
  info: "bg-gray-800",
  success: "bg-success",
  error: "bg-error",
};

export function Toast() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-2.5 text-left text-sm text-white shadow-lg sm:w-auto ${typeClasses[toast.type]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
