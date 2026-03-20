import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, parse, isValid } from "date-fns";

interface CsvRow {
  data?: string;
  horario?: string;
  solicitante?: string;
  valor?: string;
  local_retirada?: string;
  local_entrega?: string;
  veiculo_eq?: string;
  motorista?: string;
  veiculo_utilizado?: string;
  numero_pedido?: string;
  nota_fiscal?: string;
  vencimento?: string;
  pago?: string;
  forma_pagamento?: string;
  observacao?: string;
  [key: string]: string | undefined;
}

interface ImportRequest {
  rows: CsvRow[];
}

function parseDate(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  // Try formats: dd/MM/yyyy, yyyy-MM-dd, dd-MM-yyyy
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
  // Remove R$, spaces, dots used as thousands, replace comma with dot
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
  if (s.includes("dinheiro") || s.includes("cash")) return "Dinheiro";
  if (s.includes("transferência") || s.includes("transferencia") || s.includes("ted") || s.includes("doc")) return "Transferência";
  if (s.includes("cheque")) return "Cheque";
  if (s.includes("crédito") || s.includes("credito")) return "Cartão de Crédito";
  if (s.includes("débito") || s.includes("debito")) return "Cartão de Débito";
  return raw.trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: ImportRequest = await request.json();
  const rows: CsvRow[] = body.rows ?? [];

  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, errors: [] });
  }

  // Cache lookups
  const clienteCache: Record<string, string> = {};
  const equipamentoCache: Record<string, string> = {};
  const motoristaCache: Record<string, string> = {};
  const veiculoCache: Record<string, string> = {};

  // Pre-fetch existing motoristas and veiculos (small tables)
  const { data: motoristas } = await supabase.from("motoristas").select("id, nome");
  const { data: veiculos } = await supabase.from("veiculos").select("id, modelo");
  for (const m of motoristas ?? []) motoristaCache[m.nome.toLowerCase()] = m.id;
  for (const v of veiculos ?? []) veiculoCache[v.modelo.toLowerCase()] = v.id;

  let imported = 0;
  const errors: Array<{ linha: number; motivo: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const linhaNum = i + 2; // 1-based, +1 for header

    try {
      const data = parseDate(row.data);
      if (!data) {
        errors.push({ linha: linhaNum, motivo: `Data inválida: "${row.data}"` });
        continue;
      }

      const nomeCliente = normalizeNome(row.solicitante);
      if (!nomeCliente) {
        errors.push({ linha: linhaNum, motivo: "Solicitante/cliente em branco" });
        continue;
      }

      const valor = parseValor(row.valor);
      if (valor === null) {
        errors.push({ linha: linhaNum, motivo: `Valor inválido: "${row.valor}"` });
        continue;
      }

      // Upsert cliente
      const clienteKey = nomeCliente.toLowerCase();
      if (!clienteCache[clienteKey]) {
        const { data: existing } = await supabase
          .from("clientes")
          .select("id")
          .ilike("nome", nomeCliente)
          .maybeSingle();

        if (existing) {
          clienteCache[clienteKey] = existing.id;
        } else {
          const { data: novo, error: clienteErr } = await supabase
            .from("clientes")
            .insert({ nome: nomeCliente, status: "ativo" })
            .select("id")
            .single();
          if (clienteErr) {
            errors.push({ linha: linhaNum, motivo: `Erro ao criar cliente "${nomeCliente}": ${clienteErr.message}` });
            continue;
          }
          clienteCache[clienteKey] = novo.id;
        }
      }
      const clienteId = clienteCache[clienteKey];

      // Upsert equipamento
      const tipoEq = normalizeNome(row.veiculo_eq) || "Outro";
      const eqKey = tipoEq.toLowerCase();
      if (!equipamentoCache[eqKey]) {
        const { data: existing } = await supabase
          .from("equipamentos")
          .select("id")
          .ilike("tipo", tipoEq)
          .maybeSingle();

        if (existing) {
          equipamentoCache[eqKey] = existing.id;
        } else {
          const { data: novo, error: eqErr } = await supabase
            .from("equipamentos")
            .insert({ tipo: tipoEq, status: "disponivel" })
            .select("id")
            .single();
          if (eqErr) {
            errors.push({ linha: linhaNum, motivo: `Erro ao criar equipamento "${tipoEq}": ${eqErr.message}` });
            continue;
          }
          equipamentoCache[eqKey] = novo.id;
        }
      }
      const equipamentoId = equipamentoCache[eqKey];

      // Resolve motorista
      const nomeMotorista = normalizeNome(row.motorista);
      const motoristaKey = nomeMotorista.toLowerCase();
      let motoristaId: string | null = motoristaCache[motoristaKey] ?? null;
      if (!motoristaId && nomeMotorista) {
        const { data: existing } = await supabase
          .from("motoristas")
          .select("id")
          .ilike("nome", nomeMotorista)
          .maybeSingle();
        if (existing) {
          motoristaId = existing.id;
          motoristaCache[motoristaKey] = existing.id;
        } else {
          const { data: novo } = await supabase
            .from("motoristas")
            .insert({ nome: nomeMotorista, status: "ativo" })
            .select("id")
            .single();
          if (novo) {
            motoristaId = novo.id;
            motoristaCache[motoristaKey] = novo.id;
          }
        }
      }

      // Resolve veículo
      const nomeVeiculo = normalizeNome(row.veiculo_utilizado);
      const veiculoKey = nomeVeiculo.toLowerCase();
      let veiculoId: string | null = veiculoCache[veiculoKey] ?? null;
      if (!veiculoId && nomeVeiculo) {
        const { data: existing } = await supabase
          .from("veiculos")
          .select("id")
          .ilike("modelo", nomeVeiculo)
          .maybeSingle();
        if (existing) {
          veiculoId = existing.id;
          veiculoCache[veiculoKey] = existing.id;
        } else {
          const { data: novo } = await supabase
            .from("veiculos")
            .insert({ modelo: nomeVeiculo, status: "disponivel" })
            .select("id")
            .single();
          if (novo) {
            veiculoId = novo.id;
            veiculoCache[veiculoKey] = novo.id;
          }
        }
      }

      const pago = parseBoolean(row.pago);
      const vencimento = parseDate(row.vencimento);
      const forma = parseForma(row.forma_pagamento);

      // Generate numero_atendimento
      const { count } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true });
      const today = format(new Date(), "yyyyMMdd");
      const seq = String((count ?? 0) + 1).padStart(3, "0");
      const numero_atendimento = `${today}-${seq}`;

      const { error: insertErr } = await supabase.from("atendimentos").insert({
        numero_atendimento,
        data,
        cliente_id: clienteId,
        valor,
        local_retirada: row.local_retirada?.trim() || "—",
        local_entrega: row.local_entrega?.trim() || "—",
        equipamento_id: equipamentoId,
        motorista_id: motoristaId,
        veiculo_id: veiculoId,
        numero_pedido: row.numero_pedido?.trim() || null,
        nota_fiscal: row.nota_fiscal?.trim() || null,
        data_vencimento: vencimento,
        status_pagamento: pago ? "pago" : vencimento && vencimento < format(new Date(), "yyyy-MM-dd") ? "vencido" : "pendente",
        data_pagamento: pago ? data : null,
        metodo_pagamento: forma,
        observacoes: row.observacao?.trim() || null,
        created_by: user.id,
      });

      if (insertErr) {
        errors.push({ linha: linhaNum, motivo: insertErr.message });
        continue;
      }

      imported++;
    } catch (err) {
      errors.push({ linha: linhaNum, motivo: String(err) });
    }
  }

  return NextResponse.json({ imported, errors });
}
