import { useCallback, useEffect, useRef, useState } from "react";
import { getStats } from "../services/api";
import type { StatsResponse } from "../types/stats";

export const useStats = (guestId?: string | null) => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mountedRef = useRef(true);

  const loadStats = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);

      try {
        const result = await getStats(guestId);
        if (!mountedRef.current) return;
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } catch {
        if (!mountedRef.current) return;
        setError("backend_unreachable");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [guestId]
  );

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => void loadStats(false), 0);
    const interval = window.setInterval(() => void loadStats(true), 15000);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadStats]);

  const refresh = useCallback(() => void loadStats(true), [loadStats]);

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  };
};
