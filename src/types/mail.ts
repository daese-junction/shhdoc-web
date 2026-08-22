export interface Mail {
  id: string;
  senderName: string;
  title: string;
  /** 목록에서 제목 뒤에 한 줄로 붙는 본문 미리보기 */
  preview?: string;
  receivedAt: string;
  isRead: boolean;
}

export interface MailPageParams {
  page: number;
  pageSize: number;
}

export interface MailPage {
  items: Mail[];
  total: number;
  page: number;
  pageSize: number;
}

export type FetchMailPage = (params: MailPageParams) => Promise<MailPage>;

/** 목록이 어떤 메일함을 그리는지 구분한다 */
export type MailListVariant = "default" | "trash";

/** 메일 폴더. 값은 `/mail/<folder>` 라우트 세그먼트와 같다. */
export type MailFolder =
  | "inbox"
  | "pending"
  | "sent"
  | "drafts"
  | "all"
  | "trash";

/** 메일이 실제로 담기는 폴더. `all` 은 여러 폴더를 모아 보는 뷰라 제외한다. */
export type MailStoredFolder = Exclude<MailFolder, "all">;

export interface MailAddress {
  name: string;
  email: string;
}

/** 상세 화면용. 목록(`Mail`)에 없는 주소·본문·소속 폴더를 얹는다. */
export interface MailDetail extends Mail {
  folder: MailStoredFolder;
  sender: MailAddress;
  recipients: MailAddress[];
  /** 에디터가 만든 HTML */
  body: string;
}
