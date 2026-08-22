"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/common/Loading/Loading";
import { useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/utils/routes";

/**
 * 관리자만 볼 수 있는 화면을 감싼다. AuthGuard 안쪽에서 쓴다 —
 * 로그인 여부는 AuthGuard 가, 역할은 여기가 판단한다.
 *
 * 복원 판단은 useAuthStore 가 아니라 useUserStore 의 hasHydrated 를 본다.
 * 역할이 담긴 쪽이 이 스토어라, 토큰만 먼저 복원된 순간에 판단하면
 * 관리자를 잘못 돌려보내게 된다.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isAdmin = useUserStore((state) => state.user?.role === "admin");

  useEffect(() => {
    if (hasHydrated && !isAdmin) {
      router.replace(ROUTES.mail);
    }
  }, [hasHydrated, isAdmin, router]);

  if (!hasHydrated) {
    return <Loading fullHeight message="권한을 확인하는 중이에요" />;
  }

  if (!isAdmin) {
    return <Loading fullHeight message="메일 화면으로 이동합니다" />;
  }

  return <>{children}</>;
}
