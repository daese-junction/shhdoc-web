"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteAttachment, uploadAttachment } from "@/api/attachments";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import { formatFileSize } from "@/utils/format";
import {
  MAX_ATTACHMENT_TOTAL_SIZE,
  createAttachmentId,
  getAttachmentKey,
  type Attachment,
} from "./attachments";

export interface UseAttachmentsOptions {
  /** 첨부를 붙일 메일 id. 아직 없으면 파일은 대기 상태로 두었다가 id 가 생기면 올린다. */
  emailId: number | null;
  maxTotalSize?: number;
}

export interface UseAttachmentsResult {
  attachments: Attachment[];
  totalSize: number;
  maxTotalSize: number;
  /** 아직 올라가는 중인 첨부가 있는지 */
  isUploading: boolean;
  add: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** 업로드에 실패한 첨부를 처음 단계부터 다시 올린다 */
  retry: (id: string) => void;
}

/**
 * 메일 쓰기 화면의 첨부파일 목록을 들고 있는다.
 * 파일을 고르면 곧바로 업로드 주소 요청 → 스토리지 PUT → 등록 순서로 올린다.
 * emailId 가 아직 없으면 대기 상태로 두었다가 id 가 정해지는 순간 밀린 것부터 올린다.
 *
 * 외부 유출 검사는 서버가 알아서 돌린다 — 쓰기 화면은 결과를 기다리지 않는다.
 * 판정은 보낸 뒤 승인 단계에서 쓰이고, 사용자에게는 메일함의 상태 뱃지로만 보인다.
 */
