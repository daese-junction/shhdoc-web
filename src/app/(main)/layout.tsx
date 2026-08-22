import type { ReactNode } from "react";
import { Layout } from "@/components/common/Layout/Layout";
import { AuthGuard } from "@/app/(auth)/components/AuthGuard";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}
