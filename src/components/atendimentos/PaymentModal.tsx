"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { marcarPagoSchema, type MarcarPagoInput } from "@/lib/validations/atendimento.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Atendimento } from "@/types";
import { format } from "date-fns";

interface Props {
  atendimento: Atendimento | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const METODOS = [
  "Pix",
  "Boleto",
  "Dinheiro",
  "Transferência",
  "Cheque",
  "Cartão de Crédito",
  "Cartão de Débito",
];

export function PaymentModal({ atendimento, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MarcarPagoInput>({
    resolver: zodResolver(marcarPagoSchema),
    defaultValues: {
      data_pagamento: format(new Date(), "yyyy-MM-dd"),
      metodo_pagamento: "",
    },
  });

  async function onSubmit(values: MarcarPagoInput) {
    if (!atendimento) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/atendimentos/${atendimento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_pagamento: "pago",
          data_pagamento: values.data_pagamento,
          metodo_pagamento: values.metodo_pagamento,
        }),
      });
      if (!res.ok) throw new Error("Erro ao marcar pagamento");
      toast.success("Pagamento registrado com sucesso!");
      reset();
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            {atendimento && (
              <span>
                Atendimento <strong>{atendimento.numero_atendimento}</strong> ·{" "}
                {atendimento.cliente?.nome} ·{" "}
                <strong>{formatCurrency(Number(atendimento.valor))}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
            <Input
              id="data_pagamento"
              type="date"
              {...register("data_pagamento")}
            />
            {errors.data_pagamento && (
              <p className="text-xs text-destructive">{errors.data_pagamento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pagamento">Método de Pagamento *</Label>
            <Select onValueChange={(v) => setValue("metodo_pagamento", v)} value={watch("metodo_pagamento")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.metodo_pagamento && (
              <p className="text-xs text-destructive">{errors.metodo_pagamento.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
