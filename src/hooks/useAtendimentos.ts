"use client";

import { useState, useEffect, useCallback } from "react";
import type { Atendimento, PaginatedResponse } from "@/types";

interface Filters {
  search?: string;
  cliente_id?: string;
  motorista_id?: string;
  equipamento_id?: string;
  status_pagamento?: string;
  data_inicio?: string;
  data_fim?: string;
}

export function useAtendimentos(filters: Filters = {}, page = 1) {
  const [data, setData] = useState<PaginatedResponse<Atendimento> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAtendimentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filters.search) params.set("search", filters.search);
      if (filters.cliente_id) params.set("cliente_id", filters.cliente_id);
      if (filters.motorista_id) params.set("motorista_id", filters.motorista_id);
      if (filters.equipamento_id) params.set("equipamento_id", filters.equipamento_id);
      if (filters.status_pagamento) params.set("status_pagamento", filters.status_pagamento);
      if (filters.data_inicio) params.set("data_inicio", filters.data_inicio);
      if (filters.data_fim) params.set("data_fim", filters.data_fim);

      const res = await fetch(`/api/atendimentos?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar atendimentos");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    filters.search,
    filters.cliente_id,
    filters.motorista_id,
    filters.equipamento_id,
    filters.status_pagamento,
    filters.data_inicio,
    filters.data_fim,
  ]);

  useEffect(() => {
    fetchAtendimentos();
  }, [fetchAtendimentos]);

  return { data, loading, error, refetch: fetchAtendimentos };
}
