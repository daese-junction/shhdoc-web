import { create } from "zustand";

interface AppState {
  /** 사이드내비 펼침 여부. 접히면 아이콘만 남는다. */
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
