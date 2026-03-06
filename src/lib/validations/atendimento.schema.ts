import { z } from "zod";

export const atendimentoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  cliente_id: z.string().uuid("Cliente inválido"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  local_retirada: z.string().min(1, "Local de retirada é obrigatório"),
  local_entrega: z.string().min(1, "Local de entrega é obrigatório"),
  equipamento_id: z.string().uuid("Equipamento inválido"),
  motorista_id: z.string().uuid("Motorista inválido"),
  veiculo_id: z.string().uuid("Veículo inválido"),
  numero_pedido: z.string().optional().nullable(),
  nota_fiscal: z.string().optional().nullable(),
  data_vencimento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  status_pagamento: z
    .enum(["pendente", "pago", "vencido", "cancelado"])
    .optional()
    .default("pendente"),
  data_pagamento: z.string().optional().nullable(),
  metodo_pagamento: z.string().optional().nullable(),
});

export const atendimentoUpdateSchema = atendimentoSchema.partial();

export const marcarPagoSchema = z.object({
  data_pagamento: z.string().min(1, "Data de pagamento é obrigatória"),
  metodo_pagamento: z.string().min(1, "Método de pagamento é obrigatório"),
});

export type AtendimentoInput = z.input<typeof atendimentoSchema>;
export type AtendimentoUpdateInput = z.input<typeof atendimentoUpdateSchema>;
export type MarcarPagoInput = z.infer<typeof marcarPagoSchema>;
