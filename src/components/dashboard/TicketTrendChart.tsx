"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useChartColors } from "@/hooks/useChartColors";

interface Props {
  data: Array<{ mes: string; valor: number }>;
  loading?: boolean;
}

export function TicketTrendChart({ data, loading }: Props) {
  const c = useChartColors();
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-52 w-full" />
        </CardContent>
      </Card>
    );
  }

  const nonZero = data.filter((d) => d.valor > 0);
  const avg = nonZero.length > 0 ? nonZero.reduce((s, d) => s + d.valor, 0) / nonZero.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução do Ticket Médio (anual)</CardTitle>
      </CardHeader>
      <CardContent>
        {nonZero.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <AreaChart data={data} margin={{ right: 16 }}>
              <defs>
                <linearGradient id="gradTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c.mutedGradient} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={c.mutedGradient} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: c.tick }} />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: c.tick }}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, color: c.tooltipText }}
              />
              {avg > 0 && (
                <ReferenceLine
                  y={avg}
                  stroke="#dc2626"
                  strokeDasharray="4 3"
                  label={{ value: "Média", position: "right", fontSize: 11, fill: "#dc2626" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="valor"
                name="Ticket médio"
                stroke={c.mutedLine}
                strokeWidth={2}
                fill="url(#gradTicket)"
                dot={{ r: 3, fill: c.mutedLine }}
                activeDot={{ r: 5, fill: "#dc2626" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
