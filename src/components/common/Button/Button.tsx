import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** 툴바처럼 여백을 아껴야 하는 자리에는 `sm`. 기본은 `md`. */
  size?: ButtonSize;
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

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "px-4 py-2 text-sm",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: "size-8 shrink-0 p-0 text-xs",
  md: "size-10 shrink-0 p-0 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
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
      // 글자 크기는 size 가 정한다 — 여기서 text-sm 을 박으면 sm 이 먹히지 않는다
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]
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
