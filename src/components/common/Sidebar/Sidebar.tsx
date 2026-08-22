"use client";

import { useAppStore } from "@/stores/useAppStore";

export function Sidebar() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface p-4">
      <nav className="flex flex-col gap-2 text-sm text-text" />
    </aside>
  );
}
