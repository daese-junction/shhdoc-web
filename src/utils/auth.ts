import type { User } from "@/stores/useUserStore";
import type { ApiUser } from "@/types/auth";

/**
 * 서버 User → 스토어 User.
 * 서버는 id 가 number, role 이 대문자(ADMIN/USER)라 표기를 맞춰준다.
 */
export function toStoreUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role === "ADMIN" ? "admin" : "user",
  };
}

/** 아이디와 회사 도메인을 합쳐 로그인 이메일을 만든다. */
export function toEmail(username: string, emailDomain: string): string {
  return `${username.trim()}@${emailDomain.trim().toLowerCase()}`;
}
