import type { ReactNode } from "react";
import { GuestGuard } from "@/components/feature/auth/GuestGuard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex min-h-dvh flex-col">{children}</div>
    </GuestGuard>
  );
}
