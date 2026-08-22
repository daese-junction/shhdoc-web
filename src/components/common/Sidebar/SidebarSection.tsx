"use client";

import { useAppStore } from "@/stores/useAppStore";

interface SidebarSectionProps {
  title: string;
}

/** 관리 사이드내비의 소제목. 클릭 불가한 텍스트 라벨이다. */
export function SidebarSection({ title }: SidebarSectionProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  // 접힌 폭(64px)에서는 10px 소제목이 읽히지 않으므로 구분선으로만 그룹을 나눈다.
  if (!isSidebarOpen) {
    return <hr className="my-2 border-t border-border-tertiary first:hidden" />;
  }

  return (
    <h2 className="px-2 pt-4 pb-1 text-[10px] font-medium tracking-wide text-text-tertiary first:pt-1">
      {title}
    </h2>
  );
}
