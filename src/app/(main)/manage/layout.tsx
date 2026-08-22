import type { ReactNode } from "react";
import { AdminGuard } from "@/components/feature/auth/AdminGuard";

export default function ManageLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
