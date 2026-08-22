"use client";

import { useAppStore } from "@/stores/useAppStore";

export function Sidebar() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  if (!isSidebarOpen) return null;

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border-primary bg-surface-primary p-4 md:block">
      <nav className="flex flex-col gap-2 text-sm text-text-primary" />
    </aside>
  );
}
