"use client";

import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "@/api/axios";
import { createDraft } from "@/api/emails";
import { useToastStore } from "@/stores/useToastStore";
import type { EmailPayload } from "@/types/mail";

export interface EnsuredDraft {
  /** 초안 만들기에 실패했으면 null */
  id: number | null;
  /** 이번 호출에서 새로 만들었는지. 방금 만든 초안은 다시 저장할 필요가 없다. */
  created: boolean;
}

export interface UseDraftEmailIdResult {
  /** 첨부를 붙일 메일 id. 아직 초안이 없으면 null */
  emailId: number | null;
  /** 초안이 없으면 만들고 id 를 돌려준다. 여러 번 불러도 요청은 한 번만 나간다. */
  ensure: (payload: EmailPayload) => Promise<EnsuredDraft>;
}

/**
 * 첨부 업로드에 필요한 초안 메일 id 를 챙긴다.
 * 첨부는 `POST /emails/{emailId}/attachments/...` 로 올라가므로 파일을 붙이려면
 * 메일이 먼저 서버에 있어야 한다. 이어서 고치는 초안이면 그 id 를 그대로 쓴다.
 *
 * 파일을 여러 개 한꺼번에 고를 때 초안이 여러 개 생기지 않도록
 * 진행 중인 요청은 Promise 를 함께 기다린다 (src/api/axios.ts 의 재발급과 같은 방식).
 */
export function useDraftEmailId(editingId?: number): UseDraftEmailIdResult {
  const [emailId, setEmailId] = useState<number | null>(editingId ?? null);
  const showToast = useToastStore((state) => state.show);

  const emailIdRef = useRef<number | null>(editingId ?? null);
  const pendingRef = useRef<Promise<EnsuredDraft> | null>(null);

  const ensure = useCallback(
    (payload: EmailPayload) => {
      if (emailIdRef.current !== null) {
        return Promise.resolve({ id: emailIdRef.current, created: false });
      }
      if (pendingRef.current) return pendingRef.current;

      const request = createDraft(payload)
        .then(({ id }): EnsuredDraft => {
          emailIdRef.current = id;
          setEmailId(id);
          return { id, created: true };
        })
        .catch((error: unknown): EnsuredDraft => {
          // 네트워크 오류는 인터셉터가 이미 토스트로 알렸으므로 빈 메시지면 넘어간다
          const message = getErrorMessage(
            error,
            {},
            "첨부를 올릴 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.",
          );
          if (message) showToast(message, "error");
          return { id: null, created: false };
        })
        .finally(() => {
          pendingRef.current = null;
        });

      pendingRef.current = request;
      return request;
    },
    [showToast],
  );

  return { emailId, ensure };
}
