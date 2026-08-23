"use client";

import AttachFileRounded from "@mui/icons-material/AttachFileRounded";
import {
  fetchAttachmentDownloadUrl,
  type MailAttachment,
} from "@/api/attachments";
import { getErrorMessage } from "@/api/axios";
import { StatusPill } from "@/components/common";
import { useToastStore } from "@/stores/useToastStore";
import { formatFileSize } from "@/utils/format";

interface MailAttachmentListProps {
  files: MailAttachment[];
  /**
   * 첨부 조회가 실패했는지. 실패를 삼키면 "첨부한 파일이 없습니다" 로 보여
   * 검사에 걸린 문서가 없는 것처럼 읽힌다 — 발송이 왜 막혔는지를 감추는 거짓말이다.
   */
  failed: boolean;
}

/**
 * 첨부 한 건의 검사 결과.
 * 통과한 문서에도 알약을 붙인다 — 알약이 없는 줄이 "통과" 인지 "아직" 인지
 * 구분되지 않으면 파일마다 결과를 알린다고 할 수 없다.
 */
function ScanResultPill({ attachment }: { attachment: MailAttachment }) {
  if (attachment.verdict === "BLOCKED")
    return (
      <StatusPill
        label="반출불가"
        tone="bg-error/10 text-error"
        title={attachment.reason}
      />
    );

  if (attachment.scanStatus === "PENDING")
    return <StatusPill label="검사 중" tone="bg-warning/10 text-warning" busy />;

  if (attachment.scanStatus === "FAILED")
    return (
      <StatusPill
        label="검사 실패"
        tone="bg-surface-tertiary text-text-secondary"
      />
    );

  return <StatusPill label="통과" tone="bg-success/10 text-success" />;
}

/**
 * 메일에 붙은 첨부 전부와 파일별 검사 결과.
 * 발신자가 보는 화면이라 관리자 승인 화면(ApprovalDetailModal)과 같은 정보를 주되,
 * 승인·거절 같은 결재 동작은 없다.
 */
export function MailAttachmentList({ files, failed }: MailAttachmentListProps) {
  const showToast = useToastStore((state) => state.show);

  // 첨부가 없는 메일에서 빈 목록까지 그리면 본문만 읽고 싶은 화면이 시끄러워진다
  if (!failed && files.length === 0) return null;

  /** 서명 주소는 유효기간이 있어 미리 받아 두지 않고 열 때마다 발급받는다 */
  const openAttachment = async (attachment: MailAttachment) => {
    try {
      const url = await fetchAttachmentDownloadUrl(attachment.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = getErrorMessage(
        error,
        { 404: "첨부를 찾을 수 없습니다." },
        "첨부를 열지 못했습니다.",
      );
      if (message) showToast(message, "error");
    }
  };

  return (
    <section className="shrink-0 border-t border-border-tertiary px-6 py-4">
      <h2 className="flex items-center gap-1 text-xs font-medium text-text-secondary">
        <AttachFileRounded fontSize="inherit" className="shrink-0" />
        첨부 {failed ? "" : `${files.length}건`}
      </h2>

      {failed ? (
        <p className="mt-2 text-sm text-error">
          첨부 목록을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {files.map((attachment) => (
            <li key={attachment.id} className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openAttachment(attachment)}
                  className="min-w-0 truncate text-sm text-brand-600 underline underline-offset-2 hover:text-brand-700"
                >
                  {attachment.filename}
                </button>
                {attachment.sizeBytes !== undefined && (
                  <span className="shrink-0 text-xs text-text-tertiary">
                    {formatFileSize(attachment.sizeBytes)}
                  </span>
                )}
                <ScanResultPill attachment={attachment} />
              </div>
              {/* 통과한 문서의 근거도 다음 메일을 쓸 때 쓰인다 — 있으면 그대로 보여준다 */}
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
    </section>
  );
}
