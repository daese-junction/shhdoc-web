import { api } from "./axios";
import { invalidateEmails } from "./emails";
import type { ListPage, ListPageParams } from "@/types/list";
import type {
  EmailAttachment,
  EmailDetail,
  EmailStatus,
  EmailSummary,
} from "@/types/mail";

/**
 * 승인 화면이 다루는 상태.
 * BLOCKED 는 아직 처리하지 않은 것, REJECTED·SENT 는 관리자가 이미 처리한 것이다.
 * 처리한 메일도 어떤 판단을 내렸는지 남겨야 해서 목록에서 빼지 않는다.
 */
const QUEUE_STATUSES = ["BLOCKED", "REJECTED", "SENT"] as const;

export type ApprovalStatus = (typeof QUEUE_STATUSES)[number];

/** 승인 목록 한 줄. 서버 목록 응답에서 이 화면이 다루는 상태만 좁힌 것. */
export interface ApprovalEmail extends EmailSummary {
  status: ApprovalStatus;
}

/**
 * GET /admin/emails — 관리자가 결재해야 하는 메일.
 * status 는 하나만 받고 페이지 파라미터가 없어 해당 상태 전체가 한 번에 온다.
 */
function fetchAdminEmails(
  status: EmailStatus,
  signal?: AbortSignal,
): Promise<EmailSummary[]> {
  return api
    .get<EmailSummary[]>("/admin/emails", { params: { status }, signal })
    .then((response) => response.data);
}

const isApprovalEmail = (email: EmailSummary): email is ApprovalEmail =>
  QUEUE_STATUSES.some((status) => status === email.status);

/** 처리해야 할 것이 위로 온다. 이미 처리한 건은 확인용이라 아래로 밀어둔다. */
const STATUS_ORDER: Record<ApprovalStatus, number> = {
  BLOCKED: 0,
  REJECTED: 1,
  SENT: 1,
};

/**
 * 대기 중인 것은 오래 기다린 순으로 — 서버도 오래된 순으로 준다.
 * 처리한 것은 방금 내린 판단이 먼저 보이도록 최근 순으로 뒤집는다.
 */
const byQueueOrder = (a: ApprovalEmail, b: ApprovalEmail) => {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;

  return a.status === "BLOCKED"
    ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
    : Date.parse(b.createdAt) - Date.parse(a.createdAt);
};

/**
 * SENT 에는 결재를 거친 메일과 결재 없이 곧바로 나간 메일이 섞여 있다.
 * 이 화면은 관리자가 내린 판단만 남기는 곳이라 승인해서 나간 것만 골라낸다.
 * 가려낼 값(reviewedAt)이 목록 응답에 없어 상세를 봐야 한다 — 상세는 캐시되므로
 * 페이지를 오가도 다시 묻지 않지만, 발송한 메일이 많아지면 서버 필터가 필요하다.
 */
function keepReviewed(emails: ApprovalEmail[]): Promise<ApprovalEmail[]> {
  return Promise.all(
    emails.map((email) =>
      fetchAdminEmailDetail(email.id)
        .then((detail) => (detail.reviewedAt ? email : null))
        // 한 건을 못 받았다고 목록 전체를 막지 않는다 — 판단 근거가 없으면 뺀다
        .catch(() => null),
    ),
  ).then((results) => results.filter((email): email is ApprovalEmail => email !== null));
}

/**
 * 승인 대기와 처리 결과를 한 목록으로 합친다.
 * status 파라미터가 단일값이라 상태마다 따로 물어보는 수밖에 없다.
 */
export function fetchApprovalQueue(
  signal?: AbortSignal,
): Promise<ApprovalEmail[]> {
  return Promise.all(
    QUEUE_STATUSES.map((status) => fetchAdminEmails(status, signal)),
  ).then(async (groups) => {
    const emails = groups.flat().filter(isApprovalEmail);
    const sent = emails.filter((email) => email.status === "SENT");
    const reviewed = await keepReviewed(sent);
    const reviewedIds = new Set(reviewed.map((email) => email.id));

    return emails
      .filter((email) => email.status !== "SENT" || reviewedIds.has(email.id))
      .sort(byQueueOrder);
  });
}

