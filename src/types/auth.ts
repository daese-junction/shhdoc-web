/** 서버가 내려주는 값. useUserStore 의 User 와 표기가 달라 매퍼로 변환해 쓴다. */
export type ApiUserRole = "ADMIN" | "USER";

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: ApiUserRole;
}

export interface Company {
  id: number;
  name: string;
  emailDomain: string;
}

/** POST /auth/login, POST /auth/refresh 응답 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /companies — 회사와 대표자(ADMIN) 계정을 한 번에 만든다 */
export interface CreateCompanyRequest {
  companyName: string;
  emailDomain: string;
  email: string;
  password: string;
  name: string;
}

export interface CreateCompanyResponse {
  company: Company;
  user: ApiUser;
}

/**
 * POST /companies/members — ADMIN 이 자기 회사에 직원 계정을 만든다 (ADMIN 전용).
 * 소속 회사는 토큰에서 읽으므로 email 의 도메인이 회사 도메인과 다르면 거부된다.
 */
export interface CreateMemberRequest {
  email: string;
  password: string;
  name: string;
}

/** 생성 응답. role 은 항상 USER 로 내려온다. */
export type CreateMemberResponse = ApiUser;
