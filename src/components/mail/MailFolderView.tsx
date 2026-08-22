"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/common";
import { createMailFolderApi } from "@/mocks/mail";
import type { Mail, MailFolder } from "@/types/mail";
import { getMailDetailRoute } from "@/utils/routes";
import { MAIL_FOLDER_META } from "./mailFolders";
import { MailList } from "./MailList/MailList";

interface MailFolderViewProps {
  folder: MailFolder;
}

/** 폴더별 메일 목록 화면. `/mail/<folder>` 페이지는 이 컴포넌트만 렌더한다. */
export function MailFolderView({ folder }: MailFolderViewProps) {
  return (
    // 목록이 본문 영역을 그대로 채운다 — 여백 없이 화면 끝까지
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 페이지 번호를 URL 에서 읽으므로 프리렌더용 경계가 필요하다 */}
      <Suspense fallback={<Loading />}>
        <FolderMailList folder={folder} />
      </Suspense>
    </div>
  );
}

function FolderMailList({ folder }: MailFolderViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // MailList 가 fetchPage 를 effect 의존성으로 쓰므로 참조를 고정한다
  const api = useMemo(() => createMailFolderApi(folder), [folder]);

  const meta = MAIL_FOLDER_META[folder];
  const isTrash = folder === "trash";

  // 상세를 열었다 돌아와도 보던 페이지가 유지되도록 URL 에 남긴다
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // 객체가 아니라 문자열로 들고 있어야 콜백 신원이 URL 이 바뀔 때만 달라진다
  const search = searchParams.toString();

  const changePage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(search);
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, search],
  );

  const openMail = useCallback(
    (mail: Mail) => router.push(getMailDetailRoute(mail.id)),
    [router],
  );

  return (
    <MailList
      className="min-h-0 flex-1"
      title={meta.label}
      variant={isTrash ? "trash" : "default"}
      page={page}
      onPageChange={changePage}
      fetchPage={api.fetchPage}
      onMarkAsRead={api.markAsRead}
      onDelete={isTrash ? undefined : api.moveToTrash}
      onPermanentDelete={isTrash ? api.permanentlyDelete : undefined}
      onRestore={api.restore}
      onOpenMail={openMail}
      emptyTitle={meta.emptyTitle}
      emptyDescription={meta.emptyDescription}
    />
  );
}
