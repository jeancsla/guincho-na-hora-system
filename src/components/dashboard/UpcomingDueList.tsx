import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { Atendimento } from "@/types";
import Link from "next/link";

interface Props {
  data: Atendimento[];
  loading?: boolean;
}

export function UpcomingDueList({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Vencimentos Próximos (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum vencimento nos próximos 7 dias
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
                  <p className="text-xs text-muted-foreground">{a.numero_atendimento}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold">{formatCurrency(Number(a.valor))}</p>
                  <p className="text-xs text-yellow-600 font-medium">
                    Vence {formatDate(a.data_vencimento)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
