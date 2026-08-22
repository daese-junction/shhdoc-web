import type { FetchListPage, ListPage, ListPageParams } from "./list";

/** 서버가 관리하는 메일 상태. GET /emails 의 status 값. */
export type EmailStatus = "DRAFT" | "BLOCKED" | "REJECTED" | "SENT";

/** GET /emails 응답 한 건. 목록에 필요한 값만 내려온다. */
export interface EmailSummary {
  id: number;
  subject: string;
  status: EmailStatus;
  recipientCount: number;
  createdAt: string;
  /** 아직 발송되지 않았으면 비어 있다 */
  sentAt?: string | null;
}

/** GET /emails/{id} 응답. 목록(`EmailSummary`)에 본문·수신자·검토 결과가 더 붙는다. */
export interface EmailDetail {
  id: number;
  /** 보낸 사람 주소. 내가 쓴 메일이라 언제나 내 주소다. */
  senderAddress: string;
  subject: string;
  /** 에디터가 만든 HTML */
  body: string;
  status: EmailStatus;
  recipients: EmailRecipient[];
  /** 관리자가 승인·반려하며 남긴 메모. 반려 사유가 여기 담긴다. */
  reviewNote?: string | null;
  reviewedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

/** POST /emails · PATCH /emails/{id} 의 공통 요청 본문 */
export interface EmailPayload {
  subject: string;
  /** 에디터가 만든 본문 HTML */
  body: string;
  /** 초안은 수신자가 없어도 된다. 발송 시점에 한 명 이상이어야 한다. */
  recipients: EmailRecipient[];
}

export interface Mail {
  id: string;
  senderName: string;
  title: string;
  /** 목록에서 제목 뒤에 한 줄로 붙는 본문 미리보기 */
  preview?: string;
  receivedAt: string;
  isRead: boolean;
  /** 발신 계열 메일만 가진다. 목록에서 상태 뱃지로 보여준다. */
  status?: EmailStatus;
}

/** 목록 조회 타입은 공통 목록(DataList)과 같은 것을 쓴다 */
export type MailPageParams = ListPageParams;
export type MailPage = ListPage<Mail>;
export type FetchMailPage = FetchListPage<Mail>;

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
  /** 서버 메일만 가진다. 반려된 메일이면 사유가 담겨 있다. */
  reviewNote?: string | null;
}

/** 수신자 구분. 값은 서버가 그대로 받는 문자열이다. */
export type RecipientType = "TO" | "CC" | "BCC";

export interface EmailRecipient {
  /** 이메일 주소 */
  address: string;
  type: RecipientType;
}

/** 첨부 파일 검사 진행 상태 */
export type AttachmentScanStatus = "PENDING" | "DONE" | "FAILED";

/** 검사 결과. 검사가 끝나기 전에는 비어 있다. */
export type AttachmentVerdict = "ALLOWED" | "BLOCKED";

/** GET /emails/{emailId}/attachments 응답 한 건 */
export interface EmailAttachment {
  id: number;
  filename: string;
  sizeBytes: number;
  scanStatus: AttachmentScanStatus;
  /** 검사 전에는 null 이다 */
  verdict?: AttachmentVerdict | null;
  /** 판정 근거 */
  reason?: string | null;
  createdAt: string;
}
