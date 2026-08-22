export type Area = "mail" | "manage";

export const ROUTES = {
  mail: "/mail",
  mailWriting: "/mail/writing",
  mailNotifications: "/mail/notifications",
  manage: "/manage",
  manageNotifications: "/manage/notifications",
} as const;

const NOTIFICATION_ROUTE: Record<Area, string> = {
  mail: ROUTES.mailNotifications,
  manage: ROUTES.manageNotifications,
};

/** `/manage`, `/manage/...` → "manage"; 그 외 전부 → "mail" (기본 영역) */
export function getArea(pathname: string): Area {
  return pathname === ROUTES.manage || pathname.startsWith(`${ROUTES.manage}/`)
    ? "manage"
    : "mail";
}

export function getNotificationRoute(area: Area): string {
  return NOTIFICATION_ROUTE[area];
}

/** SearchBar 는 메일 목록 화면에서만 (알림 페이지에는 뜨지 않는다) */
export function isMailPage(pathname: string): boolean {
  return pathname === ROUTES.mail;
}
