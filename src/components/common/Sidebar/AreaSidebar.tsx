"use client";

import { usePathname } from "next/navigation";
import { getArea } from "@/utils/routes";
import { MailSidebar } from "./MailSidebar";
import { ManageSidebar } from "./ManageSidebar";

/**
 * 현재 경로의 영역에 맞는 사이드내비를 고른다.
 * `getArea` 기준이라 `/manage` 계열만 관리, 나머지는 메일(기본 영역)이다.
 */
export function AreaSidebar() {
  const pathname = usePathname();

  return getArea(pathname) === "manage" ? <ManageSidebar /> : <MailSidebar />;
}
