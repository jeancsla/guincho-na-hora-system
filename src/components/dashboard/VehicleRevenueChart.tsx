"use client";

import {
  BarChart,
  Bar,
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
import type { MonthlyVehiclePoint } from "@/types";

// B&W + red palette — up to 6 vehicles
const PALETTE = ["#dc2626", "#18181b", "#52525b", "#a1a1aa", "#d4d4d8", "#f5f5f5"];

interface Props {
  data: MonthlyVehiclePoint[];
  veiculos: string[];
  loading?: boolean;
}

export function VehicleRevenueChart({ data, veiculos, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receita por Veículo (mensal)</CardTitle>
      </CardHeader>
      <CardContent>
        {veiculos.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={data} margin={{ right: 16 }}>
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
              {veiculos.slice(0, 6).map((label, i) => (
                <Bar
                  key={label}
                  dataKey={label}
                  fill={PALETTE[i]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
