"use client";

import CancelOutlined from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import type SvgIcon from "@mui/material/SvgIcon";
import type { Notification, NotificationType } from "@/types/notification";
import { formatMailDate, formatMailDateTime } from "@/utils/formatDate";

interface TypeMeta {
  Icon: typeof SvgIcon;
  iconClass: string;
  /** 알림 한 줄 요약 */
  describe: (actorName: string) => string;
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  reviewApproved: {
    Icon: CheckCircleOutlined,
    iconClass: "text-success",
    describe: (actorName) => `${actorName} 님이 검토 요청을 승인했습니다`,
  },
  reviewRejected: {
    Icon: CancelOutlined,
    iconClass: "text-error",
    describe: (actorName) => `${actorName} 님이 검토 요청을 거부했습니다`,
  },
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const { Icon, iconClass, describe } = TYPE_META[notification.type];
  const isUnread = !notification.isRead;

  return (
    <li>
      <button
        type="button"
        onClick={() => onRead(notification.id)}
        className={`flex w-full items-start gap-3 border-b border-border-tertiary px-4 py-3 text-left transition-colors hover:bg-surface-tertiary ${
          isUnread ? "bg-brand-50" : ""
        }`}
      >
        <Icon fontSize="small" className={`mt-0.5 shrink-0 ${iconClass}`} />

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm text-text-primary ${
              isUnread ? "font-semibold" : ""
            }`}
          >
            {describe(notification.actorName)}
          </p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {notification.mailTitle}
          </p>
          {notification.reason && (
            <p className="mt-2 rounded-md bg-surface-secondary px-2 py-1.5 text-xs break-words text-text-secondary">
              거부 사유: {notification.reason}
            </p>
          )}
        </div>

        <time
          dateTime={notification.createdAt}
          title={formatMailDateTime(notification.createdAt)}
          className="mt-0.5 shrink-0 text-xs whitespace-nowrap text-text-tertiary"
        >
          {formatMailDate(notification.createdAt)}
        </time>

        {/* 읽어도 자리가 밀리지 않도록 점 자리는 항상 잡아둔다 */}
        <span className="mt-1.5 flex size-2 shrink-0 items-center justify-center">
          {isUnread && (
            <span
              aria-label="읽지 않음"
              className="size-2 rounded-full bg-brand-500"
            />
          )}
        </span>
      </button>
    </li>
  );
}
