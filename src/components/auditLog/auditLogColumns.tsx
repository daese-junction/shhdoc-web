import type { ListColumn } from "@/types/list";
import type { AuditLog } from "@/types/auditLog";
import { formatFullDateTime, formatShortDateTime } from "@/utils/formatDate";
import { DocumentGradeBadges, MailResultBadge } from "./AuditLogBadges";

/** 수신자가 여럿이면 첫 명만 쓰고 나머지는 수로 접는다 */
export const summarizeRecipients = (recipients: string[]) =>
  recipients.length > 1
    ? `${recipients[0]} 외 ${recipients.length - 1}명`
    : (recipients[0] ?? "");

/**
 * 감사 로그 목록의 열 구성.
 * 좁은 화면에서는 수신자·등급 열을 접는다 — 상세에서 다시 볼 수 있다.
 */
export const AUDIT_LOG_COLUMNS: ListColumn<AuditLog>[] = [
  {
    key: "occurredAt",
    header: "시각",
    className: "w-28 shrink-0 text-xs tabular-nums text-text-tertiary sm:w-36",
    render: (log) => (
      <time dateTime={log.occurredAt} title={formatFullDateTime(log.occurredAt)}>
        {formatShortDateTime(log.occurredAt)}
      </time>
    ),
  },
  {
    key: "sender",
    header: "발신자",
    className: "w-28 shrink-0 sm:w-40",
    render: (log) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-text-primary">{log.senderName}</span>
        <span className="truncate text-xs text-text-tertiary">
          {log.senderEmail}
        </span>
      </span>
    ),
  },
  {
    key: "title",
    header: "제목",
    className: "min-w-0 flex-1 truncate text-text-primary",
    render: (log) => log.title,
  },
  {
    key: "recipients",
    header: "수신자",
    className: "hidden w-48 shrink-0 truncate text-text-secondary lg:block",
    render: (log) => summarizeRecipients(log.recipients),
  },
  {
    key: "grade",
    header: "문서 등급",
    // 등급이 섞인 메일은 배지가 여러 개라 줄바꿈을 허용한다
    className: "hidden w-40 shrink-0 flex-wrap items-center gap-1 sm:flex",
    render: (log) => <DocumentGradeBadges documents={log.documents} />,
  },
  {
    key: "result",
    header: "결과",
    className: "flex w-20 shrink-0 justify-end",
    render: (log) => <MailResultBadge result={log.result} />,
  },
];
