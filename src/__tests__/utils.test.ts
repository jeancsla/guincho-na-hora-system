import { formatCurrency, formatDate, formatDatetime, generateNumeroAtendimento } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });

  it("formats positive integer", () => {
    expect(formatCurrency(1000)).toBe("R$\u00a01.000,00");
  });

  it("formats decimal value", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("formats large value", () => {
    expect(formatCurrency(100000)).toBe("R$\u00a0100.000,00");
  });

  it("formats negative value", () => {
    expect(formatCurrency(-50)).toContain("-");
    expect(formatCurrency(-50)).toContain("50,00");
  });
});

describe("formatDate", () => {
  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns dash for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });

  it("returns dash for empty string", () => {
    expect(formatDate("")).toBe("-");
  });

  it("formats ISO date string", () => {
    expect(formatDate("2024-01-15")).toBe("15/01/2024");
  });

  it("formats Date object", () => {
    expect(formatDate(new Date("2024-06-30"))).toBe("30/06/2024");
  });

  it("returns dash for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDatetime", () => {
  it("returns dash for null", () => {
    expect(formatDatetime(null)).toBe("-");
  });

  it("returns dash for undefined", () => {
    expect(formatDatetime(undefined)).toBe("-");
  });

  it("formats ISO datetime string", () => {
    const result = formatDatetime("2024-01-15T10:30:00");
    expect(result).toContain("15/01/2024");
    expect(result).toContain("10:30");
  });
});

describe("generateNumeroAtendimento", () => {
  it("generates a string with format YYYYMMDD-NNN", () => {
    const result = generateNumeroAtendimento(0);
    expect(result).toMatch(/^\d{8}-\d{3}$/);
  });

  it("pads sequence number with leading zeros", () => {
    const result = generateNumeroAtendimento(0);
    const seq = result.split("-")[1];
    expect(seq).toBe("001");
  });

  it("increments sequence correctly", () => {
    const result = generateNumeroAtendimento(9);
    const seq = result.split("-")[1];
    expect(seq).toBe("010");
  });

  it("handles large count", () => {
    const result = generateNumeroAtendimento(99);
    const seq = result.split("-")[1];
    expect(seq).toBe("100");
  });
});
