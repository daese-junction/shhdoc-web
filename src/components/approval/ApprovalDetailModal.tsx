"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  fetchAdminEmailDetail,
  fetchAttachmentDownloadUrl,
  fetchEmailAttachments,
} from "@/api/adminEmails";
import { getErrorMessage } from "@/api/axios";
import { Button, Loading, Modal } from "@/components/common";
import { MAIL_BODY_CLASS, MailStatusBadge, sanitizeMailBody } from "@/components/mail";
import { useToastStore } from "@/stores/useToastStore";
import type { EmailAttachment, EmailDetail } from "@/types/mail";
import { formatFileSize } from "@/utils/format";
import { formatFullDateTime } from "@/utils/formatDate";
import { APPROVAL_STATUS_LABEL } from "./approvalMeta";
import type { ReviewAction } from "./ReviewConfirmModal";

interface ApprovalDetailModalProps {
  /** null 이면 닫힌 상태 */
  emailId: number | null;
  onClose: () => void;
  onReview: (action: ReviewAction, email: EmailDetail) => void;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 border-b border-border-tertiary py-2 last:border-b-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-text-primary">
        {children}
      </dd>
    </div>
  );
}

/**
 * 문서 한 건의 검사 결과.
 * 판정이 없는 동안에도 검사가 어디까지 갔는지는 보여야 한다 — 판정이 비어 있는 게
 * "통과" 인지 "아직" 인지 구분되지 않으면 승인해도 되는지 알 수 없다.
 */
function AttachmentVerdictBadge({ attachment }: { attachment: EmailAttachment }) {
  if (attachment.verdict === "BLOCKED")
    return (
      <span className="shrink-0 rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
        반출불가
      </span>
    );

  if (attachment.scanStatus === "PENDING")
    return (
      <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        검사 중
      </span>
    );

  if (attachment.scanStatus === "FAILED")
    return (
      <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
        검사 실패
      </span>
    );

  return null;
}

