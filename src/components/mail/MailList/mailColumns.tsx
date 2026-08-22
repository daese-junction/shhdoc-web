import type { ListColumn } from "@/types/list";
import type { Mail } from "@/types/mail";
import { formatShortDateTime, formatFullDateTime } from "@/utils/formatDate";

/** 메일 목록의 열 구성. 읽지 않은 메일은 보낸이와 제목을 굵게 그린다. */
export const MAIL_COLUMNS: ListColumn<Mail>[] = [
  {
    key: "sender",
    className: "w-32 shrink-0 truncate text-text-primary",
    render: (mail) => (
      <span className={mail.isRead ? "" : "font-semibold"}>
        {mail.senderName}
      </span>
    ),
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
