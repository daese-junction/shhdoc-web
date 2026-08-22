import type { ListPage } from "@/types/list";
import type {
  AuditDocument,
  AuditLog,
  AuditLogFilter,
  MailResult,
} from "@/types/auditLog";

/** 실제 API 연동 전까지 사용하는 임시 데이터. src/api 작업 시 교체한다. */
const SENDERS = [
  { name: "김대세", email: "user1@shhdoc.io" },
  { name: "이정션", email: "user2@shhdoc.io" },
  { name: "박서준", email: "user3@shhdoc.io" },
  { name: "최다은", email: "user4@shhdoc.io" },
  { name: "정하늘", email: "user5@shhdoc.io" },
  { name: "한지우", email: "user6@shhdoc.io" },
];

const TITLES = [
  "계약서 검토 요청드립니다",
  "9월 정기 회의 일정 안내",
  "[대외비] 3분기 실적 정리",
  "청구서 발송 건 확인 부탁드립니다",
  "문서 서명 완료 알림",
  "[내부] 채용 전형 결과 공유",
  "프로젝트 산출물 전달드립니다",
  "요청하신 자료 첨부합니다",
];

const RECIPIENT_POOL = [
  "partner@example.com",
  "legal@example.com",
  "finance@shhdoc.io",
  "hr@shhdoc.io",
  "client@example.co.kr",
  "team@shhdoc.io",
];

/** 결과별 사유. 성공 건도 무엇이 남았는지 한 줄로 적는다. */
const DESCRIPTION: Record<MailResult, string> = {
  deliverySuccess: "수신 서버가 정상 수신했습니다.",
  deliveryFailed: "수신 서버가 메일함 용량 초과로 반송했습니다.",
  sendFailed: "발신 서버 연결이 끊겨 발송하지 못했습니다.",
  sendBlocked: "내부용 문서라 외부 도메인 발송이 정책에 의해 차단됐습니다.",
};

/** 메일에 실리는 문서. 등급은 문서마다 붙는다. */
const INTERNAL_DOCUMENT: AuditDocument = {
  name: "보안정책_개정안.pdf",
  grade: "internal",
};

const DOCUMENTS: AuditDocument[] = [
  { name: "계약서_초안_v3.pdf", grade: "external" },
  { name: "정기회의_안건.docx", grade: "external" },
  { name: "3분기_실적요약.xlsx", grade: "internal" },
  { name: "산출물_목록.xlsx", grade: "external" },
  { name: "채용전형_결과.pdf", grade: "internal" },
  { name: "청구내역_8월.pdf", grade: "external" },
  INTERNAL_DOCUMENT,
];

/** 순번으로 결과를 돌려 쓴다 — 성공이 대부분이고 실패가 간간이 섞이게 둔다 */
const RESULT_CYCLE: MailResult[] = [
  "deliverySuccess",
  "deliverySuccess",
  "deliveryFailed",
  "deliverySuccess",
  "sendFailed",
  "deliverySuccess",
  "deliverySuccess",
  "sendBlocked",
];

const BASE_TIME = Date.parse("2026-08-22T18:00:00+09:00");
const MINUTE = 60 * 1000;
const DELAY = 300;
const COUNT = 137;

/**
 * 순번에 따라 문서를 0~3개 싣는다.
 * 발신차단은 내부용 문서 때문에 막힌 것이므로 하나는 반드시 내부용으로 둔다.
 */
const documentsOf = (index: number, result: MailResult): AuditDocument[] => {
  const documents = Array.from(
    { length: index % 4 },
    (_none, offset) => DOCUMENTS[(index + offset) % DOCUMENTS.length],
  );

  if (result !== "sendBlocked") return documents;
  if (documents.some((document) => document.grade === "internal")) {
    return documents;
  }

  return [...documents, INTERNAL_DOCUMENT];
};

const logs: AuditLog[] = Array.from({ length: COUNT }, (_unused, index) => {
  const sender = SENDERS[index % SENDERS.length];
  const title = TITLES[index % TITLES.length];
  const result = RESULT_CYCLE[index % RESULT_CYCLE.length];

  return {
    id: `audit-${index + 1}`,
    // 최근 것이 위로 오도록 순번만큼 과거로 민다
    occurredAt: new Date(BASE_TIME - index * 37 * MINUTE).toISOString(),
    senderName: sender.name,
    senderEmail: sender.email,
    title: `${title} (${index + 1})`,
    recipients: Array.from(
      { length: (index % 3) + 1 },
      (_none, offset) => RECIPIENT_POOL[(index + offset) % RECIPIENT_POOL.length],
    ),
    documents: documentsOf(index, result),
    result,
    ipAddress: `10.20.${(index % 5) + 1}.${(index % 200) + 10}`,
    description: DESCRIPTION[result],
  };
});

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), DELAY));

/** yyyy-MM-dd 로 들어온 시작·끝 날짜는 그 날 전체를 포함한다 */
const inDateRange = (occurredAt: string, from: string, to: string) => {
  const time = Date.parse(occurredAt);
  if (from && time < Date.parse(`${from}T00:00:00`)) return false;
  if (to && time > Date.parse(`${to}T23:59:59.999`)) return false;
  return true;
};

const matches = (log: AuditLog, filter: AuditLogFilter) => {
  if (
    filter.grade !== "all" &&
    !log.documents.some((document) => document.grade === filter.grade)
  ) {
    return false;
  }
  if (filter.result !== "all" && log.result !== filter.result) return false;
  if (!inDateRange(log.occurredAt, filter.from, filter.to)) return false;

  const keyword = filter.keyword.trim().toLowerCase();
  return !keyword || log.title.toLowerCase().includes(keyword);
};

export function fetchAuditLogPage({
  page,
  pageSize,
  filter,
}: {
  page: number;
  pageSize: number;
  filter: AuditLogFilter;
}): Promise<ListPage<AuditLog>> {
  const filtered = logs.filter((log) => matches(log, filter));
  const start = (page - 1) * pageSize;

  return delay({
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  });
}
