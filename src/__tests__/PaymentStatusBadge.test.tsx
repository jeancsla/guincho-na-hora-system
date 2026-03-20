import { render, screen } from "@testing-library/react";
import { PaymentStatusBadge } from "@/components/atendimentos/PaymentStatusBadge";

// Mock date so "vencido" checks are deterministic
const TODAY = "2024-06-15";
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(TODAY));
});
afterEach(() => jest.useRealTimers());

describe("PaymentStatusBadge", () => {
  it('renders "Pago" badge for pago status', () => {
    render(<PaymentStatusBadge status="pago" dataVencimento={null} />);
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it('renders "Pendente" badge for pendente status', () => {
    render(<PaymentStatusBadge status="pendente" dataVencimento="2024-12-31" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it('renders "Vencido" badge for vencido status', () => {
    render(<PaymentStatusBadge status="vencido" dataVencimento="2024-01-01" />);
    expect(screen.getByText("Vencido")).toBeInTheDocument();
  });

  it('renders "Cancelado" badge for cancelado status', () => {
    render(<PaymentStatusBadge status="cancelado" dataVencimento={null} />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("renders with null dataVencimento without crashing", () => {
    render(<PaymentStatusBadge status="pendente" dataVencimento={null} />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });
});
