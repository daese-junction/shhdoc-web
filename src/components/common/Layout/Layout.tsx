import type { ReactNode } from "react";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { AreaSidebar } from "../Sidebar/AreaSidebar";

interface LayoutProps {
  /** 사이드내비를 직접 지정할 때. 기본값은 경로로 영역을 판단하는 `AreaSidebar`. */
  sidebar?: ReactNode;
  children: ReactNode;
}

export function Layout({ sidebar = <AreaSidebar />, children }: LayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="relative flex min-h-0 flex-1">
        {sidebar}
        {/* 여백은 각 페이지가 직접 잡는다 */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
