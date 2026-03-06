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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Atendimentos</h2>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.total} registro{data.total !== 1 ? "s" : ""} encontrado{data.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
          <Button size="sm" onClick={() => router.push("/atendimentos/novo")}>
            <Plus className="h-4 w-4 mr-1" />
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} · {data.total} registros
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
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
