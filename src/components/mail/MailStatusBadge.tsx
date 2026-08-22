import { StatusPill } from "@/components/common";
import {
  MAIL_STATUS_META,
  type MailBadgeStatus,
  type MailStatusMeta,
} from "./mailStatus";

interface MailStatusBadgeProps {
  status: MailBadgeStatus;
  /**
   * 화면마다 같은 상태를 다르게 부를 때만 넘긴다.
   * (승인 화면은 REJECTED 를 발신자 화면의 "반려" 대신 "발송거절" 로 부른다.)
   */
  label?: string;
  /** 마우스를 올렸을 때 뜨는 사유. 검토에서 걸린 문서명 등. */
  title?: string;
}

/** 발신 계열 메일의 상태 알약. 서버가 모르는 상태를 주면 그리지 않는다. */
export function MailStatusBadge({ status, label, title }: MailStatusBadgeProps) {
  const meta = MAIL_STATUS_META[status] as MailStatusMeta | undefined;
  if (!meta) return null;

  const { Icon } = meta;

  return (
    <StatusPill
      label={label ?? meta.label}
      tone={meta.className}
      busy={meta.busy}
      title={title}
      // 라벨(12px)보다 살짝 크게 둬야 아이콘이 글자와 같은 무게로 보인다
      icon={Icon && <Icon fontSize="inherit" className="text-sm" />}
    />
  );
}
