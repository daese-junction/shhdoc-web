import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** 아래 셋은 GET /auth/me 로만 채워진다 — 로그인 응답에는 없다. */
  department?: string | null;
  position?: string | null;
  companyName?: string | null;
}

interface UserState {
  user: User | null;
  /** localStorage 복원이 끝났는지. false 인 동안은 역할을 판단하면 안 된다. */
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setHasHydrated: (value: boolean) => void;
}

// useAuthStore 와 같은 방식으로 저장한다. 토큰만 남고 역할이 사라지면
// 새로고침할 때마다 관리자가 /manage 에서 튕기기 때문에 함께 보존해야 한다.
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
