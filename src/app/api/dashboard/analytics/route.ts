import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { z } from "zod";
import {
  buildYTD,
  buildMonthlyByVehicle,
  buildYearComparison,
  buildCollectionRate,
  buildTicketTrend,
  type RawRow,
} from "@/lib/dashboard/aggregations";

const QuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "year must be 4-digit YYYY")
    .optional()
    .transform((v) => (v ? Number(v) : new Date().getFullYear())),
});

/** Paginate through all rows for a given year range. */
async function fetchYearRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startDate: string,
  endDate: string
): Promise<RawRow[]> {
  const PAGE = 1000;
  const all: RawRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("atendimentos")
      .select(
        "veiculo_id, valor, data, status_pagamento, data_vencimento, veiculo:veiculos(modelo, placa)"
      )
      .gte("data", startDate)
      .lte("data", endDate)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);

    const mapped: RawRow[] = (data ?? []).map((r) => {
      const v = r.veiculo as { modelo?: string; placa?: string } | null;
      const modelo = v?.modelo ?? "";
      const placa = v?.placa ? ` (${v.placa})` : "";
      return {
        veiculo_id: r.veiculo_id as string | null,
        veiculo_label: modelo ? `${modelo}${placa}` : "Sem veículo",
        valor: Number(r.valor ?? 0),
        data: r.data as string,
        status_pagamento: r.status_pagamento as string,
        data_vencimento: r.data_vencimento as string | null,
      };
    });

    all.push(...mapped);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

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

  const { year } = parsed.data;
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const thisYearStart = `${year}-01-01`;
  const thisYearEnd = `${year}-12-31`;
  const lastYearStart = `${year - 1}-01-01`;
  const lastYearEnd = `${year - 1}-12-31`;

  // Fetch current and previous year concurrently
  const [thisYearRows, lastYearRows] = await Promise.all([
    fetchYearRows(supabase, thisYearStart, thisYearEnd),
    fetchYearRows(supabase, lastYearStart, lastYearEnd),
  ]);

  const ytd = buildYTD(thisYearRows, todayStr);
  const { veiculos, mensal: receitaMensalPorVeiculo } = buildMonthlyByVehicle(thisYearRows, year);
  const comparacaoAnual = buildYearComparison(thisYearRows, lastYearRows);
  const taxaCobranca = buildCollectionRate(thisYearRows, todayStr);
  const ticketMedioMensal = buildTicketTrend(thisYearRows, year);

  return NextResponse.json({
    ytd,
    veiculos,
    receitaMensalPorVeiculo,
    comparacaoAnual,
    taxaCobranca,
    ticketMedioMensal,
  });
}
