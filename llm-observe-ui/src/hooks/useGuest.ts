import { useCallback, useEffect, useState } from "react";
import { fetchGuestStatus } from "../services/guest";
import type { GuestStatus } from "../types/guest";
import { getGuestId } from "../utils/guestId";

export const useGuest = (enabled: boolean) => {
  const [guestId] = useState(getGuestId);
  const [status, setStatus] = useState<GuestStatus | null>(null);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await fetchGuestStatus(guestId);
      setStatus(result);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, guestId]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [enabled, refresh]);

  return {
    guestId,
    status,
    loading,
    refresh,
    callsRemaining: status?.calls_remaining ?? 5,
    callsUsed: status?.calls_used ?? 0,
    limit: status?.limit ?? 5,
  };
};
