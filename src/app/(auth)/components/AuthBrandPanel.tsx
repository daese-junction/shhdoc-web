"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";

/** 로그인/회원가입 브랜드 패널. 파란 배경 위에 마우스를 따라다니는 흰색 글로우를 얹는다. */
export function AuthBrandPanel() {
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      opacity: 1,
    });
  };

  return (
    <aside
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setGlow((prev) => ({ ...prev, opacity: 0 }))}
      className="relative hidden w-[44%] max-w-2xl flex-col overflow-hidden bg-brand-500 p-10 lg:flex"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl"
      />

      {/* 커서를 따라다니는 글로우 — 라이트는 밝게, 다크는 어둡게 톤만 바뀐다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(380px circle at ${glow.x}% ${glow.y}%, var(--auth-glow), transparent 70%)`,
        }}
      />

      {/* 가운데 마스코트 + 로고 묶음 — 남는 세로 공간 안에서 가운데 정렬한다.
          마스코트는 장식용이라 스크린 리더에는 노출하지 않는다 */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
        <Image
          aria-hidden
          src="/assets/images/dog.svg"
          alt=""
          width={1248}
          height={1208}
          className="h-64 w-64 shrink-0 brightness-0 invert sm:h-72 sm:w-72"
        />
        <Image
          // 패널 전용 배색 — Shh 는 흰색, Doc 은 배경보다 짙은 브랜드 블루로 고정되어 있다
          src="/assets/images/logoPanel.svg"
          alt="쉿독"
          width={1112}
          height={245}
          priority
          className="h-10 w-auto sm:h-11"
        />
      </div>

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
  );
}
