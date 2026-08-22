"use client";

import MuiTooltip, { type TooltipProps as MuiTooltipProps } from "@mui/material/Tooltip";
import type { ReactElement, ReactNode } from "react";

interface TooltipProps {
  /** 말풍선에 넣을 내용 */
  title: ReactNode;
  /** 마우스를 올리거나 포커스했을 때 말풍선을 띄울 요소. ref 를 받을 수 있어야 한다. */
  children: ReactElement;
  placement?: MuiTooltipProps["placement"];
}

/**
 * MUI Tooltip 을 프로젝트 색 토큰에 맞춰 감싼 공통 툴팁.
 * ThemeProvider 가 없어 MUI 기본 테마(라이트)가 그대로 나오므로,
 * 색은 className 대신 sx 로 준다 — emotion 스타일이 레이어 밖이라
 * @layer utilities 의 Tailwind 클래스보다 항상 우선한다.
 */
export function Tooltip({ title, children, placement = "top" }: TooltipProps) {
  return (
    <MuiTooltip
      title={title}
      placement={placement}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: "16rem",
            borderRadius: "0.375rem",
            border: "1px solid var(--color-border-tertiary)",
            backgroundColor: "var(--color-surface-primary)",
            color: "var(--color-text-primary)",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.12)",
            padding: "0.375rem 0.625rem",
            fontSize: "0.75rem",
            fontWeight: 400,
            lineHeight: 1.5,
            wordBreak: "keep-all",
          },
        },
      }}
    >
      {children}
    </MuiTooltip>
  );
}
