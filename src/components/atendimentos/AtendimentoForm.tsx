"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { atendimentoSchema, type AtendimentoInput } from "@/lib/validations/atendimento.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Motorista, Veiculo, Equipamento, Atendimento } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Props {
  atendimento?: Atendimento;
}

export function AtendimentoForm({ atendimento }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  const isEdit = !!atendimento;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AtendimentoInput>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: atendimento
      ? {
          data: atendimento.data,
          cliente_id: atendimento.cliente_id,
          valor: atendimento.valor,
          local_retirada: atendimento.local_retirada,
          local_entrega: atendimento.local_entrega,
          equipamento_id: atendimento.equipamento_id,
          motorista_id: atendimento.motorista_id,
          veiculo_id: atendimento.veiculo_id,
          numero_pedido: atendimento.numero_pedido ?? "",
          nota_fiscal: atendimento.nota_fiscal ?? "",
          data_vencimento: atendimento.data_vencimento ?? "",
          observacoes: atendimento.observacoes ?? "",
          status_pagamento: atendimento.status_pagamento,
        }
      : {
          data: format(new Date(), "yyyy-MM-dd"),
          status_pagamento: "pendente",
        },
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("motoristas").select("id, nome, veiculo_id").eq("status", "ativo").order("nome"),
      supabase.from("veiculos").select("id, modelo, placa").order("modelo"),
      supabase.from("equipamentos").select("id, tipo").order("tipo"),
    ]).then(([c, m, v, e]) => {
      setClientes((c.data ?? []) as Cliente[]);
      setMotoristas((m.data ?? []) as Motorista[]);
      setVeiculos((v.data ?? []) as Veiculo[]);
      setEquipamentos((e.data ?? []) as Equipamento[]);
    });
  }, []);

  // Auto-fill vehicle when driver changes
  function handleMotoristaChange(motoristaId: string) {
    setValue("motorista_id", motoristaId);
    const motorista = motoristas.find((m) => m.id === motoristaId);
    if (motorista?.veiculo_id) {
      setValue("veiculo_id", motorista.veiculo_id);
    }
  }

  async function onSubmit(values: AtendimentoInput) {
    setLoading(true);
    try {
      const url = isEdit ? `/api/atendimentos/${atendimento.id}` : "/api/atendimentos";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar atendimento");
        return;
      }

      toast.success(isEdit ? "Atendimento atualizado!" : "Atendimento criado!");
      router.push("/atendimentos");
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" {...register("data")} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Controller
              control={control}
              name="cliente_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              {...register("valor")}
            />
            {errors.valor && <p className="text-xs text-destructive">{String(errors.valor.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label>Equipamento *</Label>
            <Controller
              control={control}
              name="equipamento_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.equipamento_id && <p className="text-xs text-destructive">{errors.equipamento_id.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="local_retirada">Local de Retirada *</Label>
            <Input
              id="local_retirada"
              placeholder="Endereço de retirada"
              {...register("local_retirada")}
            />
            {errors.local_retirada && <p className="text-xs text-destructive">{errors.local_retirada.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="local_entrega">Local de Entrega *</Label>
            <Input
              id="local_entrega"
              placeholder="Endereço de entrega"
              {...register("local_entrega")}
            />
            {errors.local_entrega && <p className="text-xs text-destructive">{errors.local_entrega.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Motorista e Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motorista e Veículo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Motorista *</Label>
            <Controller
              control={control}
              name="motorista_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => handleMotoristaChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoristas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.motorista_id && <p className="text-xs text-destructive">{errors.motorista_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Veículo *</Label>
            <Controller
              control={control}
              name="veiculo_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.modelo}{v.placa ? ` · ${v.placa}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.veiculo_id && <p className="text-xs text-destructive">{errors.veiculo_id.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Dados Financeiros e Opcionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Opcionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_pedido">Número do Pedido</Label>
            <Input id="numero_pedido" placeholder="Nº pedido do cliente" {...register("numero_pedido")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
            <Input id="nota_fiscal" placeholder="Nº da NF" {...register("nota_fiscal")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Input id="data_vencimento" type="date" {...register("data_vencimento")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" placeholder="Observações adicionais..." rows={3} {...register("observacoes")} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEdit ? "Salvar Alterações" : "Criar Atendimento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/atendimentos")}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
