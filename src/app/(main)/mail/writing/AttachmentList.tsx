"use client";

import CloseIcon from "@mui/icons-material/Close";
import { formatFileSize } from "@/utils/format";
import type { Attachment } from "./attachments";
import type { ReviewResults } from "./useAttachmentReview";

interface AttachmentListProps {
  attachments: Attachment[];
  totalSize: number;
  maxTotalSize: number;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  /** 검토 결과 (첨부 id → 외부 유출 가능 여부). 판정 전 첨부에는 뱃지를 달지 않는다. */
  reviewResults?: ReviewResults;
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
  reviewResults = {},
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const isOverLimit = totalSize > maxTotalSize;

  return (
    <div className="border-b border-border-tertiary bg-surface-secondary px-3 py-2">
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

      <ul className={`mt-1 overflow-y-auto ${LIST_MAX_HEIGHT}`}>
        {attachments.map(({ id, file, url }) => (
          <li key={id} className="flex h-9 items-center gap-2">
            <button
              type="button"
              aria-label={`${file.name} 첨부 삭제`}
              onClick={() => onRemove(id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            >
              <CloseIcon fontSize="small" />
            </button>

            <ReviewBadge exportable={reviewResults[id]} />

            {/* 아직 서버에 올라가지 않은 파일이라 blob URL 로 원본을 그대로 내려받는다 */}
            <a
              href={url}
              download={file.name}
              title={file.name}
              className="min-w-0 flex-1 truncate text-sm text-text-primary hover:underline"
            >
              {file.name}
            </a>

            <span className="shrink-0 text-xs text-text-tertiary">
              {formatFileSize(file.size)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReviewBadgeProps {
  /** 아직 검토하지 않았거나 서버가 판정을 내려주지 않았으면 undefined */
  exportable?: boolean;
}

/** 파일명 왼쪽에 붙는 검토 결과 뱃지 */
function ReviewBadge({ exportable }: ReviewBadgeProps) {
  if (exportable === undefined) return null;

  return (
    <span
      title={exportable ? "외부 유출 가능 문서" : "외부 유출 불가 문서"}
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-white ${
        exportable ? "bg-success" : "bg-error"
      }`}
    >
      {exportable ? "성공" : "실패"}
    </span>
  );
}
