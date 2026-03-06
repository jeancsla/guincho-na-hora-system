"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueByClientChart } from "@/components/dashboard/RevenueByClientChart";
import { RevenueByDriverChart } from "@/components/dashboard/RevenueByDriverChart";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { PaymentStatusChart } from "@/components/dashboard/PaymentStatusChart";
import { UpcomingDueList } from "@/components/dashboard/UpcomingDueList";
import { RecentAtendimentosList } from "@/components/dashboard/RecentAtendimentosList";
import { formatCurrency } from "@/lib/utils";
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getLastMonths(n: number): Array<{ value: string; label: string }> {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy").replace(/\b\w/g, (c) => c.toUpperCase());
    return { value, label };
  });
}

export default function DashboardPage() {
  const months = getLastMonths(12);
  const [mes, setMes] = useState(months[0].value);
  const { data, loading } = useDashboardStats(mes);

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Visão Geral</h2>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Atendimentos"
          value={loading ? "—" : String(data?.totalAtendimentos ?? 0)}
          subtitle="no período selecionado"
          icon={ClipboardList}
          iconColor="text-blue-500"
          loading={loading}
        />
        <StatsCard
          title="Receita Total"
          value={loading ? "—" : formatCurrency(data?.receitaTotal ?? 0)}
          subtitle="atendimentos não cancelados"
          icon={DollarSign}
          iconColor="text-green-500"
          loading={loading}
        />
        <StatsCard
          title="Ticket Médio"
          value={loading ? "—" : formatCurrency(data?.ticketMedio ?? 0)}
          subtitle="por atendimento"
          icon={TrendingUp}
          iconColor="text-purple-500"
          loading={loading}
        />
        <StatsCard
          title="A Receber"
          value={loading ? "—" : formatCurrency(data?.totalAReceber ?? 0)}
          subtitle="pendentes + vencidos"
          icon={Clock}
          iconColor="text-yellow-500"
          loading={loading}
        />
        <StatsCard
          title="Vencidos"
          value={loading ? "—" : String(data?.atendimentosVencidos ?? 0)}
          subtitle="não pagos após vencimento"
          icon={AlertTriangle}
          iconColor="text-red-500"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyRevenueChart data={data?.receitaMensal ?? []} loading={loading} />
        <PaymentStatusChart data={data?.distribuicaoStatus ?? []} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByClientChart data={data?.receitaPorCliente ?? []} loading={loading} />
        <RevenueByDriverChart data={data?.receitaPorMotorista ?? []} loading={loading} />
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDueList data={data?.proximosVencimentos ?? []} loading={loading} />
        <RecentAtendimentosList data={data?.ultimosAtendimentos ?? []} loading={loading} />
      </div>
    </div>
  );
}
