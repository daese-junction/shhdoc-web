"use client";

import { useEffect, useState } from "react";
import {
  fetchFolderCounts,
  subscribeEmails,
  type MailFolderCounts,
} from "@/api/emails";

/**
 * 사이드네비 뱃지용 폴더별 건수.
 * 목록과 같은 캐시를 쓰므로 목록이 이미 떠 있으면 요청을 더 만들지 않는다.
 * 메일을 보내거나 지우면 구독을 통해 알아서 다시 세어 온다.
 *
 * 아직 못 받았거나 실패하면 `null` 이다 — 뱃지는 보조 정보라
 * 실패를 사용자에게 따로 알리지 않는다 (목록 쪽이 같은 실패를 이미 알린다).
 */
export function useMailFolderCounts(): MailFolderCounts | null {
  const [counts, setCounts] = useState<MailFolderCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void fetchFolderCounts()
        .then((result) => {
          if (!cancelled) setCounts(result);
        })
        .catch(() => {
          if (!cancelled) setCounts(null);
        });
    };

    load();

    // 목록이 바뀔 때마다 (초안 저장·발송·삭제) 다시 센다
    const unsubscribe = subscribeEmails(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return counts;
}
