"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { StatusPagamento } from "@/types";
import { useChartColors } from "@/hooks/useChartColors";

interface Props {
  data: Array<{ status: StatusPagamento; total: number; valor: number }>;
  loading?: boolean;
}

// Semantic colors kept intentional (green = money in, red = overdue, gray = neutral)
const STATUS_COLORS: Record<StatusPagamento, string> = {
  pago: "#16a34a",
  pendente: "#a1a1aa",
  vencido: "#dc2626",
  cancelado: "#e4e4e7",
};

const STATUS_LABELS: Record<StatusPagamento, string> = {
  pago: "Pago",
  pendente: "Pendente",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export function PaymentStatusChart({ data, loading }: Props) {
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

  const chartData = data
    .filter((d) => d.total > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status],
      value: d.total,
      valor: d.valor,
      fill: STATUS_COLORS[d.status],
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por Status de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, _name, props) => [
                  `${Number(v)} atend. (${formatCurrency(Number(props?.payload?.valor ?? 0))})`,
                  String(props?.name ?? ""),
                ]}
                contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, color: c.tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: c.tick }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
