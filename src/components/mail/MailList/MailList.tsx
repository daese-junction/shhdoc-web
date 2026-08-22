"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ConfirmModal, DataList } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useListSelection } from "@/hooks/useListSelection";
import { useToastStore } from "@/stores/useToastStore";
import type { FetchMailPage, Mail, MailListVariant } from "@/types/mail";
import { MAIL_COLUMNS } from "./mailColumns";

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
  /**
   * 이 간격(ms)마다 목록을 스스로 다시 읽는다.
   * 아직 진행 중인 상태(AI 검증 등)를 따라갈 때만 넘기고, 평소에는 비워 둔다.
   */
  autoRefreshMs?: number;
}

/** 공통 목록(DataList) 위에 메일함 동작(읽음·삭제·복원)만 얹은 화면 */
export function MailList({
  title,
  fetchPage,
  variant = "default",
  page,
  onPageChange,
  pageSize,
  emptyTitle = "메일이 없습니다",
  emptyDescription,
  className = "",
  onMarkAsRead,
  onDelete,
  onPermanentDelete,
  onRestore,
  onOpenMail,
  onInvalidate,
  autoRefreshMs,
}: MailListProps) {
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  // 목록 밖(액션·되돌리기)에서 일어난 변경을 DataList 에 알리는 값
  const [reloadToken, setReloadToken] = useState(0);

  // 확인 모달과 토스트가 선택 상태를 함께 봐야 해서 목록 대신 여기서 들고 있는다
  const selection = useListSelection();
  const showToast = useToastStore((state) => state.show);

  const isTrash = variant === "trash";
  const selectedIds = useMemo(
    () => Array.from(selection.selectedIds),
    [selection.selectedIds],
  );

  // 자동 갱신 타이머가 매번 새로 걸리지 않도록 신원을 고정해 둔다
  const reload = useCallback(() => {
    // 캐시를 비우지 않으면 방금 지운 메일이 그대로 다시 돌아온다
    onInvalidate?.();
    setReloadToken((token) => token + 1);
  }, [onInvalidate]);

  useEffect(() => {
    if (!autoRefreshMs) return;

    const timer = setInterval(() => {
      // 보이지 않는 탭까지 서버를 두드릴 이유는 없다 — 돌아오면 다음 차례에 읽는다
      if (!document.hidden) reload();
    }, autoRefreshMs);

    return () => clearInterval(timer);
  }, [autoRefreshMs, reload]);

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
    <>
      <DataList<Mail>
        className={className}
        title={title}
        columns={MAIL_COLUMNS}
        fetchPage={fetchPage}
        getRowId={(mail) => mail.id}
        getRowLabel={(mail) => `${mail.senderName}의 메일 선택`}
        selection={selection}
        page={page}
        onPageChange={onPageChange}
        pageSize={pageSize}
        reloadToken={reloadToken}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRowClick={onOpenMail}
        notice={isTrash ? TRASH_NOTICE : undefined}
        selectionActions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleMarkAsRead()}
            >
              읽음
            </Button>
            {isTrash ? (
              // 휴지통에서는 휴지통으로 보내는 삭제 대신 완전 삭제만 노출한다
              <Button
                variant="outline"
                size="sm"
                className="text-error"
                onClick={() => setConfirmMode("permanentDelete")}
              >
                완전 삭제
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmMode("delete")}
              >
                삭제
              </Button>
            )}
          </>
        }
      />

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
    </>
  );
}
