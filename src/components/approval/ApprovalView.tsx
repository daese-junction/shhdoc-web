"use client";

import { useCallback, useMemo, useState } from "react";
import {
  approveEmail,
  fetchAdminEmailDetail,
  fetchApprovalPage,
  rejectEmail,
  type ApprovalEmail,
} from "@/api/adminEmails";
import { getErrorMessage } from "@/api/axios";
import { DataList } from "@/components/common";
import { useToastStore } from "@/stores/useToastStore";
import type { ListPageParams } from "@/types/list";
import type { EmailDetail } from "@/types/mail";
import { createApprovalColumns } from "./approvalColumns";
import { ApprovalDetailModal } from "./ApprovalDetailModal";
import { RejectReasonModal } from "./RejectReasonModal";
import { ReviewConfirmModal, type ReviewAction } from "./ReviewConfirmModal";

/** 확인 모달이 처리 중인 대상. 제목은 어떤 메일인지 확인시키는 용도다. */
interface ReviewTarget {
  action: ReviewAction;
  id: number;
  subject: string;
}

/** 사유 모달이 보고 있는 메일 */
interface ReasonTarget {
  id: number;
  subject: string;
}

const REVIEW_ERROR_MESSAGES: Record<number, string> = {
  400: "이미 처리된 메일입니다. 목록을 새로고침해 주세요.",
  404: "메일을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
};

/** 관리자 메일 승인 화면. `/manage/approval` 페이지는 이 컴포넌트만 렌더한다. */
export function ApprovalView() {
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const [reason, setReason] = useState<ReasonTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** 목록 응답에 발신자·수신자가 없어 상세로 채운다 */
  const [details, setDetails] = useState<Record<number, EmailDetail>>({});
  const showToast = useToastStore((state) => state.show);

  /**
   * 지금 페이지에 놓인 메일의 상세만 채운다.
   * 상세는 모듈에서 캐시하므로 페이지를 오가도 같은 메일을 다시 묻지 않는다.
   */
  const loadDetails = (items: ApprovalEmail[]) => {
    items.forEach((item) => {
      void fetchAdminEmailDetail(item.id)
        .then((detail) =>
          setDetails((prev) =>
            prev[item.id] === detail ? prev : { ...prev, [item.id]: detail },
          ),
        )
        // 한 건을 못 받았다고 목록 전체를 막을 이유는 없다
        .catch(() => undefined);
    });
  };

  const fetchPage = useCallback(
    (params: ListPageParams) =>
      fetchApprovalPage(params).then((result) => {
        loadDetails(result.items);
        return result;
      }),
    [],
  );

  const columns = useMemo(
    () =>
      createApprovalColumns({
        getDetail: (id) => details[id],
        onApprove: (email) =>
          setReview({ action: "approve", id: email.id, subject: email.subject }),
        onReject: (email) =>
          setReview({ action: "reject", id: email.id, subject: email.subject }),
        onShowReason: (email) =>
          setReason({ id: email.id, subject: email.subject }),
      }),
    [details],
  );

  const handleConfirm = async (note: string) => {
    if (!review) return;

    setSubmitting(true);
    try {
      if (review.action === "approve") await approveEmail(review.id, note);
      else await rejectEmail(review.id, note);

      showToast(
        review.action === "approve"
          ? "메일을 발송했습니다."
          : "메일을 거절했습니다.",
        "success",
      );
      setReview(null);
      setDetailId(null);
      // 처리하며 무효화한 상세를 다시 받아야 사유·상태가 최신이 된다
      setDetails((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
      // 상태가 바뀌었으니 서버가 확정한 목록을 다시 받는다
      setReloadToken((token) => token + 1);
    } catch (error) {
      // 응답 자체가 없으면 인터셉터가 이미 안내했으므로 빈 문자열이 온다
      const message = getErrorMessage(error, REVIEW_ERROR_MESSAGES);
      if (message) showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 목록이 본문 영역을 그대로 채운다 — 여백 없이 화면 끝까지
    <div className="flex min-h-auto flex-1 flex-col">
      <DataList<ApprovalEmail>
        className="min-h-0 flex-1"
        title="승인/결재"
        columns={columns}
        fetchPage={fetchPage}
        getRowId={(email) => String(email.id)}
        // 발송은 되돌릴 수 없어 여러 건을 한 번에 처리하지 않는다
        selectable={false}
        page={page}
        onPageChange={setPage}
        reloadToken={reloadToken}
        onRowClick={(email) => setDetailId(email.id)}
        emptyTitle="승인 요청이 없습니다"
        emptyDescription="결재를 기다리는 메일이 여기에 표시됩니다."
      />

      {/* 여는 메일이 바뀌면 새로 만든다 — 앞서 보던 내용이 남지 않는다 */}
      <ApprovalDetailModal
        key={`detail-${detailId ?? "closed"}`}
        emailId={detailId}
        onClose={() => setDetailId(null)}
        onReview={(action, email) =>
          setReview({ action, id: email.id, subject: email.subject })
        }
      />

      {/* 사유도 여는 메일이 바뀌면 새로 만든다 */}
      <RejectReasonModal
        key={reason ? `reason-${reason.id}` : "reason-closed"}
        emailId={reason?.id ?? null}
        subject={reason?.subject ?? ""}
        onClose={() => setReason(null)}
      />

      {/* 대상이 바뀌면 새로 만든다 — 앞서 쓰던 의견·사유가 남지 않는다 */}
      <ReviewConfirmModal
        key={review ? `review-${review.action}-${review.id}` : "review-closed"}
        action={review?.action ?? null}
        subject={review?.subject ?? ""}
        loading={submitting}
        onClose={() => setReview(null)}
        onConfirm={(note) => void handleConfirm(note)}
      />
    </div>
  );
}
