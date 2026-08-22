import { useAuthStore } from "@/stores/useAuthStore";

/** 백엔드 주소. 미설정이면 같은 오리진의 `/api` 를 쓴다. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const { message } = body as { message?: unknown };
      if (typeof message === "string" && message) return message;
    }
  } catch {
    // 본문이 비어 있거나 JSON 이 아니면 상태 코드만으로 메시지를 만든다
  }
  return `요청에 실패했습니다 (${response.status})`;
}

/**
 * 공통 fetch 래퍼. 액세스 토큰을 자동으로 싣고 실패는 ApiError 로 던진다.
 * FormData 본문에는 Content-Type 을 직접 넣지 않는다 — 브라우저가 boundary 를 붙여야 한다.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(init.headers);

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
