"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  /**
   * 뱃지에 띄울 건수. 0 이거나 없으면 뱃지를 그리지 않는다.
   * 펼쳤을 때는 오른쪽 숫자로, 접었을 때는 아이콘 위 파란 점으로만 보여준다.
   */
  count?: number;
}

export function SidebarItem({ href, icon, label, count }: SidebarItemProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const hasCount = Boolean(count);

  return (
    <Link
      href={href}
      title={
        isSidebarOpen ? undefined : hasCount ? `${label} (${count}개)` : label
      }
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
        {/* 접었을 때는 숫자를 넣을 자리가 없어 점 하나로만 알린다 */}
        {!isSidebarOpen && hasCount ? (
          <>
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand-500" />
            <span className="sr-only">{count}개</span>
          </>
        ) : null}
      </span>
      {isSidebarOpen && (
        <>
          <span className="flex-1 truncate text-sm">{label}</span>
          {hasCount && (
            <span className="text-xs font-medium tabular-nums text-text-secondary">
              {count}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
