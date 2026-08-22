import type { EmailStatus } from "@/types/mail";

export interface MailStatusMeta {
  label: string;
  /** 뱃지 배경색 */
  className: string;
}

/** 상태별 뱃지 문구와 색. 발신 계열 목록에서만 쓴다. */
export const MAIL_STATUS_META: Record<EmailStatus, MailStatusMeta> = {
  DRAFT: { label: "임시보관", className: "bg-gray-500" },
  BLOCKED: { label: "발송보류", className: "bg-warning" },
  REJECTED: { label: "반려", className: "bg-error" },
  SENT: { label: "발송완료", className: "bg-success" },
};
