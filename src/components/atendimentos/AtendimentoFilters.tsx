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

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nº atendimento, NF, nº pedido, observação..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <Select value={filters.cliente_id || "all"} onValueChange={(v) => set("cliente_id", v === "all" ? "" : v)}>
          <SelectTrigger>
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
          <SelectTrigger>
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
          <SelectTrigger>
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
          <SelectTrigger>
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

        <Input
          type="date"
          value={filters.data_inicio}
          onChange={(e) => set("data_inicio", e.target.value)}
          title="Data início"
        />
        <Input
          type="date"
          value={filters.data_fim}
          onChange={(e) => set("data_fim", e.target.value)}
          title="Data fim"
        />

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
