"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reviewAttachments } from "@/api/review";
import { useToastStore } from "@/stores/useToastStore";
import type { Attachment } from "./attachments";

export type ReviewStatus = "idle" | "pending" | "done";

/** 첨부 id → 외부 유출 가능 여부. 서버가 판정을 빼먹은 첨부는 키가 없다. */
export type ReviewResults = Record<string, boolean>;

export interface UseAttachmentReviewResult {
  status: ReviewStatus;
  results: ReviewResults;
  /** 지금 첨부 목록 그대로 검토를 마쳤고 전부 유출 가능한지 */
  isReviewed: boolean;
  review: () => void;
}

/**
 * 첨부 문서의 외부 유출 가능 여부를 서버에 물어본다.
 * 검토 결과는 요청 당시의 첨부 배열 참조와 함께 들고 있어,
 * 첨부가 하나라도 바뀌면 결과가 자동으로 무효가 된다.
 */
export function useAttachmentReview(
  attachments: Attachment[],
): UseAttachmentReviewResult {
  const [reviewed, setReviewed] = useState<{
    list: Attachment[];
    results: ReviewResults;
  } | null>(null);
  // 검토 중인 첨부 목록. 요청이 끝나면 비운다.
  const [pendingList, setPendingList] = useState<Attachment[] | null>(null);
  const showToast = useToastStore((state) => state.show);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const isPending = pendingList === attachments;
  const isCurrent = reviewed?.list === attachments;
  const results = isCurrent ? reviewed.results : {};
  const status: ReviewStatus = isPending
    ? "pending"
    : isCurrent
      ? "done"
      : "idle";
  const isReviewed =
    isCurrent && attachments.every(({ id }) => results[id] === true);

  const review = useCallback(() => {
    if (attachments.length === 0) return;

    // 이전 요청은 결과를 쓰지 않으므로 끊는다
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const target = attachments;
    setPendingList(target);

    void reviewAttachments(
      target.map(({ id, file }) => ({ id, file })),
      controller.signal,
    )
      .then((list) => {
        const next: ReviewResults = {};
        for (const { id, exportable } of list) next[id] = exportable;

        setReviewed({ list: target, results: next });

        const blocked = target.filter(({ id }) => next[id] !== true).length;
        if (blocked > 0) {
          showToast(
            `외부 유출이 불가한 문서 ${blocked}개가 있습니다. 해당 첨부를 빼고 다시 검토해 주세요.`,
            "error",
          );
        } else {
          showToast(
            "검토를 통과했습니다. 메일을 보낼 수 있습니다.",
            "success",
          );
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        showToast("검토 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setPendingList(null);
      });
  }, [attachments, showToast]);

  return { status, results, isReviewed, review };
}
