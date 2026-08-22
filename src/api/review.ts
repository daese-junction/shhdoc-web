import { apiFetch } from "./client";

export interface ReviewTarget {
  /** 첨부 목록에서 쓰는 id. 응답을 첨부와 맞추는 열쇠라 그대로 돌려받는다. */
  id: string;
  file: File;
}

export interface AttachmentReviewResult {
  id: string;
  /** true 면 외부로 내보낼 수 있는 문서 */
  exportable: boolean;
  /** 서버가 사유를 내려주면 뱃지 툴팁에 보여준다 */
  reason?: string;
}

/** 서버는 `{ results: [...] }` 로 감싸 주지만 배열을 그대로 주는 경우도 받아 준다 */
type ReviewResponse = { results: AttachmentReviewResult[] } | AttachmentReviewResult[];

/**
 * 첨부 문서를 결재 서버에 올려 각각이 외부 유출 가능한 문서인지 판정받는다.
 * 응답 순서는 보장하지 않으므로 항상 id 로 맞춰 쓴다.
 */
export async function reviewAttachments(
  targets: ReviewTarget[],
  signal?: AbortSignal,
): Promise<AttachmentReviewResult[]> {
  const formData = new FormData();

  for (const { id, file } of targets) {
    formData.append("ids", id);
    formData.append("files", file, file.name);
  }

  const data = await apiFetch<ReviewResponse>("/mail/attachments/review", {
    method: "POST",
    body: formData,
    signal,
  });

  return Array.isArray(data) ? data : data.results;
}
