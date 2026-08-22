import type { ApprovalStatus } from "@/api/adminEmails";
import type { EmailStatus } from "@/types/mail";

/** 거절 사유 입력 상한. 발신자에게 그대로 보이는 글이라 길어질 이유가 없다. */
export const REVIEW_NOTE_MAX_LENGTH = 500;

/**
 * 승인 화면에서만 다르게 부르는 상태 이름.
 * 발신자에게는 "반려"지만 관리자에게는 자기가 막은 발송이라 "발송거절"이다.
 * 여기 없는 상태는 `MAIL_STATUS_META` 의 이름을 그대로 쓴다.
 */
export const APPROVAL_STATUS_LABEL: Partial<Record<EmailStatus, string>> = {
  REJECTED: "발송거절",
};

/** 이미 처리한 건의 작업 열에 남기는 결과. 관리자가 무엇을 했는지만 말한다. */
export const REVIEW_RESULT_LABEL: Record<
  Exclude<ApprovalStatus, "BLOCKED">,
  string
> = {
  SENT: "승인함",
  REJECTED: "거절함",
};
