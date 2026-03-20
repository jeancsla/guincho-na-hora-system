"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Atendimento } from "@/types";
import { AtendimentoForm } from "@/components/atendimentos/AtendimentoForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/atendimentos/PaymentStatusBadge";
import { PaymentModal } from "@/components/atendimentos/PaymentModal";
import { Edit, CheckCircle, FileText } from "lucide-react";
import { generateRecibo } from "@/lib/pdf/recibo";
import Link from "next/link";

export default function AtendimentoDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isEdit = searchParams.get("edit") === "true";

  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/atendimentos/${id}`);
      if (res.ok) setAtendimento(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Atendimento não encontrado.</p>
        <Link href="/atendimentos" className="text-primary underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (isEdit) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Editar Atendimento</h2>
          <p className="text-sm text-muted-foreground">{atendimento.numero_atendimento}</p>
        </div>
        <AtendimentoForm atendimento={atendimento} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Atendimento {atendimento.numero_atendimento}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(atendimento.data)}</p>
        </div>
        <div className="flex gap-2">
          {atendimento.status_pagamento !== "pago" && atendimento.status_pagamento !== "cancelado" && (
            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
              Marcar como Pago
            </Button>
          )}
          {atendimento.status_pagamento !== "cancelado" && (
            <Button variant="outline" size="sm" onClick={() => generateRecibo(atendimento)}>
              <FileText className="h-4 w-4 mr-1" />
              Gerar Recibo
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/atendimentos/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Dados Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Cliente" value={atendimento.cliente?.nome} />
            <Row label="Equipamento" value={atendimento.equipamento?.tipo} />
            <Row label="Motorista" value={atendimento.motorista?.nome} />
            <Row label="Veículo" value={`${atendimento.veiculo?.modelo}${atendimento.veiculo?.placa ? ` · ${atendimento.veiculo?.placa}` : ""}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Valor" value={formatCurrency(Number(atendimento.valor))} />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <PaymentStatusBadge status={atendimento.status_pagamento} dataVencimento={atendimento.data_vencimento} />
            </div>
            <Row label="Vencimento" value={formatDate(atendimento.data_vencimento)} />
            {atendimento.data_pagamento && <Row label="Pago em" value={formatDate(atendimento.data_pagamento)} />}
            {atendimento.metodo_pagamento && <Row label="Método" value={atendimento.metodo_pagamento} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Localização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Retirada" value={atendimento.local_retirada} />
            <Row label="Entrega" value={atendimento.local_entrega} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nº Pedido" value={atendimento.numero_pedido ?? "—"} />
            <Row label="Nota Fiscal" value={atendimento.nota_fiscal ?? "—"} />
          </CardContent>
        </Card>
      </div>

      {atendimento.observacoes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{atendimento.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <PaymentModal
        atendimento={atendimento}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}
