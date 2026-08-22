/** 첨부파일 전체 용량 상한 (기본 25MB) */
export const MAX_ATTACHMENT_TOTAL_SIZE = 25 * 1024 * 1024;

export interface Attachment {
  id: string;
  file: File;
  /** 목록에서 바로 내려받게 하려고 만들어 둔 blob URL. 첨부를 지울 때 함께 해제한다. */
  url: string;
}

/** 같은 파일을 두 번 붙이는 것을 막기 위한 키 */
export function getAttachmentKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
