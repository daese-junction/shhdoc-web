import type {
  FetchMailPage,
  Mail,
  MailAddress,
  MailDetail,
  MailFolder,
  MailPage,
  MailPageParams,
  MailStoredFolder,
} from "@/types/mail";

/** 실제 API 연동 전까지 사용하는 임시 데이터. src/api 작업 시 교체한다. */
const PEOPLE = [
  "김대세",
  "이정션",
  "박서준",
  "최다은",
  "정하늘",
  "한지우",
  "오세영",
];

const TITLES = [
  "계약서 검토 요청드립니다",
  "9월 정기 회의 일정 안내",
  "[공지] 보안 정책 변경 안내",
  "청구서 발송 건 확인 부탁드립니다",
  "문서 서명 완료 알림",
  "프로젝트 산출물 전달드립니다",
  "요청하신 자료 첨부합니다",
];

/** TITLES 와 같은 순서로 짝지어 쓴다 */
const PREVIEWS = [
  "첨부된 계약서 초안 확인하시고 수정이 필요한 부분 회신 부탁드립니다.",
  "일시와 장소가 변경되었으니 참석 전에 반드시 확인 부탁드립니다.",
  "다음 주 월요일부터 사내 계정에 2단계 인증이 적용됩니다.",
  "이번 달 청구 내역에 누락된 항목이 없는지 확인 부탁드립니다.",
  "요청하신 문서의 모든 서명이 완료되어 안내드립니다.",
  "산출물 목록과 함께 최종본을 첨부했으니 검토 부탁드립니다.",
  "필요한 자료가 더 있으면 편하게 말씀해 주세요.",
];

/** 상세 화면 본문. 에디터가 만든 HTML 을 가정한다. TITLES 와 같은 순서로 짝지어 쓴다. */
const BODIES = [
  "<p>안녕하세요.</p><p>첨부된 계약서 초안을 확인 부탁드립니다. 2조와 5조의 문구가 이전 논의와 다르게 정리되어 있어 검토가 필요합니다.</p><p>수정이 필요한 부분은 회신으로 남겨주시면 반영해 다시 보내드리겠습니다.</p><p>감사합니다.</p>",
  "<p>9월 정기 회의 일정을 안내드립니다.</p><ul><li>일시: 9월 3일 오후 2시</li><li>장소: 본사 3층 대회의실</li><li>안건: 3분기 실적 공유, 하반기 로드맵</li></ul><p>일시와 장소가 변경되었으니 참석 전에 반드시 확인 부탁드립니다.</p>",
  "<p>사내 보안 정책이 변경되어 안내드립니다.</p><p>다음 주 월요일부터 모든 사내 계정에 <strong>2단계 인증</strong>이 적용됩니다. 적용 전까지 인증 수단을 등록해 주세요.</p><p>문의는 보안팀으로 부탁드립니다.</p>",
  "<p>이번 달 청구 내역을 전달드립니다.</p><p>누락되었거나 중복 청구된 항목이 없는지 확인 부탁드립니다. 확인 후 회신 주시면 최종 발송하겠습니다.</p>",
  "<p>요청하신 문서의 모든 서명이 완료되었습니다.</p><p>완료본은 문서함에서 내려받으실 수 있으며, 원본은 30일간 보관됩니다.</p>",
  "<p>프로젝트 산출물 최종본을 전달드립니다.</p><p>산출물 목록과 변경 이력을 함께 첨부했습니다. 검토 후 피드백 부탁드립니다.</p>",
  "<p>요청하신 자료를 첨부합니다.</p><p>필요한 자료가 더 있으면 편하게 말씀해 주세요.</p>",
];

/** 목 데이터라 이름 대신 순번으로 주소를 만든다 */
const addressOf = (index: number): MailAddress => ({
  name: PEOPLE[index],
  email: `user${index + 1}@shhdoc.io`,
});

const ME: MailAddress = { name: "나", email: "me@shhdoc.io" };

const BASE_TIME = Date.parse("2026-08-22T18:00:00+09:00");
const HOUR = 60 * 60 * 1000;
const DELAY = 300;

type StoredFolder = MailStoredFolder;

interface StoredMail extends MailDetail {
  /** 휴지통에서 복원할 원래 폴더 */
  restoreTo?: StoredFolder;
}

interface CreateOptions {
  read?: boolean;
  hourStep?: number;
}

