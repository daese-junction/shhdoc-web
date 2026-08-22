import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** 일부만 선택된 상태. checked 대신 대시로 표시된다. */
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  error,
  indeterminate = false,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        {/* indeterminate 는 속성이 아니라 DOM 프로퍼티라 ref 로만 설정할 수 있다 */}
        <input
          type="checkbox"
          ref={(node) => {
            if (node) node.indeterminate = indeterminate;
          }}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={`w-4 h-4 shrink-0 grid place-items-center rounded border text-transparent transition-colors peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-checked:text-white peer-indeterminate:bg-brand-500 peer-indeterminate:border-brand-500 peer-indeterminate:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 ${
            error ? "border-error" : "border-border-secondary"
          } ${className}`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <path d={indeterminate ? "M3.5 8h9" : "M3.5 8.5 6.5 11.5 12.5 5"} />
          </svg>
        </span>
        {label && <span className="text-sm text-text-primary">{label}</span>}
      </label>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
