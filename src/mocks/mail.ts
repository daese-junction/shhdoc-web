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

/** 제목·미리보기·본문 한 벌. 미리보기는 본문 첫 문단을 줄인 것으로 본다. */
interface MailContent {
  title: string;
  /** 목록에서 제목 뒤에 한 줄로 붙는다 */
  preview: string;
  /** 상세 화면 본문. 에디터가 만든 HTML 을 가정한다. */
  body: string;
}

interface IncomingMail extends MailContent {
  sender: MailAddress;
}

/** 받은 메일. 사내 계정으로 실제 오갈 법한 서비스 알림과 거래처 메일을 섞었다. */
const INCOMING: IncomingMail[] = [
  {
    sender: { name: "Google", email: "no-reply@accounts.google.com" },
    title: "보안 알림: 새로운 기기에서 계정에 로그인했습니다",
    preview:
      "Windows 기기에서 shhdoc.io 계정에 로그인했습니다. 본인이 아니라면 지금 확인하세요.",
    body: "<p>새로운 기기에서 Google 계정에 로그인했습니다.</p><ul><li>기기: Windows</li><li>위치: 대한민국 서울</li><li>시각: 8월 22일 오후 6시</li></ul><p>본인이 맞다면 별도로 하실 일은 없습니다. 본인이 아니라면 지금 바로 비밀번호를 변경해 주세요.</p>",
  },
  {
    sender: { name: "Amazon Web Services", email: "billing@amazon.com" },
    title: "[AWS] 8월 청구서가 발행되었습니다",
    preview: "8월 사용 요금은 USD 1,284.60 이며 결제 예정일은 9월 3일입니다.",
    body: "<p>안녕하세요, AWS 청구 담당자님.</p><p>8월 사용 요금 청구서가 발행되었습니다.</p><ul><li>청구 금액: USD 1,284.60</li><li>결제 예정일: 9월 3일</li><li>주요 항목: EC2, S3, CloudFront</li></ul><p>상세 내역은 Billing 콘솔에서 확인하실 수 있습니다.</p>",
  },
  {
    sender: { name: "GitHub", email: "noreply@github.com" },
    title: "[GitHub] 조직 SAML SSO 인증서가 곧 만료됩니다",
    preview:
      "daese-junction 조직의 SSO 인증서가 14일 뒤 만료됩니다. 갱신하지 않으면 로그인이 차단됩니다.",
    body: "<p><strong>daese-junction</strong> 조직에 설정된 SAML SSO 인증서가 14일 뒤 만료됩니다.</p><p>만료 전까지 새 인증서를 등록하지 않으면 조직 구성원의 로그인이 차단됩니다.</p><p>Settings → Authentication security 에서 인증서를 교체해 주세요.</p>",
  },
  {
    sender: { name: "토스페이먼츠", email: "settlement@tosspayments.com" },
    title: "8월 1차 정산 명세서 안내",
    preview:
      "8월 1일~15일 거래분 정산 명세서를 안내드립니다. 지급 예정일은 8월 25일입니다.",
    body: "<p>안녕하세요, 토스페이먼츠입니다.</p><p>8월 1차(8월 1일~15일) 거래분 정산 명세서를 안내드립니다.</p><ul><li>정산 대상 금액: 32,480,000원</li><li>수수료 차감 후 지급액: 31,606,880원</li><li>지급 예정일: 8월 25일</li></ul><p>명세서는 첨부 파일에서 확인하실 수 있습니다.</p>",
  },
  {
    sender: {
      name: "김도현 · 한빛물산 구매팀",
      email: "dohyun.kim@hanbit-corp.co.kr",
    },
    title: "공급 계약서 최종본 검토 요청드립니다",
    preview:
      "2조 납기 조건과 5조 손해배상 조항이 지난 논의와 달라 검토가 필요합니다.",
    body: "<p>안녕하세요, 한빛물산 구매팀 김도현입니다.</p><p>첨부된 공급 계약서 최종본을 확인 부탁드립니다. 2조 납기 조건과 5조 손해배상 조항이 지난 논의와 다르게 정리되어 있어 검토가 필요합니다.</p><p>수정이 필요한 부분은 회신으로 남겨주시면 반영해 다시 보내드리겠습니다.</p><p>감사합니다.</p>",
  },
  {
    sender: { name: "네이버 클라우드 플랫폼", email: "no-reply@ncloud.com" },
    title: "[점검 안내] 8월 30일 Object Storage 정기 점검",
    preview:
      "8월 30일 02:00~05:00 정기 점검이 있습니다. 점검 중 업로드가 일시 중단됩니다.",
    body: "<p>서비스 안정화를 위한 정기 점검을 안내드립니다.</p><ul><li>점검 일시: 8월 30일 02:00 ~ 05:00 (KST)</li><li>대상 서비스: Object Storage</li><li>영향: 점검 시간 동안 업로드 및 삭제 요청이 일시 중단됩니다</li></ul><p>이용에 참고 부탁드립니다.</p>",
  },
  {
    sender: { name: "Microsoft 365", email: "noreply@microsoft.com" },
    title: "Microsoft 365 Business 라이선스 갱신 안내",
    preview:
      "구독이 9월 12일에 만료됩니다. 갱신하지 않으면 라이선스 12석이 회수됩니다.",
    body: "<p>귀사의 Microsoft 365 Business Standard 구독이 <strong>9월 12일</strong>에 만료됩니다.</p><p>갱신하지 않으면 배정된 라이선스 12석이 회수되며, 사용자 계정은 30일간 읽기 전용으로 전환됩니다.</p><p>관리 센터에서 결제 수단과 갱신 여부를 확인해 주세요.</p>",
  },
  {
    sender: { name: "세무법인 정도", email: "tax@jeongdo-tax.co.kr" },
    title: "7월 부가세 신고 자료 요청드립니다",
    preview:
      "매입·매출 세금계산서와 카드 사용 내역을 이번 주 금요일까지 회신 부탁드립니다.",
    body: "<p>안녕하세요, 세무법인 정도입니다.</p><p>7월 부가세 신고를 위해 아래 자료를 요청드립니다.</p><ul><li>매입·매출 세금계산서</li><li>법인카드 사용 내역</li><li>해외 결제 건 증빙</li></ul><p>이번 주 금요일까지 회신 부탁드립니다.</p>",
  },
  {
    sender: { name: "Slack", email: "feedback@slack.com" },
    title: "shhdoc 워크스페이스에 초대되었습니다",
    preview:
      "이수진님이 회원님을 shhdoc 워크스페이스의 #계약-검토 채널로 초대했습니다.",
    body: "<p>이수진님이 회원님을 <strong>shhdoc</strong> 워크스페이스로 초대했습니다.</p><p>초대 링크는 7일간 유효하며, 참여하면 #계약-검토 채널에 자동으로 추가됩니다.</p>",
  },
  {
    sender: { name: "Figma", email: "no-reply@figma.com" },
    title: "결제에 실패했습니다 — 청구 정보를 확인해 주세요",
    preview:
      "Organization 요금제 결제가 거절되었습니다. 7일 내 갱신하지 않으면 편집이 제한됩니다.",
    body: "<p>등록된 카드로 Organization 요금제 결제를 시도했으나 승인이 거절되었습니다.</p><p>7일 내에 결제 수단을 갱신하지 않으면 팀 파일이 보기 전용으로 전환됩니다.</p><p>Billing 설정에서 카드 정보를 확인해 주세요.</p>",
  },
];

