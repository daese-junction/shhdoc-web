"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import CloseIcon from "@mui/icons-material/Close";

interface RecipientInputProps {
  id?: string;
  /** 확정된 수신자 목록 */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** 접근성 상 필수 입력임을 알린다 */
  required?: boolean;
}

/** 서버에서 한 번 더 검증하므로 여기서는 실수를 걸러낼 정도만 본다 */
const EMAIL_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

/** 입력 중인 값이 "쉼표 + 공백"으로 끝나면 태그로 확정한다 */
const COMMIT_PATTERN = /,\s$/;

/**
 * 이메일을 태그(칩)로 관리하는 입력창.
 * 쉼표 뒤 스페이스, Enter, 포커스 아웃 시점에 태그로 확정한다.
 */
export function RecipientInput({
  id,
  value,
  onChange,
  placeholder,
  required = false,
}: RecipientInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = id ? `${id}-error` : undefined;

  /**
   * 입력값을 쉼표로 잘라 태그로 확정한다.
   * 형식이 틀린 값이 하나라도 있으면 아무것도 추가하지 않고 입력값을 남겨 고쳐 쓰게 한다.
   */
  const commit = (raw: string) => {
    const candidates = raw
      .split(",")
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    if (candidates.length === 0) {
      setDraft("");
      setError(null);
      return;
    }

    const invalid = candidates.find(
      (candidate) => !EMAIL_PATTERN.test(candidate),
    );
    if (invalid) {
      setDraft(raw.trim());
      setError(`'${invalid}' 는 올바른 이메일 형식이 아닙니다.`);
      return;
    }

    // 이미 담긴 주소는 다시 넣지 않는다 (대소문자는 구분하지 않음)
    const seen = new Set(value.map((email) => email.toLowerCase()));
    const added = candidates.filter((candidate) => {
      const key = candidate.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (added.length > 0) onChange([...value, ...added]);
    setDraft("");
    setError(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;

    if (COMMIT_PATTERN.test(raw)) {
      commit(raw.replace(COMMIT_PATTERN, ""));
      return;
    }

    setDraft(raw);
    // 다시 고쳐 쓰기 시작하면 이전 에러는 지운다
    if (error) setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit(draft);
      return;
    }

    // 입력창이 비었을 때 백스페이스로 마지막 태그를 지운다
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  return (
    <div className="flex w-full flex-col gap-1">
      {/* 빈 공간을 눌러도 입력창으로 포커스가 가도록 컨테이너에서 받는다 */}
      <div
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={`flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-surface-primary px-2 py-1.5 transition-colors focus-within:ring-2 sm:min-h-10 ${
          error
            ? "border-error focus-within:border-error focus-within:ring-error/25"
            : "border-border-tertiary focus-within:border-brand-500 focus-within:ring-brand-500/25"
        }`}
      >
        {value.map((email, index) => (
          <span
            key={email}
            className="flex max-w-full items-center gap-0.5 rounded-md bg-surface-tertiary py-0.5 pr-0.5 pl-2 text-sm text-text-primary"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              aria-label={`${email} 삭제`}
              onClick={() => removeAt(index)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-border-secondary hover:text-text-primary"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          // 태그가 하나라도 있으면 입력창 자체는 비어도 되므로 required 를 떼어낸다
          required={required && value.length === 0}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder={value.length === 0 ? placeholder : ""}
          // text-base(16px) 이하면 iOS 에서 포커스 시 화면이 확대되므로 모바일은 16px 유지
          className="h-7 min-w-40 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none sm:text-sm"
        />
      </div>

      {error && (
        <p id={errorId} className="text-xs leading-4 text-error">
          {error}
        </p>
      )}
    </div>
  );
}
