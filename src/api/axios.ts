import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import type { TokenPair } from "@/types/auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** 재발급이 진행 중이면 그 결과를 함께 기다린다 (동시 401 이 여러 번 재발급하는 것 방지) */
let refreshPromise: Promise<TokenPair> | null = null;

async function refreshSession(): Promise<TokenPair> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error("refreshToken 없음");

  // 만료된 accessToken 이 붙으면 안 되므로 인터셉터가 없는 별도 요청으로 보낸다.
  const { data } = await axios.post<TokenPair>(
    "/auth/refresh",
    { refreshToken },
    { baseURL: process.env.NEXT_PUBLIC_API_URL }
  );

  // 재발급되면 이전 refreshToken 은 즉시 무효가 되므로 새 쌍을 반드시 저장한다.
  useAuthStore.getState().login(data.accessToken, data.refreshToken);
  return data;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    // 응답 자체가 없으면(끊김/타임아웃) 재시도 안내를 토스트로 한 번만 띄운다.
    if (!error.response) {
      useToastStore
        .getState()
        .show("네트워크가 불안정하니 잠시 후 다시 시도해주세요.", "error");
    }

    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login");

    if (shouldRefresh) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshSession();
        const { accessToken } = await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // 재발급도 실패하면 세션이 끝난 것이다.
        useAuthStore.getState().logout();
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

/** 응답이 있으면 그 상태 코드. 끊김·타임아웃처럼 응답 자체가 없으면 undefined. */
export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** 서버 메시지를 우선 쓰고, 없으면 상태 코드별 문구로 대체한다. */
export function getErrorMessage(
  error: unknown,
  statusMessages: Record<number, string> = {},
  fallback = "잠시 후 다시 시도해주세요."
): string {
  if (axios.isAxiosError(error)) {
    // 인터셉터가 이미 토스트로 안내했으니 폼에는 따로 띄우지 않는다.
    if (!error.response) return "";

    const data = error.response.data as { message?: string } | undefined;
    if (data?.message) return data.message;

    const byStatus = statusMessages[error.response.status];
    if (byStatus) return byStatus;
  }
  return fallback;
}
