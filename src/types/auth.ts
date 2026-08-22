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