const createMails = (
  folder: StoredFolder,
  count: number,
  { read, hourStep = 5 }: CreateOptions = {},
): StoredMail[] =>
  Array.from({ length: count }, (_, index) => {
    // 발신함·임시보관은 내가 보낸 메일이라 보낸이/받는사람 방향이 뒤집힌다
    const isOutgoing = folder === "sent" || folder === "drafts";
    const person = addressOf(index % PEOPLE.length);
    const sender = isOutgoing ? ME : person;
    const recipients = isOutgoing
      ? Array.from({ length: (index % 3) + 1 }, (_unused, offset) =>
          addressOf((index + offset) % PEOPLE.length),
        )
      : [ME];

    return {
      id: `${folder}-${index + 1}`,
      senderName: sender.name,
      sender,
      recipients,
      title: `${TITLES[index % TITLES.length]} (${index + 1})`,
      preview: PREVIEWS[index % PREVIEWS.length],
      body: BODIES[index % BODIES.length],
      receivedAt: new Date(BASE_TIME - index * hourStep * HOUR).toISOString(),
      isRead: read ?? index % 3 === 0,
      folder,
    };
  });

let mails: StoredMail[] = [
  ...createMails("inbox", 47),
  ...createMails("pending", 5, { read: true, hourStep: 9 }),
  ...createMails("sent", 18, { read: true, hourStep: 7 }),
  ...createMails("drafts", 3, { read: true, hourStep: 11 }),
  ...createMails("trash", 4, { hourStep: 13 }),
];

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), DELAY));

const byReceivedAtDesc = (a: Mail, b: Mail) =>
  Date.parse(b.receivedAt) - Date.parse(a.receivedAt);

const inFolder = (folder: MailFolder): StoredMail[] =>
  mails
    .filter((mail) =>
      folder === "all" ? mail.folder !== "trash" : mail.folder === folder,
    )
    .sort(byReceivedAtDesc);

export interface MailFolderApi {
  fetchPage: FetchMailPage;
  markAsRead: (ids: string[]) => Promise<void>;
  /** 휴지통으로 이동. 복원할 수 있도록 원래 폴더를 기억한다. */
  moveToTrash: (ids: string[]) => Promise<void>;
  restore: (ids: string[]) => Promise<void>;
  permanentlyDelete: (ids: string[]) => Promise<void>;
}

/** 폴더 하나에 대한 목록 조회 + 액션 묶음 */
export function createMailFolderApi(folder: MailFolder): MailFolderApi {
  return {
    fetchPage: ({ page, pageSize }: MailPageParams): Promise<MailPage> => {
      const folderMails = inFolder(folder);
      const start = (page - 1) * pageSize;

      return delay({
        items: folderMails.slice(start, start + pageSize),
        total: folderMails.length,
        page,
        pageSize,
      });
    },

    markAsRead: (ids) => {
      const targets = new Set(ids);
      mails = mails.map((mail) =>
        targets.has(mail.id) ? { ...mail, isRead: true } : mail,
      );

      return delay(undefined);
    },

    moveToTrash: (ids) => {
      const targets = new Set(ids);
      mails = mails.map((mail) =>
        targets.has(mail.id) && mail.folder !== "trash"
          ? { ...mail, folder: "trash", restoreTo: mail.folder }
          : mail,
      );

      return delay(undefined);
    },

    restore: (ids) => {
      const targets = new Set(ids);
      mails = mails.map((mail) =>
        targets.has(mail.id) && mail.folder === "trash"
          ? { ...mail, folder: mail.restoreTo ?? "inbox", restoreTo: undefined }
          : mail,
      );

      return delay(undefined);
    },

    permanentlyDelete: (ids) => {
      const targets = new Set(ids);
      mails = mails.filter(
        (mail) => !(targets.has(mail.id) && mail.folder === "trash"),
      );

      return delay(undefined);
    },
  };
}

/** 상세 페이지용 단건 조회. 없는 id 면 null 을 준다. */
export function fetchMailDetail(id: string): Promise<MailDetail | null> {
  const found = mails.find((mail) => mail.id === id);
  if (!found) return delay(null);

  // restoreTo 는 목록 내부 상태라 상세에서는 쓰지 않는다
  return delay({ ...found });
}

/** 상세 페이지에서 목록으로 돌아갈 때 쓰는, 폴더와 무관한 단건 액션 */
const globalApi = createMailFolderApi("all");

export const markMailAsRead = (id: string) => globalApi.markAsRead([id]);
export const moveMailToTrash = (id: string) => globalApi.moveToTrash([id]);
export const restoreMail = (id: string) => globalApi.restore([id]);
export const permanentlyDeleteMail = (id: string) =>
  globalApi.permanentlyDelete([id]);

const inboxApi = createMailFolderApi("inbox");
const trashApi = createMailFolderApi("trash");

export const fetchMailPage = inboxApi.fetchPage;
export const markMailsAsRead = inboxApi.markAsRead;
export const deleteMails = inboxApi.moveToTrash;
export const restoreMails = trashApi.restore;
export const fetchTrashPage = trashApi.fetchPage;
export const permanentlyDeleteMails = trashApi.permanentlyDelete;
