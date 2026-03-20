"use client";

import { useState, useEffect } from "react";
import type { DashboardAnalytics } from "@/types";

export function useDashboardAnalytics(year: number) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/analytics?year=${year}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Erro ao carregar analytics");
        }
        const json = await res.json();
        if (!cancelled) setData(json as DashboardAnalytics);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { data, loading, error };
}
