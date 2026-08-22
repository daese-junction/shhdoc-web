interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-border"
        }`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}
