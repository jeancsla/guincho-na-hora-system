"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueByClientChart } from "@/components/dashboard/RevenueByClientChart";
import { RevenueByDriverChart } from "@/components/dashboard/RevenueByDriverChart";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { PaymentStatusChart } from "@/components/dashboard/PaymentStatusChart";
import { VehicleRevenueChart } from "@/components/dashboard/VehicleRevenueChart";
import { YearComparisonChart } from "@/components/dashboard/YearComparisonChart";
import { YTDSummaryCard } from "@/components/dashboard/YTDSummaryCard";
import { CollectionRateChart } from "@/components/dashboard/CollectionRateChart";
import { TicketTrendChart } from "@/components/dashboard/TicketTrendChart";
import { UpcomingDueList } from "@/components/dashboard/UpcomingDueList";
import { RecentAtendimentosList } from "@/components/dashboard/RecentAtendimentosList";
import { formatCurrency } from "@/lib/utils";
import { ClipboardList, DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getLastMonths(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy").replace(/\b\w/g, (c) => c.toUpperCase());
    return { value, label };
  });
}

function getYearOptions(n: number) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) => currentYear - i);
}

export default function DashboardPage() {
  const months = getLastMonths(12);
  const years = getYearOptions(4);

  const [mes, setMes] = useState(months[0].value);
  const [year, setYear] = useState(new Date().getFullYear());

  // Both fetches run concurrently — independent hooks fire in parallel
  const { data, loading } = useDashboardStats(mes);
  const { data: analytics, loading: analyticsLoading } = useDashboardAnalytics(year);

  return (
    <div className="space-y-8">

      {/* ── Section: Period KPIs ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visão do Mês</h2>
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
            iconColor="text-zinc-400"
            loading={loading}
          />
          <StatsCard
            title="Receita Total"
            value={loading ? "—" : formatCurrency(data?.receitaTotal ?? 0)}
            subtitle="não cancelados"
            icon={DollarSign}
            iconColor="text-red-600"
            loading={loading}
          />
          <StatsCard
            title="Ticket Médio"
            value={loading ? "—" : formatCurrency(data?.ticketMedio ?? 0)}
            subtitle="por atendimento"
            icon={TrendingUp}
            iconColor="text-zinc-500"
            loading={loading}
          />
          <StatsCard
            title="A Receber"
            value={loading ? "—" : formatCurrency(data?.totalAReceber ?? 0)}
            subtitle="pendentes + vencidos"
            icon={Clock}
            iconColor="text-zinc-400"
            loading={loading}
          />
          <StatsCard
            title="Vencidos"
            value={loading ? "—" : String(data?.atendimentosVencidos ?? 0)}
            subtitle="não pagos após vencimento"
            icon={AlertTriangle}
            iconColor="text-red-600"
            loading={loading}
          />
        </div>

        {/* Monthly trend + Status distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyRevenueChart data={data?.receitaMensal ?? []} loading={loading} />
          <PaymentStatusChart data={data?.distribuicaoStatus ?? []} loading={loading} />
        </div>

        {/* Top clients + Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueByClientChart data={data?.receitaPorCliente ?? []} loading={loading} />
          <RevenueByDriverChart data={data?.receitaPorMotorista ?? []} loading={loading} />
        </div>
      </section>

      {/* ── Section: Annual Analytics ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Análise Anual</h2>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* YTD Summary spans full width */}
        <YTDSummaryCard data={analytics?.ytd ?? null} year={year} loading={analyticsLoading} />

        {/* Vehicle revenue (grouped monthly) */}
        <VehicleRevenueChart
          data={analytics?.receitaMensalPorVeiculo ?? []}
          veiculos={analytics?.veiculos ?? []}
          loading={analyticsLoading}
        />

        {/* YoY comparison + collection rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <YearComparisonChart
            data={analytics?.comparacaoAnual ?? []}
            year={year}
            loading={analyticsLoading}
          />
          <CollectionRateChart data={analytics?.taxaCobranca ?? null} loading={analyticsLoading} />
        </div>

        {/* Ticket trend */}
        <TicketTrendChart data={analytics?.ticketMedioMensal ?? []} loading={analyticsLoading} />
      </section>

      {/* ── Section: Lists ───────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingDueList data={data?.proximosVencimentos ?? []} loading={loading} />
          <RecentAtendimentosList data={data?.ultimosAtendimentos ?? []} loading={loading} />
        </div>
      </section>

    </div>
  );
}
