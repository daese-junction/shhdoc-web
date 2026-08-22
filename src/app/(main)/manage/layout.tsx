import type { ReactNode } from "react";
import { AdminGuard } from "@/app/(auth)/components/AdminGuard";

export default function ManageLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
