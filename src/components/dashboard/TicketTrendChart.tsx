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

interface Props {
  data: Array<{ mes: string; valor: number }>;
  loading?: boolean;
}

export function TicketTrendChart({ data, loading }: Props) {
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
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
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
                stroke="#18181b"
                strokeWidth={2}
                fill="url(#gradTicket)"
                dot={{ r: 3, fill: "#18181b" }}
                activeDot={{ r: 5, fill: "#dc2626" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
