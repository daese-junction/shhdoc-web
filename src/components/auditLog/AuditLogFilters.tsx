"use client";

import { Button, SearchInput } from "@/components/common";
import type {
  AuditLogFilter,
  DocumentGrade,
  MailResult,
} from "@/types/auditLog";
import {
  DOCUMENT_GRADE_OPTIONS,
  EMPTY_AUDIT_LOG_FILTER,
  MAIL_RESULT_OPTIONS,
} from "./auditLogMeta";

const SELECT_CLASS =
  "h-9 rounded-lg border border-border-tertiary bg-surface-primary px-2 text-sm text-text-primary transition-colors focus-visible:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

const DATE_CLASS = `${SELECT_CLASS} tabular-nums`;

interface AuditLogFiltersProps {
  filter: AuditLogFilter;
  /** 입력 중인 검색어. 적용은 Enter(또는 지우기)에서 한다. */
  keywordDraft: string;
  onKeywordDraftChange: (value: string) => void;
  onChange: (patch: Partial<AuditLogFilter>) => void;
  onReset: () => void;
}

export function AuditLogFilters({
  filter,
  keywordDraft,
  onKeywordDraftChange,
  onChange,
  onReset,
}: AuditLogFiltersProps) {
  const isFiltered = (
    Object.keys(EMPTY_AUDIT_LOG_FILTER) as (keyof AuditLogFilter)[]
  ).some((key) => filter[key] !== EMPTY_AUDIT_LOG_FILTER[key]);

  return (
    <>
      <div className="w-full sm:w-64">
        <SearchInput
          value={keywordDraft}
          onChange={onKeywordDraftChange}
          onSearch={(keyword) => onChange({ keyword })}
          placeholder="제목 검색"
          aria-label="메일 제목 검색"
        />
      </div>

      {/* 기간: 시작일 ~ 종료일 */}
      <div className="flex items-center gap-1 text-sm text-text-secondary">
        <input
          type="date"
          aria-label="기간 시작일"
          value={filter.from}
          // 시작일이 종료일을 넘지 못하게 막는다
          max={filter.to || undefined}
          onChange={(event) => onChange({ from: event.target.value })}
          className={DATE_CLASS}
        />
        <span aria-hidden>~</span>
        <input
          type="date"
          aria-label="기간 종료일"
          value={filter.to}
          min={filter.from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
          className={DATE_CLASS}
        />
      </div>

      <select
        aria-label="문서 등급"
        value={filter.grade}
        onChange={(event) =>
          onChange({ grade: event.target.value as DocumentGrade | "all" })
        }
        className={SELECT_CLASS}
      >
        {DOCUMENT_GRADE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="메일 결과"
        value={filter.result}
        onChange={(event) =>
          onChange({ result: event.target.value as MailResult | "all" })
        }
        className={SELECT_CLASS}
      >
        {MAIL_RESULT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isFiltered && (
        <Button variant="outline" size="sm" onClick={onReset}>
          초기화
        </Button>
      )}
    </>
  );
}
