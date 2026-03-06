import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { atendimentoUpdateSchema } from "@/lib/validations/atendimento.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("atendimentos")
    .select(
      `*, cliente:clientes(id, nome, telefone, email, cidade), equipamento:equipamentos(id, tipo), motorista:motoristas(id, nome, telefone), veiculo:veiculos(id, modelo, placa)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Fetch current record for audit
  const { data: current } = await supabase
    .from("atendimentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = atendimentoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("atendimentos")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("id", id)
    .select(
      `*, cliente:clientes(id, nome), equipamento:equipamentos(id, tipo), motorista:motoristas(id, nome), veiculo:veiculos(id, modelo)`
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("auditoria").insert({
    tabela: "atendimentos",
    registro_id: id,
    acao: "UPDATE",
    dados_antes: current,
    dados_novos: data,
    usuario_id: user.id,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: current } = await supabase
    .from("atendimentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete: status = cancelado
  const { error } = await supabase
    .from("atendimentos")
    .update({ status_pagamento: "cancelado", updated_by: user.id })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("auditoria").insert({
    tabela: "atendimentos",
    registro_id: id,
    acao: "DELETE",
    dados_antes: current,
    dados_novos: { status_pagamento: "cancelado" },
    usuario_id: user.id,
  });

  return NextResponse.json({ success: true });
}
