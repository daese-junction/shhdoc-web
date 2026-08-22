"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/common/Loading/Loading";
import { useAuthStore } from "@/stores/useAuthStore";
import { ROUTES } from "@/utils/routes";

/** 이미 로그인한 사용자가 로그인·회원가입 화면에 머무르지 않도록 되돌린다. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      // 로그인 성공 직후에도 이 가드가 먼저 돌아 폼의 이동을 덮어쓴다.
      // 그래서 목적지를 서비스 기본 화면으로 맞춰둔다.
      router.replace(ROUTES.mail);
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated) {
    return <Loading fullHeight message="로그인 정보를 확인하는 중이에요" />;
  }

  if (accessToken) {
    return <Loading fullHeight message="메일함으로 이동합니다" />;
  }

  return <>{children}</>;
}