/** 내가 보낸 메일의 받는 사람 후보. 거래처 담당자와 부서 대표 주소를 섞었다. */
const CONTACTS: MailAddress[] = [
  { name: "김도현 · 한빛물산", email: "dohyun.kim@hanbit-corp.co.kr" },
  { name: "이수진 · LG CNS", email: "sujin.lee@lgcns.com" },
  { name: "박태호 · 삼성SDS", email: "taeho.park@samsungsds.com" },
  {
    name: "최유나 · 카카오엔터프라이즈",
    email: "yuna.choi@kakaoenterprise.com",
  },
  { name: "한빛물산 법무팀", email: "legal@hanbit-corp.co.kr" },
  { name: "대세정션 구매팀", email: "purchase@daese-junction.com" },
  { name: "정민석 · 우아한형제들", email: "minseok.jung@woowahan.com" },
];

/** 내가 보낸 메일. 보낸이는 언제나 나라서 제목·본문만 갖는다. */
const OUTGOING: MailContent[] = [
  {
    title: "[shhdoc] Enterprise 플랜 견적서 회신드립니다",
    preview:
      "요청하신 좌석 수 기준으로 견적서를 첨부했습니다. 연간 결제 시 15% 할인이 적용됩니다.",
    body: "<p>안녕하세요, shhdoc 세일즈팀입니다.</p><p>요청하신 50석 기준 Enterprise 플랜 견적서를 첨부드립니다. 연간 결제 시 15% 할인이 적용됩니다.</p><p>추가로 필요한 항목이 있으면 말씀해 주세요.</p>",
  },
  {
    title: "공급 계약서 서명본 송부드립니다",
    preview:
      "논의된 대로 2조와 5조를 수정해 서명한 계약서 원본을 첨부했습니다.",
    body: "<p>안녕하세요.</p><p>지난 논의대로 2조 납기 조건과 5조 손해배상 조항을 수정해 서명한 계약서를 송부드립니다.</p><p>귀사 서명 후 스캔본 한 부 회신 부탁드립니다.</p>",
  },
  {
    title: "8월 세금계산서 발행 요청드립니다",
    preview:
      "8월 용역 대금 건으로 세금계산서 발행 부탁드립니다. 사업자등록증은 첨부했습니다.",
    body: "<p>안녕하세요, 재무팀입니다.</p><p>8월 용역 대금 건으로 세금계산서 발행 부탁드립니다.</p><ul><li>공급가액: 18,000,000원</li><li>발행 요청일: 8월 31일</li></ul><p>사업자등록증 사본을 첨부했습니다.</p>",
  },
  {
    title: "[제안] 문서 보안 솔루션 도입 제안서 (v2)",
    preview: "지난 미팅에서 주신 피드백을 반영한 제안서 2차본을 전달드립니다.",
    body: "<p>안녕하세요.</p><p>지난 미팅에서 주신 피드백을 반영해 제안서를 보완했습니다.</p><ul><li>온프레미스 구축 옵션 추가</li><li>감사 로그 보관 기간 3년으로 상향</li><li>도입 일정 4주 단축</li></ul><p>검토 후 편하신 시간에 회신 부탁드립니다.</p>",
  },
  {
    title: "온보딩 일정 조율 요청드립니다",
    preview:
      "다음 주 중 2시간 정도 킥오프 세션을 잡고자 합니다. 가능한 시간대를 알려주세요.",
    body: "<p>안녕하세요.</p><p>계약 체결에 따라 온보딩 킥오프 세션을 진행하려 합니다.</p><ul><li>소요 시간: 약 2시간</li><li>참석 요청: 정보보안 담당자, 시스템 운영 담당자</li></ul><p>다음 주 중 가능한 시간대를 알려주시면 일정을 확정하겠습니다.</p>",
  },
  {
    title: "장애 보고서 및 재발 방지 대책 안내",
    preview:
      "8월 19일 문서 업로드 지연 건에 대한 원인과 조치 계획을 정리해 드립니다.",
    body: "<p>8월 19일 발생한 문서 업로드 지연 건에 대해 안내드립니다.</p><ul><li>원인: 스토리지 연동 구간의 커넥션 풀 고갈</li><li>조치: 풀 크기 상향 및 자동 확장 적용 (8월 20일 완료)</li><li>재발 방지: 임계치 알림 추가, 주간 부하 점검</li></ul><p>불편을 드려 죄송합니다.</p>",
  },
  {
    title: "요청하신 보안 점검 자료 전달드립니다",
    preview: "ISMS 인증서와 최근 모의해킹 결과 요약본을 첨부했습니다.",
    body: "<p>안녕하세요.</p><p>요청하신 보안 점검 자료를 전달드립니다.</p><ul><li>ISMS 인증서 사본</li><li>2026년 상반기 모의해킹 결과 요약</li><li>데이터 처리 위탁 계약서 양식</li></ul><p>필요한 자료가 더 있으면 편하게 말씀해 주세요.</p>",
  },
];

