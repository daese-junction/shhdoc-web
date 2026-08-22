import { apiFetch } from "./client";

export interface DraftPayload {
  /** 수신자 이메일 목록 */
  recipients: string[];
  /** 수신자마다 따로 발송할지 여부 (개인별) */
  individual: boolean;
  subject: string;
  important: boolean;
  /** 에디터가 만든 본문 HTML */
  body: string;
  attachments: File[];
}

/**
 * 작성 중인 메일을 임시보관함에 저장한다.
 * 첨부를 함께 실어야 해서 JSON 대신 FormData 로 보낸다
 * (Content-Type 은 브라우저가 boundary 와 함께 붙인다).
 */
export async function saveDraft(
  payload: DraftPayload,
  signal?: AbortSignal,
): Promise<void> {
  const formData = new FormData();

  for (const recipient of payload.recipients) {
    formData.append("recipients", recipient);
  }
  formData.append("individual", String(payload.individual));
  formData.append("subject", payload.subject);
  formData.append("important", String(payload.important));
  formData.append("body", payload.body);

  for (const file of payload.attachments) {
    formData.append("files", file, file.name);
  }

  await apiFetch<void>("/mail/drafts", {
    method: "POST",
    body: formData,
    signal,
  });
}
