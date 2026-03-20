import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sort") ?? "valor_total";
  const sortDir = searchParams.get("dir") ?? "desc";

  // Fetch all clients (no status filter — show all)
  let query = supabase.from("clientes").select("*").order("nome");
  if (search) query = query.ilike("nome", `%${search}%`);
  const { data: clientes, error: clientesError } = await query;

  if (clientesError) return NextResponse.json({ error: clientesError.message }, { status: 500 });

  // Aggregate atendimentos per cliente (all statuses for full count)
  const { data: allStats, error: statsError } = await supabase
    .from("atendimentos")
    .select("cliente_id, valor, data, status_pagamento");

  if (statsError) return NextResponse.json({ error: statsError.message }, { status: 500 });

  type StatMap = Record<
    string,
    {
      total_atendimentos: number;
      valor_total: number;
      valor_pendente: number;
      valor_pago: number;
      ultimo_atendimento: string | null;
    }
  >;

  const statMap: StatMap = {};
  for (const row of allStats ?? []) {
    if (!row.cliente_id) continue;
    if (!statMap[row.cliente_id]) {
      statMap[row.cliente_id] = {
        total_atendimentos: 0,
        valor_total: 0,
        valor_pendente: 0,
        valor_pago: 0,
        ultimo_atendimento: null,
      };
    }
    const v = Number(row.valor ?? 0);
    const entry = statMap[row.cliente_id];
    // Count all non-cancelled
    if (row.status_pagamento !== "cancelado") {
      entry.total_atendimentos += 1;
      entry.valor_total += v;
      if (row.status_pagamento === "pago") entry.valor_pago += v;
      else entry.valor_pendente += v;
    }
    if (!entry.ultimo_atendimento || row.data > entry.ultimo_atendimento) {
      entry.ultimo_atendimento = row.data;
    }
  }

  const result = (clientes ?? []).map((c) => ({
    ...c,
    total_atendimentos: statMap[c.id]?.total_atendimentos ?? 0,
    valor_total: statMap[c.id]?.valor_total ?? 0,
    valor_pendente: statMap[c.id]?.valor_pendente ?? 0,
    valor_pago: statMap[c.id]?.valor_pago ?? 0,
    ultimo_atendimento: statMap[c.id]?.ultimo_atendimento ?? null,
  }));

  // Sort
  result.sort((a, b) => {
    const key = sortBy as keyof typeof a;
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    const cmp =
      typeof aVal === "string" && typeof bVal === "string"
        ? aVal.localeCompare(bVal)
        : Number(aVal) - Number(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return NextResponse.json(result);
}
