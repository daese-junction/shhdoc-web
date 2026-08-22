import type SvgIcon from "@mui/material/SvgIcon";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import AllInboxOutlined from "@mui/icons-material/AllInboxOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import DraftsOutlined from "@mui/icons-material/DraftsOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import PendingActionsOutlined from "@mui/icons-material/PendingActionsOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";

export type IconComponent = typeof SvgIcon;

export interface NavItem {
  href: string;
  label: string;
  Icon: IconComponent;
  /** 폴더의 전체 개수. 펼친 상태에서 오른쪽 회색 숫자로 표시된다. */
  count?: number;
  /** 주목이 필요한 개수(읽지 않음·대기). 브랜드 컬러 pill로 표시된다. */
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** 메일 사이드내비 폴더 목록. count/badge는 API 연동 전까지의 목데이터. */
export const MAIL_NAV_ITEMS: NavItem[] = [
  { href: "/mail/inbox", label: "수신함", Icon: InboxOutlined, count: 12, badge: 3 },
  { href: "/mail/pending", label: "승인대기", Icon: PendingActionsOutlined, count: 5, badge: 5 },
  { href: "/mail/sent", label: "발신함", Icon: SendOutlined, count: 8 },
  { href: "/mail/drafts", label: "임시보관", Icon: DraftsOutlined, count: 2 },
  { href: "/mail/all", label: "전체", Icon: AllInboxOutlined, count: 27 },
  { href: "/mail/trash", label: "휴지통", Icon: DeleteOutlineOutlined, count: 1 },
];

/** 관리 사이드내비 섹션 목록. 소제목은 클릭 불가한 텍스트 라벨이다. */
export const MANAGE_NAV_SECTIONS: NavSection[] = [
  {
    title: "환경",
    items: [
      { href: "/manage/company", label: "회사 정보", Icon: BusinessOutlined },
      { href: "/manage/domain", label: "도메인", Icon: LanguageOutlined },
    ],
  },
  {
    title: "조직",
    items: [
      { href: "/manage/members", label: "구성원", Icon: PeopleOutlined },
      { href: "/manage/roles", label: "직책", Icon: BadgeOutlined },
      { href: "/manage/departments", label: "조직", Icon: AccountTreeOutlined },
    ],
  },
  {
    title: "보안",
    items: [
      { href: "/manage/audit-log", label: "감사 로그", Icon: HistoryOutlined },
      { href: "/manage/approval", label: "승인/결재", Icon: VerifiedUserOutlined },
    ],
  },
];
