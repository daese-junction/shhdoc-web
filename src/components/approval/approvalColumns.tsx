import { Button } from "@/components/common";
import { MailStatusBadge } from "@/components/mail";
import type { ApprovalEmail } from "@/api/adminEmails";
import type { ListColumn } from "@/types/list";
import type { EmailDetail, EmailRecipient } from "@/types/mail";
import { formatFullDateTime, formatShortDateTime } from "@/utils/formatDate";
import { APPROVAL_STATUS_LABEL, REVIEW_RESULT_LABEL } from "./approvalMeta";

interface ApprovalColumnOptions {
  /** 목록 응답에 발신자·수신자가 없어 상세로 따로 채운다. 아직 못 받았으면 undefined. */
  getDetail: (id: number) => EmailDetail | undefined;
  onApprove: (email: ApprovalEmail) => void;
  onReject: (email: ApprovalEmail) => void;
  /** 발송거절된 메일의 사유를 따로 열어 본다 */
  onShowReason: (email: ApprovalEmail) => void;
}

/** 한 줄에 다 담을 수 없어 첫 수신자만 쓰고 나머지는 수로 줄인다 */
function renderRecipients(recipients: EmailRecipient[]) {
  const [first, ...rest] = recipients;

  return (
    <span title={recipients.map((to) => `${to.address} (${to.type})`).join("\n")}>
      {first.address}
      {rest.length > 0 && (
        <span className="text-text-tertiary"> 외 {rest.length}명</span>
      )}
    </span>
  );
}

/**
 * 승인 대기 목록의 열 구성.
 * 좁은 화면에서는 수신자를 접는다 — 상세에서 주소까지 다시 볼 수 있다.
 */
export function createApprovalColumns({
  getDetail,
  onApprove,
  onReject,
  onShowReason,
}: ApprovalColumnOptions): ListColumn<ApprovalEmail>[] {
  return [
    {
      key: "sender",
      header: "발신자",
      className: "w-32 shrink-0 truncate text-text-primary sm:w-48",
      render: (email) =>
        getDetail(email.id)?.senderAddress ?? (
          <span className="text-text-tertiary">—</span>
        ),
    },
    {
      key: "subject",
      header: "제목",
      className: "min-w-0 flex-1 truncate text-text-primary",
      render: (email) =>
        email.subject || <span className="text-text-tertiary">(제목 없음)</span>,
    },
    {
      key: "recipients",
      header: "수신자",
      className: "hidden w-44 shrink-0 truncate text-text-secondary lg:block xl:w-56",
      // 주소를 아직 못 받았으면 목록 응답에 있는 수만이라도 보여준다
      render: (email) => {
        const recipients = getDetail(email.id)?.recipients;
        if (!recipients) return `${email.recipientCount}명`;
        if (recipients.length === 0)
          return <span className="text-text-tertiary">수신자 없음</span>;

        return renderRecipients(recipients);
      },
    },
    {
      key: "status",
      header: "상태",
      className: "flex w-20 shrink-0 items-center gap-1.5 sm:w-32",
      render: (email) => (
        <>
          <MailStatusBadge
            status={email.status}
            label={APPROVAL_STATUS_LABEL[email.status]}
          />
          {/* 왜 나가지 못했는지는 사유를 봐야 안다 — 행 열기와 별개 동작이다 */}
          {email.status === "REJECTED" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowReason(email);
              }}
              className="hidden shrink-0 text-xs text-brand-600 underline underline-offset-2 hover:text-brand-700 sm:inline"
            >
              상세보기
            </button>
          )}
        </>
      ),
    },
    {
      key: "createdAt",
      header: "요청일시",
      className: "w-28 shrink-0 text-xs tabular-nums text-text-tertiary sm:w-36",
      render: (email) => (
        <time
          dateTime={email.createdAt}
          title={formatFullDateTime(email.createdAt)}
        >
          {formatShortDateTime(email.createdAt)}
        </time>
      ),
    },
    {
      key: "actions",
      header: "작업",
      className: "flex w-32 shrink-0 justify-end",
      // 이미 처리한 메일은 서버가 다시 받아주지 않으므로 버튼을 그리지 않는다
      render: (email) =>
        email.status === "BLOCKED" ? (
          // 버튼 클릭은 행 열기(상세 모달)와 별개 동작이다
          <span
            className="flex gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button size="sm" onClick={() => onApprove(email)}>
              승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(email)}
            >
              거절
            </Button>
          </span>
        ) : (
          // 처리한 건은 되돌릴 수 없다 — 무엇을 했는지만 남긴다
          <span className="text-xs text-text-tertiary">
            {REVIEW_RESULT_LABEL[email.status]}
          </span>
        ),
    },
  ];
}
