import { api } from "./axios";
import type { CompanyMember } from "@/types/auth";

/**
 * GET /companies/members — 같은 회사 계정 전체를 등록순으로 받는다.
 * ADMIN 전용이 아니다 — 직원 관리 화면, 메일 수신자 선택, 상세 화면의 이름 표시가 함께 쓴다.
 * 비밀번호·토큰은 응답에 포함되지 않는다.
 */
export const listMembers = () =>
  api.get<CompanyMember[]>("/companies/members").then((res) => res.data);

/** 주소로 구성원을 찾는 표. 키는 대소문자를 가리지 않도록 소문자로 둔다. */
export type MemberDirectory = ReadonlyMap<string, CompanyMember>;

const EMPTY_DIRECTORY: MemberDirectory = new Map();

/**
 * 구성원 목록은 자주 바뀌지 않는데 메일을 한 통 열 때마다 필요하다.
 * 한 번 받은 표를 잠깐 들고 있으면서 상세 화면들이 나눠 쓴다.
 */
const DIRECTORY_TTL = 300_000;

let cache: { at: number; directory: MemberDirectory } | null = null;
let inflight: Promise<MemberDirectory> | null = null;

/**
 * 주소 → 구성원 표.
 *
 * **실패해도 거부하지 않는다** — 이름은 있으면 좋은 값이라, 못 받아오면 빈 표를 준다.
 * 화면은 주소만으로도 그대로 뜬다. 실패한 결과도 잠깐 들고 있어
 * 메일을 열 때마다 같은 요청을 다시 보내지 않는다.
 */
export function loadMemberDirectory(): Promise<MemberDirectory> {
  if (cache && Date.now() - cache.at < DIRECTORY_TTL) {
    return Promise.resolve(cache.directory);
  }
  // 여러 화면이 동시에 물으면 요청 하나만 보내고 결과를 나눠 갖는다
  if (inflight) return inflight;

  inflight = listMembers()
    .then((members) => {
      const directory: MemberDirectory = new Map(
        members.map((member) => [member.email.toLowerCase(), member]),
      );
      cache = { at: Date.now(), directory };
      return directory;
    })
    .catch(() => {
      cache = { at: Date.now(), directory: EMPTY_DIRECTORY };
      return EMPTY_DIRECTORY;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** 구성원이 추가·수정되면 불러 다음 조회가 서버를 다시 보게 한다. */
export function invalidateMemberDirectory(): void {
  cache = null;
}

/** 주소의 주인 이름. 사내 구성원이 아니면(외부 수신자) 찾을 수 없다. */
export function findMemberName(
  directory: MemberDirectory | undefined,
  email: string,
): string | undefined {
  return directory?.get(email.toLowerCase())?.name;
}
