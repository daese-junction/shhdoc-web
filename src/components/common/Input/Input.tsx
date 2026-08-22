import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** 입력창 왼쪽 안쪽에 붙는 요소 (아이콘 등) */
  leftSlot?: ReactNode;
  /** 입력창 오른쪽 안쪽에 붙는 요소 (버튼, 단위 등) */
  rightSlot?: ReactNode;
  /** 에러·힌트 영역을 미리 확보하지 않는다 (검색창처럼 메시지가 없는 경우) */
  hideMessage?: boolean;
  /** horizontal 은 라벨을 입력창 왼쪽에 두어 세로 높이를 줄인다 */
  layout?: "vertical" | "horizontal";
}

export function Input({
  label,
  error,
  hint,
  leftSlot,
  rightSlot,
  hideMessage = false,
  layout = "vertical",
  id,
  className = "",
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = error || hint ? `${inputId}-desc` : undefined;
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={
        isHorizontal
          ? "grid w-full grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1"
          : "flex w-full flex-col gap-1.5"
      }
    >
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}

      <div className={`relative ${isHorizontal && !label ? "col-start-2" : ""}`}>
        {leftSlot && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
            {leftSlot}
          </div>
        )}

        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          // text-base(16px) 이하면 iOS 에서 포커스 시 화면이 확대되므로 모바일은 16px 유지
          className={`h-11 w-full rounded-lg border bg-surface-primary text-base transition-colors sm:h-10 sm:text-sm
            text-text-primary placeholder:text-text-tertiary
            focus-visible:outline-none focus:ring-2
            disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:text-text-tertiary
            ${leftSlot ? "pl-10" : "pl-3"}
            ${rightSlot ? "pr-11" : "pr-3"}
            ${
              error
                ? "border-error focus:border-error focus:ring-error/25"
                : "border-border-tertiary focus:border-brand-500 focus:ring-brand-500/25"
            }
            ${className}`}
          {...props}
        />

        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {rightSlot}
          </div>
        )}
      </div>

      {/* 메시지가 없을 때도 한 줄 높이를 유지해 에러 표시 시 레이아웃이 밀리지 않게 한다 */}
      {!hideMessage && (
        <p
          id={describedById}
          className={`min-h-4 text-xs leading-4 ${
            isHorizontal ? "col-start-2" : ""
          } ${error ? "text-error" : "text-text-tertiary"}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
