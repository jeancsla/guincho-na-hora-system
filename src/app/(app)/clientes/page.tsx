"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClienteStats } from "@/types";

type SortKey = "nome" | "total_atendimentos" | "valor_total" | "valor_pendente" | "ultimo_atendimento";
type SortDir = "asc" | "desc";

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-orange-500" /> : <ArrowDown className="h-3 w-3 text-orange-500" />;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("valor_total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let list = [...clientes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          (c.cidade ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [clientes, search, sortKey, sortDir]);

  const totals = useMemo(
    () => ({
      atendimentos: clientes.reduce((s, c) => s + c.total_atendimentos, 0),
      faturado: clientes.reduce((s, c) => s + c.valor_total, 0),
      pendente: clientes.reduce((s, c) => s + c.valor_pendente, 0),
    }),
    [clientes]
  );

  const ThBtn = ({
    col,
    label,
    className = "",
  }: {
    col: SortKey;
    label: string;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-1 group hover:text-foreground transition-colors ${className}`}
    >
      {label}
      <SortIcon col={col} active={sortKey} dir={sortDir} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading
              ? "Carregando..."
              : `${clientes.length} clientes · ${filtered.length} exibidos`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchClientes} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Clientes",
            value: loading ? "—" : clientes.length.toString(),
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Total Atendimentos",
            value: loading ? "—" : totals.atendimentos.toLocaleString("pt-BR"),
            icon: TrendingUp,
            color: "text-orange-500",
          },
          {
            label: "Total Faturado",
            value: loading ? "—" : formatCurrency(totals.faturado),
            icon: DollarSign,
            color: "text-green-500",
          },
          {
            label: "A Receber",
            value: loading ? "—" : formatCurrency(totals.pendente),
            icon: Clock,
            color: "text-yellow-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
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
          placeholder="Buscar por nome ou cidade..."
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
                  <ThBtn col="nome" label="Cliente" />
                </th>
                <th className="text-right font-medium px-4 py-3">
                  <div className="flex justify-end">
                    <ThBtn col="total_atendimentos" label="Atend." />
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3">
                  <div className="flex justify-end">
                    <ThBtn col="valor_total" label="Faturado" />
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">
                  <div className="flex justify-end">
                    <ThBtn col="valor_pendente" label="Pendente" />
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">
                  <div className="flex justify-end">
                    <ThBtn col="ultimo_atendimento" label="Último" />
                  </div>
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {search
                      ? `Nenhum cliente encontrado para "${search}"`
                      : "Nenhum cliente cadastrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium leading-tight">{cliente.nome}</div>
                      {cliente.cidade && (
                        <div className="text-xs text-muted-foreground mt-0.5">{cliente.cidade}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant="secondary"
                        className={`tabular-nums ${cliente.total_atendimentos === 0 ? "opacity-40" : ""}`}
                      >
                        {cliente.total_atendimentos}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(cliente.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {cliente.valor_pendente > 0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium tabular-nums text-xs">
                          {formatCurrency(cliente.valor_pendente)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden md:table-cell tabular-nums">
                      {formatDate(cliente.ultimo_atendimento)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/atendimentos?cliente_id=${cliente.id}`}
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ver histórico"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
