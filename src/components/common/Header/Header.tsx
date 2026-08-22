"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export function Header() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-primary bg-surface-primary px-4 sm:px-6">
      <span className="font-semibold text-text-primary">정션</span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        로그아웃
      </button>
    </header>
  );
}
