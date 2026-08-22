import type { ReactNode } from "react";
import Image from "next/image";
import { AuthBrandPanel } from "@/app/(auth)/components/AuthBrandPanel";
import { GuestGuard } from "@/app/(auth)/components/GuestGuard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex min-h-dvh">
        {/* 브랜드 패널 — 좁은 화면에서는 숨기고 폼만 보여준다 */}
        <AuthBrandPanel />

        <div className="flex flex-1 flex-col">
          {/* 브랜드 패널이 없는 화면에서는 폼 위에 로고를 둔다 */}
          <div className="flex justify-center pt-10 lg:hidden">
            <Image
              src="/assets/images/logo.svg"
              alt="쉿독"
              width={1112}
              height={245}
              priority
              className="h-6 w-auto"
            />
          </div>

          {children}
        </div>
      </div>
    </GuestGuard>
  );
}
