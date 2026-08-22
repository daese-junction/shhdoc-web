"use client";

import { useEffect, useState } from "react";
import { fetchAdminEmailDetail, fetchEmailAttachments } from "@/api/adminEmails";
import { Button, Loading, Modal } from "@/components/common";
import type { EmailAttachment, EmailDetail } from "@/types/mail";
import { formatFileSize } from "@/utils/format";
import { formatFullDateTime } from "@/utils/formatDate";

interface RejectReasonModalProps {
  /** null 이면 닫힌 상태 */
  emailId: number | null;
  /** 어떤 메일의 사유인지 확인시켜 준다 */
  subject: string;
  onClose: () => void;
}

/**
 * 발송거절 사유만 따로 보여주는 화면.
 * 관리자가 적은 거절 사유와, 검사에서 반출불가로 걸린 문서의 판정 근거를 함께 놓는다.
 * 같은 발신자·같은 문서가 다시 올라왔을 때 승인·거절 판단이 빨라지라고 있는 화면이다.
 */
export function RejectReasonModal({
  emailId,
  subject,
  onClose,
}: RejectReasonModalProps) {
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  /** 판정 근거가 있는 것만 남긴다 — 통과한 문서는 거절과 상관이 없다 */
  const [blocked, setBlocked] = useState<EmailAttachment[]>([]);

  useEffect(() => {
    if (emailId === null) return;

    // 열릴 때마다 호출부가 key 로 이 컴포넌트를 다시 만들어 상태는 이미 비어 있다
    let cancelled = false;

    void fetchAdminEmailDetail(emailId).then((email) => {
      if (!cancelled) setDetail(email);
    });

    // 첨부는 없을 수도 있고, 못 받아도 관리자 사유는 보여줄 수 있다
    void fetchEmailAttachments(emailId)
      .then((files) => {
        if (!cancelled)
          setBlocked(files.filter((file) => file.verdict === "BLOCKED"));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [emailId]);

  return (
    <Modal open={emailId !== null} onClose={onClose} title="발송거절 사유">
      {!detail ? (
        <Loading message="사유를 불러오는 중이에요" />
      ) : (
        <div className="flex flex-col gap-5">
          <p className="truncate text-sm font-medium text-text-primary">
            {subject || "(제목 없음)"}
          </p>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm text-text-secondary">
              관리자 사유
              {detail.reviewedAt && (
                <span className="ml-2 text-xs text-text-tertiary">
                  {formatFullDateTime(detail.reviewedAt)}
                </span>
              )}
            </h3>
            <p className="rounded-lg border border-border-tertiary p-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-text-primary">
              {detail.reviewNote || (
                <span className="text-text-tertiary">
                  남긴 사유가 없습니다.
                </span>
              )}
            </p>
          </section>

          {/* 문서 때문에 막힌 것이면 어떤 파일이 왜 걸렸는지가 진짜 사유다 */}
          {blocked.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-sm text-text-secondary">
                반출불가 문서 {blocked.length}건
              </h3>
              <ul className="flex flex-col gap-2">
                {blocked.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex flex-col gap-1 rounded-lg border border-error/40 bg-error/5 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                        {attachment.filename}
                      </span>
                      <span className="shrink-0 text-xs text-text-tertiary">
                        {formatFileSize(attachment.sizeBytes)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words text-text-secondary">
                      {attachment.reason || "판정 근거가 기록되지 않았습니다."}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
