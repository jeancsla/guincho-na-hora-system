import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { atendimentoSchema } from "@/lib/validations/atendimento.schema";
import { format } from "date-fns";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? String(PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const clienteId = searchParams.get("cliente_id") ?? "";
  const motoristaId = searchParams.get("motorista_id") ?? "";
  const equipamentoId = searchParams.get("equipamento_id") ?? "";
  const statusPagamento = searchParams.get("status_pagamento") ?? "";
  const dataInicio = searchParams.get("data_inicio") ?? "";
  const dataFim = searchParams.get("data_fim") ?? "";
  const exportCsv = searchParams.get("export") === "csv";

  let query = supabase
    .from("atendimentos")
    .select(
      `*, cliente:clientes(id, nome), equipamento:equipamentos(id, tipo), motorista:motoristas(id, nome), veiculo:veiculos(id, modelo)`,
      { count: "exact" }
    );

  // Filters
  if (clienteId) query = query.eq("cliente_id", clienteId);
  if (motoristaId) query = query.eq("motorista_id", motoristaId);
  if (equipamentoId) query = query.eq("equipamento_id", equipamentoId);
  if (statusPagamento) query = query.eq("status_pagamento", statusPagamento);
  if (dataInicio) query = query.gte("data", dataInicio);
  if (dataFim) query = query.lte("data", dataFim);
  if (search) {
    query = query.or(
      `numero_atendimento.ilike.%${search}%,nota_fiscal.ilike.%${search}%,numero_pedido.ilike.%${search}%,observacoes.ilike.%${search}%`
    );
  }

  query = query.order("data", { ascending: false }).order("created_at", { ascending: false });

  if (exportCsv) {
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []).map((a) => [
      a.numero_atendimento,
      a.data,
      a.cliente?.nome ?? "",
      a.valor,
      a.local_retirada,
      a.local_entrega,
      a.equipamento?.tipo ?? "",
      a.motorista?.nome ?? "",
      a.veiculo?.modelo ?? "",
      a.numero_pedido ?? "",
      a.nota_fiscal ?? "",
      a.data_vencimento ?? "",
      a.status_pagamento,
      a.data_pagamento ?? "",
      a.metodo_pagamento ?? "",
      a.observacoes ?? "",
    ]);

    const header = [
      "Nº Atendimento",
      "Data",
      "Cliente",
      "Valor",
      "Local Retirada",
      "Local Entrega",
      "Equipamento",
      "Motorista",
      "Veículo",
      "Nº Pedido",
      "Nota Fiscal",
      "Vencimento",
      "Status Pagamento",
      "Data Pagamento",
      "Método Pagamento",
      "Observações",
    ];

    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="atendimentos-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  }

  // Paginated
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({
    data: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = atendimentoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Generate numero_atendimento
  const { count } = await supabase
    .from("atendimentos")
    .select("*", { count: "exact", head: true });

  const today = format(new Date(), "yyyyMMdd");
  const seq = String((count ?? 0) + 1).padStart(3, "0");
  const numero_atendimento = `${today}-${seq}`;

  const { data, error } = await supabase
    .from("atendimentos")
    .insert({ ...parsed.data, numero_atendimento, created_by: user.id })
    .select(`*, cliente:clientes(id, nome), equipamento:equipamentos(id, tipo), motorista:motoristas(id, nome), veiculo:veiculos(id, modelo)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("auditoria").insert({
    tabela: "atendimentos",
    registro_id: data.id,
    acao: "CREATE",
    dados_novos: data,
    usuario_id: user.id,
  });

  return NextResponse.json(data, { status: 201 });
}
