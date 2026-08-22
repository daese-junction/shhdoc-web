"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/common";
import { useAuthStore } from "@/stores/useAuthStore";

/** 이미 로그인한 사용자가 로그인·회원가입 화면에 머무르지 않도록 되돌린다. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace("/");
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated) {
    return <Loading fullHeight message="로그인 정보를 확인하는 중이에요" />;
  }

  if (accessToken) {
    return <Loading fullHeight message="이미 로그인되어 있어 메인으로 이동합니다" />;
  }

  return <>{children}</>;
}
