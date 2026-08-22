import type { ReactNode } from "react";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { Sidebar } from "../Sidebar/Sidebar";
import { Toast } from "../Toast/Toast";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4">{children}</main>
      </div>
      <Footer />
      <Toast />
    </div>
  );
}
