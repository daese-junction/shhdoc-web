"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/common";
import {
  deleteDraft,
  fetchEmailPage,
  invalidateEmails,
  isEmailFolder,
} from "@/api/emails";
import { createMailFolderApi } from "@/mocks/mail";
import type { FetchMailPage, Mail, MailFolder } from "@/types/mail";
import { getMailComposeRoute, getMailDetailRoute } from "@/utils/routes";
import { MAIL_FOLDER_META } from "./mailFolders";
import { MailList } from "./MailList/MailList";

interface MailFolderViewProps {
  folder: MailFolder;
}

/** AI 검증이 도는 동안 목록을 다시 읽는 간격 */
const SCAN_REFRESH_INTERVAL = 8000;

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

  // 수신함·휴지통은 아직 API 가 없어 목 데이터를 그대로 쓴다
  const usesEmails = isEmailFolder(folder);
  // AI 검증이 도는 중인 메일이 이 페이지에 있는지. 있을 때만 목록을 스스로 다시 읽는다.
  const [hasScanning, setHasScanning] = useState(false);
  // MailList 가 fetchPage 를 effect 의존성으로 쓰므로 참조를 고정한다
  const mock = useMemo(() => createMailFolderApi(folder), [folder]);
  const fetchPage = useMemo<FetchMailPage>(
    () =>
      usesEmails
        ? (params) =>
            fetchEmailPage(folder, params).then((result) => {
              // setState 는 신원이 고정이라 이 래퍼가 매번 새로 만들어지지 않는다
              setHasScanning(
                result.items.some((mail) => mail.reviewStage === "SCANNING"),
              );
              return result;
            })
        : mock.fetchPage,
    [usesEmails, folder, mock],
  );

  const meta = MAIL_FOLDER_META[folder];
  const isTrash = folder === "trash";
  // 스펙상 DELETE 는 초안 전용이라 발신함·승인대기에서는 삭제를 내주지 않는다
  const isDrafts = folder === "drafts";

  const deleteDrafts = useCallback(
    (ids: string[]) =>
      Promise.all(ids.map((id) => deleteDraft(Number(id)))).then(() => undefined),
    [],
  );

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

  // 초안은 읽을 게 아니라 이어서 쓰는 것이므로 상세 대신 작성 화면을 연다
  const openMail = useCallback(
    (mail: Mail) =>
      router.push(
        mail.status === "DRAFT"
          ? getMailComposeRoute("edit", mail.id)
          : getMailDetailRoute(mail.id),
      ),
    [router],
  );

  return (
    <MailList
      className="min-h-0 flex-1"
      title={meta.label}
      variant={isTrash ? "trash" : "default"}
      page={page}
      onPageChange={changePage}
      fetchPage={fetchPage}
      onMarkAsRead={usesEmails ? undefined : mock.markAsRead}
      onDelete={
        isDrafts ? deleteDrafts : usesEmails || isTrash ? undefined : mock.moveToTrash
      }
      onPermanentDelete={isTrash ? mock.permanentlyDelete : undefined}
      onRestore={usesEmails ? undefined : mock.restore}
      onOpenMail={openMail}
      onInvalidate={usesEmails ? invalidateEmails : undefined}
      // 검증이 끝나 뱃지가 넘어가는 것을 새로고침 없이 보여 준다
      autoRefreshMs={hasScanning ? SCAN_REFRESH_INTERVAL : undefined}
      emptyTitle={meta.emptyTitle}
      emptyDescription={meta.emptyDescription}
    />
  );
}
