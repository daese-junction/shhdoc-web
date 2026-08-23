import { api } from "@/api/axios";
import { invalidateMemberDirectory } from "@/api/members";
import type { CompanyMember, CreateMemberRequest } from "@/types/auth";

/**
 * GET /companies/members — 메일 상세 화면도 같은 목록으로 이름을 채우므로
 * 호출은 공용 모듈 한 곳에 두고 여기서는 그대로 내보낸다.
 */
export { listMembers } from "@/api/members";

/**
 * POST /companies/members — ADMIN 이 자기 회사에 직원 계정을 만든다 (role = USER).
 * 소속 회사는 토큰에서 읽으므로 남의 회사에는 계정을 만들 수 없고,
 * 초기 비밀번호는 관리자가 정해 직원에게 따로 전달한다.
 *
 * 400: 회사 도메인이 아닌 이메일
 * 403: ADMIN 이 아님
 * 409: 이미 가입된 이메일
 */
export const createMember = (payload: CreateMemberRequest) =>
  api.post<CompanyMember>("/companies/members", payload).then((res) => {
    // 새 구성원의 이름이 메일 화면에도 바로 뜨도록 표를 비운다
    invalidateMemberDirectory();
    return res.data;
  });
