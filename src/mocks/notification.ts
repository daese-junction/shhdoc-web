import type { Notification } from "@/types/notification";

/** 실제 API 연동 전까지 사용하는 임시 데이터. src/api 작업 시 교체한다. */
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const DELAY = 300;

// 상대 시간("3시간 전")으로 보여주므로 실행 시점을 기준으로 만든다
const NOW = Date.now();

const at = (offset: number) => new Date(NOW - offset).toISOString();

const createNotifications = (): Notification[] => [
  {
    id: "notif-1",
    type: "reviewApproved",
    mailTitle: "계약서 검토 요청드립니다",
    actorName: "김대세",
    createdAt: at(12 * MINUTE),
    isRead: false,
  },
  {
    id: "notif-2",
    type: "reviewRejected",
    mailTitle: "청구서 발송 건 확인 부탁드립니다",
    actorName: "이정션",
    reason: "첨부된 청구서 금액이 계약서와 다릅니다. 수정 후 다시 요청해 주세요.",
    createdAt: at(3 * HOUR),
    isRead: false,
  },
  {
    id: "notif-3",
    type: "reviewApproved",
    mailTitle: "프로젝트 산출물 전달드립니다",
    actorName: "최다은",
    createdAt: at(9 * HOUR),
    isRead: false,
  },
  {
    id: "notif-4",
    type: "reviewRejected",
    mailTitle: "[공지] 보안 정책 변경 안내",
    actorName: "김대세",
    reason: "전사 공지는 관리 > 승인/결재에서 별도 승인이 필요합니다.",
    createdAt: at(2 * DAY),
    isRead: true,
  },
  {
    id: "notif-5",
    type: "reviewApproved",
    mailTitle: "9월 정기 회의 일정 안내",
    actorName: "박서준",
    createdAt: at(5 * DAY),
    isRead: true,
  },
];

let notifications = createNotifications();

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), DELAY));

export function fetchNotifications(): Promise<Notification[]> {
  return delay(notifications);
}

export function markNotificationsAsRead(ids: string[]): Promise<void> {
  const targets = new Set(ids);
  notifications = notifications.map((notification) =>
    targets.has(notification.id)
      ? { ...notification, isRead: true }
      : notification,
  );

  return delay(undefined);
}

export function markAllNotificationsAsRead(): Promise<void> {
  notifications = notifications.map((notification) => ({
    ...notification,
    isRead: true,
  }));

  return delay(undefined);
}
