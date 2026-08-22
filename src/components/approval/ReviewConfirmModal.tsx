"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/common";
import { REVIEW_NOTE_MAX_LENGTH } from "./approvalMeta";

/** 관리자가 내리는 결정. 둘 다 같은 요청 본문(note)을 쓴다. */
export type ReviewAction = "approve" | "reject";

interface ReviewConfirmModalProps {
  /** null 이면 닫힌 상태 */
  action: ReviewAction | null;
  /** 어떤 메일을 처리하는지 확인시켜 준다 */
  subject: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

/** 승인·거절 확인 모달. 거절만 사유가 필수라는 점 말고는 흐름이 같다. */
export function ReviewConfirmModal({
  action,
  subject,
  loading,
  onClose,
  onConfirm,
}: ReviewConfirmModalProps) {
  // 대상이 바뀌면 호출부가 key 로 이 컴포넌트를 다시 만든다 — 쓰던 내용은 그때 사라진다
  const [note, setNote] = useState("");

  const isReject = action === "reject";
  const isEmpty = note.trim().length === 0;
  const isTooLong = note.length > REVIEW_NOTE_MAX_LENGTH;

  return (
    <ConfirmModal
      open={action !== null}
      onClose={onClose}
      onConfirm={() => onConfirm(note)}
      title={isReject ? "이 메일을 거절할까요?" : "이 메일을 발송할까요?"}
      confirmLabel={isReject ? "거절" : "승인 후 발송"}
      loading={loading}
      confirmDisabled={(isReject && isEmpty) || isTooLong}
      description={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-text-secondary">
              {isReject
                ? "거절하면 발송되지 않고 발신자에게 사유가 그대로 전달됩니다."
                : "승인하면 이 메일이 곧바로 발송됩니다. 되돌릴 수 없습니다."}
            </p>
            <p className="truncate text-sm font-medium text-text-primary">
              {subject || "(제목 없음)"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="review-note"
              className="text-sm font-medium text-text-primary"
            >
              {isReject ? "거절 사유" : "의견 (선택)"}
            </label>
            <textarea
              id="review-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              autoFocus
              aria-invalid={isTooLong ? true : undefined}
              placeholder={
                isReject
                  ? "발신자에게 전달할 거절 사유를 적어주세요."
                  : "남길 의견이 있으면 적어주세요."
              }
              className={`w-full resize-none rounded-lg border bg-surface-primary px-3 py-2 text-base transition-colors sm:text-sm
                text-text-primary placeholder:text-text-tertiary
                focus-visible:outline-none focus:ring-2
                ${
                  isTooLong
                    ? "border-error focus:border-error focus:ring-error/25"
                    : "border-border-tertiary focus:border-brand-500 focus:ring-brand-500/25"
                }`}
            />
            <p
              className={`text-xs ${
                isTooLong ? "text-error" : "text-text-tertiary"
              }`}
            >
              {isTooLong
                ? `${REVIEW_NOTE_MAX_LENGTH}자까지 쓸 수 있습니다 (${note.length}자)`
                : isReject
                  ? "사유를 적어야 거절할 수 있습니다."
                  : "비워두면 의견 없이 승인합니다."}
            </p>
          </div>
        </div>
      }
    />
  );
}
