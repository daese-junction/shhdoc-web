"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Loading } from "@/components/common";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from "@/mocks/notification";
import { useToastStore } from "@/stores/useToastStore";
import type { Notification } from "@/types/notification";
import { NotificationItem } from "./NotificationItem";

const TOAST_DURATION = 3000;

type NotificationFilter = "all" | "unread";

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "unread", label: "읽지 않음" },
];

const EMPTY_STATE: Record<
  NotificationFilter,
  { title: string; description: string }
> = {
  all: {
    title: "알림이 없습니다",
    description: "검토 요청의 승인·거부 결과가 여기에 표시됩니다.",
  },
  unread: {
    title: "읽지 않은 알림이 없습니다",
    description: "새 알림이 도착하면 여기에 표시됩니다.",
  },
};

interface NotificationListProps {
  className?: string;
}

export function NotificationList({ className = "" }: NotificationListProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  // 목록을 조금이라도 내리면 헤더 아래에 그림자를 깐다
  const [isScrolled, setIsScrolled] = useState(false);

  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    let cancelled = false;

    void fetchNotifications().then((result) => {
      if (cancelled) return;
      setItems(result);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const visibleItems = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.isRead) : items),
    [items, filter],
  );

  // 목록에서 사라지거나 굵기가 풀리는 건 바로 보여주고, 저장은 뒤따라간다
  const handleRead = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target || target.isRead) return;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    void markNotificationsAsRead([id]);
  };

  const handleReadAll = () => {
    if (unreadCount === 0) return;

    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    void markAllNotificationsAsRead();
    showToast(`${unreadCount}개의 알림을 읽음 처리했습니다.`, {
      type: "success",
      duration: TOAST_DURATION,
    });
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border-tertiary bg-surface-primary ${className}`}
    >
      <div
        className={`sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border-tertiary bg-surface-primary px-4 py-2 transition-shadow ${
          isScrolled ? "shadow-xs" : ""
        }`}
      >
        <div className="flex items-center gap-1 rounded-md bg-surface-tertiary p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-surface-primary text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <span className="text-sm text-text-secondary">
            읽지 않음 {unreadCount}개
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={unreadCount === 0}
          onClick={handleReadAll}
        >
          모두 읽음
        </Button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
      >
        {isLoading ? (
          <Loading />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={EMPTY_STATE[filter].title}
            description={EMPTY_STATE[filter].description}
          />
        ) : (
          <ul>
            {visibleItems.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleRead}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