/**
 * 목록 한 페이지. 서버가 전체를 한 번에 주므로 자르는 건 여기서 한다.
 * (`fetchEmailPage` 와 같은 방식이다.)
 */
export function fetchApprovalPage({
  page,
  pageSize,
}: ListPageParams): Promise<ListPage<ApprovalEmail>> {
  return fetchApprovalQueue().then((items) => {
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    };
  });
}

/**
 * 상세는 목록의 발신자 열과 상세 모달이 함께 쓴다.
 * 같은 메일을 두 번 물어보지 않도록 한 번 받은 것을 들고 있는다.
 */
const detailCache = new Map<number, EmailDetail>();
const detailInflight = new Map<number, Promise<EmailDetail>>();

/** GET /admin/emails/{id} — 본문과 수신자까지. 사용자용 `/emails/{id}` 와 달리 남의 메일도 본다. */
export function fetchAdminEmailDetail(id: number): Promise<EmailDetail> {
  const cached = detailCache.get(id);
  if (cached) return Promise.resolve(cached);

  const inflight = detailInflight.get(id);
  if (inflight) return inflight;

  const request = api
    .get<EmailDetail>(`/admin/emails/${id}`)
    .then((response) => {
      detailCache.set(id, response.data);
      return response.data;
    })
    .finally(() => {
      detailInflight.delete(id);
    });

  detailInflight.set(id, request);
  return request;
}

/** 승인·거절로 상태가 바뀌면 들고 있던 상세는 낡은 것이 된다. */
function invalidateAdminEmailDetail(id: number): void {
  detailCache.delete(id);
}

/** 승인·거절 요청 본문. 승인은 선택, 거절은 필수이며 발신자에게 그대로 보인다. */
interface ReviewRequest {
  note?: string;
}

/** 처리한 메일은 발신자의 목록에서도 상태가 달라진다 */
function afterReview(id: number): void {
  invalidateAdminEmailDetail(id);
  invalidateEmails();
}

/**
 * POST /admin/emails/{id}/approve — 승인.
 * 서버가 곧바로 발송하고 SENT 로 바꾼다. 되돌릴 수 없다.
 */
export function approveEmail(id: number, note?: string): Promise<void> {
  const trimmed = note?.trim();
  const body: ReviewRequest = trimmed ? { note: trimmed } : {};

  return api.post(`/admin/emails/${id}/approve`, body).then(() => {
    afterReview(id);
  });
}

/** POST /admin/emails/{id}/reject — 거절. 사유는 필수다. */
export function rejectEmail(id: number, note: string): Promise<void> {
  return api
    .post(`/admin/emails/${id}/reject`, { note: note.trim() } satisfies ReviewRequest)
    .then(() => {
      afterReview(id);
    });
}

/** GET /emails/{emailId}/attachments — 발신자 본인과 같은 회사 관리자가 볼 수 있다. */
export function fetchEmailAttachments(
  emailId: number,
  signal?: AbortSignal,
): Promise<EmailAttachment[]> {
  return api
    .get<EmailAttachment[]>(`/emails/${emailId}/attachments`, { signal })
    .then((response) => response.data);
}

/**
 * 스펙에 이 응답의 스키마가 없어 실제 형태를 확정하지 못했다.
 * 주소 문자열을 그대로 주는 경우와 객체에 담아 주는 경우를 모두 받는다.
 */
function toDownloadUrl(data: unknown): string {
  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    const candidate = data as Record<string, unknown>;
    const value = candidate.url ?? candidate.downloadUrl;
    if (typeof value === "string") return value;
  }

  throw new Error("다운로드 주소를 받지 못했습니다.");
}

/** GET /attachments/{id}/download-url — 관리자가 첨부를 열어볼 때만 발급받는다. */
export function fetchAttachmentDownloadUrl(id: number): Promise<string> {
  return api
    .get(`/attachments/${id}/download-url`)
    .then((response) => toDownloadUrl(response.data));
}
