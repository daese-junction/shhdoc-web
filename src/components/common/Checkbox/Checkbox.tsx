import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Checkbox({
  label,
  error,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className={`w-4 h-4 shrink-0 grid place-items-center rounded border text-transparent transition-colors peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 ${
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
            <path d="M3.5 8.5 6.5 11.5 12.5 5" />
          </svg>
        </span>
        {label && <span className="text-sm text-text-primary">{label}</span>}
      </label>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
