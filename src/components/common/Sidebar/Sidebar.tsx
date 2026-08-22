"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/stores/useAppStore";

/** md 미만 — 사이드내비가 컨텐츠 위로 덮는 오버레이 모드가 되는 구간. */
const OVERLAY_QUERY = "(max-width: 767px)";

interface SidebarProps {
  /** 스크린리더에서 메일/관리 내비게이션을 구분하기 위한 라벨 */
  label: string;
  /** 목록 위 고정 영역. 메일의 `메일쓰기` 버튼처럼 스크롤되지 않아야 하는 것들. */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 사이드내비의 공통 셸. 헤더의 토글 버튼이 `isSidebarOpen` 을 바꾼다.
 *
 * - md 이상: 컨텐츠를 밀어내는 고정 컬럼. 폭만 바뀐다(펼침 240px / 접힘 64px).
 * - md 미만: 컨텐츠 위로 덮는 오버레이 drawer. 닫히면 왼쪽으로 빠지고,
 *   뒤쪽에는 옅은 그림자막을 깔아 클릭하면 닫힌다.
 */
export function Sidebar({
  label,
  header,
  children,
  className = "",
}: SidebarProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  // 기본값이 열림이라 좁은 화면에서 첫 진입부터 컨텐츠를 덮어버린다.
  // 오버레이 구간에 들어오면 닫고, 다시 넓어지면 컬럼으로 되돌린다.
  useEffect(() => {
    const media = window.matchMedia(OVERLAY_QUERY);
    if (media.matches) setSidebarOpen(false);

    const handleChange = (event: MediaQueryListEvent) =>
      setSidebarOpen(!event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [setSidebarOpen]);

  // 오버레이로 열려 있을 때만 Esc 로 닫는다. 넓은 화면의 접기는 헤더 버튼 몫.
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && window.matchMedia(OVERLAY_QUERY).matches) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* 오버레이 뒤에 깔리는 그림자막. md 이상에서는 존재하지 않는다. */}
      <div
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        className={`absolute inset-0 z-20 bg-black/20 transition-opacity duration-200 md:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label={label}
        className={`absolute inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-border-tertiary bg-surface-primary shadow-[4px_0_16px_rgba(0,0,0,0.10)] transition-transform duration-200 md:static md:z-auto md:shadow-none md:transition-[width] ${
          isSidebarOpen
            ? "translate-x-0 md:w-60"
            : "-translate-x-full md:w-16 max-md:pointer-events-none"
        } md:translate-x-0 ${className}`}
      >
        {header && <div className="shrink-0 p-2">{header}</div>}
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-2 pb-2">
          {children}
        </nav>
      </aside>
    </>
  );
}
