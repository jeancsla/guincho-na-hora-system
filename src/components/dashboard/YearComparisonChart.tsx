"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { YearComparisonPoint } from "@/types";

interface Props {
  data: YearComparisonPoint[];
  year: number;
  loading?: boolean;
}

export function YearComparisonChart({ data, year, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receita: {year} vs {year - 1}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ right: 16 }}>
            <defs>
              <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#71717a" }} />
            <YAxis
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#71717a" }}
            />
            <Tooltip
              formatter={(v, name) => [formatCurrency(Number(v)), String(name)]}
              contentStyle={{ border: "1px solid #e4e4e7", borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="anoAtual"
              name={String(year)}
              stroke="#dc2626"
              strokeWidth={2}
              fill="url(#gradAtual)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="anoAnterior"
              name={String(year - 1)}
              stroke="#a1a1aa"
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="url(#gradAnterior)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
