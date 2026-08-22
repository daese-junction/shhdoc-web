import { api } from "@/api/axios";
import type { LoginRequest, TokenPair } from "@/types/auth";

/** POST /auth/login — 로그인할 때마다 refreshToken 이 새로 발급되고 이전 것은 무효가 된다. */
export const login = (payload: LoginRequest) =>
  api.post<TokenPair>("/auth/login", payload).then((res) => res.data);

/** POST /auth/refresh — 401 을 만났을 때 axios 인터셉터가 자동으로 호출한다. */
export const refresh = (refreshToken: string) =>
  api.post<TokenPair>("/auth/refresh", { refreshToken }).then((res) => res.data);

/**
 * POST /auth/logout — 서버의 refreshToken 을 지운다.
 * 이미 발급된 accessToken 은 회수할 수 없어 최대 30분 남으므로
 * 클라이언트에 저장한 토큰도 반드시 함께 지워야 한다.
 */
export const logout = () => api.post<void>("/auth/logout").then(() => undefined);
