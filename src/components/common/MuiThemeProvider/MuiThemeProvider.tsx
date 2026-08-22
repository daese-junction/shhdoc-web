"use client";

import type { ReactNode } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// MUI 는 기본값이 Roboto 라 그대로 두면 Dialog·Menu 만 다른 폰트로 렌더된다.
const theme = createTheme({
  typography: {
    fontFamily: "var(--font-sans)",
  },
});

export function MuiThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
