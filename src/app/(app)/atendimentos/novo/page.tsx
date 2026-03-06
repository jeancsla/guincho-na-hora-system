import { AtendimentoForm } from "@/components/atendimentos/AtendimentoForm";

export default function NovoAtendimentoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Novo Atendimento</h2>
        <p className="text-sm text-muted-foreground">Preencha os dados do novo atendimento</p>
      </div>
      <AtendimentoForm />
    </div>
  );
}
