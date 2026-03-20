"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Motorista, Equipamento } from "@/types";
import { Search, X } from "lucide-react";

interface Filters {
  search: string;
  cliente_id: string;
  motorista_id: string;
  equipamento_id: string;
  status_pagamento: string;
  data_inicio: string;
  data_fim: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

export function AtendimentoFilters({ filters, onChange, onReset }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("motoristas").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("equipamentos").select("id, tipo").eq("status", "disponivel").order("tipo"),
    ]).then(([c, m, e]) => {
      setClientes((c.data ?? []) as Cliente[]);
      setMotoristas((m.data ?? []) as Motorista[]);
      setEquipamentos((e.data ?? []) as Equipamento[]);
    });
  }, []);

  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const activeCount = Object.values(filters).filter((v) => v !== "").length;
  const hasActiveFilters = activeCount > 0;

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-3 transition-colors ${hasActiveFilters ? "border-zinc-300 shadow-sm" : ""}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Buscar por nº atendimento, NF, nº pedido, observação..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {filters.search && (
          <button
            onClick={() => set("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 items-end">
        <Select value={filters.cliente_id || "all"} onValueChange={(v) => set("cliente_id", v === "all" ? "" : v)}>
          <SelectTrigger className={`h-9 text-sm ${filters.cliente_id ? "border-zinc-400 text-zinc-900" : ""}`}>
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.motorista_id || "all"} onValueChange={(v) => set("motorista_id", v === "all" ? "" : v)}>
          <SelectTrigger className={`h-9 text-sm ${filters.motorista_id ? "border-zinc-400 text-zinc-900" : ""}`}>
            <SelectValue placeholder="Motorista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os motoristas</SelectItem>
            {motoristas.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.equipamento_id || "all"} onValueChange={(v) => set("equipamento_id", v === "all" ? "" : v)}>
          <SelectTrigger className={`h-9 text-sm ${filters.equipamento_id ? "border-zinc-400 text-zinc-900" : ""}`}>
            <SelectValue placeholder="Equipamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os equipamentos</SelectItem>
            {equipamentos.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status_pagamento || "all"} onValueChange={(v) => set("status_pagamento", v === "all" ? "" : v)}>
          <SelectTrigger className={`h-9 text-sm ${filters.status_pagamento ? "border-zinc-400 text-zinc-900" : ""}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide px-0.5">De</p>
          <Input
            type="date"
            value={filters.data_inicio}
            onChange={(e) => set("data_inicio", e.target.value)}
            className={`h-9 text-sm ${filters.data_inicio ? "border-zinc-400 text-zinc-900" : ""}`}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide px-0.5">Até</p>
          <Input
            type="date"
            value={filters.data_fim}
            onChange={(e) => set("data_fim", e.target.value)}
            className={`h-9 text-sm ${filters.data_fim ? "border-zinc-400 text-zinc-900" : ""}`}
          />
        </div>

        {hasActiveFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-9 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 gap-1.5 self-end"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
            <span className="inline-flex items-center justify-center bg-zinc-900 text-white text-[10px] font-bold rounded-full h-4 w-4">
              {activeCount}
            </span>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
