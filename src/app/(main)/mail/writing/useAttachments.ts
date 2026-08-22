"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToastStore } from "@/stores/useToastStore";
import { formatFileSize } from "@/utils/format";
import {
  MAX_ATTACHMENT_TOTAL_SIZE,
  getAttachmentKey,
  type Attachment,
} from "./attachments";

export interface UseAttachmentsResult {
  attachments: Attachment[];
  totalSize: number;
  maxTotalSize: number;
  add: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * 메일 쓰기 화면의 첨부파일 목록을 들고 있는다.
 * 서버 업로드는 아직 없고, 고른 File 객체와 미리보기/다운로드용 blob URL 만 관리한다.
 */
export function useAttachments(
  maxTotalSize: number = MAX_ATTACHMENT_TOTAL_SIZE,
): UseAttachmentsResult {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const showToast = useToastStore((state) => state.show);

  // blob URL 해제와 연속 추가 계산에 최신 목록이 필요해 ref 로도 들고 있는다
  const attachmentsRef = useRef<Attachment[]>([]);

  const apply = useCallback((next: Attachment[]) => {
    attachmentsRef.current = next;
    setAttachments(next);
  }, []);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  const totalSize = useMemo(
    () => attachments.reduce((sum, { file }) => sum + file.size, 0),
    [attachments],
  );

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
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
        });
      }

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

  const remove = useCallback(
    (id: string) => {
      const target = attachmentsRef.current.find((item) => item.id === id);
      if (!target) return;

      URL.revokeObjectURL(target.url);
      apply(attachmentsRef.current.filter((item) => item.id !== id));
    },
    [apply],
  );

  const clear = useCallback(() => {
    if (attachmentsRef.current.length === 0) return;

    attachmentsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    apply([]);
  }, [apply]);

  return { attachments, totalSize, maxTotalSize, add, remove, clear };
}
