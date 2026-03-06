import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { format, differenceInDays, parseISO, isValid } from "date-fns";

interface Props {
  dataVencimento: string | null | undefined;
  statusPagamento: string;
}

export function DueDateBadge({ dataVencimento, statusPagamento }: Props) {
  if (!dataVencimento || statusPagamento === "pago" || statusPagamento === "cancelado") {
    return dataVencimento ? (
      <span className="text-sm text-muted-foreground">{formatDate(dataVencimento)}</span>
    ) : (
      <span className="text-sm text-muted-foreground">—</span>
    );
  }

  const today = new Date();
  const due = parseISO(dataVencimento);
  if (!isValid(due)) return <span className="text-sm text-muted-foreground">—</span>;

  const diff = differenceInDays(due, today);

  if (diff < 0) {
    return (
      <Badge variant="error">
        Vencido há {Math.abs(diff)}d
      </Badge>
    );
  }
  if (diff <= 7) {
    return (
      <Badge variant="warning">
        Vence em {diff}d
      </Badge>
    );
  }
  return (
    <span className="text-sm text-muted-foreground">{formatDate(dataVencimento)}</span>
  );
}
