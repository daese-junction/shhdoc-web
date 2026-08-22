"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  /** 오른쪽 회색 숫자 — 폴더의 전체 개수 */
  count?: number;
  /** 브랜드 컬러 pill — 주목이 필요한 개수. 접히면 아이콘 위 점으로 축소된다. */
  badge?: number;
}

export function SidebarItem({ href, icon, label, count, badge }: SidebarItemProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={isSidebarOpen ? undefined : label}
      aria-current={isActive ? "page" : undefined}
      className={`h-9 flex items-center rounded-md transition-colors ${
        isSidebarOpen ? "gap-2.5 px-2" : "justify-center"
      } ${
        isActive
          ? "bg-brand-50 text-brand-600 font-medium"
          : "text-text-secondary hover:bg-surface-tertiary"
      }`}
    >
      <span className="relative shrink-0 grid place-items-center">
        {icon}
        {!isSidebarOpen && badge ? (
          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand-500" />
        ) : null}
      </span>
      {isSidebarOpen && (
        <>
          <span className="flex-1 truncate text-sm">{label}</span>
          {/* 글자색을 surface 토큰으로 두면 다크에서 팔레트가 뒤집혀도 대비가 유지된다 */}
          {badge ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] leading-none tabular-nums text-surface-primary">
              {badge}
            </span>
          ) : null}
          {count !== undefined && (
            <span className="text-xs tabular-nums text-text-tertiary">{count}</span>
          )}
        </>
      )}
    </Link>
  );
}
