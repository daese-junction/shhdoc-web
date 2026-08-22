"use client";

import { useRef, type ChangeEvent } from "react";
import { Checkbox } from "@/components/common";
import type { EmailStatus, Mail } from "@/types/mail";
import { formatShortDateTime, formatFullDateTime } from "@/utils/formatDate";
import { MAIL_STATUS_META, type MailStatusMeta } from "../mailStatus";

interface MailListItemProps {
  mail: Mail;
  /** 현재 페이지 안에서의 순번. shift 범위 선택의 기준이 된다. */
  index: number;
  selected: boolean;
  onToggle: (id: string, index: number, shiftKey: boolean) => void;
  onOpen?: (mail: Mail) => void;
}

export function MailListItem({
  mail,
  index,
  selected,
  onToggle,
  onOpen,
}: MailListItemProps) {
  // label 을 거쳐 들어온 클릭은 change 이벤트에 수식키가 남지 않을 수 있어
  // 캡처 단계에서 미리 받아둔다.
  const shiftKeyRef = useRef(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as Partial<MouseEvent>;
    onToggle(
      mail.id,
      index,
      shiftKeyRef.current || Boolean(nativeEvent.shiftKey),
    );
    shiftKeyRef.current = false;
  };

  return (
    <li
      onClick={() => onOpen?.(mail)}
      className={`flex items-center gap-3 border-b border-border-tertiary px-4 py-3 text-sm transition-colors hover:bg-surface-tertiary ${
        onOpen ? "cursor-pointer" : ""
      } ${selected ? "bg-brand-50" : ""}`}
    >
      {/* 체크는 행 열기와 별개 동작이다 */}
      <span
        className="flex shrink-0 items-center"
        onClickCapture={(event) => {
          shiftKeyRef.current = event.shiftKey;
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          aria-label={`${mail.senderName}의 메일 선택`}
          checked={selected}
          onChange={handleChange}
        />
      </span>
      <span
        className={`w-32 shrink-0 truncate text-text-primary ${
          mail.isRead ? "" : "font-semibold"
        }`}
      >
        {mail.senderName}
      </span>
      {mail.status && <MailStatusBadge status={mail.status} />}
      {/* 제목 + 본문 미리보기를 한 줄에 붙여 그리고, 넘치면 통째로 자른다 */}
      <span className="min-w-0 flex-1 truncate text-text-primary">
        <span className={mail.isRead ? "" : "font-semibold"}>{mail.title}</span>
        {mail.preview && (
          <span className="text-text-secondary">
            {" — "}
            {mail.preview}
          </span>
        )}
      </span>
      <time
        dateTime={mail.receivedAt}
        title={formatFullDateTime(mail.receivedAt)}
        className="w-28 shrink-0 text-right text-xs text-text-tertiary"
      >
        {formatShortDateTime(mail.receivedAt)}
      </time>
    </li>
  );
}

interface MailStatusBadgeProps {
  status: EmailStatus;
}

/** 발신 계열 메일의 상태 뱃지. 서버가 모르는 상태를 주면 그리지 않는다. */
function MailStatusBadge({ status }: MailStatusBadgeProps) {
  const meta = MAIL_STATUS_META[status] as MailStatusMeta | undefined;
  if (!meta) return null;

  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-white ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
