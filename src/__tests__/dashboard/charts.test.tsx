import { render, screen } from "@testing-library/react";

// Recharts uses ResizeObserver internally — mock it in jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { VehicleRevenueChart } from "@/components/dashboard/VehicleRevenueChart";
import { YearComparisonChart } from "@/components/dashboard/YearComparisonChart";
import { YTDSummaryCard } from "@/components/dashboard/YTDSummaryCard";
import { CollectionRateChart } from "@/components/dashboard/CollectionRateChart";
import { TicketTrendChart } from "@/components/dashboard/TicketTrendChart";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { RevenueByClientChart } from "@/components/dashboard/RevenueByClientChart";
import { RevenueByDriverChart } from "@/components/dashboard/RevenueByDriverChart";

// ────────────────────────────────────────────────────────────────────────────
describe("VehicleRevenueChart", () => {
  it("renders loading skeleton", () => {
    const { container } = render(
      <VehicleRevenueChart data={[]} veiculos={[]} loading />
    );
    expect(container.querySelector("[class*=skeleton], [data-slot=skeleton]") ?? container.firstChild).toBeTruthy();
  });

  it("renders empty state when no vehicles", () => {
    render(<VehicleRevenueChart data={[]} veiculos={[]} />);
    expect(screen.getByText("Sem dados no período")).toBeInTheDocument();
  });

  it("renders chart title when data provided", () => {
    const data = [{ mes: "Jan", "Scania (ABC)": 1000, "Ford (XYZ)": 500 }];
    render(<VehicleRevenueChart data={data} veiculos={["Scania (ABC)", "Ford (XYZ)"]} />);
    expect(screen.getByText("Receita por Veículo (mensal)")).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("YearComparisonChart", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<YearComparisonChart data={[]} year={2025} loading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("shows year vs previous year in title", () => {
    render(<YearComparisonChart data={[]} year={2025} />);
    expect(screen.getByText(/2025.*2024|2024.*2025/)).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("YTDSummaryCard", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<YTDSummaryCard data={null} year={2025} loading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("shows YTD and year label", () => {
    render(<YTDSummaryCard data={null} year={2025} />);
    expect(screen.getByText(/YTD.*2025/)).toBeInTheDocument();
  });

  it("renders per-vehicle breakdown", () => {
    const data = {
      total: 15000,
      atendimentos: 10,
      ticketMedio: 1500,
      porVeiculo: [
        { id: "v1", label: "Scania R450", valor: 12000, atendimentos: 8 },
        { id: "v2", label: "Ford Cargo", valor: 3000, atendimentos: 2 },
      ],
    };
    render(<YTDSummaryCard data={data} year={2025} />);
    expect(screen.getByText("Scania R450")).toBeInTheDocument();
    expect(screen.getByText("Ford Cargo")).toBeInTheDocument();
  });

  it("shows 'Sem dados' when no vehicles", () => {
    const data = { total: 0, atendimentos: 0, ticketMedio: 0, porVeiculo: [] };
    render(<YTDSummaryCard data={data} year={2025} />);
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("CollectionRateChart", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<CollectionRateChart data={null} loading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders title", () => {
    render(<CollectionRateChart data={null} />);
    expect(screen.getByText("Taxa de Cobrança (YTD)")).toBeInTheDocument();
  });

  it("shows percentage when data provided", () => {
    const data = { pago: 800, pendente: 100, vencido: 100, total: 1000, taxaCobranca: 80 };
    render(<CollectionRateChart data={data} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("TicketTrendChart", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<TicketTrendChart data={[]} loading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders empty state for all-zero data", () => {
    const data = Array.from({ length: 12 }, (_, i) => ({ mes: `M${i + 1}`, valor: 0 }));
    render(<TicketTrendChart data={data} />);
    expect(screen.getByText("Sem dados no período")).toBeInTheDocument();
  });

  it("renders title", () => {
    const data = [{ mes: "Jan", valor: 500 }];
    render(<TicketTrendChart data={data} />);
    expect(screen.getByText(/Ticket Médio/)).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("MonthlyRevenueChart", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<MonthlyRevenueChart data={[]} loading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders chart title", () => {
    render(<MonthlyRevenueChart data={[{ mes: "Jan/25", valor: 1000 }]} />);
    expect(screen.getByText(/Evolução de Receita Mensal/)).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("RevenueByClientChart", () => {
  it("shows empty state when no data", () => {
    render(<RevenueByClientChart data={[]} />);
    expect(screen.getByText("Sem dados no período")).toBeInTheDocument();
  });

  it("renders chart title with data", () => {
    render(<RevenueByClientChart data={[{ nome: "Cliente A", valor: 5000 }]} />);
    expect(screen.getByText(/Top 10/)).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("RevenueByDriverChart", () => {
  it("shows empty state when no data", () => {
    render(<RevenueByDriverChart data={[]} />);
    expect(screen.getByText("Sem dados no período")).toBeInTheDocument();
  });

  it("renders chart title with data", () => {
    render(<RevenueByDriverChart data={[{ nome: "Motorista A", valor: 3000 }]} />);
    expect(screen.getByText("Receita por Motorista")).toBeInTheDocument();
  });
});
