"use client";

import { useToastStore, type Toast as ToastItem } from "@/stores/useToastStore";

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
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

interface ToastMessageProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

/** 자동 닫힘은 스토어의 duration 이 담당한다 — 여기서는 그리기만 한다 */
function ToastMessage({ toast, onDismiss }: ToastMessageProps) {
  return (
    // 액션 버튼을 담아야 해서 바깥은 div 로 둔다 — 버튼은 중첩할 수 없다
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg sm:w-auto ${typeClasses[toast.type]}`}
    >
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="min-w-0 flex-1 text-left"
      >
        {toast.message}
      </button>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
