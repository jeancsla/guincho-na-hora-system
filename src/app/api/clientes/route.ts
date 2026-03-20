import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AtendimentoRow = {
  cliente_id: string | null;
  valor: number | null;
  data: string | null;
  status_pagamento: string | null;
};

/** Supabase caps at 1000 rows by default — paginate to get all records. */
async function fetchAllAtendimentos(supabase: Awaited<ReturnType<typeof createClient>>) {
  const PAGE = 1000;
  const all: AtendimentoRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("atendimentos")
      .select("cliente_id, valor, data, status_pagamento")
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
  const sortBy = searchParams.get("sort") ?? "valor_total";
  const sortDir = searchParams.get("dir") ?? "desc";

  // Fetch all clients
  let query = supabase.from("clientes").select("*").order("nome");
  if (search) query = query.ilike("nome", `%${search}%`);
  const { data: clientes, error: clientesError } = await query;

  if (clientesError) return NextResponse.json({ error: clientesError.message }, { status: 500 });

  // Paginate through ALL atendimentos to avoid the 1000-row cap
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

    const entry = statMap[row.cliente_id];
    const v = Number(row.valor ?? 0);

    if (row.status_pagamento !== "cancelado") {
      entry.total_atendimentos += 1;
      entry.valor_total += v;
      if (row.status_pagamento === "pago") entry.valor_pago += v;
      else entry.valor_pendente += v;
    }

    // Track latest service date (data column = date of the service)
    if (row.data && (!entry.ultimo_atendimento || row.data > entry.ultimo_atendimento)) {
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
