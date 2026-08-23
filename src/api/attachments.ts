import { api } from "./axios";

/** 서버가 첨부를 검사한 진행 상태. 등록 직후에는 대개 PENDING 이다. */
export type ScanStatus = "PENDING" | "DONE" | "FAILED";

/** 검사 판정. 검사 전에는 서버가 내려주지 않는다. */
export type ScanVerdict = "ALLOWED" | "BLOCKED";

/** AttachmentResponse — 등록·조회가 모두 이 모양으로 온다 */
export interface MailAttachment {
  id: number;
  filename: string;
  sizeBytes?: number;
  scanStatus: ScanStatus;
  /** 검사 전에는 없다 */
  verdict?: ScanVerdict;
  /** 판정 근거 */
  reason?: string;
  createdAt?: string;
}

/** 1번 단계에서 받아 오는 업로드 티켓 */
export interface AttachmentUploadTicket {
  /** 스토리지(shhdoc-storage.daeonlab.com)로 바로 PUT 할 주소 */
  uploadUrl: string;
  /** 3번 단계에서 그대로 되돌려 줘야 하는 저장 키 */
  storageKey: string;
  /** 이 주소가 만료되기까지 남은 시간(초) */
  expiresInSeconds?: number;
}

/**
 * 1. POST /emails/{emailId}/attachments/upload-url — 업로드 주소 발급.
 * DRAFT 상태의 내 메일에만 첨부할 수 있다 (아니면 400).
 */
export function createAttachmentUploadUrl(
  emailId: number,
  filename: string,
  signal?: AbortSignal,
): Promise<AttachmentUploadTicket> {
  return api
    .post<AttachmentUploadTicket>(
      `/emails/${emailId}/attachments/upload-url`,
      { filename },
      { signal },
    )
    .then((response) => response.data);
}

export interface UploadOptions {
  signal?: AbortSignal;
  /** 0~1. 보낸 바이트 비율 */
  onProgress?: (ratio: number) => void;
}

/**
 * 2. 받은 주소로 파일을 그대로 PUT 한다.
 *
 * 우리 서버가 아니라 스토리지로 가는 요청이라 api 인스턴스(토큰·baseURL·타임아웃)를 쓰지 않는다
 * — 인터셉터가 Authorization 을 얹으면 안 된다.
 * fetch 는 업로드 진행 이벤트를 주지 않아서 XHR 로 보낸다. Content-Type 은 따로 지정하지 않는다
 * (브라우저가 파일에서 붙인다) — 서명에 없는 헤더를 우리가 덧붙이면 스토리지가 거절할 수 있다.
 */
export function uploadFileToStorage(
  uploadUrl: string,
  file: File,
  { signal, onProgress }: UploadOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("업로드가 취소되었습니다", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    const stopListening = () => {
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => xhr.abort();
    signal?.addEventListener("abort", abort, { once: true });

    xhr.upload.addEventListener("progress", (event) => {
      // 크기를 모르면 비율을 낼 수 없다 — 그럴 땐 진행률을 건드리지 않는다
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    });

    xhr.addEventListener("load", () => {
      stopListening();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      reject(new Error(`파일 업로드에 실패했습니다 (${xhr.status})`));
    });

    xhr.addEventListener("error", () => {
      stopListening();
      reject(new Error("파일 업로드에 실패했습니다"));
    });

    xhr.addEventListener("abort", () => {
      stopListening();
      reject(new DOMException("업로드가 취소되었습니다", "AbortError"));
    });

    xhr.send(file);
  });
}

/**
 * 3. POST /emails/{emailId}/attachments — 올린 파일을 메일에 등록한다.
 * 서버가 스토리지 도착 여부를 확인하고 검사를 시작한다. 검사는 비동기라
 * 응답이 PENDING 으로 올 수 있고, 그때는 목록 조회로 결과를 기다린다.
 */
export function registerAttachment(
  emailId: number,
  params: { storageKey: string; filename: string },
  signal?: AbortSignal,
): Promise<MailAttachment> {
  return api
    .post<MailAttachment>(`/emails/${emailId}/attachments`, params, { signal })
    .then((response) => response.data);
}

/** GET /emails/{emailId}/attachments — 검사 결과를 다시 읽을 때 쓴다 */
export function fetchAttachments(
  emailId: number,
  signal?: AbortSignal,
): Promise<MailAttachment[]> {
  return api
    .get<MailAttachment[]>(`/emails/${emailId}/attachments`, { signal })
    .then((response) => response.data);
}

/**
 * 통과로 볼 수 없는 첨부.
 * 반출 불가 판정을 받았거나, 검사 자체가 실패해 판정이 없는 문서다 —
 * 후자를 통과로 세면 확인되지 않은 문서가 그대로 나간다.
 */
export function isBlockedAttachment({
  verdict,
  scanStatus,
}: MailAttachment): boolean {
  return verdict === "BLOCKED" || scanStatus === "FAILED";
}

/** 왜 걸렸는지. 서버가 근거를 안 줬으면 상태에 맞는 기본 문구로 메운다. */
export function attachmentBlockReason(attachment: MailAttachment): string {
  if (attachment.reason) return attachment.reason;
  return attachment.scanStatus === "FAILED"
    ? "검사에 실패해 반출 가능 여부를 확인하지 못했습니다"
    : "외부 유출이 불가한 문서입니다";
}

/** DELETE /attachments/{id} — DRAFT 상태의 내 메일에서만. 스토리지 객체도 함께 지워진다. */
export function deleteAttachment(
  attachmentId: number,
  signal?: AbortSignal,
): Promise<void> {
  return api.delete(`/attachments/${attachmentId}`, { signal }).then(() => undefined);
}

/**
 * GET /attachments/{id}/download-url — 브라우저에서 바로 열 수 있는 주소.
 * 유효기간이 있으므로 미리 받아 두지 않고 열 때마다 새로 받는다.
 */
export function fetchAttachmentDownloadUrl(
  attachmentId: number,
  signal?: AbortSignal,
): Promise<string> {
  return api
    .get<{ downloadUrl: string }>(`/attachments/${attachmentId}/download-url`, {
      signal,
    })
    .then((response) => response.data.downloadUrl);
}

/**
 * 주소 요청 → 스토리지 업로드 → 등록까지 한 번에.
 * 진행률은 실제로 시간이 걸리는 2단계(스토리지 PUT)만 센다 —
 * 앞뒤 두 요청은 본문이 작아 체감되지 않는다.
 */
export async function uploadAttachment(
  emailId: number,
  file: File,
  { signal, onProgress }: UploadOptions = {},
): Promise<MailAttachment> {
  const { uploadUrl, storageKey } = await createAttachmentUploadUrl(
    emailId,
    file.name,
    signal,
  );

  await uploadFileToStorage(uploadUrl, file, { signal, onProgress });

  return registerAttachment(emailId, { storageKey, filename: file.name }, signal);
}
