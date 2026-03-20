"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Truck } from "lucide-react";
import type { VehicleYTD } from "@/types";

interface YTDData {
  total: number;
  atendimentos: number;
  ticketMedio: number;
  porVeiculo: VehicleYTD[];
}

interface Props {
  data: YTDData | null;
  year: number;
  loading?: boolean;
}

export function YTDSummaryCard({ data, year, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ytd = data ?? { total: 0, atendimentos: 0, ticketMedio: 0, porVeiculo: [] };

  return (
    <Card className="border-t-2 border-t-red-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-red-600" />
          YTD {year} — Acumulado do Ano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline totals */}
        <div className="grid grid-cols-3 gap-3 border-b pb-4">
          <div>
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(ytd.total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Atendimentos</p>
            <p className="text-2xl font-bold">{ytd.atendimentos}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold">{formatCurrency(ytd.ticketMedio)}</p>
          </div>
        </div>

        {/* Per-vehicle breakdown */}
        {ytd.porVeiculo.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Sem dados</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Por veículo
            </p>
            {ytd.porVeiculo.map((v) => {
              const pct = ytd.total > 0 ? (v.valor / ytd.total) * 100 : 0;
              return (
                <div key={v.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 truncate max-w-[60%]">
                      <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{v.label}</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatCurrency(v.valor)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pct.toFixed(1)}% · {v.atendimentos} atend.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
