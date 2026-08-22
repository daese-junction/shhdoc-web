import { api } from "./axios";
import type {
  EmailDetail,
  EmailPayload,
  EmailRecipient,
  EmailStatus,
  EmailSummary,
  Mail,
  MailAddress,
  MailDetail,
  MailFolder,
  MailPage,
  MailPageParams,
  MailStoredFolder,
  RecipientType,
} from "@/types/mail";

/** GET /emails — 내가 쓴 메일. 페이지 파라미터가 없어 한 번에 다 내려온다. */
export function fetchEmails(
  status?: EmailStatus,
  signal?: AbortSignal,
): Promise<EmailSummary[]> {
  return api
    .get<EmailSummary[]>("/emails", { params: status ? { status } : undefined, signal })
    .then((response) => response.data);
}

/** GET /emails/{id} — 본문과 수신자까지 있는 한 통. */
export function fetchEmailDetail(
  id: number,
  signal?: AbortSignal,
): Promise<EmailDetail> {
  return api
    .get<EmailDetail>(`/emails/${id}`, { signal })
    .then((response) => response.data);
}

/**
 * POST /emails — 메일 초안을 만든다.
 * 수신자 없이도 저장되며, 발송은 수신자가 한 명 이상일 때만 가능하다.
 * 첨부는 이 요청에 실리지 않는다 (스펙에 없음 — 별도 업로드 연동 시 추가한다).
 */
export function createDraft(payload: EmailPayload): Promise<EmailDetail> {
  return api.post<EmailDetail>("/emails", payload).then((response) => {
    invalidateEmails();
    return response.data;
  });
}

/** PATCH /emails/{id} — 초안 수정. 이미 발송된 메일은 서버가 400 으로 막는다. */
export function updateDraft(id: number, payload: EmailPayload): Promise<void> {
  return api.patch(`/emails/${id}`, payload).then(() => {
    invalidateEmails();
  });
}

/** DELETE /emails/{id} — 초안 삭제. 되돌릴 수 없다. */
export function deleteDraft(id: number): Promise<void> {
  return api.delete(`/emails/${id}`).then(() => {
    invalidateEmails();
  });
}

/**
 * POST /emails/{id}/send — 발송.
 * 결재가 필요하면 곧바로 SENT 가 되지 않고 BLOCKED(승인 대기)로 떨어진다.
 */
export function sendEmail(id: number): Promise<EmailDetail> {
  return api.post<EmailDetail>(`/emails/${id}/send`).then((response) => {
    invalidateEmails();
    return response.data;
  });
}

/** 주소 목록을 스펙의 수신자 객체로 바꾼다. 빈 문자열은 걸러낸다. */
export function toRecipients(
  addresses: string[],
  type: RecipientType = "TO",
): EmailRecipient[] {
  return addresses
    .map((address) => address.trim())
    .filter(Boolean)
    .map((address) => ({ address, type }));
}

/** 서버 메일이 실제로 담기는 폴더. 수신함·휴지통은 스펙에 없어 여기 없다. */
type EmailFolder = Extract<MailStoredFolder, "drafts" | "pending" | "sent">;

/** 상태별로 어느 메일함에 담기는지. 반려도 다시 결재를 받아야 해서 승인대기에 함께 둔다. */
const FOLDER_BY_STATUS: Record<EmailStatus, EmailFolder> = {
  DRAFT: "drafts",
  BLOCKED: "pending",
  REJECTED: "pending",
  SENT: "sent",
};

/**
 * GET /emails 는 페이지 파라미터가 없어 언제나 전체를 준다.
 * 폴더를 옮기거나 페이지를 넘길 때마다 같은 걸 다시 받을 이유가 없으므로
 * 한 번 받은 목록을 잠깐 들고 있으면서 모든 폴더가 나눠 쓴다.
 */
const CACHE_TTL = 30_000;

let cache: { at: number; emails: EmailSummary[] } | null = null;
let inflight: Promise<EmailSummary[]> | null = null;
/** 조회 도중에 목록이 바뀌었는지 판별한다 */
let generation = 0;

