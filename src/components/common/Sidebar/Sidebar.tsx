"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface SidebarProps {
  /** 스크린리더에서 메일/관리 내비게이션을 구분하기 위한 라벨 */
  label: string;
  /** 목록 위 고정 영역. 메일의 `메일쓰기` 버튼처럼 스크롤되지 않아야 하는 것들. */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 사이드내비의 공통 셸. 헤더의 토글 버튼이 `isSidebarOpen` 을 바꾸면
 * 폭만 바뀌고(펼침 240px / 접힘 64px) 내용은 각 항목이 알아서 줄인다.
 * 좁은 화면에서는 아직 감춘다 — 오버레이 drawer 는 별도로 정한다.
 */
export function Sidebar({
  label,
  header,
  children,
  className = "",
}: SidebarProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  return (
    <aside
      aria-label={label}
      className={`hidden shrink-0 flex-col border-r border-border-tertiary bg-surface-primary transition-[width] duration-200 md:flex ${
        isSidebarOpen ? "w-60" : "w-16"
      } ${className}`}
    >
      {header && <div className="shrink-0 p-2">{header}</div>}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 pb-2">
        {children}
      </nav>
    </aside>
  );
}
