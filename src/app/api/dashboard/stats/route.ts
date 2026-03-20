import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";
import { z } from "zod";

const QuerySchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "mes must be YYYY-MM format")
    .optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { mes: mesParam } = parsed.data;

  let start: Date;
  let end: Date;
  if (mesParam) {
    const ref = parseISO(`${mesParam}-01`);
    start = startOfMonth(ref);
    end = endOfMonth(ref);
  } else {
    start = startOfMonth(new Date());
    end = endOfMonth(new Date());
  }

  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const d7 = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  // Start of the 12-month window for receitaMensal
  const inicio12Meses = format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd");

  // 4 concurrent queries instead of 15 sequential
  const [periodResult, twelveMonthResult, vencimentosResult, ultimosResult] = await Promise.all([
    // Period atendimentos (all statuses, with joins for top-10 aggregation)
    supabase
      .from("atendimentos")
      .select(
        "id, valor, status_pagamento, data_vencimento, cliente:clientes(id, nome), motorista:motoristas(id, nome), veiculo:veiculos(id, modelo), equipamento:equipamentos(id, tipo), numero_atendimento, data, local_retirada, local_entrega, equipamento_id, motorista_id, veiculo_id, cliente_id, numero_pedido, nota_fiscal, data_pagamento, metodo_pagamento, observacoes, created_at, updated_at, created_by, updated_by"
      )
      .gte("data", startStr)
      .lte("data", endStr),

    // Last 12 months lightweight — one query, aggregate in-memory
    supabase
      .from("atendimentos")
      .select("data, valor")
      .gte("data", inicio12Meses)
      .neq("status_pagamento", "cancelado"),

    // Upcoming vencimentos (next 7 days)
    supabase
      .from("atendimentos")
      .select("*, cliente:clientes(id, nome), motorista:motoristas(id, nome)")
      .eq("status_pagamento", "pendente")
      .gte("data_vencimento", today)
      .lte("data_vencimento", d7)
      .order("data_vencimento", { ascending: true })
      .limit(10),

    // Latest 10 atendimentos
    supabase
      .from("atendimentos")
      .select("*, cliente:clientes(id, nome), motorista:motoristas(id, nome)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (periodResult.error)
    return NextResponse.json({ error: periodResult.error.message }, { status: 500 });
  if (twelveMonthResult.error)
    return NextResponse.json({ error: twelveMonthResult.error.message }, { status: 500 });

  const all = periodResult.data ?? [];
  const nonCancelled = all.filter((a) => a.status_pagamento !== "cancelado");

  // KPIs
  const totalAtendimentos = nonCancelled.length;
  const receitaTotal = nonCancelled.reduce((s, a) => s + Number(a.valor), 0);
  const ticketMedio = totalAtendimentos > 0 ? receitaTotal / totalAtendimentos : 0;
  const totalAReceber = nonCancelled
    .filter((a) => a.status_pagamento === "pendente" || a.status_pagamento === "vencido")
    .reduce((s, a) => s + Number(a.valor), 0);
  const atendimentosVencidos = nonCancelled.filter(
    (a) =>
      a.status_pagamento === "pendente" && a.data_vencimento && a.data_vencimento < today
  ).length;

  // Top-10 clients
  const clienteMap = new Map<string, number>();
  nonCancelled.forEach((a) => {
    const nome = (a.cliente as { nome?: string } | null)?.nome ?? "Desconhecido";
    clienteMap.set(nome, (clienteMap.get(nome) ?? 0) + Number(a.valor));
  });
  const receitaPorCliente = Array.from(clienteMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Drivers
  const motoristaMap = new Map<string, number>();
  nonCancelled.forEach((a) => {
    const nome = (a.motorista as { nome?: string } | null)?.nome ?? "Desconhecido";
    motoristaMap.set(nome, (motoristaMap.get(nome) ?? 0) + Number(a.valor));
  });
  const receitaPorMotorista = Array.from(motoristaMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Receita mensal (in-memory from the single 12-month fetch)
  const monthBuckets: Record<string, number> = {};
  const months12 = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), 11 - i);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM/yy");
    monthBuckets[key] = 0;
    return { key, label };
  });

  for (const row of twelveMonthResult.data ?? []) {
    const key = (row.data as string).slice(0, 7); // YYYY-MM
    if (key in monthBuckets) monthBuckets[key] += Number(row.valor);
  }

  const receitaMensal = months12.map(({ key, label }) => ({ mes: label, valor: monthBuckets[key] }));

  // Status distribution
  const statusCounts = { pendente: 0, pago: 0, vencido: 0, cancelado: 0 };
  const statusValues = { pendente: 0, pago: 0, vencido: 0, cancelado: 0 };

  all.forEach((a) => {
    let status = a.status_pagamento as keyof typeof statusCounts;
    if (status === "pendente" && a.data_vencimento && a.data_vencimento < today) status = "vencido";
    if (status in statusCounts) {
      statusCounts[status] += 1;
      statusValues[status] += Number(a.valor);
    }
  });

  const distribuicaoStatus = (Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map(
    (s) => ({ status: s, total: statusCounts[s], valor: statusValues[s] })
  );

  return NextResponse.json({
    totalAtendimentos,
    receitaTotal,
    ticketMedio,
    totalAReceber,
    atendimentosVencidos,
    receitaPorCliente,
    receitaPorMotorista,
    receitaMensal,
    distribuicaoStatus,
    proximosVencimentos: vencimentosResult.data ?? [],
    ultimosAtendimentos: ultimosResult.data ?? [],
  });
}
