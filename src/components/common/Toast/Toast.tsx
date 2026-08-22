"use client";

import { useToastStore } from "@/stores/useToastStore";

const typeClasses = {
  info: "bg-secondary",
  success: "bg-success",
  error: "bg-error",
};

export function Toast() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={`px-4 py-2 rounded-md text-white text-sm shadow-lg cursor-pointer ${typeClasses[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
