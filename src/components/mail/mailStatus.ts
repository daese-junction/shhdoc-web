import type { SvgIconComponent } from "@mui/icons-material";
import CancelRounded from "@mui/icons-material/CancelRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import type { EmailStatus, Mail } from "@/types/mail";

/**
 * 알약이 그리는 단계.
 * 서버 상태(`EmailStatus`)에 화면에서만 쓰는 두 칸을 더 얹는다 —
 * 승인 대기(`BLOCKED`) 한 덩어리 안에서 "검토 중"과 "권한 밖"이 갈리기 때문이다.
 *
 * `EmailStatus` 의 상위집합이어야 승인 화면이 `status={email.status}` 를 그대로 넘길 수 있다.
 */
export type MailBadgeStatus = EmailStatus | "SCANNING" | "DOC_RESTRICTED";

export interface MailStatusMeta {
  label: string;
  /** 알약의 배경·글자색 (StatusPill 의 tone) */
  className: string;
  /** 라벨 앞에 붙는 아이콘. busy 면 스피너가 대신 들어간다. */
  Icon?: SvgIconComponent;
  /** 진행 중인 단계인지. 스피너가 돈다. */
  busy?: boolean;
}

/**
 * 단계별 알약 문구와 색.
 *
 * 옅은 톤이 기본이고 **진한 알약은 `반려` 하나뿐**이다 — 사용자가 직접 고쳐서 다시
 * 보내야 하는 유일한 상태라, 목록에서 혼자 튀어야 한다.
 * 옅은 톤은 auditLog·approval 알약이 이미 쓰는 반투명 배경 방식과 같다.
 */
export const MAIL_STATUS_META: Record<MailBadgeStatus, MailStatusMeta> = {
  DRAFT: {
    label: "임시보관",
    className: "bg-surface-tertiary text-text-secondary",
  },
  SCANNING: {
    label: "문서 검토중",
    // 시맨틱 토큰에 info 가 없어 진행 중은 brand 를 쓴다.
    // brand 스케일은 다크에서 뒤집히므로 600 하나로 두 모드가 다 맞는다.
    className: "bg-brand-500/10 text-brand-600",
    busy: true,
  },
  DOC_RESTRICTED: {
    label: "문서 권한 밖",
    className: "bg-error/10 text-error",
    Icon: GppMaybeOutlined,
  },
  BLOCKED: {
    label: "승인 대기중",
    className: "bg-warning/10 text-warning",
    Icon: ScheduleRounded,
  },
  REJECTED: {
    label: "반려",
    className: "bg-error text-white",
    Icon: CancelRounded,
  },
  SENT: {
    label: "발송완료",
    className: "bg-success/10 text-success",
    Icon: CheckCircleRounded,
  },
};

/**
 * 메일 한 통이 어느 단계에 있는지.
 * 승인 대기(BLOCKED)는 첨부 검토 결과에 따라 세 갈래로 갈린다 —
 * 결과를 못 받았으면 가장 무난한 "승인 대기중" 으로 물러난다.
 */
export function getMailBadgeStatus({
  status,
  reviewStage,
}: Pick<Mail, "status" | "reviewStage">): MailBadgeStatus | undefined {
  if (!status) return undefined;
  if (status !== "BLOCKED") return status;

  if (reviewStage === "SCANNING") return "SCANNING";
  if (reviewStage === "DOC_RESTRICTED") return "DOC_RESTRICTED";
  return "BLOCKED";
}
