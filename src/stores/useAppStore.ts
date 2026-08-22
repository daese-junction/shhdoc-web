import { create } from "zustand";

interface AppState {
  /** 사이드내비 펼침 여부. md 이상에서는 접히면 아이콘만 남고, md 미만에서는 오버레이 drawer 가 열린다. */
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
