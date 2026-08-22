"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal, EmptyState, Loading } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useMailSelection } from "@/hooks/useMailSelection";
import { useToastStore } from "@/stores/useToastStore";
import type { FetchMailPage, Mail, MailListVariant } from "@/types/mail";
import { MailListHeader } from "./MailListHeader";
import { MailListItem } from "./MailListItem";

const DEFAULT_PAGE_SIZE = 20;
const TOAST_DURATION = 3000;
const UNDO_TOAST_DURATION = 6000;
const TRASH_NOTICE = "30일 후 자동으로 완전히 삭제됩니다";

type ConfirmMode = "delete" | "permanentDelete" | null;

interface MailListProps {
  /** 목록 헤더 맨 앞에 붙는 화면 제목. 보통 폴더 이름. */
  title?: string;
  /** 페이지네이션 단위로 메일을 조회한다 */
  fetchPage: FetchMailPage;
  /** trash면 완전 삭제 버튼과 보관 기간 안내를 노출한다 */
  variant?: MailListVariant;
  /** 페이지를 URL 등 바깥에서 관리할 때. 없으면 컴포넌트가 직접 들고 있는다. */
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  onMarkAsRead?: (ids: string[]) => Promise<void> | void;
  onDelete?: (ids: string[]) => Promise<void> | void;
  onPermanentDelete?: (ids: string[]) => Promise<void> | void;
  onRestore?: (ids: string[]) => Promise<void> | void;
  onOpenMail?: (mail: Mail) => void;
  /** 새로고침이 캐시를 건너뛰고 서버를 다시 보게 한다. 참조가 고정돼 있어야 한다. */
  onInvalidate?: () => void;
}

