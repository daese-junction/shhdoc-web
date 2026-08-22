import type { MailStoredFolder } from "@/types/mail";

export type Area = "mail" | "manage";

/** 메일을 쓸 때 원문을 어떻게 물고 들어가는지. `edit` 는 저장해 둔 초안을 이어서 고친다. */
export type ComposeMode = "reply" | "forward" | "edit";

export const ROUTES = {
  mail: "/mail",
  mailInbox: "/mail/inbox",
  mailPending: "/mail/pending",
  mailSent: "/mail/sent",
  mailDrafts: "/mail/drafts",
  mailAll: "/mail/all",
  mailTrash: "/mail/trash",
  mailWriting: "/mail/writing",
  mailNotifications: "/mail/notifications",
  /** 메일 상세는 `/mail/view/<id>` */
  mailView: "/mail/view",
  manage: "/manage",
  manageNotifications: "/manage/notifications",
} as const;

/** 메일 목록을 보여주는 경로들 */
const MAIL_LIST_ROUTES: readonly string[] = [
  ROUTES.mail,
  ROUTES.mailInbox,
  ROUTES.mailPending,
  ROUTES.mailSent,
  ROUTES.mailDrafts,
  ROUTES.mailAll,
  ROUTES.mailTrash,
];

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

/** 메일 한 통을 여는 상세 경로 */
export function getMailDetailRoute(id: string): string {
  return `${ROUTES.mailView}/${encodeURIComponent(id)}`;
}

const FOLDER_ROUTE: Record<MailStoredFolder, string> = {
  inbox: ROUTES.mailInbox,
  pending: ROUTES.mailPending,
  sent: ROUTES.mailSent,
  drafts: ROUTES.mailDrafts,
  trash: ROUTES.mailTrash,
};

/** 그 메일이 들어 있는 폴더의 목록 경로 */
export function getMailFolderRoute(folder: MailStoredFolder): string {
  return FOLDER_ROUTE[folder];
}

/** 원문을 물고 작성 화면으로 가는 경로. 본문은 작성 화면이 id 로 다시 읽는다. */
export function getMailComposeRoute(mode: ComposeMode, id: string): string {
  return `${ROUTES.mailWriting}?mode=${mode}&id=${encodeURIComponent(id)}`;
}

/** SearchBar 는 메일 목록 화면에서만 (작성·상세·알림 페이지에는 뜨지 않는다) */
export function isMailPage(pathname: string): boolean {
  return MAIL_LIST_ROUTES.includes(pathname);
}