/**
 * 같은 템플릿이 다시 나올 때 제목 앞에 붙인다.
 * 같은 제목이 그대로 반복되지 않게 하면서 실제 메일함처럼 주고받은 흔적을 남긴다.
 */
const THREAD_PREFIXES = ["", "Re: ", "Fwd: ", "Re: Re: ", "[재전송] "];

const ME: MailAddress = { name: "나", email: "me@shhdoc.io" };

/**
 * 목록의 보낸이 자리에 들어갈 글. 내가 쓴 메일이라 받는 사람을 쓴다.
 * src/api/emails.ts 의 `toRecipientLabel` 과 같은 규칙이다.
 */
const recipientLabel = (recipients: MailAddress[]): string => {
  const [first, ...rest] = recipients;
  return rest.length === 0 ? first.email : `${first.email} 외 ${rest.length}명`;
};

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
    const incoming = INCOMING[index % INCOMING.length];
    const content: MailContent = isOutgoing
      ? OUTGOING[index % OUTGOING.length]
      : incoming;
    const sender = isOutgoing ? ME : incoming.sender;
    const recipients = isOutgoing
      ? Array.from(
          { length: (index % 3) + 1 },
          (_unused, offset) => CONTACTS[(index + offset) % CONTACTS.length],
        )
      : [ME];
    const round = Math.floor(
      index / (isOutgoing ? OUTGOING.length : INCOMING.length),
    );

    return {
      id: `${folder}-${index + 1}`,
      senderName: isOutgoing ? recipientLabel(recipients) : sender.name,
      sender,
      recipients,
      title: `${THREAD_PREFIXES[round % THREAD_PREFIXES.length]}${content.title}`,
      preview: content.preview,
      body: content.body,
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
