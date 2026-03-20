/**
 * Pure aggregation helpers for the dashboard analytics API.
 * Kept separate so they can be unit-tested without any HTTP or Supabase mocking.
 */

export interface RawRow {
  veiculo_id: string | null;
  veiculo_label: string; // "Modelo (PLACA)"
  valor: number;
  data: string; // YYYY-MM-DD
  status_pagamento: string;
  data_vencimento: string | null;
}

export interface VehicleYTD {
  id: string;
  label: string;
  valor: number;
  atendimentos: number;
}

export interface YTDResult {
  total: number;
  atendimentos: number;
  ticketMedio: number;
  porVeiculo: VehicleYTD[];
}

export interface MonthlyVehiclePoint {
  mes: string;
  [veiculoLabel: string]: number | string;
}

export interface YearComparisonPoint {
  mes: string;
  anoAtual: number;
  anoAnterior: number;
}

export interface CollectionRate {
  pago: number;
  pendente: number;
  vencido: number;
  total: number;
  taxaCobranca: number; // pago / total * 100
}

export interface TicketMedioPoint {
  mes: string;
  valor: number;
}

// ---------------------------------------------------------------------------

/** Compute YTD totals up to (and including) todayStr from rows that already
 *  belong to the current year and are not cancelled. */
export function buildYTD(rows: RawRow[], todayStr: string): YTDResult {
  const relevant = rows.filter((r) => r.data <= todayStr && r.status_pagamento !== "cancelado");

  const vehicleMap = new Map<string, { id: string; label: string; valor: number; count: number }>();
  let total = 0;

  for (const row of relevant) {
    total += row.valor;
    const id = row.veiculo_id ?? "__none__";
    const label = row.veiculo_label || "Sem veículo";
    if (!vehicleMap.has(id)) vehicleMap.set(id, { id, label, valor: 0, count: 0 });
    const entry = vehicleMap.get(id)!;
    entry.valor += row.valor;
    entry.count += 1;
  }

  const atendimentos = relevant.length;
  const ticketMedio = atendimentos > 0 ? total / atendimentos : 0;
  const porVeiculo = Array.from(vehicleMap.values())
    .map((v) => ({ id: v.id, label: v.label, valor: v.valor, atendimentos: v.count }))
    .sort((a, b) => b.valor - a.valor);

  return { total, atendimentos, ticketMedio, porVeiculo };
}

/** Build month-by-vehicle matrix for a recharts grouped bar chart.
 *  Returns:
 *  - `veiculos`: ordered list of vehicle labels (sorted by total revenue desc)
 *  - `mensal`: array of 12 month points, each with vehicle label keys
 */
export function buildMonthlyByVehicle(
  rows: RawRow[],
  year: number
): { veiculos: string[]; mensal: MonthlyVehiclePoint[] } {
  const MONTH_LABELS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  // Initialize 12 month slots
  const matrix: Record<number, Record<string, number>> = {};
  for (let m = 1; m <= 12; m++) matrix[m] = {};

  // Tally by vehicle + month
  const vehicleTotals = new Map<string, number>();

  for (const row of rows) {
    if (row.status_pagamento === "cancelado") continue;
    const rowYear = Number(row.data.slice(0, 4));
    if (rowYear !== year) continue;
    const month = Number(row.data.slice(5, 7));
    const label = row.veiculo_label || "Sem veículo";
    matrix[month][label] = (matrix[month][label] ?? 0) + row.valor;
    vehicleTotals.set(label, (vehicleTotals.get(label) ?? 0) + row.valor);
  }

  const veiculos = Array.from(vehicleTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  const mensal: MonthlyVehiclePoint[] = MONTH_LABELS.map((mes, i) => {
    const month = i + 1;
    const point: MonthlyVehiclePoint = { mes };
    for (const label of veiculos) point[label] = matrix[month][label] ?? 0;
    return point;
  });

  return { veiculos, mensal };
}

/** Build year-over-year comparison using two sets of rows (current/previous year). */
export function buildYearComparison(
  thisYearRows: RawRow[],
  lastYearRows: RawRow[]
): YearComparisonPoint[] {
  const MONTH_LABELS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const sum = (rows: RawRow[], month: number): number =>
    rows
      .filter((r) => r.status_pagamento !== "cancelado" && Number(r.data.slice(5, 7)) === month)
      .reduce((s, r) => s + r.valor, 0);

  return MONTH_LABELS.map((mes, i) => ({
    mes,
    anoAtual: sum(thisYearRows, i + 1),
    anoAnterior: sum(lastYearRows, i + 1),
  }));
}

/** Compute collection rate from a set of rows (any date range). */
export function buildCollectionRate(rows: RawRow[], todayStr: string): CollectionRate {
  let pago = 0;
  let pendente = 0;
  let vencido = 0;

  for (const row of rows) {
    if (row.status_pagamento === "cancelado") continue;
    const v = row.valor;
    if (row.status_pagamento === "pago") {
      pago += v;
    } else if (
      row.status_pagamento === "vencido" ||
      (row.status_pagamento === "pendente" && row.data_vencimento && row.data_vencimento < todayStr)
    ) {
      vencido += v;
    } else {
      pendente += v;
    }
  }

  const total = pago + pendente + vencido;
  const taxaCobranca = total > 0 ? (pago / total) * 100 : 0;
  return { pago, pendente, vencido, total, taxaCobranca };
}

/** Compute average ticket per month for a given year. */
export function buildTicketTrend(rows: RawRow[], year: number): TicketMedioPoint[] {
  const MONTH_LABELS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const byMonth: Record<number, { total: number; count: number }> = {};
  for (let m = 1; m <= 12; m++) byMonth[m] = { total: 0, count: 0 };

  for (const row of rows) {
    if (row.status_pagamento === "cancelado") continue;
    if (Number(row.data.slice(0, 4)) !== year) continue;
    const month = Number(row.data.slice(5, 7));
    byMonth[month].total += row.valor;
    byMonth[month].count += 1;
  }

  return MONTH_LABELS.map((mes, i) => {
    const { total, count } = byMonth[i + 1];
    return { mes, valor: count > 0 ? total / count : 0 };
  });
}
