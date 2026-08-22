/** 첨부파일 전체 용량 상한 (기본 25MB) */
export const MAX_ATTACHMENT_TOTAL_SIZE = 25 * 1024 * 1024;

/**
 * 첨부 한 건의 업로드 상태.
 * - waiting: 붙일 메일(emailId)이 아직 없어 대기 중
 * - uploading: 업로드 주소 요청 → 스토리지 PUT → 등록 진행 중
 * - uploaded: 서버 등록까지 끝나 serverId 가 생긴 상태
 * - failed: 세 단계 중 하나가 실패한 상태 (다시 시도할 수 있다)
 *
 * 유출 검사 결과는 여기 담지 않는다 — 검사는 보낸 뒤 백그라운드로 돌고,
 * 진행 상황은 메일함의 상태 뱃지가 알린다.
 */
export type AttachmentStatus = "waiting" | "uploading" | "uploaded" | "failed";

export interface Attachment {
  /** 화면에서만 쓰는 로컬 id */
  id: string;
  file: File;
  /** 업로드가 끝나기 전 목록에서 바로 열어 보게 하는 blob URL. 첨부를 지울 때 함께 해제한다. */
  url: string;
  status: AttachmentStatus;
  /** 스토리지에 보낸 바이트 비율 0~1. 업로드가 끝나면 1 이다. */
  progress: number;
  /** 등록(3단계)까지 끝나면 받는 서버 첨부 id. 내려받기·삭제는 이 id 로 한다. */
  serverId?: number;
  /** 업로드가 실패했을 때 보여 줄 사유 */
  error?: string;
}

/** 같은 파일을 두 번 붙이는 것을 막기 위한 키 */
export function getAttachmentKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

let localIdSeq = 0;

/**
 * 화면에서만 쓰는 첨부 id.
 * `crypto.randomUUID` 는 secure context(https·localhost)에만 있어서,
 * 사내망 IP(http://192.168.x.x)로 열면 없다 — 그때는 순번으로 물러난다.
 */
export function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  localIdSeq += 1;
  return `attachment-${localIdSeq}`;
}