/** 발송을 승인할지 판단하는 화면. 본문·수신자·첨부를 한 번에 보여준다. */
export function ApprovalDetailModal({
  emailId,
  onClose,
  onReview,
}: ApprovalDetailModalProps) {
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  /**
   * 첨부 조회가 실패했는지. 실패를 삼키면 "첨부한 파일이 없습니다" 로 보여
   * 검사에 걸린 문서가 없는 것처럼 읽힌다 — 판단을 그르치는 거짓말이다.
   */
  const [attachmentsFailed, setAttachmentsFailed] = useState(false);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    if (emailId === null) return;

    // 열릴 때마다 호출부가 key 로 이 컴포넌트를 다시 만들어 상태는 이미 비어 있다
    let cancelled = false;

    void fetchAdminEmailDetail(emailId).then((email) => {
      if (!cancelled) setDetail(email);
    });

    // 첨부는 없을 수도 있고, 실패해도 본문·수신자로 하는 판단까지 막지는 않는다
    void fetchEmailAttachments(emailId)
      .then((files) => {
        if (!cancelled) setAttachments(files);
      })
      .catch(() => {
        if (!cancelled) setAttachmentsFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [emailId]);

  /** 검사에서 걸린 문서. 승인할지 거절할지는 사실상 이걸 보고 정한다. */
  const blockedAttachments = attachments.filter(
    (attachment) => attachment.verdict === "BLOCKED",
  );
  /** 검사가 아직 안 끝난 문서가 있으면 판정이 더 붙을 수 있다 */
  const pendingAttachments = attachments.filter(
    (attachment) => attachment.scanStatus === "PENDING",
  );

  /** 서명 주소가 만료될 수 있어 실제로 열어볼 때 발급받는다 */
  const openAttachment = async (attachment: EmailAttachment) => {
    try {
      const url = await fetchAttachmentDownloadUrl(attachment.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = getErrorMessage(error, {
        404: "첨부를 찾을 수 없습니다.",
      });
      if (message) showToast(message, "error");
    }
  };

  return (
    <Modal open={emailId !== null} onClose={onClose} title="승인 요청 상세">
      {!detail ? (
        <Loading message="메일을 불러오는 중이에요" />
      ) : (
        <>
          {/*
            이 메일이 왜 결재로 넘어왔는지가 승인 판단의 출발점이다.
            아래 첨부 목록에도 같은 근거가 있지만, 스크롤해서 찾게 두지 않는다.
          */}
          {blockedAttachments.length > 0 && (
            <section className="mb-4 flex flex-col gap-2 rounded-lg border border-error/40 bg-error/5 p-3">
              <h3 className="text-sm font-medium text-error">
                검사에서 반출불가로 걸린 문서 {blockedAttachments.length}건
              </h3>
              <ul className="flex flex-col gap-2">
                {blockedAttachments.map((attachment) => (
                  <li key={attachment.id} className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {attachment.filename}
                    </span>
                    <p className="text-sm leading-relaxed break-words text-text-secondary">
                      {attachment.reason || "판정 근거가 기록되지 않았습니다."}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 판정이 더 붙을 수 있는데 승인하면 검사 안 끝난 문서가 그대로 나간다 */}
          {pendingAttachments.length > 0 && (
            <p className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-text-secondary">
              아직 검사 중인 문서가 {pendingAttachments.length}건 있습니다. 판정이
              끝난 뒤에 승인하는 편이 안전합니다.
            </p>
          )}

          <dl className="flex flex-col">
            <DetailRow label="발신자">{detail.senderAddress}</DetailRow>
            <DetailRow label="제목">
              {detail.subject || (
                <span className="text-text-tertiary">(제목 없음)</span>
              )}
            </DetailRow>
            <DetailRow label="수신자">
              {detail.recipients.length === 0 ? (
                <span className="text-text-tertiary">수신자가 없습니다</span>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {detail.recipients.map((recipient) => (
                    <li key={`${recipient.type}-${recipient.address}`}>
                      {recipient.address}
                      <span className="text-text-tertiary">
                        {" "}
                        ({recipient.type})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailRow>
            <DetailRow label="상태">
              <MailStatusBadge
                status={detail.status}
                label={APPROVAL_STATUS_LABEL[detail.status]}
              />
            </DetailRow>
            <DetailRow label="요청일시">
              {formatFullDateTime(detail.createdAt)}
            </DetailRow>
            <DetailRow label={`첨부 ${attachments.length}건`}>
              {attachmentsFailed ? (
                <span className="text-error">
                  첨부와 검사 결과를 불러오지 못했습니다. 검사에 걸린 문서가
                  있는지 확인할 수 없으니 승인은 새로고침 후에 판단해 주세요.
                </span>
              ) : attachments.length === 0 ? (
                <span className="text-text-tertiary">첨부한 파일이 없습니다</span>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openAttachment(attachment)}
                          className="min-w-0 truncate text-brand-600 underline underline-offset-2 hover:text-brand-700"
                        >
                          {attachment.filename}
                        </button>
                        <span className="shrink-0 text-xs text-text-tertiary">
                          {formatFileSize(attachment.sizeBytes)}
                        </span>
                        <AttachmentVerdictBadge attachment={attachment} />
                      </div>
                      {/* 통과한 문서의 근거도 판단에 쓰인다 — 판정이 있으면 그대로 보여준다 */}
                      {attachment.reason && (
                        <p
                          className={`text-xs leading-relaxed break-words ${
                            attachment.verdict === "BLOCKED"
                              ? "text-error"
                              : "text-text-secondary"
                          }`}
                        >
                          {attachment.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DetailRow>
            {/* 처리한 메일은 언제 어떤 판단을 내렸는지가 남아야 한다 */}
            {detail.reviewedAt && (
              <DetailRow label="처리일시">
                {formatFullDateTime(detail.reviewedAt)}
              </DetailRow>
            )}
            {detail.reviewNote && (
              <DetailRow
                label={detail.status === "REJECTED" ? "거절 사유" : "관리자 의견"}
              >
                {detail.reviewNote}
              </DetailRow>
            )}
          </dl>

          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-text-secondary">본문</span>
            <div
              className={`max-h-64 overflow-y-auto rounded-lg border border-border-tertiary p-3 text-sm leading-relaxed break-words text-text-primary ${MAIL_BODY_CLASS}`}
              dangerouslySetInnerHTML={{ __html: sanitizeMailBody(detail.body) }}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            {/* 이미 처리한 메일은 서버가 다시 받아주지 않는다 */}
            {detail.status === "BLOCKED" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onReview("reject", detail)}
                >
                  거절
                </Button>
                <Button onClick={() => onReview("approve", detail)}>승인</Button>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
