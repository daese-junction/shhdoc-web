import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  /** localStorage 복원이 끝났는지. 이 값이 false 인 동안은 로그인 여부를 판단하면 안 된다. */
  hasHydrated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      hasHydrated: false,
      login: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // 토큰만 저장한다. hasHydrated 는 매 실행마다 새로 판단해야 한다.
      partialize: (state) => ({ accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
