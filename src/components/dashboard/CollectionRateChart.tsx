"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useChartColors } from "@/hooks/useChartColors";

interface CollectionData {
  pago: number;
  pendente: number;
  vencido: number;
  total: number;
  taxaCobranca: number;
}

interface Props {
  data: CollectionData | null;
  loading?: boolean;
}

const SEGMENTS = [
  { key: "pago" as const, label: "Recebido", color: "#16a34a" },
  { key: "pendente" as const, label: "Pendente", color: "#a1a1aa" },
  { key: "vencido" as const, label: "Vencido", color: "#dc2626" },
];

export function CollectionRateChart({ data, loading }: Props) {
  const c = useChartColors();
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const safe = data ?? { pago: 0, pendente: 0, vencido: 0, total: 0, taxaCobranca: 0 };
  const chartData = SEGMENTS.map((s) => ({ name: s.label, value: safe[s.key], color: s.color })).filter(
    (d) => d.value > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taxa de Cobrança (YTD)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="shrink-0">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ name: "Sem dados", value: 1, color: "#e4e4e7" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={66}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(chartData.length > 0 ? chartData : [{ color: "#e4e4e7" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, color: c.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center -mt-2 text-lg font-bold tabular-nums">
              {safe.taxaCobranca.toFixed(0)}%
            </p>
            <p className="text-center text-xs text-muted-foreground">recebido</p>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {SEGMENTS.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </span>
                <span className="tabular-nums font-medium">{formatCurrency(safe[s.key])}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(safe.total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
