import type { ListPage, ListPageParams } from "./list";

/** 문서 등급. 지정하지 않으면 `external`(외부가능). */
export type DocumentGrade = "external" | "internal";

/** 메일에 실린 문서 한 건. 등급은 문서마다 따로 매겨진다. */
export interface AuditDocument {
  name: string;
  grade: DocumentGrade;
}

/** 등급별 문서 수. 목록 배지가 이 단위로 그려진다. */
export interface DocumentGradeCount {
  grade: DocumentGrade;
  count: number;
}

/** 메일 한 통의 처리 결과 */
export type MailResult =
  | "deliverySuccess"
  | "deliveryFailed"
  | "sendFailed"
  | "sendBlocked";

/** 메일 한 통이 남긴 감사 기록 */
export interface AuditLog {
  id: string;
  occurredAt: string;
  senderName: string;
  senderEmail: string;
  /** 메일 제목. 목록 검색이 훑는 값이다. */
  title: string;
  recipients: string[];
  /** 한 메일에 문서가 여러 개일 수 있고, 등급도 문서마다 다르다 */
  documents: AuditDocument[];
  result: MailResult;
  ipAddress: string;
  /** 상세에서만 보여주는 부가 설명 (실패 사유 등) */
  description: string;
}

export interface AuditLogFilter {
  /** 메일 제목 검색어 */
  keyword: string;
  /** 그 등급의 문서를 하나라도 담은 메일만 남긴다 */
  grade: DocumentGrade | "all";
  result: MailResult | "all";
  /** yyyy-MM-dd. 빈 문자열이면 제한 없음 */
  from: string;
  to: string;
}

export type FetchAuditLogPage = (
  params: ListPageParams & { filter: AuditLogFilter },
) => Promise<ListPage<AuditLog>>;
