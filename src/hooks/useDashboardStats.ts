"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/types";

export function useDashboardStats(mes: string) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/stats?mes=${mes}`);
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [mes]);

  return { data, loading, error };
}
