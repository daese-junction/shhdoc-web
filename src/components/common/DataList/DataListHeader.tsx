"use client";

import type { ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Checkbox } from "../Checkbox/Checkbox";

const ICON_BUTTON_CLASS =
  "grid size-8 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent";

interface DataListHeaderProps {
  /** 화면 제목. 목록이 화면을 꽉 채우므로 페이지 제목을 헤더가 함께 보여준다. */
  title?: string;
  selectable: boolean;
  allChecked: boolean;
  someChecked: boolean;
  selectedCount: number;
  /** 하나 이상 선택했을 때만 나오는 동작 버튼들 */
  selectionActions?: ReactNode;
  /** 두 번째 줄에 놓이는 검색·필터 영역 */
  filters?: ReactNode;
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onToggleAll: (checked: boolean) => void;
  onRefresh: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function DataListHeader({
  title,
  selectable,
  allChecked,
  someChecked,
  selectedCount,
  selectionActions,
  filters,
  isLoading,
  page,
  totalPages,
  total,
  onToggleAll,
  onRefresh,
  onPrevPage,
  onNextPage,
}: DataListHeaderProps) {
  const hasSelection = selectedCount > 0;

  return (
    // 상단 고정은 이 헤더를 감싸는 DataList 쪽에서 열 제목 행까지 함께 처리한다
    <div className="border-b border-border-tertiary bg-surface-primary">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        {title && (
          <h1 className="mr-1 text-sm font-semibold text-text-primary">
            {title}
          </h1>
        )}

        {selectable && (
          <Checkbox
            aria-label="현재 페이지 전체 선택"
            checked={allChecked}
            indeterminate={someChecked && !allChecked}
            onChange={(event) => onToggleAll(event.target.checked)}
          />
        )}

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

        {/* 선택한 행에만 쓰는 동작이라 하나라도 골랐을 때만 꺼낸다 */}
        {hasSelection && (
          <>
            {selectionActions}
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

      {filters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-tertiary px-4 py-2">
          {filters}
        </div>
      )}
    </div>
  );
}
