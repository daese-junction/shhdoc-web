import type { ReactNode } from "react";
import Image from "next/image";
import { GuestGuard } from "@/app/(auth)/components/GuestGuard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex min-h-dvh">
        {/* 브랜드 패널 — 좁은 화면에서는 숨기고 폼만 보여준다 */}
        <aside className="relative hidden w-[44%] max-w-2xl flex-col justify-between overflow-hidden bg-brand-500 p-10 lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl"
          />

          <Image
            src="/assets/images/logo.svg"
            alt="쉿독"
            width={486}
            height={91}
            priority
            // 로고가 검정 단색이라 컬러 패널 위에서는 흰색으로 반전시킨다
            className="relative h-7 w-auto brightness-0 invert"
          />

          <div className="relative flex flex-col gap-3">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-white">
              유출은 시스템이 뚫릴 때가 아니라
              <br />
              보내기를 누를 때 일어납니다
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              파일명이 아니라 내용을 읽고 보안 등급을 매깁니다.
              <br />
              받는 사람을 대조해, 나가면 안 되는 문서는 나가기 전에 멈춥니다.
            </p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          {/* 브랜드 패널이 없는 화면에서는 폼 위에 로고를 둔다 */}
          <div className="flex justify-center pt-10 lg:hidden">
            <Image
              src="/assets/images/logo.svg"
              alt="쉿독"
              width={486}
              height={91}
              priority
              className="h-6 w-auto dark:brightness-0 dark:invert"
            />
          </div>

          {children}
        </div>
      </div>
    </GuestGuard>
  );
}
