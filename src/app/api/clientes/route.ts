import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: clientes, error: clientesError } = await supabase
    .from("clientes")
    .select("*")
    .eq("status", "ativo")
    .order("nome");

  if (clientesError) return NextResponse.json({ error: clientesError.message }, { status: 500 });

  // Aggregate atendimentos per cliente
  const { data: stats, error: statsError } = await supabase
    .from("atendimentos")
    .select("cliente_id, valor, data")
    .neq("status_pagamento", "cancelado");

  if (statsError) return NextResponse.json({ error: statsError.message }, { status: 500 });

  type StatMap = Record<string, { total_atendimentos: number; valor_total: number; ultimo_atendimento: string | null }>;

  const statMap: StatMap = {};
  for (const row of stats ?? []) {
    if (!row.cliente_id) continue;
    if (!statMap[row.cliente_id]) {
      statMap[row.cliente_id] = { total_atendimentos: 0, valor_total: 0, ultimo_atendimento: null };
    }
    statMap[row.cliente_id].total_atendimentos += 1;
    statMap[row.cliente_id].valor_total += Number(row.valor ?? 0);
    if (!statMap[row.cliente_id].ultimo_atendimento || row.data > statMap[row.cliente_id].ultimo_atendimento!) {
      statMap[row.cliente_id].ultimo_atendimento = row.data;
    }
  }

  const result = (clientes ?? []).map((c) => ({
    ...c,
    total_atendimentos: statMap[c.id]?.total_atendimentos ?? 0,
    valor_total: statMap[c.id]?.valor_total ?? 0,
    ultimo_atendimento: statMap[c.id]?.ultimo_atendimento ?? null,
  }));

  // Sort by valor_total descending
  result.sort((a, b) => b.valor_total - a.valor_total);

  return NextResponse.json(result);
}
