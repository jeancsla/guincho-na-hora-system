/**
 * Unit tests for the CSV import parsing logic extracted from /api/importar/route.ts
 * Tests the pure functions used to normalize data from the historical CSV.
 */

// ── Pure parser functions (extracted for testing) ─────────────────────────────

import { format, parse, isValid } from "date-fns";

function parseDate(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  const formats = ["dd/MM/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "d/M/yyyy"];
  for (const fmt of formats) {
    try {
      const d = parse(s, fmt, new Date());
      if (isValid(d)) return format(d, "yyyy-MM-dd");
    } catch { /* continue */ }
  }
  return null;
}

function parseValor(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function normalizeNome(nome: string | undefined): string {
  return (nome ?? "").trim().replace(/\s+/g, " ");
}

function parseBoolean(raw: string | undefined): boolean {
  if (!raw) return false;
  const s = raw.trim().toLowerCase();
  return ["sim", "yes", "1", "true", "pago", "s"].includes(s);
}

function parseForma(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim().toLowerCase();
  if (s.includes("pix")) return "Pix";
  if (s.includes("boleto")) return "Boleto";
  if (s.includes("dinheiro")) return "Dinheiro";
  if (s.includes("transferência") || s.includes("transferencia")) return "Transferência";
  if (s.includes("cheque")) return "Cheque";
  if (s.includes("crédito") || s.includes("credito")) return "Cartão de Crédito";
  if (s.includes("débito") || s.includes("debito")) return "Cartão de Débito";
  return raw.trim();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("parseDate", () => {
  it("parses dd/MM/yyyy format", () => {
    expect(parseDate("25/03/2024")).toBe("2024-03-25");
  });

  it("parses yyyy-MM-dd format", () => {
    expect(parseDate("2024-03-25")).toBe("2024-03-25");
  });

  it("parses d/M/yyyy with single digit day/month", () => {
    expect(parseDate("5/3/2024")).toBe("2024-03-05");
  });

  it("parses dd-MM-yyyy format", () => {
    expect(parseDate("25-03-2024")).toBe("2024-03-25");
  });

  it("returns null for empty string", () => {
    expect(parseDate("")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseDate(undefined)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseDate("  25/03/2024  ")).toBe("2024-03-25");
  });
});

describe("parseValor", () => {
  it("parses plain number", () => {
    expect(parseValor("1500")).toBe(1500);
  });

  it("parses Brazilian currency with comma decimal", () => {
    expect(parseValor("1.500,00")).toBe(1500);
  });

  it("strips R$ prefix", () => {
    expect(parseValor("R$ 500,00")).toBe(500);
  });

  it("strips R$ prefix without space", () => {
    expect(parseValor("R$500,00")).toBe(500);
  });

  it("handles decimal with comma", () => {
    expect(parseValor("1234,56")).toBe(1234.56);
  });

  it("returns null for empty", () => {
    expect(parseValor("")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseValor(undefined)).toBeNull();
  });

  it("returns null for non-numeric", () => {
    expect(parseValor("abc")).toBeNull();
  });

  it("parses zero", () => {
    expect(parseValor("0")).toBe(0);
  });
});

describe("normalizeNome", () => {
  it("trims whitespace", () => {
    expect(normalizeNome("  CAE  ")).toBe("CAE");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeNome("CAE   Sistemas")).toBe("CAE Sistemas");
  });

  it("returns empty string for undefined", () => {
    expect(normalizeNome(undefined)).toBe("");
  });

  it("preserves case", () => {
    expect(normalizeNome("cae")).toBe("cae");
    expect(normalizeNome("CAE")).toBe("CAE");
  });
});

describe("parseBoolean", () => {
  it.each(["sim", "yes", "1", "true", "pago", "s"])(
    "returns true for '%s'",
    (val) => expect(parseBoolean(val)).toBe(true)
  );

  it.each(["não", "no", "0", "false", "pendente", ""])(
    "returns false for '%s'",
    (val) => expect(parseBoolean(val)).toBe(false)
  );

  it("is case-insensitive", () => {
    expect(parseBoolean("SIM")).toBe(true);
    expect(parseBoolean("Pago")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(parseBoolean(undefined)).toBe(false);
  });
});

describe("parseForma", () => {
  it("detects Pix", () => expect(parseForma("pix")).toBe("Pix"));
  it("detects PIX uppercase", () => expect(parseForma("PIX")).toBe("Pix"));
  it("detects Boleto", () => expect(parseForma("boleto bancário")).toBe("Boleto"));
  it("detects Dinheiro", () => expect(parseForma("dinheiro")).toBe("Dinheiro"));
  it("detects Transferência", () => expect(parseForma("transferência")).toBe("Transferência"));
  it("detects Transferencia without accent", () => expect(parseForma("transferencia")).toBe("Transferência"));
  it("detects Cheque", () => expect(parseForma("cheque")).toBe("Cheque"));
  it("detects Cartão de Crédito", () => expect(parseForma("cartão de crédito")).toBe("Cartão de Crédito"));
  it("detects credito without accent", () => expect(parseForma("credito")).toBe("Cartão de Crédito"));
  it("detects Cartão de Débito", () => expect(parseForma("débito")).toBe("Cartão de Débito"));
  it("returns original for unknown", () => expect(parseForma("Bitcoin")).toBe("Bitcoin"));
  it("returns null for empty", () => expect(parseForma("")).toBeNull());
  it("returns null for undefined", () => expect(parseForma(undefined)).toBeNull());
});
