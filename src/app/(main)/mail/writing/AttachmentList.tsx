"use client";

import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { fetchAttachmentDownloadUrl } from "@/api/attachments";
import { useToastStore } from "@/stores/useToastStore";
import { formatFileSize } from "@/utils/format";
import type { Attachment } from "./attachments";

interface AttachmentListProps {
  attachments: Attachment[];
  totalSize: number;
  maxTotalSize: number;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  /** 업로드에 실패한 첨부를 처음부터 다시 올린다 */
  onRetry: (id: string) => void;
}

/** 행 높이 2.25rem(h-9) 기준 5개까지만 보이고 그 이상은 스크롤한다 */
const LIST_MAX_HEIGHT = "max-h-[11.25rem]";

/** 툴바 아래에 붙는 첨부파일 목록. 첨부가 없으면 아무것도 그리지 않는다. */
export function AttachmentList({
  attachments,
  totalSize,
  maxTotalSize,
  onRemove,
  onClearAll,
  onRetry,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const isOverLimit = totalSize > maxTotalSize;

  return (
    <div className="flex flex-col gap-1 border-b border-border-tertiary bg-surface-secondary px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">
            첨부파일 {attachments.length}개
          </span>
          <span aria-hidden className="h-3 w-px bg-border-primary" />
          <button
            type="button"
            onClick={onClearAll}
            className="text-text-tertiary transition-colors hover:text-text-primary hover:underline"
          >
            전체 삭제
          </button>
        </div>

        <span className={isOverLimit ? "text-error" : "text-text-tertiary"}>
          {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
        </span>
      </div>

      <ul className={`overflow-y-auto ${LIST_MAX_HEIGHT}`}>
        {attachments.map((attachment) => (
          <li key={attachment.id} className="flex h-9 items-center gap-2">
            <InsertDriveFileOutlinedIcon
              fontSize="small"
              className="shrink-0 text-text-tertiary"
            />

            <AttachmentName attachment={attachment} />

            <UploadState
              attachment={attachment}
              onRetry={() => onRetry(attachment.id)}
            />

            <span className="shrink-0 text-xs text-text-tertiary">
              {formatFileSize(attachment.file.size)}
            </span>

            <button
              type="button"
              aria-label={`${attachment.file.name} 첨부 삭제`}
              onClick={() => onRemove(attachment.id)}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            >
              <CloseIcon fontSize="small" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AttachmentItemProps {
  attachment: Attachment;
}

/**
 * 올라간 첨부는 서버에서 받은 주소로 연다 —
 * 내려받기 주소는 유효기간이 있어 미리 받아 두지 않고 누를 때 받는다.
 * 아직 올라가지 않은 파일은 blob URL 로 원본을 그대로 내려받는다.
 */
function AttachmentName({ attachment }: AttachmentItemProps) {
  const { file, url, status, serverId } = attachment;
  const showToast = useToastStore((state) => state.show);
  const [isOpening, setIsOpening] = useState(false);

  const nameClass =
    "min-w-0 flex-1 truncate text-left text-sm text-text-primary hover:underline";

  if (status !== "uploaded" || serverId === undefined) {
    return (
      <a href={url} download={file.name} title={file.name} className={nameClass}>
        {file.name}
      </a>
    );
  }

  const handleOpen = async () => {
    if (isOpening) return;
    setIsOpening(true);
    try {
      const downloadUrl = await fetchAttachmentDownloadUrl(serverId);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      showToast(
        "내려받기 주소를 받지 못했습니다. 잠시 후 다시 시도해 주세요.",
        "error",
      );
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      title={file.name}
      onClick={() => void handleOpen()}
      className={nameClass}
    >
      {file.name}
    </button>
  );
}

interface UploadStateProps extends AttachmentItemProps {
  onRetry: () => void;
}

/** 파일명 오른쪽에 붙는 업로드 상태. 등록까지 끝난 첨부에는 아무것도 붙이지 않는다. */
function UploadState({ attachment, onRetry }: UploadStateProps) {
  const { status, error, progress, file } = attachment;

  if (status === "waiting" || status === "uploading") {
    const percent = Math.round(progress * 100);
    const isPending = status === "waiting";

    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          role="progressbar"
          aria-valuenow={isPending ? undefined : percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${file.name} 업로드 진행률`}
          className="block h-1.5 w-16 overflow-hidden rounded-full bg-surface-tertiary"
        >
          <span
            className="block h-full rounded-full bg-brand-500 transition-[width] duration-200"
            style={{ width: isPending ? "0%" : `${percent}%` }}
          />
        </span>
        <span className="w-9 text-right font-mono text-xs text-text-tertiary">
          {isPending ? "대기" : `${percent}%`}
        </span>
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs">
        <span title={error} className="text-error">
          실패
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="text-text-tertiary transition-colors hover:text-text-primary hover:underline"
        >
          다시 시도
        </button>
      </span>
    );
  }

  return null;
}
