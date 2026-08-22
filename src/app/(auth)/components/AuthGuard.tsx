"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/common/Loading/Loading";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 로그인해야 볼 수 있는 화면을 감싼다.
 * output: "export" 라 middleware 를 쓸 수 없어 클라이언트에서 막는다.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hasHydrated, accessToken, router]);

  // 복원 전에는 판단할 수 없고, 미로그인 상태에서는 리다이렉트될 때까지 내용을 감춘다
  if (!hasHydrated) {
    return <Loading fullHeight message="로그인 정보를 확인하는 중이에요" />;
  }

  if (!accessToken) {
    return <Loading fullHeight message="로그인 화면으로 이동합니다" />;
  }

  return <>{children}</>;
}