/**
 * 목록 응답에는 수신자 수만 있어 주소는 상세를 봐야 안다.
 * 같은 메일을 두 번 묻지 않도록 한 번 받은 것을 들고 있는다 — 목록과 함께 비운다.
 */
const detailCache = new Map<number, EmailDetail>();
const detailInflight = new Map<number, Promise<EmailDetail>>();

/** 목록이 바뀌었을 때 다시 그려야 하는 곳들 (사이드네비 뱃지 등) */
const listeners = new Set<() => void>();

/**
 * 목록이 바뀌면 알려준다. 돌려받은 함수를 부르면 구독이 끊긴다.
 * 목록을 직접 들고 있지 않은 화면이 변경 시점을 알기 위한 통로다.
 */
export function subscribeEmails(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 목록을 바꾼 뒤에는 반드시 불러 다음 조회가 서버를 다시 보게 한다. */
export function invalidateEmails(): void {
  cache = null;
  detailCache.clear();
  generation += 1;
  listeners.forEach((notify) => notify());
}

function loadEmails(): Promise<EmailSummary[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return Promise.resolve(cache.emails);
  }
  // 여러 목록이 동시에 뜨면 요청 하나만 보내고 결과를 나눠 갖는다
  if (inflight) return inflight;

  const started = generation;

  inflight = fetchEmails()
    .then((emails) => {
      // 받는 사이에 무효화됐다면 이미 낡은 값이라 캐시에 넣지 않는다
      if (started === generation) cache = { at: Date.now(), emails };
      return emails;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** 상세 한 통. 캐시에 있으면 그대로 쓰고, 같은 메일을 동시에 물으면 요청을 합친다. */
function loadEmailDetail(id: number): Promise<EmailDetail> {
  const cached = detailCache.get(id);
  if (cached) return Promise.resolve(cached);

  const pending = detailInflight.get(id);
  if (pending) return pending;

  const request = fetchEmailDetail(id)
    .then((detail) => {
      detailCache.set(id, detail);
      return detail;
    })
    .finally(() => {
      detailInflight.delete(id);
    });

  detailInflight.set(id, request);
  return request;
}

/**
 * 지금 페이지에 놓인 메일의 수신자만 채운다.
 * 한 건을 못 받아도 그 줄만 수로 남을 뿐 목록 전체는 그대로 뜬다.
 */
function loadRecipients(
  emails: EmailSummary[],
): Promise<Map<number, EmailRecipient[]>> {
  return Promise.all(
    emails.map((email) =>
      loadEmailDetail(email.id)
        .then(
          (detail) => [email.id, detail.recipients] as [number, EmailRecipient[]],
        )
        .catch(() => null),
    ),
  ).then(
    (entries) =>
      new Map(
        entries.filter(
          (entry): entry is [number, EmailRecipient[]] => entry !== null,
        ),
      ),
  );
}

/** 사이드네비 뱃지가 쓰는 폴더별 건수. */
export interface MailFolderCounts {
  /** 승인 대기 + 반려 — 둘 다 내가 다시 손봐야 하는 메일이다 */
  pending: number;
  drafts: number;
  sent: number;
  all: number;
}

/**
 * 폴더별 메일 건수. 목록과 같은 캐시를 쓰므로
 * 목록이 이미 떠 있으면 요청을 더 만들지 않는다.
 */
export function fetchFolderCounts(): Promise<MailFolderCounts> {
  return loadEmails().then((emails) => {
    const counts: MailFolderCounts = {
      pending: 0,
      drafts: 0,
      sent: 0,
      all: emails.length,
    };

    emails.forEach((email) => {
      counts[FOLDER_BY_STATUS[email.status]] += 1;
    });

    return counts;
  });
}

/**
 * 화면용 id 가 서버 메일을 가리키는지.
 * 서버 id 는 숫자뿐이고 목 데이터는 `inbox-1` 꼴이라 이것으로 갈린다.
 */
export const isEmailId = (id: string): boolean => /^[0-9]+$/.test(id);

/** GET /emails 로 그릴 수 있는 폴더. 수신함·휴지통은 아직 스펙이 없다. */
export function isEmailFolder(folder: MailFolder): boolean {
  return (
    folder === "drafts" ||
    folder === "pending" ||
    folder === "sent" ||
    folder === "all"
  );
}

/**
 * 목록의 보낸이 자리에 들어갈 글. 내가 쓴 메일이라 받는 사람을 쓴다.
 * 한 명이면 주소를 그대로 쓴다 — "받는사람 1명" 은 누구에게 보냈는지를 감추기만 한다.
 * 주소를 못 받아왔을 때만 목록 응답에 있는 수로 물러난다.
 */
function toRecipientLabel(
  count: number,
  recipients?: EmailRecipient[],
): string {
  if (!recipients || recipients.length === 0)
    return count > 0 ? `받는사람 ${count}명` : "받는사람 없음";

  const [first, ...rest] = recipients;
  return rest.length === 0
    ? first.address
    : `${first.address} 외 ${rest.length}명`;
}

/** 목록 한 줄로 옮긴다. 내가 쓴 메일이라 보낸이 자리에는 받는 사람이 온다. */
export function toMail(email: EmailSummary, recipients?: EmailRecipient[]): Mail {
  return {
    id: String(email.id),
    senderName: toRecipientLabel(email.recipientCount, recipients),
    title: email.subject,
    // 아직 보내지 않았으면 작성 시각이 기준이 된다
    receivedAt: email.sentAt ?? email.createdAt,
    // 내가 쓴 메일이라 읽음 여부가 없다
    isRead: true,
    status: email.status,
  };
}

/** 서버는 주소만 준다. 이름을 알 수 없으므로 이름 자리에도 주소를 쓴다. */
const toAddress = (address: string): MailAddress => ({
  name: address,
  email: address,
});

/** 상세 응답을 화면이 쓰는 모양으로 옮긴다. */
export function toMailDetail(email: EmailDetail): MailDetail {
  return {
    id: String(email.id),
    senderName: email.senderAddress,
    sender: toAddress(email.senderAddress),
    recipients: email.recipients.map((recipient) => toAddress(recipient.address)),
    title: email.subject,
    body: email.body,
    receivedAt: email.sentAt ?? email.createdAt,
    isRead: true,
    status: email.status,
    folder: FOLDER_BY_STATUS[email.status],
    reviewNote: email.reviewNote,
  };
}

/** 아직 보내지 않았으면 작성 시각이 기준이 된다 — `toMail` 의 receivedAt 과 같다. */
const receivedAt = (email: EmailSummary) => email.sentAt ?? email.createdAt;

const byReceivedAtDesc = (a: EmailSummary, b: EmailSummary) =>
  Date.parse(receivedAt(b)) - Date.parse(receivedAt(a));

/**
 * 폴더 하나에 대한 목록 조회.
 * 서버가 전체 배열을 한 번에 주므로 상태로 거르고 페이지는 여기서 자른다.
 * 수신자 주소는 지금 페이지에 놓인 것만 상세로 채운다 — 전체를 채우면
 * 메일이 쌓일수록 목록이 뜨는 데 걸리는 시간이 같이 늘어난다.
 */
export function fetchEmailPage(
  folder: MailFolder,
  { page, pageSize }: MailPageParams,
): Promise<MailPage> {
  return loadEmails().then(async (emails) => {
    const matched = emails
      .filter(
        (email) =>
          folder === "all" || FOLDER_BY_STATUS[email.status] === folder,
      )
      .sort(byReceivedAtDesc);

    const start = (page - 1) * pageSize;
    const pageItems = matched.slice(start, start + pageSize);
    const recipients = await loadRecipients(pageItems);

    return {
      items: pageItems.map((email) => toMail(email, recipients.get(email.id))),
      total: matched.length,
      page,
      pageSize,
    };
  });
}
