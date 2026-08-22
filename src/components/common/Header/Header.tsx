"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { fetchMe } from "@/app/(auth)/api/auth";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore, type User } from "@/stores/useUserStore";
import { toStoreUserFromMe } from "@/utils/auth";
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
  // 로그인 때 저장해 둔 값이라 팝오버를 열자마자 이름이 보인다
  const user = useUserStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const isProfileOpen = Boolean(profileAnchorEl);
  // /auth/me 는 팝오버를 열 때 한 번만 읽는다 (열 때마다 다시 부르지 않는다)
  const hasLoadedMeRef = useRef(false);

  const handleSearch = (value: string) => {
    const query = value.trim();
    // 목록 화면이 읽어갈 수 있도록 URL 에 남긴다.
    // 실제 필터링은 메일 목록이 붙을 때 q 파라미터를 읽어 연결한다.
    router.push(
      query ? `${ROUTES.mail}?q=${encodeURIComponent(query)}` : ROUTES.mail
    );
  };

  /**
   * 팝오버를 처음 열 때 한 번만 GET /auth/me 를 읽어 소속까지 채운다.
   * 로그인 응답에는 부서·직급이 없고, 이름도 그 뒤에 바뀌었을 수 있다.
   */
  const handleProfileOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setProfileAnchorEl(event.currentTarget);

    if (hasLoadedMeRef.current) return;
    hasLoadedMeRef.current = true;

    void fetchMe()
      .then((me) => setUser(toStoreUserFromMe(me)))
      .catch(() => {
        // 실패해도 로그인 때 저장해 둔 이름은 그대로 보인다.
        // 401 이면 인터셉터가 이미 로그아웃까지 처리한다.
        hasLoadedMeRef.current = false;
      });
  };

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

      <Link
        href={ROUTES.mail}
        aria-label="쉿독 홈"
        className="flex shrink-0 items-center gap-1.5"
      >
        <Image
          aria-hidden
          src="/assets/images/dog.svg"
          alt=""
          width={1248}
          height={1208}
          priority
          className="h-5 w-5"
        />
        <Image
          src="/assets/images/logo.svg"
          alt="쉿독"
          width={1112}
          height={245}
          priority
          // 로고 svg 자체가 다크모드에 맞춰 색을 바꾸므로 여기서 따로 반전하지 않는다
          className="h-5 w-auto"
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
          // 이메일 한 줄이 들어갈 폭. 넘치면 각 줄이 알아서 잘린다.
          className="w-64"
        >
          <ProfileSummary user={user} />

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

/**
 * 팝오버 맨 위에 붙는 "지금 로그인한 사람".
 * 이름은 로그인 때 저장해 둔 값으로 바로 뜨고, 부서·직급은 GET /auth/me 가 도착하면 채워진다.
 */
function ProfileSummary({ user }: { user: User | null }) {
  if (!user) {
    return (
      <p className="border-b border-border-tertiary px-4 py-3 text-sm text-text-tertiary">
        로그인 정보를 불러오지 못했습니다
      </p>
    );
  }

  // 부서·직급은 안 채워진 계정이 있어 있는 것만 이어 붙인다
  const affiliation = [user.department, user.position].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-0.5 border-b border-border-tertiary px-4 py-3">
      <p className="truncate text-sm font-medium text-text-primary" title={user.name}>
        {user.name}
      </p>
      <p className="truncate text-xs text-text-secondary" title={user.email}>
        {user.email}
      </p>
      {affiliation && (
        <p className="truncate text-xs text-text-tertiary">{affiliation}</p>
      )}
    </div>
  );
}
