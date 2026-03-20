import type { Atendimento } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMPRESA = {
  nome: "Guincho Na Hora",
  cnpj: "24.436.315/0001-44",
  telefone: "(12) 9 9999-0000",
  cidade: "São José dos Campos — SP",
};

const ACCENT = [232, 122, 32] as [number, number, number]; // #E87A20
const DARK = [15, 15, 15] as [number, number, number];
const MUTED = [136, 136, 136] as [number, number, number];

export async function generateRecibo(atendimento: Atendimento): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header background ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setTextColor(245, 245, 245);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(EMPRESA.nome, 14, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(170, 170, 170);
  doc.text(`CNPJ ${EMPRESA.cnpj}  ·  ${EMPRESA.telefone}  ·  ${EMPRESA.cidade}`, 14, 23);

  // "RECIBO DE SERVIÇO" label on the right
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text("RECIBO DE SERVIÇO", pageW - 14, 16, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(170, 170, 170);
  doc.text(atendimento.numero_atendimento, pageW - 14, 23, { align: "right" });

  y = 50;

  // ── Helper functions ────────────────────────────────────────────────
  const sectionTitle = (title: string) => {
    doc.setFillColor(...ACCENT);
    doc.rect(14, y - 1, pageW - 28, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 16, y + 3);
    y += 10;
  };

  const row = (label: string, value: string, half = false, rightCol = false) => {
    const x = rightCol ? pageW / 2 + 2 : 14;
    const maxWidth = half ? pageW / 2 - 18 : pageW - 28;
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(value || "—", x, y + 5);
    if (!half || rightCol) y += 14;
  };

  const rowPair = (
    labelA: string, valueA: string,
    labelB: string, valueB: string
  ) => {
    row(labelA, valueA, true, false);
    row(labelB, valueB, true, true);
  };

  // ── Dados do Serviço ────────────────────────────────────────────────
  sectionTitle("Dados do Serviço");

  rowPair(
    "Data do Atendimento", formatDate(atendimento.data),
    "Número do Atendimento", atendimento.numero_atendimento
  );

  row("Cliente", atendimento.cliente?.nome ?? "—");
  row("Equipamento Transportado", atendimento.equipamento?.tipo ?? "—");

  rowPair(
    "Local de Retirada", atendimento.local_retirada,
    "Local de Entrega", atendimento.local_entrega
  );

  rowPair(
    "Motorista", atendimento.motorista?.nome ?? "—",
    "Veículo Utilizado",
    atendimento.veiculo
      ? `${atendimento.veiculo.modelo}${atendimento.veiculo.placa ? ` · ${atendimento.veiculo.placa}` : ""}`
      : "—"
  );

  // ── Financeiro ──────────────────────────────────────────────────────
  y += 4;
  sectionTitle("Financeiro");

  const statusLabel: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    vencido: "Vencido",
    cancelado: "Cancelado",
  };

  rowPair(
    "Valor do Serviço", formatCurrency(Number(atendimento.valor)),
    "Status de Pagamento", statusLabel[atendimento.status_pagamento] ?? atendimento.status_pagamento
  );

  rowPair(
    "Forma de Pagamento", atendimento.metodo_pagamento ?? "—",
    "Data de Vencimento", formatDate(atendimento.data_vencimento)
  );

  if (atendimento.data_pagamento) {
    row("Data de Pagamento", formatDate(atendimento.data_pagamento));
  }

  // ── Documentos ──────────────────────────────────────────────────────
  if (atendimento.numero_pedido || atendimento.nota_fiscal) {
    y += 4;
    sectionTitle("Documentos");
    if (atendimento.numero_pedido) row("Número do Pedido", atendimento.numero_pedido);
    if (atendimento.nota_fiscal) row("Nota Fiscal", atendimento.nota_fiscal);
  }

  // ── Observações ──────────────────────────────────────────────────────
  if (atendimento.observacoes) {
    y += 4;
    sectionTitle("Observações");
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(atendimento.observacoes, pageW - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  }

  // ── Assinatura ──────────────────────────────────────────────────────
  const sigY = Math.max(y + 20, 230);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, sigY, 95, sigY);
  doc.line(115, sigY, pageW - 14, sigY);

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura do Cliente", 14, sigY + 5);
  doc.text("Assinatura Guincho Na Hora", 115, sigY + 5);

  // ── Footer ──────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(14, footerY - 4, pageW - 14, footerY - 4);

  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} — ${EMPRESA.nome} — CNPJ ${EMPRESA.cnpj}`,
    pageW / 2,
    footerY,
    { align: "center" }
  );

  doc.save(`recibo-${atendimento.numero_atendimento}.pdf`);
}
