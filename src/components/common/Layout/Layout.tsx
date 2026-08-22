import type { ReactNode } from "react";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { Sidebar } from "../Sidebar/Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        {/* 여백은 각 페이지가 직접 잡는다 */}
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
