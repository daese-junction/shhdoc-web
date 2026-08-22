import type { ListColumn } from "@/types/list";
import type { Mail } from "@/types/mail";
import { formatShortDateTime, formatFullDateTime } from "@/utils/formatDate";
import { getMailBadgeStatus } from "../mailStatus";
import { MailStatusBadge } from "../MailStatusBadge";

/** 메일 목록의 열 구성. 읽지 않은 메일은 보낸이와 제목을 굵게 그린다. */
export const MAIL_COLUMNS: ListColumn<Mail>[] = [
  {
    key: "sender",
    // 발신함은 이 자리에 받는 사람 주소가 온다 — 이름보다 길어 폭을 더 준다
    className: "w-32 shrink-0 truncate text-text-primary sm:w-56",
    render: (mail) => (
      <span
        title={mail.senderName}
        className={mail.isRead ? "" : "font-semibold"}
      >
        {mail.senderName}
      </span>
    ),
  },
  {
    key: "status",
    // 아이콘 + "문서 검토중" 이 한 줄에 들어가는 최소 폭. 수신함에서는 빈 칸이 된다.
    className: "w-28 shrink-0",
    render: (mail) => {
      const status = getMailBadgeStatus(mail);
      if (!status) return null;

      // 행 자체가 클릭 대상이라 Tooltip 으로 감싸지 않고 네이티브 title 을 쓴다
      return <MailStatusBadge status={status} title={mail.reviewReason} />;
    },
  },
  {
    key: "title",
    // 제목 + 본문 미리보기를 한 줄에 붙여 그리고, 넘치면 통째로 자른다
    className: "min-w-0 flex-1 truncate text-text-primary",
    render: (mail) => (
      <>
        <span className={mail.isRead ? "" : "font-semibold"}>{mail.title}</span>
        {mail.preview && (
          <span className="text-text-secondary">
            {" — "}
            {mail.preview}
          </span>
        )}
      </>
    ),
  },
  {
    key: "receivedAt",
    className: "w-28 shrink-0 text-right text-xs text-text-tertiary",
    render: (mail) => (
      <time
        dateTime={mail.receivedAt}
        title={formatFullDateTime(mail.receivedAt)}
      >
        {formatShortDateTime(mail.receivedAt)}
      </time>
    ),
  },
];
