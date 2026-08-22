import type { EmailStatus } from "@/types/mail";
import { MAIL_STATUS_META, type MailStatusMeta } from "./mailStatus";

interface MailStatusBadgeProps {
  status: EmailStatus;
  /**
   * 화면마다 같은 상태를 다르게 부를 때만 넘긴다.
   * (승인 화면은 REJECTED 를 발신자 화면의 "반려" 대신 "발송거절" 로 부른다.)
   */
  label?: string;
}

/** 발신 계열 메일의 상태 뱃지. 서버가 모르는 상태를 주면 그리지 않는다. */
export function MailStatusBadge({ status, label }: MailStatusBadgeProps) {
  const meta = MAIL_STATUS_META[status] as MailStatusMeta | undefined;
  if (!meta) return null;

  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-white ${meta.className}`}
    >
      {label ?? meta.label}
    </span>
  );
}
