"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  ROUTES,
  getArea,
  getNotificationRoute,
  isMailPage,
} from "@/utils/routes";
import { Popover } from "../Popover/Popover";
import { SearchInput } from "../SearchInput/SearchInput";

const PROFILE_POPOVER_ID = "header-profile-popover";

/** 헤더의 아이콘 전용 액션. 버튼과 링크가 같은 크기·상태를 갖도록 공유한다. */
const ICON_ACTION_CLASS =
  "grid size-9 shrink-0 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary";

const AREA_TABS = [
  { area: "mail", href: ROUTES.mail, label: "메일" },
  { area: "manage", href: ROUTES.manage, label: "관리" },
] as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const area = getArea(pathname);

  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const logout = useAuthStore((state) => state.logout);
  // 원시값을 반환하는 셀렉터라 user 객체가 바뀌어도 role 이 그대로면 리렌더되지 않는다.
  const isAdmin = useUserStore((state) => state.user?.role === "admin");
  const setUser = useUserStore((state) => state.setUser);

  const [searchQuery, setSearchQuery] = useState("");
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const isProfileOpen = Boolean(profileAnchorEl);

  const handleSearch = (value: string) => {
    const query = value.trim();
    // 목록 화면이 읽어갈 수 있도록 URL 에 남긴다.
    // 실제 필터링은 메일 목록이 붙을 때 q 파라미터를 읽어 연결한다.
    router.push(
      query ? `${ROUTES.mail}?q=${encodeURIComponent(query)}` : ROUTES.mail
    );
  };

  const handleProfileOpen = (event: MouseEvent<HTMLButtonElement>) =>
    setProfileAnchorEl(event.currentTarget);
  const closeProfile = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    closeProfile();
    logout();
    // 토큰만 지우면 stale 한 user 가 남아 관리자 토글이 계속 보인다.
    setUser(null);
    router.replace("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-tertiary bg-surface-primary px-4 sm:px-6">
      {/* ── 좌측: 사이드내비 토글 + 로고 ────────────────── */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="사이드바 토글"
        aria-expanded={isSidebarOpen}
        className={`-ml-2 ${ICON_ACTION_CLASS}`}
      >
        <MenuOutlined fontSize="small" />
      </button>

      <Link href={ROUTES.mail} aria-label="정션 홈" className="shrink-0">
        <Image
          src="/assets/images/logo.svg"
          alt="정션"
          width={486}
          height={91}
          priority
          // 로고가 검정 단색 svg 라 다크 모드 배경(bg-surface-primary)에 묻힌다 — invert 로 반전시킨다
          className="h-5 w-auto dark:brightness-0 dark:invert"
        />
      </Link>

      {/* ── 중앙: 검색 (메일 화면에서만) ────────────────── */}
      <div className="flex min-w-0 flex-1 justify-center px-2">
        {isMailPage(pathname) && (
          // SearchInput 은 className 을 자기 것으로 덮어쓰므로 폭은 바깥에서 잡는다.
          <div className="hidden w-full max-w-md sm:block">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="메일 검색"
            />
          </div>
        )}
      </div>

      {/* ── 우측: 영역 토글 + 알림 + 프로필 ─────────────── */}
      <div className="flex shrink-0 items-center gap-1">
        {isAdmin && (
          <nav
            aria-label="영역 전환"
            className="mr-1 flex items-center gap-0.5 rounded-full border border-border-tertiary bg-surface-secondary p-0.5"
          >
            {AREA_TABS.map((tab) => (
              <Link
                key={tab.area}
                href={tab.href}
                aria-current={area === tab.area ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  area === tab.area
                    ? "bg-brand-500 text-white"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}

        <Link
          href={getNotificationRoute(area)}
          aria-label="알림"
          className={ICON_ACTION_CLASS}
        >
          <NotificationsOutlined fontSize="small" />
        </Link>

        <button
          type="button"
          onClick={handleProfileOpen}
          aria-label="프로필 메뉴"
          aria-haspopup="dialog"
          aria-expanded={isProfileOpen}
          // 닫혀 있을 때는 팝오버 노드가 DOM 에 없으므로 가리키지 않는다.
          aria-controls={isProfileOpen ? PROFILE_POPOVER_ID : undefined}
          className={ICON_ACTION_CLASS}
        >
          <AccountCircleOutlined fontSize="small" />
        </button>

        <Popover
          id={PROFILE_POPOVER_ID}
          open={isProfileOpen}
          anchorEl={profileAnchorEl}
          onClose={closeProfile}
          ariaLabel="프로필 메뉴"
        >
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-tertiary"
          >
            로그아웃
          </button>
        </Popover>
      </div>
    </header>
  );
}