export function useAttachments({
  emailId,
  maxTotalSize = MAX_ATTACHMENT_TOTAL_SIZE,
}: UseAttachmentsOptions): UseAttachmentsResult {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const showToast = useToastStore((state) => state.show);

  // blob URL 해제와 연속 추가 계산에 최신 목록이 필요해 ref 로도 들고 있는다
  const attachmentsRef = useRef<Attachment[]>([]);
  // 진행 중인 업로드. 중복 실행을 막고 첨부가 사라질 때 요청을 끊는 데 쓴다.
  const uploadsRef = useRef(new Map<string, AbortController>());

  const apply = useCallback((next: Attachment[]) => {
    attachmentsRef.current = next;
    setAttachments(next);
  }, []);

  /** 첨부 한 건만 바꿔 끼운다. 이미 지워진 첨부라면 아무것도 하지 않는다. */
  const patch = useCallback(
    (id: string, changes: Partial<Attachment>) => {
      const current = attachmentsRef.current;
      if (!current.some((item) => item.id === id)) return;

      apply(
        current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      );
    },
    [apply],
  );

  useEffect(() => {
    const uploads = uploadsRef.current;
    return () => {
      uploads.forEach((controller) => controller.abort());
      uploads.clear();
      attachmentsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  const totalSize = useMemo(
    () => attachments.reduce((sum, { file }) => sum + file.size, 0),
    [attachments],
  );

  const upload = useCallback(
    (attachment: Attachment, targetEmailId: number) => {
      if (uploadsRef.current.has(attachment.id)) return;

      const controller = new AbortController();
      uploadsRef.current.set(attachment.id, controller);
      patch(attachment.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });

      // 바이트마다 리렌더하지 않도록 퍼센트가 바뀔 때만 반영한다
      let shownPercent = -1;

      void uploadAttachment(targetEmailId, attachment.file, {
        signal: controller.signal,
        onProgress: (ratio) => {
          const percent = Math.round(ratio * 100);
          if (percent === shownPercent) return;
          shownPercent = percent;
          patch(attachment.id, { progress: ratio });
        },
      })
        .then((registered) => {
          patch(attachment.id, {
            status: "uploaded",
            progress: 1,
            serverId: registered.id,
          });
        })
        .catch((error: unknown) => {
          // 첨부를 지워서 끊긴 요청은 알릴 것이 없다
          if (controller.signal.aborted) return;

          const message = getErrorMessage(
            error,
            { 400: "임시저장된 메일에만 첨부할 수 있습니다." },
            "업로드에 실패했습니다. 다시 시도해 주세요.",
          );

          patch(attachment.id, { status: "failed", error: message });
          showToast(`${attachment.file.name} 업로드에 실패했습니다.`, "error");
        })
        .finally(() => {
          uploadsRef.current.delete(attachment.id);
        });
    },
    [patch, showToast],
  );

  // 새로 붙은 파일과, emailId 가 늦게 정해져 밀려 있던 파일을 함께 올린다
  useEffect(() => {
    if (emailId === null) return;

    attachments
      .filter(({ status }) => status === "waiting")
      .forEach((attachment) => upload(attachment, emailId));
  }, [attachments, emailId, upload]);

  const add = useCallback(
    (files: FileList | File[]) => {
      const picked = Array.from(files);
      if (picked.length === 0) return;

      const current = attachmentsRef.current;
      const keys = new Set(current.map(({ file }) => getAttachmentKey(file)));
      let used = current.reduce((sum, { file }) => sum + file.size, 0);

      const accepted: Attachment[] = [];
      let duplicated = 0;
      let tooLarge = 0;

      for (const file of picked) {
        const key = getAttachmentKey(file);

        if (keys.has(key)) {
          duplicated += 1;
          continue;
        }
        // 한도를 넘기는 파일만 거절하고 나머지는 그대로 담는다
        if (used + file.size > maxTotalSize) {
          tooLarge += 1;
          continue;
        }

        keys.add(key);
        used += file.size;
        accepted.push({
          id: createAttachmentId(),
          file,
          url: URL.createObjectURL(file),
          status: "waiting",
          progress: 0,
        });
      }

      // 업로드는 목록이 바뀐 뒤 effect 가 이어서 시작한다
      if (accepted.length > 0) apply([...current, ...accepted]);

      if (tooLarge > 0) {
        showToast(
          `용량 한도(${formatFileSize(maxTotalSize)})를 넘어 ${tooLarge}개 파일을 첨부하지 못했습니다`,
          "error",
        );
      } else if (duplicated > 0) {
        showToast(`이미 첨부된 파일 ${duplicated}개를 건너뛰었습니다`, "error");
      }
    },
    [apply, maxTotalSize, showToast],
  );

  /**
   * 화면에서 뗀 첨부는 서버에서도 지운다 (스토리지 객체까지 함께 지워진다).
   * 실패해도 화면은 이미 지운 뒤라 되돌리지 않고 알리기만 한다.
   */
  const drop = useCallback(
    ({ id, url, serverId }: Attachment) => {
      uploadsRef.current.get(id)?.abort();
      uploadsRef.current.delete(id);
      URL.revokeObjectURL(url);

      if (serverId === undefined) return;

      void deleteAttachment(serverId).catch(() => {
        showToast("첨부를 서버에서 지우지 못했습니다.", "error");
      });
    },
    [showToast],
  );

  const remove = useCallback(
    (id: string) => {
      const target = attachmentsRef.current.find((item) => item.id === id);
      if (!target) return;

      drop(target);
      apply(attachmentsRef.current.filter((item) => item.id !== id));
    },
    [apply, drop],
  );

  const clear = useCallback(() => {
    if (attachmentsRef.current.length === 0) return;

    attachmentsRef.current.forEach(drop);
    apply([]);
  }, [apply, drop]);

  const retry = useCallback(
    (id: string) => {
      const target = attachmentsRef.current.find((item) => item.id === id);
      if (!target || target.status !== "failed") return;

      // emailId 가 아직 없으면 대기로 되돌려 두고 id 가 생길 때 effect 가 집어간다
      if (emailId === null) {
        patch(id, { status: "waiting", progress: 0, error: undefined });
        return;
      }
      upload(target, emailId);
    },
    [emailId, patch, upload],
  );

  const isUploading = attachments.some(
    ({ status }) => status === "waiting" || status === "uploading",
  );

  return {
    attachments,
    totalSize,
    maxTotalSize,
    isUploading,
    add,
    remove,
    clear,
    retry,
  };
}
