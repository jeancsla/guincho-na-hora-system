import {
  buildYTD,
  buildMonthlyByVehicle,
  buildYearComparison,
  buildCollectionRate,
  buildTicketTrend,
  type RawRow,
} from "@/lib/dashboard/aggregations";

// Helper
function row(overrides: Partial<RawRow>): RawRow {
  return {
    veiculo_id: "v1",
    veiculo_label: "Scania R450 (ABC-1234)",
    valor: 1000,
    data: "2025-01-15",
    status_pagamento: "pago",
    data_vencimento: null,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
describe("buildYTD", () => {
  it("sums revenue up to today, ignoring future dates", () => {
    const rows: RawRow[] = [
      row({ valor: 500, data: "2025-01-10" }),
      row({ valor: 300, data: "2025-03-20" }), // after today
    ];
    const result = buildYTD(rows, "2025-02-01");
    expect(result.total).toBe(500);
    expect(result.atendimentos).toBe(1);
  });

  it("excludes cancelled rows", () => {
    const rows: RawRow[] = [
      row({ valor: 1000, status_pagamento: "cancelado" }),
      row({ valor: 400, status_pagamento: "pago" }),
    ];
    const result = buildYTD(rows, "2025-12-31");
    expect(result.total).toBe(400);
  });

  it("computes ticket médio correctly", () => {
    const rows: RawRow[] = [
      row({ valor: 200 }),
      row({ valor: 600 }),
    ];
    const result = buildYTD(rows, "2025-12-31");
    expect(result.ticketMedio).toBe(400);
  });

  it("groups revenue by vehicle", () => {
    const rows: RawRow[] = [
      row({ veiculo_id: "v1", veiculo_label: "Scania", valor: 800 }),
      row({ veiculo_id: "v2", veiculo_label: "Ford", valor: 200 }),
      row({ veiculo_id: "v1", veiculo_label: "Scania", valor: 200 }),
    ];
    const result = buildYTD(rows, "2025-12-31");
    expect(result.porVeiculo).toHaveLength(2);
    const scania = result.porVeiculo.find((v) => v.label === "Scania");
    expect(scania?.valor).toBe(1000);
    expect(scania?.atendimentos).toBe(2);
  });

  it("returns zeros when no rows", () => {
    const result = buildYTD([], "2025-12-31");
    expect(result.total).toBe(0);
    expect(result.atendimentos).toBe(0);
    expect(result.ticketMedio).toBe(0);
    expect(result.porVeiculo).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("buildMonthlyByVehicle", () => {
  it("returns 12 month slots", () => {
    const { mensal } = buildMonthlyByVehicle([], 2025);
    expect(mensal).toHaveLength(12);
    expect(mensal[0].mes).toBe("Jan");
    expect(mensal[11].mes).toBe("Dez");
  });

  it("tallies revenue per vehicle per month", () => {
    const rows: RawRow[] = [
      row({ veiculo_label: "Scania", valor: 1000, data: "2025-03-05" }),
      row({ veiculo_label: "Ford", valor: 500, data: "2025-03-10" }),
      row({ veiculo_label: "Scania", valor: 200, data: "2025-03-20" }),
    ];
    const { mensal, veiculos } = buildMonthlyByVehicle(rows, 2025);
    expect(veiculos).toContain("Scania");
    expect(veiculos).toContain("Ford");
    const mar = mensal[2]; // index 2 = March
    expect(mar["Scania"]).toBe(1200);
    expect(mar["Ford"]).toBe(500);
  });

  it("excludes cancelled rows", () => {
    const rows: RawRow[] = [
      row({ veiculo_label: "Scania", valor: 1000, data: "2025-01-01", status_pagamento: "cancelado" }),
    ];
    const { mensal } = buildMonthlyByVehicle(rows, 2025);
    expect(mensal[0]["Scania"]).toBeUndefined();
  });

  it("ignores rows from other years", () => {
    const rows: RawRow[] = [
      row({ veiculo_label: "Scania", valor: 999, data: "2024-06-01" }),
    ];
    const { veiculos } = buildMonthlyByVehicle(rows, 2025);
    expect(veiculos).toHaveLength(0);
  });

  it("sorts vehicles by total revenue descending", () => {
    const rows: RawRow[] = [
      row({ veiculo_label: "Ford", valor: 100, data: "2025-01-01" }),
      row({ veiculo_label: "Scania", valor: 900, data: "2025-01-01" }),
    ];
    const { veiculos } = buildMonthlyByVehicle(rows, 2025);
    expect(veiculos[0]).toBe("Scania");
    expect(veiculos[1]).toBe("Ford");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("buildYearComparison", () => {
  it("returns 12 comparison points", () => {
    const result = buildYearComparison([], []);
    expect(result).toHaveLength(12);
  });

  it("sums current vs previous year by month", () => {
    const thisYear: RawRow[] = [row({ valor: 1000, data: "2025-06-15" })];
    const lastYear: RawRow[] = [row({ valor: 700, data: "2024-06-10" })];
    const result = buildYearComparison(thisYear, lastYear);
    const june = result[5];
    expect(june.anoAtual).toBe(1000);
    expect(june.anoAnterior).toBe(700);
  });

  it("excludes cancelled from both years", () => {
    const thisYear: RawRow[] = [
      row({ valor: 500, data: "2025-01-01", status_pagamento: "cancelado" }),
    ];
    const result = buildYearComparison(thisYear, []);
    expect(result[0].anoAtual).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("buildCollectionRate", () => {
  it("computes taxa de cobrança correctly", () => {
    const rows: RawRow[] = [
      row({ valor: 600, status_pagamento: "pago" }),
      row({ valor: 300, status_pagamento: "pendente", data_vencimento: "2099-12-31" }),
      row({ valor: 100, status_pagamento: "vencido" }),
    ];
    const result = buildCollectionRate(rows, "2025-06-01");
    expect(result.pago).toBe(600);
    expect(result.pendente).toBe(300);
    expect(result.vencido).toBe(100);
    expect(result.total).toBe(1000);
    expect(result.taxaCobranca).toBeCloseTo(60, 1);
  });

  it("treats overdue pendente as vencido", () => {
    const rows: RawRow[] = [
      row({ valor: 200, status_pagamento: "pendente", data_vencimento: "2025-01-01" }),
    ];
    const result = buildCollectionRate(rows, "2025-06-01");
    expect(result.vencido).toBe(200);
    expect(result.pendente).toBe(0);
  });

  it("excludes cancelled", () => {
    const rows: RawRow[] = [
      row({ valor: 999, status_pagamento: "cancelado" }),
    ];
    const result = buildCollectionRate(rows, "2025-06-01");
    expect(result.total).toBe(0);
    expect(result.taxaCobranca).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("buildTicketTrend", () => {
  it("returns 12 monthly averages", () => {
    const result = buildTicketTrend([], 2025);
    expect(result).toHaveLength(12);
    expect(result.every((p) => p.valor === 0)).toBe(true);
  });

  it("computes average per month", () => {
    const rows: RawRow[] = [
      row({ valor: 200, data: "2025-02-05" }),
      row({ valor: 600, data: "2025-02-20" }),
    ];
    const result = buildTicketTrend(rows, 2025);
    expect(result[1].valor).toBe(400); // February = index 1
  });

  it("ignores other years", () => {
    const rows: RawRow[] = [row({ valor: 999, data: "2024-02-01" })];
    const result = buildTicketTrend(rows, 2025);
    expect(result[1].valor).toBe(0);
  });

  it("ignores cancelled", () => {
    const rows: RawRow[] = [
      row({ valor: 999, data: "2025-01-01", status_pagamento: "cancelado" }),
    ];
    const result = buildTicketTrend(rows, 2025);
    expect(result[0].valor).toBe(0);
  });
});
