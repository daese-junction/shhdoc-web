import type { MailFolder } from "@/types/mail";

interface MailFolderMeta {
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}

/** 폴더별 제목과 빈 목록 문구. 사이드내비 라벨과 같은 이름을 쓴다. */
export const MAIL_FOLDER_META: Record<MailFolder, MailFolderMeta> = {
  inbox: {
    label: "수신함",
    emptyTitle: "받은 메일이 없습니다",
    emptyDescription: "새로 도착한 메일이 여기에 표시됩니다.",
  },
  pending: {
    label: "승인대기",
    emptyTitle: "승인 대기 중인 메일이 없습니다",
    emptyDescription: "결재가 필요한 메일이 여기에 표시됩니다.",
  },
  sent: {
    label: "발신함",
    emptyTitle: "보낸 메일이 없습니다",
    emptyDescription: "발송한 메일이 여기에 표시됩니다.",
  },
  drafts: {
    label: "임시보관",
    emptyTitle: "임시보관된 메일이 없습니다",
    emptyDescription: "작성하다 저장한 메일이 여기에 표시됩니다.",
  },
  all: {
    label: "전체",
    emptyTitle: "메일이 없습니다",
    emptyDescription: "휴지통을 제외한 모든 메일이 여기에 표시됩니다.",
  },
  trash: {
    label: "휴지통",
    emptyTitle: "휴지통이 비어 있습니다",
    emptyDescription: "삭제한 메일이 여기에 표시됩니다.",
  },
};
