import { Badge } from "@/components/ui/badge";
import type { StatusPagamento } from "@/types";
import { format } from "date-fns";

interface Props {
  status: StatusPagamento;
  dataVencimento?: string | null;
}

export function PaymentStatusBadge({ status, dataVencimento }: Props) {
  // Check if should be displayed as vencido
  const today = format(new Date(), "yyyy-MM-dd");
  const isVencido =
    status === "pendente" && dataVencimento && dataVencimento < today;

  const effectiveStatus = isVencido ? "vencido" : status;

  const config = {
    pago: { label: "Pago", variant: "success" as const },
    pendente: { label: "Pendente", variant: "warning" as const },
    vencido: { label: "Vencido", variant: "error" as const },
    cancelado: { label: "Cancelado", variant: "muted" as const },
  };

  const { label, variant } = config[effectiveStatus] ?? config.pendente;

  return <Badge variant={variant}>{label}</Badge>;
}
