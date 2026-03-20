"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MotoristaStats } from "@/types";

type SortKey = "nome" | "total_atendimentos" | "valor_total" | "valor_pendente" | "ultimo_atendimento";
type SortDir = "asc" | "desc";

function SortBtn({
  col,
  label,
  active,
  dir,
  onSort,
  className = "",
}: {
  col: SortKey;
  label: string;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const Icon =
    col !== active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className}`}
    >
      {label}
      <Icon className={`h-3 w-3 ${col === active ? "text-orange-500" : "opacity-40"}`} />
    </button>
  );
}

export default function MotoristasPage() {
  const [motoristas, setMotoristas] = useState<MotoristaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("valor_total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/motoristas");
      const data = await res.json();
      setMotoristas(Array.isArray(data) ? data : []);
    } catch {
      setMotoristas([]);
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
    let list = [...motoristas];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.nome.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const aVal = a[sortKey as keyof MotoristaStats] ?? 0;
      const bVal = b[sortKey as keyof MotoristaStats] ?? 0;
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [motoristas, search, sortKey, sortDir]);

  const totals = useMemo(() => ({
    atendimentos: motoristas.reduce((s, m) => s + m.total_atendimentos, 0),
    faturado: motoristas.reduce((s, m) => s + m.valor_total, 0),
    pendente: motoristas.reduce((s, m) => s + m.valor_pendente, 0),
  }), [motoristas]);

  const kpis = [
    { label: "Motoristas", value: motoristas.length.toString(), icon: User, color: "text-blue-500" },
    { label: "Atendimentos", value: totals.atendimentos.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-orange-500" },
    { label: "Total Faturado", value: formatCurrency(totals.faturado), icon: DollarSign, color: "text-green-500" },
    { label: "A Receber", value: formatCurrency(totals.pendente), icon: Clock, color: "text-yellow-500" },
  ];

  const sortProps = { active: sortKey, dir: sortDir, onSort: handleSort };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motoristas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading
              ? "Carregando..."
              : `${motoristas.length} motoristas · ${filtered.length} exibidos`}
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
          placeholder="Buscar motorista..."
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
                  <SortBtn col="nome" label="Motorista" {...sortProps} />
                </th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Veículo</th>
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
                <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">
                  <div className="flex justify-end">
                    <SortBtn col="valor_pendente" label="Pendente" {...sortProps} />
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Truck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    {search
                      ? `Nenhum motorista encontrado para "${search}"`
                      : "Nenhum motorista cadastrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium leading-tight">{m.nome}</div>
                          {m.telefone && (
                            <div className="text-xs text-muted-foreground mt-0.5">{m.telefone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {m.veiculo ? (
                        <span>
                          {m.veiculo.modelo}
                          {m.veiculo.placa && (
                            <Badge variant="outline" className="ml-1.5 text-[10px] font-mono">
                              {m.veiculo.placa}
                            </Badge>
                          )}
                        </span>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant="secondary"
                        className={`tabular-nums ${m.total_atendimentos === 0 ? "opacity-40" : ""}`}
                      >
                        {m.total_atendimentos}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {m.valor_total > 0 ? formatCurrency(m.valor_total) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {m.valor_pendente > 0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium tabular-nums text-xs">
                          {formatCurrency(m.valor_pendente)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell tabular-nums">
                      {formatDate(m.ultimo_atendimento)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/atendimentos?motorista_id=${m.id}`}
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ver atendimentos"
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
