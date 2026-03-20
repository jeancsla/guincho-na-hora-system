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

  // Fetch veiculos
  let query = supabase.from("veiculos").select("*").order("modelo");
  if (search) query = query.ilike("modelo", `%${search}%`);
  const { data: veiculos, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate atendimentos per veiculo (veiculo_id = motorista's vehicle used)
  const { data: atendStats, error: statsError } = await supabase
    .from("atendimentos")
    .select("veiculo_id, motorista_id, valor, data, status_pagamento, motorista:motoristas(id, nome)");

  if (statsError) return NextResponse.json({ error: statsError.message }, { status: 500 });

  type StatMap = Record<
    string,
    {
      total_atendimentos: number;
      valor_total: number;
      valor_pendente: number;
      valor_pago: number;
      ultimo_atendimento: string | null;
      motoristas: Set<string>;
    }
  >;

  const statMap: StatMap = {};
  for (const row of atendStats ?? []) {
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
    const v = Number(row.valor ?? 0);
    const entry = statMap[row.veiculo_id];
    if (row.status_pagamento !== "cancelado") {
      entry.total_atendimentos += 1;
      entry.valor_total += v;
      if (row.status_pagamento === "pago") entry.valor_pago += v;
      else entry.valor_pendente += v;
    }
    if (!entry.ultimo_atendimento || row.data > entry.ultimo_atendimento) {
      entry.ultimo_atendimento = row.data;
    }
    // Track which motoristas used this vehicle
    const motorista = (row.motorista as unknown) as { id: string; nome: string } | null;
    if (motorista?.nome) entry.motoristas.add(motorista.nome);
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
