import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { Atendimento } from "@/types";
import Link from "next/link";
import { PaymentStatusBadge } from "@/components/atendimentos/PaymentStatusBadge";

interface Props {
  data: Atendimento[];
  loading?: boolean;
}

export function RecentAtendimentosList({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          Últimos Atendimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum atendimento cadastrado
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((a) => (
              <Link
                key={a.id}
                href={`/atendimentos/${a.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.cliente?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.numero_atendimento} · {formatDate(a.data)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <PaymentStatusBadge status={a.status_pagamento} dataVencimento={a.data_vencimento} />
                  <p className="text-sm font-semibold">{formatCurrency(Number(a.valor))}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
