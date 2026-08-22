import type SvgIcon from "@mui/material/SvgIcon";
import type { MailFolderCounts } from "@/api/emails";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import AllInboxOutlined from "@mui/icons-material/AllInboxOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import DraftsOutlined from "@mui/icons-material/DraftsOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import PendingActionsOutlined from "@mui/icons-material/PendingActionsOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import PolicyOutlined from "@mui/icons-material/PolicyOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";

export type IconComponent = typeof SvgIcon;

export interface NavItem {
  href: string;
  label: string;
  Icon: IconComponent;
  /**
   * 뱃지에 어느 건수를 띄울지. 값 자체는 서버에서 받아 채운다.
   * 펼치면 오른쪽 숫자, 접으면 아이콘 위 파란 점으로 표시된다.
   */
  countKey?: keyof MailFolderCounts;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * 메일 사이드내비 폴더 목록.
 * 뱃지는 내가 손봐야 하는 폴더에만 단다 — 결재를 기다리거나 반려된 메일(승인대기)과
 * 아직 보내지 않은 초안(임시보관). 발신함·전체는 이미 끝난 메일이라 숫자를 띄우지 않는다.
 * 수신함·휴지통은 서버에 엔드포인트가 없어 셀 수 있는 값이 없다.
 */
export const MAIL_NAV_ITEMS: NavItem[] = [
  { href: "/mail/inbox", label: "수신함", Icon: InboxOutlined },
  {
    href: "/mail/pending",
    label: "승인대기",
    Icon: PendingActionsOutlined,
    countKey: "pending",
  },
  { href: "/mail/sent", label: "발신함", Icon: SendOutlined },
  {
    href: "/mail/drafts",
    label: "임시보관",
    Icon: DraftsOutlined,
    countKey: "drafts",
  },
  { href: "/mail/all", label: "전체", Icon: AllInboxOutlined },
  { href: "/mail/trash", label: "휴지통", Icon: DeleteOutlineOutlined },
];

/** 관리 사이드내비 섹션 목록. 소제목은 클릭 불가한 텍스트 라벨이다. */
export const MANAGE_NAV_SECTIONS: NavSection[] = [
  {
    title: "환경",
    items: [
      { href: "/manage/company", label: "회사 정보", Icon: BusinessOutlined },
    ],
  },
  {
    title: "조직",
    items: [
      { href: "/manage/members", label: "구성원", Icon: PeopleOutlined },
      { href: "/manage/departments", label: "조직", Icon: AccountTreeOutlined },
    ],
  },
  {
    title: "보안",
    items: [
      { href: "/manage/audit-log", label: "감사 로그", Icon: HistoryOutlined },
      { href: "/manage/approval", label: "승인/결재", Icon: VerifiedUserOutlined },
      {
        href: "/manage/document-policy",
        label: "정책",
        Icon: PolicyOutlined,
      },
    ],
  },
];
