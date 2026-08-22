import type { ReactNode } from "react";
import { Layout } from "@/components/common";
import { AuthGuard } from "@/components/feature/auth/AuthGuard";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}
