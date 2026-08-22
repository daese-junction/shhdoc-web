import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  /** 재발급용. accessToken 30분, refreshToken 7일. */
  refreshToken: string | null;
  /** sessionStorage 복원이 끝났는지. 이 값이 false 인 동안은 로그인 여부를 판단하면 안 된다. */
  hasHydrated: boolean;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      login: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken: refreshToken ?? null }),
      logout: () => set({ accessToken: null, refreshToken: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      // 토큰만 저장한다. hasHydrated 는 매 실행마다 새로 판단해야 한다.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
