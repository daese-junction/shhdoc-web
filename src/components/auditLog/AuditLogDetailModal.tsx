"use client";

import type { ReactNode } from "react";
import { Button, Modal } from "@/components/common";
import type { AuditLog } from "@/types/auditLog";
import { formatFullDateTime } from "@/utils/formatDate";
import { DocumentGradeBadge, MailResultBadge } from "./AuditLogBadges";

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3 border-b border-border-tertiary py-2 last:border-b-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-text-primary">
        {children}
      </dd>
    </div>
  );
}

/** 목록에서 접어 둔 값(수신자 전체·IP·사유)까지 한 번에 보여준다 */
export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  return (
    <Modal open={log !== null} onClose={onClose} title="감사 로그 상세">
      {log && (
        <>
          <dl className="flex flex-col">
            <DetailRow label="시각">
              {formatFullDateTime(log.occurredAt)}
            </DetailRow>
            <DetailRow label="발신자">
              {log.senderName}
              <span className="text-text-tertiary"> ({log.senderEmail})</span>
            </DetailRow>
            <DetailRow label="제목">{log.title}</DetailRow>
            <DetailRow label="수신자">
              <ul className="flex flex-col gap-0.5">
                {log.recipients.map((recipient) => (
                  <li key={recipient}>{recipient}</li>
                ))}
              </ul>
            </DetailRow>
            <DetailRow label={`문서 ${log.documents.length}건`}>
              {log.documents.length === 0 ? (
                <span className="text-text-tertiary">첨부한 문서가 없습니다</span>
              ) : (
                // 목록은 등급별 개수만 보여주므로 여기서는 문서마다 등급을 붙인다
                <ul className="flex flex-col gap-1">
                  {log.documents.map((document, index) => (
                    <li
                      key={`${document.name}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <span className="min-w-0 truncate">{document.name}</span>
                      <DocumentGradeBadge grade={document.grade} />
                    </li>
                  ))}
                </ul>
              )}
            </DetailRow>
            <DetailRow label="결과">
              <MailResultBadge result={log.result} />
            </DetailRow>
            <DetailRow label="IP">
              <span className="tabular-nums">{log.ipAddress}</span>
            </DetailRow>
            <DetailRow label="사유">{log.description}</DetailRow>
          </dl>

          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
