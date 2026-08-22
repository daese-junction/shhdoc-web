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
          // ThemeProvider가 없어 Paper 기본값이 라이트 테마 흰 배경으로 고정된다.
          // elevation을 죽이고 토큰으로 직접 칠해야 다크모드가 따라온다.
          elevation: 0,
          role: "dialog",
          "aria-label": ariaLabel,
          className: `mt-1 min-w-40 overflow-hidden rounded-md border border-border-tertiary bg-surface-primary text-text-primary shadow-lg ${className}`,
        },
      }}
    >
      {children}
    </MuiPopover>
  );
}
