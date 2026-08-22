import type {
  AuditLogFilter,
  DocumentGrade,
  MailResult,
} from "@/types/auditLog";

/** 아무 조건도 걸지 않은 상태 */
export const EMPTY_AUDIT_LOG_FILTER: AuditLogFilter = {
  keyword: "",
  grade: "all",
  result: "all",
  from: "",
  to: "",
};

export const DOCUMENT_GRADE_LABEL: Record<DocumentGrade, string> = {
  external: "외부가능",
  internal: "내부용",
};

export const MAIL_RESULT_LABEL: Record<MailResult, string> = {
  deliverySuccess: "수신성공",
  deliveryFailed: "수신실패",
  sendFailed: "발신실패",
  sendBlocked: "발신차단",
};

interface FilterOption {
  label: string;
  value: string;
}

const toOptions = (labels: Record<string, string>): FilterOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

// 전체 항목은 무엇의 전체인지 드러나게 필드 이름을 붙여 적는다
export const DOCUMENT_GRADE_OPTIONS: FilterOption[] = [
  { label: "전체 문서 등급", value: "all" },
  ...toOptions(DOCUMENT_GRADE_LABEL),
];

export const MAIL_RESULT_OPTIONS: FilterOption[] = [
  { label: "전체 전송 상태", value: "all" },
  ...toOptions(MAIL_RESULT_LABEL),
];
