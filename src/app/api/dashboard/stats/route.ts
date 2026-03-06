import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mesParam = searchParams.get("mes"); // YYYY-MM

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

  // Fetch all atendimentos for the period (excluding cancelled)
  const { data: atendimentos, error } = await supabase
    .from("atendimentos")
    .select(
      `*, cliente:clientes(id, nome), motorista:motoristas(id, nome), equipamento:equipamentos(id, tipo), veiculo:veiculos(id, modelo)`
    )
    .gte("data", startStr)
    .lte("data", endStr)
    .neq("status_pagamento", "cancelado")
    .order("data", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = atendimentos ?? [];

  // KPIs
  const totalAtendimentos = all.length;
  const receitaTotal = all.reduce((sum, a) => sum + Number(a.valor), 0);
  const ticketMedio = totalAtendimentos > 0 ? receitaTotal / totalAtendimentos : 0;
  const totalAReceber = all
    .filter((a) => a.status_pagamento === "pendente" || a.status_pagamento === "vencido")
    .reduce((sum, a) => sum + Number(a.valor), 0);
  const atendimentosVencidos = all.filter(
    (a) =>
      a.status_pagamento === "pendente" &&
      a.data_vencimento &&
      a.data_vencimento < today
  ).length;

  // Receita por cliente (top 10)
  const clienteMap = new Map<string, number>();
  all.forEach((a) => {
    const nome = a.cliente?.nome ?? "Desconhecido";
    clienteMap.set(nome, (clienteMap.get(nome) ?? 0) + Number(a.valor));
  });
  const receitaPorCliente = Array.from(clienteMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Receita por motorista
  const motoristaMap = new Map<string, number>();
  all.forEach((a) => {
    const nome = a.motorista?.nome ?? "Desconhecido";
    motoristaMap.set(nome, (motoristaMap.get(nome) ?? 0) + Number(a.valor));
  });
  const receitaPorMotorista = Array.from(motoristaMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Receita mensal (últimos 12 meses)
  const mesesPromises = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), 11 - i);
    return { mes: format(d, "MMM/yy"), start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
  });

  const receitaMensal = await Promise.all(
    mesesPromises.map(async ({ mes, start: s, end: e }) => {
      const { data } = await supabase
        .from("atendimentos")
        .select("valor")
        .gte("data", s)
        .lte("data", e)
        .neq("status_pagamento", "cancelado");
      const valor = (data ?? []).reduce((sum, a) => sum + Number(a.valor), 0);
      return { mes, valor };
    })
  );

  // Distribuição de status
  const statusCounts = { pendente: 0, pago: 0, vencido: 0, cancelado: 0 };
  const statusValues = { pendente: 0, pago: 0, vencido: 0, cancelado: 0 };

  // Include cancelled for distribution
  const { data: allForStatus } = await supabase
    .from("atendimentos")
    .select("status_pagamento, valor, data_vencimento")
    .gte("data", startStr)
    .lte("data", endStr);

  (allForStatus ?? []).forEach((a) => {
    let status = a.status_pagamento as keyof typeof statusCounts;
    // Check if should be vencido
    if (status === "pendente" && a.data_vencimento && a.data_vencimento < today) {
      status = "vencido";
    }
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    statusValues[status] = (statusValues[status] ?? 0) + Number(a.valor);
  });

  const distribuicaoStatus = (Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map(
    (s) => ({ status: s, total: statusCounts[s], valor: statusValues[s] })
  );

  // Próximos vencimentos (7 dias)
  const { data: proximosVencimentos } = await supabase
    .from("atendimentos")
    .select(`*, cliente:clientes(id, nome), motorista:motoristas(id, nome)`)
    .eq("status_pagamento", "pendente")
    .gte("data_vencimento", today)
    .lte("data_vencimento", d7)
    .order("data_vencimento", { ascending: true })
    .limit(10);

  // Últimos atendimentos
  const { data: ultimosAtendimentos } = await supabase
    .from("atendimentos")
    .select(`*, cliente:clientes(id, nome), motorista:motoristas(id, nome)`)
    .order("created_at", { ascending: false })
    .limit(10);

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
    proximosVencimentos: proximosVencimentos ?? [],
    ultimosAtendimentos: ultimosAtendimentos ?? [],
  });
}
