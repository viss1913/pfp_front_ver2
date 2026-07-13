"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminAuthState = {
  token: string;
  projectKey: string;
  setToken: (token: string) => void;
  setProjectKey: (key: string) => void;
  setCredentials: (token: string, projectKey: string) => void;
  clear: () => void;
  isReady: () => boolean;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: "",
      projectKey: "",
      setToken: (token) => set({ token }),
      setProjectKey: (projectKey) => set({ projectKey }),
      setCredentials: (token, projectKey) => set({ token, projectKey }),
      clear: () => set({ token: "", projectKey: "" }),
      isReady: () => {
        const { token, projectKey } = get();
        return Boolean(token.trim() && projectKey.trim());
      },
    }),
    {
      name: "pfp-admin-auth",
      partialize: (s) => ({ token: s.token, projectKey: s.projectKey }),
    }
  )
);
