"use client";

import { Fragment } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarItem } from "./SidebarItem";
import { SidebarSection } from "./SidebarSection";
import { MANAGE_NAV_SECTIONS } from "./navItems";

export function ManageSidebar() {
  return (
    <Sidebar label="관리 내비게이션">
      {MANAGE_NAV_SECTIONS.map((section) => (
        <Fragment key={section.title}>
          <SidebarSection title={section.title} />
          {section.items.map(({ Icon, ...item }) => (
            <SidebarItem key={item.href} icon={<Icon fontSize="small" />} {...item} />
          ))}
        </Fragment>
      ))}
    </Sidebar>
  );
}
