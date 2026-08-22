import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * 아이콘만 담는 정사각형 버튼.
   * 좌우 여백을 없애야 아이콘이 정확히 가운데 온다 — `px-4` 가 남으면
   * 콘텐츠 박스보다 큰 아이콘이 오른쪽으로 밀린다.
   */
  iconOnly?: boolean;
  /** 진행 중 표시. 스피너를 앞에 붙이고 버튼을 잠근다. */
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
  secondary:
    "bg-surface-tertiary text-text-primary hover:bg-gray-200 active:bg-gray-300",
  outline:
    "border border-border-tertiary bg-transparent text-text-primary hover:bg-surface-tertiary active:bg-gray-200",
};

export function Button({
  variant = "primary",
  iconOnly = false,
  loading = false,
  className = "",
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        iconOnly ? "size-10 shrink-0 p-0" : "px-4 py-2"
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && (
        // 테두리 한 쪽만 비워 두면 회전할 때 도는 게 보인다. 색은 글자색을 따라간다.
        <span
          aria-hidden
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {/* 아이콘 버튼은 스피너가 아이콘 자리를 대신한다 */}
      {(!loading || !iconOnly) && children}
    </button>
  );
}
