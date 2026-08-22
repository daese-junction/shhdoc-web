import type {
  AuditDocument,
  DocumentGrade,
  DocumentGradeCount,
  MailResult,
} from "@/types/auditLog";
import { DOCUMENT_GRADE_LABEL, MAIL_RESULT_LABEL } from "./auditLogMeta";

const BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const GRADE_CLASS: Record<DocumentGrade, string> = {
  external: "bg-surface-tertiary text-text-secondary",
  internal: "bg-warning/10 text-warning",
};

/** 발신 결과. 수신까지 끝난 건만 성공(초록)으로 본다. */
const RESULT_CLASS: Record<MailResult, string> = {
  deliverySuccess: "bg-success/10 text-success",
  deliveryFailed: "bg-error/10 text-error",
  sendFailed: "bg-error/10 text-error",
  sendBlocked: "bg-warning/10 text-warning",
};

/** 배지를 그리는 순서. 외부가능을 먼저 둔다. */
const GRADE_ORDER = Object.keys(DOCUMENT_GRADE_LABEL) as DocumentGrade[];

/** 문서 목록을 등급별 개수로 접는다. 그 등급이 없으면 빼고 센다. */
export function countByGrade(documents: AuditDocument[]): DocumentGradeCount[] {
  return GRADE_ORDER.map((grade) => ({
    grade,
    count: documents.filter((document) => document.grade === grade).length,
  })).filter(({ count }) => count > 0);
}

interface DocumentGradeBadgeProps {
  grade: DocumentGrade;
  /** 같은 등급 문서 수. 1이면 숫자를 붙이지 않는다. */
  count?: number;
}

export function DocumentGradeBadge({ grade, count }: DocumentGradeBadgeProps) {
  return (
    <span className={`${BADGE_CLASS} ${GRADE_CLASS[grade]}`}>
      {DOCUMENT_GRADE_LABEL[grade]}
      {count !== undefined && count > 1 && (
        <span className="tabular-nums opacity-70">{count}</span>
      )}
    </span>
  );
}

/** 한 메일에 실린 문서들을 등급별 배지로 묶어 보여준다 */
export function DocumentGradeBadges({
  documents,
}: {
  documents: AuditDocument[];
}) {
  const counts = countByGrade(documents);

  // 문서를 싣지 않은 메일도 있어 빈 자리를 표시로 채운다
  if (counts.length === 0) {
    return <span className="text-xs text-text-tertiary">문서 없음</span>;
  }

  return (
    <>
      {counts.map(({ grade, count }) => (
        <DocumentGradeBadge key={grade} grade={grade} count={count} />
      ))}
    </>
  );
}

export function MailResultBadge({ result }: { result: MailResult }) {
  return (
    <span className={`${BADGE_CLASS} ${RESULT_CLASS[result]}`}>
      {MAIL_RESULT_LABEL[result]}
    </span>
  );
}
