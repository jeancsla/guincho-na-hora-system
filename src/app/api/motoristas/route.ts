import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AtendimentoRow = {
  motorista_id: string | null;
  valor: number | null;
  data: string | null;
  status_pagamento: string | null;
};

async function fetchAllAtendimentos(supabase: Awaited<ReturnType<typeof createClient>>) {
  const PAGE = 1000;
  const all: AtendimentoRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("atendimentos")
      .select("motorista_id, valor, data, status_pagamento")
      .range(from, from + PAGE - 1);

    if (error) return { data: null, error: error.message };
    all.push(...(data as AtendimentoRow[]));
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

  let query = supabase
    .from("motoristas")
    .select("*, veiculo:veiculos(id, modelo, placa)")
    .order("nome");
  if (search) query = query.ilike("nome", `%${search}%`);
  const { data: motoristas, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: allStats, error: statsError } = await fetchAllAtendimentos(supabase);
  if (statsError) return NextResponse.json({ error: statsError }, { status: 500 });

  type StatEntry = {
    total_atendimentos: number;
    valor_total: number;
    valor_pendente: number;
    valor_pago: number;
    ultimo_atendimento: string | null;
  };

  const statMap: Record<string, StatEntry> = {};

  for (const row of allStats ?? []) {
    if (!row.motorista_id) continue;

    if (!statMap[row.motorista_id]) {
      statMap[row.motorista_id] = {
        total_atendimentos: 0,
        valor_total: 0,
        valor_pendente: 0,
        valor_pago: 0,
        ultimo_atendimento: null,
      };
    }

    const entry = statMap[row.motorista_id];
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
  }

  const result = (motoristas ?? []).map((m) => ({
    ...m,
    total_atendimentos: statMap[m.id]?.total_atendimentos ?? 0,
    valor_total: statMap[m.id]?.valor_total ?? 0,
    valor_pendente: statMap[m.id]?.valor_pendente ?? 0,
    valor_pago: statMap[m.id]?.valor_pago ?? 0,
    ultimo_atendimento: statMap[m.id]?.ultimo_atendimento ?? null,
  }));

  result.sort((a, b) => b.valor_total - a.valor_total);

  return NextResponse.json(result);
}
