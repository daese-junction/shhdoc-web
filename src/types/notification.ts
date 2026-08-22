/**
 * 메일 알림 종류.
 * 지금은 내가 보낸 검토 요청을 관리자가 승인/거부한 결과만 다룬다.
 */
export type NotificationType = "reviewApproved" | "reviewRejected";

export interface Notification {
  id: string;
  type: NotificationType;
  /** 검토를 요청한 메일의 제목 */
  mailTitle: string;
  /** 승인·거부를 처리한 관리자 이름 */
  actorName: string;
  /** 거부 사유. `reviewRejected` 일 때만 채워진다. */
  reason?: string;
  createdAt: string;
  isRead: boolean;
}
