"use client";

import { useState, useCallback } from "react";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { AtendimentoFilters } from "@/components/atendimentos/AtendimentoFilters";
import { AtendimentoTable } from "@/components/atendimentos/AtendimentoTable";
import { PaymentModal } from "@/components/atendimentos/PaymentModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Atendimento } from "@/types";

const EMPTY_FILTERS = {
  search: "",
  cliente_id: "",
  motorista_id: "",
  equipamento_id: "",
  status_pagamento: "",
  data_inicio: "",
  data_fim: "",
};

export default function AtendimentosPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [paymentTarget, setPaymentTarget] = useState<Atendimento | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Atendimento | null>(null);

  const { data, loading, refetch } = useAtendimentos(filters, page);

  function handleFilterChange(newFilters: typeof EMPTY_FILTERS) {
    setFilters(newFilters);
    setPage(1);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    try {
      const res = await fetch(`/api/atendimentos/${cancelTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao cancelar");
      toast.success("Atendimento cancelado");
      refetch();
    } catch {
      toast.error("Erro ao cancelar atendimento");
    } finally {
      setCancelTarget(null);
    }
  }

  function handleExportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (filters.search) params.set("search", filters.search);
    if (filters.cliente_id) params.set("cliente_id", filters.cliente_id);
    if (filters.motorista_id) params.set("motorista_id", filters.motorista_id);
    if (filters.equipamento_id) params.set("equipamento_id", filters.equipamento_id);
    if (filters.status_pagamento) params.set("status_pagamento", filters.status_pagamento);
    if (filters.data_inicio) params.set("data_inicio", filters.data_inicio);
    if (filters.data_fim) params.set("data_fim", filters.data_fim);
    window.open(`/api/atendimentos?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Atendimentos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {loading ? (
              <span className="inline-block skeleton-shimmer h-3.5 w-40 rounded" />
            ) : data ? (
              `${data.total.toLocaleString("pt-BR")} registro${data.total !== 1 ? "s" : ""} encontrado${data.total !== 1 ? "s" : ""}`
            ) : (
              "Carregando…"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600">
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/atendimentos/novo")}
            className="bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Atendimento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AtendimentoFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
      />

      {/* Table */}
      <AtendimentoTable
        data={data?.data ?? []}
        loading={loading}
        onMarkPaid={setPaymentTarget}
        onCancel={setCancelTarget}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
            Página <span className="font-semibold text-zinc-700 dark:text-zinc-300">{data.page}</span> de{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{data.totalPages}</span>
            {" · "}
            {data.total.toLocaleString("pt-BR")} registros
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0 hover:border-zinc-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(data.totalPages, 5) }).map((_, idx) => {
              const p = Math.max(1, Math.min(page - 2, data.totalPages - 4)) + idx;
              if (p < 1 || p > data.totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 p-0 text-xs font-medium ${p === page ? "bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white" : "hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="h-8 w-8 p-0 hover:border-zinc-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        atendimento={paymentTarget}
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSuccess={refetch}
      />

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o atendimento{" "}
              <strong>{cancelTarget?.numero_atendimento}</strong>?{" "}
              O registro será mantido com status &quot;Cancelado&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              Cancelar Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
