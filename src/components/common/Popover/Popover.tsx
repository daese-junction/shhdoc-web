"use client";

import MuiPopover, { type PopoverOrigin } from "@mui/material/Popover";
import type { ReactNode } from "react";

interface PopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  /** 트리거가 aria-controls로 가리키는 id */
  id?: string;
  /** 팝오버 표면의 접근성 이름 */
  ariaLabel?: string;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  className?: string;
}

const DEFAULT_ANCHOR_ORIGIN: PopoverOrigin = {
  vertical: "bottom",
  horizontal: "right",
};

const DEFAULT_TRANSFORM_ORIGIN: PopoverOrigin = {
  vertical: "top",
  horizontal: "right",
};

export function Popover({
  open,
  anchorEl,
  onClose,
  children,
  id,
  ariaLabel,
  anchorOrigin = DEFAULT_ANCHOR_ORIGIN,
  transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  className = "",
}: PopoverProps) {
  return (
    <MuiPopover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      // MUI Modal이 body에 overflow:hidden + 스크롤바 보정 패딩을 넣어
      // 팝오버를 열 때마다 헤더가 가로로 밀리는 것을 막는다.
      disableScrollLock
      slotProps={{
        paper: {
          elevation: 0,
          role: "dialog",
          "aria-label": ariaLabel,
          // MUI 가 주입하는 Paper 기본 배경/글자색(흰 배경 + 검정 글자)이 토큰 클래스보다
          // 나중에 적용돼 그냥 덮어써서는 안 먹는다 — !important 로 강제해야 다크모드가 실제로 반영된다.
          className: `mt-1 min-w-40 overflow-hidden rounded-md border border-border-tertiary !bg-surface-primary !text-text-primary shadow-lg ${className}`,
        },
      }}
    >
      {children}
    </MuiPopover>
  );
}
