import { api } from "@/api/axios";
import type { CompanyMember, CreateMemberRequest } from "@/types/auth";

/**
 * GET /companies/members — 같은 회사 계정 전체를 등록순으로 받는다.
 * ADMIN 전용이 아니다 — 직원 관리 화면과 메일 작성 시 수신자 선택 양쪽에서 쓴다.
 * 비밀번호·토큰은 응답에 포함되지 않는다.
 */
export const listMembers = () =>
  api.get<CompanyMember[]>("/companies/members").then((res) => res.data);

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
  api
    .post<CompanyMember>("/companies/members", payload)
    .then((res) => res.data);
