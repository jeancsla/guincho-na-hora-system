"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Car,
  Search,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VeiculoStats } from "@/types";

type SortKey = "modelo" | "total_atendimentos" | "valor_total" | "ultimo_atendimento";
type SortDir = "asc" | "desc";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  em_uso: { label: "Em Uso", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" },
  manutencao: { label: "Manutenção", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

function SortBtn({
  col, label, active, dir, onSort, className = "",
}: {
  col: SortKey; label: string; active: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const Icon = col !== active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className}`}
    >
      {label}
      <Icon className={`h-3 w-3 ${col === active ? "text-red-600" : "opacity-40"}`} />
    </button>
  );
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<VeiculoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("valor_total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/veiculos");
      const data = await res.json();
      setVeiculos(Array.isArray(data) ? data : []);
    } catch {
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let list = [...veiculos];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.modelo.toLowerCase().includes(q) ||
          (v.placa ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortKey as keyof VeiculoStats] ?? 0;
      const bVal = b[sortKey as keyof VeiculoStats] ?? 0;
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [veiculos, search, sortKey, sortDir]);

  const totals = useMemo(() => ({
    atendimentos: veiculos.reduce((s, v) => s + v.total_atendimentos, 0),
    faturado: veiculos.reduce((s, v) => s + v.valor_total, 0),
    pendente: veiculos.reduce((s, v) => s + v.valor_pendente, 0),
    emUso: veiculos.filter((v) => v.status === "em_uso").length,
  }), [veiculos]);

  const kpis = [
    { label: "Veículos", value: veiculos.length.toString(), icon: Car, color: "text-zinc-400" },
    { label: "Atendimentos", value: totals.atendimentos.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-red-600" },
    { label: "Total Faturado", value: formatCurrency(totals.faturado), icon: DollarSign, color: "text-emerald-600" },
    { label: "A Receber", value: formatCurrency(totals.pendente), icon: Clock, color: "text-zinc-400" },
  ];

  const sortProps = { active: sortKey, dir: sortDir, onSort: handleSort };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Veículos</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            {loading
              ? "Carregando..."
              : `${veiculos.length.toLocaleString("pt-BR")} veículos · ${totals.emUso} em uso`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch_} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-bold tabular-nums">{value}</p>
              )}
              <Icon className={`absolute right-3 top-3 h-5 w-5 ${color} opacity-20`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por modelo ou placa..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20">
              <tr className="text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">
                  <SortBtn col="modelo" label="Veículo" {...sortProps} />
                </th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Motoristas</th>
                <th className="text-right font-medium px-4 py-3">
                  <div className="flex justify-end">
                    <SortBtn col="total_atendimentos" label="Atend." {...sortProps} />
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3">
                  <div className="flex justify-end">
                    <SortBtn col="valor_total" label="Faturado" {...sortProps} />
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">
                  <div className="flex justify-end">
                    <SortBtn col="ultimo_atendimento" label="Último" {...sortProps} />
                  </div>
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Car className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {search
                      ? `Nenhum veículo encontrado para "${search}"`
                      : "Nenhum veículo cadastrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const statusInfo = STATUS_LABELS[v.status] ?? {
                    label: v.status, className: "bg-muted text-muted-foreground",
                  };
                  return (
                    <tr
                      key={v.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                            <Car className="h-4 w-4 text-zinc-400" />
                          </div>
                          <div>
                            <div className="font-medium leading-tight">{v.modelo}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {v.placa && (
                                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1">
                                  {v.placa}
                                </Badge>
                              )}
                              {v.ano && (
                                <span className="text-xs text-muted-foreground">{v.ano}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {v.motoristas.length > 0 ? (
                            v.motoristas.map((nome) => (
                              <Badge key={nome} variant="secondary" className="text-[10px]">
                                {nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={`tabular-nums ${v.total_atendimentos === 0 ? "opacity-40" : ""}`}
                        >
                          {v.total_atendimentos}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {v.valor_total > 0 ? formatCurrency(v.valor_total) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell tabular-nums">
                        {formatDate(v.ultimo_atendimento)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/atendimentos?veiculo_id=${v.id}`}
                          className="flex items-center gap-1 text-red-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ver atendimentos"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Capacity info */}
      {!loading && veiculos.some((v) => v.capacidade_kg) && (
        <p className="text-xs text-muted-foreground">
          * Capacidade cadastrada em alguns veículos — acesse os detalhes no Supabase para editar.
        </p>
      )}
    </div>
  );
}
