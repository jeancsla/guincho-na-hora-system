"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClienteStats } from "@/types";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.cidade ?? "").toLowerCase().includes(q)
    );
  }, [clientes, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Carregando..." : `${clientes.length} clientes cadastrados`}
        </p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clientes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total Faturado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(clientes.reduce((s, c) => s + c.valor_total, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {clientes.reduce((s, c) => s + c.total_atendimentos, 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou cidade..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {search ? "Nenhum cliente encontrado para essa busca." : "Nenhum cliente cadastrado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium px-4 py-3">Cliente</th>
                    <th className="text-right font-medium px-4 py-3">Atendimentos</th>
                    <th className="text-right font-medium px-4 py-3">Valor Total</th>
                    <th className="text-right font-medium px-4 py-3">Último Atend.</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{cliente.nome}</div>
                        {cliente.cidade && (
                          <div className="text-xs text-muted-foreground">{cliente.cidade}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary">{cliente.total_atendimentos}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium tabular-nums">
                        {formatCurrency(cliente.valor_total)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatDate(cliente.ultimo_atendimento)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/atendimentos?cliente_id=${cliente.id}`}
                          className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors"
                        >
                          Ver histórico
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