export function MailList({
  title,
  fetchPage,
  variant = "default",
  page: controlledPage,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  emptyTitle = "메일이 없습니다",
  emptyDescription,
  className = "",
  onMarkAsRead,
  onDelete,
  onPermanentDelete,
  onRestore,
  onOpenMail,
  onInvalidate,
}: MailListProps) {
  const [ownPage, setOwnPage] = useState(1);
  const page = controlledPage ?? ownPage;
  const setPage = (nextPage: number) => {
    if (onPageChange) onPageChange(nextPage);
    else setOwnPage(nextPage);
  };

  // 조회 effect 안에서도 최신 setPage 를 쓰되, 콜백 신원이 바뀌어도
  // 재조회가 다시 돌지 않도록 ref 로 들고 있는다
  const setPageRef = useRef(setPage);
  useEffect(() => {
    setPageRef.current = setPage;
  });

  const [items, setItems] = useState<Mail[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  // 목록을 조금이라도 내리면 헤더 아래에 그림자를 깐다
  const [isScrolled, setIsScrolled] = useState(false);

  const selection = useMailSelection();
  const showToast = useToastStore((state) => state.show);
  // 조회 effect 가 토스트 때문에 다시 돌지 않도록 ref 로 들고 있는다
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  });
  // shift 범위 선택의 기준이 되는 직전 클릭 행. 페이지가 바뀌면 순번이 달라져 지운다.
  const anchorIndexRef = useRef<number | null>(null);

  const isTrash = variant === "trash";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let cancelled = false;

    void fetchPage({ page, pageSize })
      .then((result) => {
        if (cancelled) return;

        // 삭제 등으로 전체 페이지 수가 줄어든 경우 마지막 페이지를 다시 조회한다
        const lastPage = Math.max(1, Math.ceil(result.total / pageSize));
        if (page > lastPage) {
          setPageRef.current(lastPage);
          return;
        }

        setItems(result.items);
        setTotal(result.total);
        setIsLoading(false);
        anchorIndexRef.current = null;
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        // 로딩을 반드시 내려야 한다 — 안 그러면 스피너에 갇혀 새로고침도 못 누른다
        setIsLoading(false);

        const message = getErrorMessage(error, {}, "메일을 불러오지 못했습니다.");
        // 네트워크 오류는 인터셉터가 이미 토스트로 알렸다
        if (message) showToastRef.current(message, "error");
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, page, pageSize, reloadKey]);

  const reload = useCallback(() => {
    // 캐시를 비우지 않으면 새로고침해도 방금 본 목록이 그대로 돌아온다
    onInvalidate?.();
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  }, [onInvalidate]);

  const movePage = (nextPage: number) => {
    if (nextPage === page) return;
    setIsLoading(true);
    setPage(nextPage);
  };

  const selectedIds = useMemo(
    () => Array.from(selection.selectedIds),
    [selection.selectedIds],
  );

  const pageIds = useMemo(() => items.map((mail) => mail.id), [items]);

  // shift 로 찍으면 직전에 찍은 행부터 지금 행까지를 지금 행의 결과 상태로 맞춘다
  const handleToggle = (id: string, index: number, shiftKey: boolean) => {
    const anchorIndex = anchorIndexRef.current;

    if (shiftKey && anchorIndex !== null && anchorIndex !== index) {
      const [start, end] =
        anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
      const rangeIds = items.slice(start, end + 1).map((mail) => mail.id);
      selection.select(rangeIds, !selection.isSelected(id));
    } else {
      selection.toggle(id);
    }

    anchorIndexRef.current = index;
  };

  const allChecked =
    pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const someChecked = pageIds.some((id) => selection.isSelected(id));

  const handleRestore = async (ids: string[]) => {
    await onRestore?.(ids);
    reload();
    showToast("삭제를 되돌렸습니다.", {
      type: "info",
      duration: TOAST_DURATION,
    });
  };

  const handleMarkAsRead = async () => {
    if (selectedIds.length === 0) return;

    await onMarkAsRead?.(selectedIds);
    selection.clear();
    reload();
    showToast(`${selectedIds.length}개의 메일을 읽음 처리했습니다.`, {
      type: "success",
      duration: TOAST_DURATION,
    });
  };

  const handleDelete = async () => {
    const ids = selectedIds;
    setConfirmMode(null);
    if (ids.length === 0) return;

    try {
      await onDelete?.(ids);
    } catch (error) {
      // 일부만 지워졌을 수 있으므로 목록은 다시 읽는다
      reload();
      const message = getErrorMessage(error, {}, "메일을 삭제하지 못했습니다.");
      if (message) showToast(message, "error");
      return;
    }

    selection.clear();
    reload();
    // 되돌릴 수단이 없으면 되돌리기 버튼도 내주지 않는다 (초안 삭제는 복구가 없다)
    showToast(
      `${ids.length}개의 메일을 삭제했습니다.`,
      onRestore
        ? {
            type: "success",
            duration: UNDO_TOAST_DURATION,
            action: { label: "되돌리기", onClick: () => void handleRestore(ids) },
          }
        : { type: "success", duration: TOAST_DURATION },
    );
  };

  // 완전 삭제는 복구할 수 없으므로 되돌리기 액션을 제공하지 않는다
  const handlePermanentDelete = async () => {
    const ids = selectedIds;
    setConfirmMode(null);
    if (ids.length === 0) return;

    await onPermanentDelete?.(ids);
    selection.clear();
    reload();
    showToast(`${ids.length}개의 메일을 완전히 삭제했습니다.`, {
      type: "success",
      duration: TOAST_DURATION,
    });
  };

  const isPermanent = confirmMode === "permanentDelete";

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-surface-primary ${className}`}
    >
      <MailListHeader
        title={title}
        isScrolled={isScrolled}
        variant={variant}
        allChecked={allChecked}
        someChecked={someChecked}
        selectedCount={selection.selectedCount}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onToggleAll={(checked) => {
          anchorIndexRef.current = null;
          selection.select(pageIds, checked);
        }}
        onRefresh={reload}
        onMarkAsRead={onMarkAsRead && (() => void handleMarkAsRead())}
        onDelete={onDelete && (() => setConfirmMode("delete"))}
        onPermanentDelete={
          onPermanentDelete && (() => setConfirmMode("permanentDelete"))
        }
        onPrevPage={() => movePage(Math.max(1, page - 1))}
        onNextPage={() => movePage(Math.min(totalPages, page + 1))}
      />

      {isTrash && (
        <p className="shrink-0 border-b border-border-tertiary bg-surface-secondary px-4 py-2 text-xs text-text-secondary">
          {TRASH_NOTICE}
        </p>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
      >
        {isLoading && items.length === 0 ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul>
            {items.map((mail, index) => (
              <MailListItem
                key={mail.id}
                mail={mail}
                index={index}
                selected={selection.isSelected(mail.id)}
                onToggle={handleToggle}
                onOpen={onOpenMail}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={confirmMode !== null}
        onClose={() => setConfirmMode(null)}
        onConfirm={() =>
          void (isPermanent ? handlePermanentDelete() : handleDelete())
        }
        title={isPermanent ? "메일 완전 삭제" : "메일 삭제"}
        description={
          isPermanent
            ? `선택한 ${selection.selectedCount}개의 메일을 완전히 삭제할까요? 삭제한 메일은 복구할 수 없습니다.`
            : `선택한 ${selection.selectedCount}개의 메일을 삭제할까요?`
        }
        confirmLabel={isPermanent ? "완전 삭제" : "삭제"}
        danger={isPermanent}
      />
    </div>
  );
}
