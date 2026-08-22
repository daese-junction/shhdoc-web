"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button, Checkbox } from "@/components/common";
import type { MailListVariant } from "@/types/mail";

const ICON_BUTTON_CLASS =
  "grid size-8 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent";

interface MailListHeaderProps {
  /** 화면 제목. 목록이 화면을 꽉 채우므로 페이지 제목을 헤더가 함께 보여준다. */
  title?: string;
  /** 목록이 최상단이 아닐 때. 헤더 아래에 옅은 그림자를 깐다. */
  isScrolled?: boolean;
  variant?: MailListVariant;
  allChecked: boolean;
  someChecked: boolean;
  selectedCount: number;
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onToggleAll: (checked: boolean) => void;
  onRefresh: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onPermanentDelete: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function MailListHeader({
  title,
  isScrolled = false,
  variant = "default",
  allChecked,
  someChecked,
  selectedCount,
  isLoading,
  page,
  totalPages,
  total,
  onToggleAll,
  onRefresh,
  onMarkAsRead,
  onDelete,
  onPermanentDelete,
  onPrevPage,
  onNextPage,
}: MailListHeaderProps) {
  const hasSelection = selectedCount > 0;
  const isTrash = variant === "trash";

  return (
    // 목록이 스크롤돼도 헤더는 상단에 그대로 남는다
    <div
      className={`sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border-tertiary bg-surface-primary px-4 py-2 transition-shadow ${
        isScrolled ? "shadow-xs" : ""
      }`}
    >
      {title && (
        <h1 className="mr-1 text-sm font-semibold text-text-primary">{title}</h1>
      )}
      <Checkbox
        aria-label="현재 페이지 전체 선택"
        checked={allChecked}
        indeterminate={someChecked && !allChecked}
        onChange={(event) => onToggleAll(event.target.checked)}
      />

      <button
        type="button"
        aria-label="새로고침"
        onClick={onRefresh}
        disabled={isLoading}
        className={ICON_BUTTON_CLASS}
      >
        <RefreshIcon
          fontSize="small"
          className={isLoading ? "animate-spin" : ""}
        />
      </button>

      {/* 선택한 메일에만 쓰는 동작이라 하나라도 골랐을 때만 꺼낸다 */}
      {hasSelection && (
        <>
          <Button variant="outline" size="sm" onClick={onMarkAsRead}>
            읽음
          </Button>
          {isTrash ? (
            // 휴지통에서는 휴지통으로 보내는 삭제 대신 완전 삭제만 노출한다
            <Button
              variant="outline"
              size="sm"
              className="text-error"
              onClick={onPermanentDelete}
            >
              완전 삭제
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onDelete}>
              삭제
            </Button>
          )}
          <span className="text-sm text-text-secondary">
            {selectedCount}개 선택됨
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-3 text-xs text-text-secondary">
        <span className="tabular-nums">전체 {total.toLocaleString()}개</span>
        <span className="tabular-nums">
          {page} / {totalPages} 페이지
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={onPrevPage}
            disabled={isLoading || page <= 1}
            className={ICON_BUTTON_CLASS}
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={onNextPage}
            disabled={isLoading || page >= totalPages}
            className={ICON_BUTTON_CLASS}
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
}
