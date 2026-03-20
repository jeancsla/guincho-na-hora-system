import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AtendimentoRow = {
  veiculo_id: string | null;
  valor: number | null;
  data: string | null;
  status_pagamento: string | null;
  motorista: { id: string; nome: string } | null;
};

async function fetchAllAtendimentos(supabase: Awaited<ReturnType<typeof createClient>>) {
  const PAGE = 1000;
  const all: AtendimentoRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("atendimentos")
      .select("veiculo_id, valor, data, status_pagamento, motorista:motoristas(id, nome)")
      .range(from, from + PAGE - 1);

    if (error) return { data: null, error: error.message };
    all.push(
      ...(data as unknown as AtendimentoRow[])
    );
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  return { data: all, error: null };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  let query = supabase.from("veiculos").select("*").order("modelo");
  if (search) query = query.ilike("modelo", `%${search}%`);
  const { data: veiculos, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: allStats, error: statsError } = await fetchAllAtendimentos(supabase);
  if (statsError) return NextResponse.json({ error: statsError }, { status: 500 });

  type StatEntry = {
    total_atendimentos: number;
    valor_total: number;
    valor_pendente: number;
    valor_pago: number;
    ultimo_atendimento: string | null;
    motoristas: Set<string>;
  };

  const statMap: Record<string, StatEntry> = {};

  for (const row of allStats ?? []) {
    if (!row.veiculo_id) continue;

    if (!statMap[row.veiculo_id]) {
      statMap[row.veiculo_id] = {
        total_atendimentos: 0,
        valor_total: 0,
        valor_pendente: 0,
        valor_pago: 0,
        ultimo_atendimento: null,
        motoristas: new Set(),
      };
    }

    const entry = statMap[row.veiculo_id];
    const v = Number(row.valor ?? 0);

    if (row.status_pagamento !== "cancelado") {
      entry.total_atendimentos += 1;
      entry.valor_total += v;
      if (row.status_pagamento === "pago") entry.valor_pago += v;
      else entry.valor_pendente += v;
    }

    if (row.data && (!entry.ultimo_atendimento || row.data > entry.ultimo_atendimento)) {
      entry.ultimo_atendimento = row.data;
    }

    if (row.motorista?.nome) entry.motoristas.add(row.motorista.nome);
  }

  const result = (veiculos ?? []).map((v) => ({
    ...v,
    total_atendimentos: statMap[v.id]?.total_atendimentos ?? 0,
    valor_total: statMap[v.id]?.valor_total ?? 0,
    valor_pendente: statMap[v.id]?.valor_pendente ?? 0,
    valor_pago: statMap[v.id]?.valor_pago ?? 0,
    ultimo_atendimento: statMap[v.id]?.ultimo_atendimento ?? null,
    motoristas: Array.from(statMap[v.id]?.motoristas ?? []),
  }));

  result.sort((a, b) => b.valor_total - a.valor_total);

  return NextResponse.json(result);
}
