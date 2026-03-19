import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '../services/api.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      creatorId: null,

      setSession: (token, user, creatorId = null) => {
        setAuthToken(token);
        set({ token, user, creatorId: creatorId ?? get().creatorId });
      },

      setCreatorId: (id) => set({ creatorId: id }),

      logout: () => {
        setAuthToken(null);
        set({ token: null, user: null, creatorId: null });
      },

      hydrateToken: () => {
        const t = get().token;
        if (t) setAuthToken(t);
      },
    }),
    {
      name: 'creator-platform-auth',
      partialize: (s) => ({ token: s.token, user: s.user, creatorId: s.creatorId }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    }
  )
);
