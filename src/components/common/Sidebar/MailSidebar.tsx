"use client";

import { useRouter } from "next/navigation";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useMailFolderCounts } from "@/hooks/useMailFolderCounts";
import { useAppStore } from "@/stores/useAppStore";
import { ROUTES } from "@/utils/routes";
import { Button } from "../Button/Button";
import { Sidebar } from "./Sidebar";
import { SidebarItem } from "./SidebarItem";
import { MAIL_NAV_ITEMS } from "./navItems";

interface MailSidebarProps {
  /** 넘기지 않으면 메일쓰기 화면으로 이동한다. */
  onCompose?: () => void;
}

export function MailSidebar({ onCompose }: MailSidebarProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const router = useRouter();
  const counts = useMailFolderCounts();

  return (
    <Sidebar
      label="메일 내비게이션"
      header={
        <Button
          variant="primary"
          onClick={onCompose ?? (() => router.push(ROUTES.mailWriting))}
          aria-label={isSidebarOpen ? undefined : "메일쓰기"}
          iconOnly={!isSidebarOpen}
          className={isSidebarOpen ? "w-full" : "mx-auto"}
        >
          {!isSidebarOpen && <EditOutlined fontSize="small" />}
          {isSidebarOpen && "메일쓰기"}
        </Button>
      }
    >
      {MAIL_NAV_ITEMS.map(({ Icon, countKey, ...item }) => (
        <SidebarItem
          key={item.href}
          icon={<Icon fontSize="small" />}
          count={countKey && counts ? counts[countKey] : undefined}
          {...item}
        />
      ))}
    </Sidebar>
  );
}
