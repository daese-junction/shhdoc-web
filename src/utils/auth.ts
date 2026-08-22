import type { User } from "@/stores/useUserStore";
import type { ApiMe, ApiUser } from "@/types/auth";

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

/**
 * GET /auth/me → 스토어 User.
 * 로그인 응답으로 만든 User 에 소속 정보를 얹는 것이므로 `toStoreUser` 를 그대로 쓴다.
 */
export function toStoreUserFromMe(me: ApiMe): User {
  return {
    ...toStoreUser(me),
    department: me.department ?? null,
    position: me.position ?? null,
    companyName: me.company?.name ?? null,
  };
}

/** 아이디와 회사 도메인을 합쳐 로그인 이메일을 만든다. */
export function toEmail(username: string, emailDomain: string): string {
  return `${username.trim()}@${emailDomain.trim().toLowerCase()}`;
}
