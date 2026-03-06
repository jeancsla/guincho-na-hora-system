export type StatusPagamento = "pendente" | "pago" | "vencido" | "cancelado";
export type StatusGeral = "ativo" | "inativo";
export type StatusRecurso = "disponivel" | "em_uso" | "manutencao";

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  observacoes: string | null;
  status: StatusGeral;
  created_at: string;
  updated_at: string;
}

export interface Equipamento {
  id: string;
  tipo: string;
  descricao: string | null;
  status: StatusRecurso;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  modelo: string;
  placa: string | null;
  ano: number | null;
  capacidade_kg: number | null;
  status: StatusRecurso;
  created_at: string;
  updated_at: string;
}

export interface Motorista {
  id: string;
  nome: string;
  telefone: string | null;
  cnh: string | null;
  veiculo_id: string | null;
  status: StatusGeral;
  veiculo?: Veiculo;
  created_at: string;
  updated_at: string;
}

export interface Atendimento {
  id: string;
  numero_atendimento: string;
  data: string;
  cliente_id: string;
  valor: number;
  local_retirada: string;
  local_entrega: string;
  equipamento_id: string;
  motorista_id: string;
  veiculo_id: string;
  numero_pedido: string | null;
  nota_fiscal: string | null;
  data_vencimento: string | null;
  status_pagamento: StatusPagamento;
  data_pagamento: string | null;
  metodo_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Joined
  cliente?: Cliente;
  equipamento?: Equipamento;
  motorista?: Motorista;
  veiculo?: Veiculo;
}

export interface Auditoria {
  id: string;
  tabela: string;
  registro_id: string;
  acao: "CREATE" | "UPDATE" | "DELETE";
  dados_antes: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  usuario_id: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalAtendimentos: number;
  receitaTotal: number;
  ticketMedio: number;
  totalAReceber: number;
  atendimentosVencidos: number;
  receitaPorCliente: Array<{ nome: string; valor: number }>;
  receitaPorMotorista: Array<{ nome: string; valor: number }>;
  receitaMensal: Array<{ mes: string; valor: number }>;
  distribuicaoStatus: Array<{ status: StatusPagamento; total: number; valor: number }>;
  proximosVencimentos: Atendimento[];
  ultimosAtendimentos: Atendimento[];
}

export type MetodoPagamento =
  | "Pix"
  | "Boleto"
  | "Dinheiro"
  | "Transferência"
  | "Cheque"
  | "Cartão de Crédito"
  | "Cartão de Débito";
