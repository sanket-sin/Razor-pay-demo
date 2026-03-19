import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import * as sessionsApi from '../services/sessions.js';

/** Resolve creator UUID from session list (creator.user.id matches logged-in user). */
export function useCreatorProfile() {
  const user = useAuthStore((s) => s.user);
  const creatorId = useAuthStore((s) => s.creatorId);
  const setCreatorId = useAuthStore((s) => s.setCreatorId);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'creator') return null;
    if (creatorId) return creatorId;
    try {
      const list = await sessionsApi.listSessions({});
      const mine = list?.find((s) => s.creator?.user?.id === user.id);
      if (mine?.creatorId) {
        setCreatorId(mine.creatorId);
        return mine.creatorId;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, [user, creatorId, setCreatorId]);

  useEffect(() => {
    if (user?.role === 'creator' && !creatorId) refresh();
  }, [user, creatorId, refresh]);

  return { creatorId, refreshCreatorId: refresh };
}
