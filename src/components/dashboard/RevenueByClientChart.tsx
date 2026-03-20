"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Array<{ nome: string; valor: number }>;
  loading?: boolean;
}

export function RevenueByClientChart({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
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
        <CardTitle className="text-base">Receita por Cliente (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
              <XAxis
                type="number"
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11, fill: "#52525b" }} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ border: "1px solid #e4e4e7", borderRadius: 6 }}
              />
              <Bar dataKey="valor" name="Receita" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
