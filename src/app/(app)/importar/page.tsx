"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Upload, CheckCircle2, AlertCircle, ArrowRight, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Column mapping: CSV header (lowercase, normalized) → internal key
const COLUMN_MAP: Record<string, string> = {
  data: "data",
  date: "data",
  horario: "horario",
  "horário": "horario",
  hora: "horario",
  solicitante: "solicitante",
  cliente: "solicitante",
  valor: "valor",
  value: "valor",
  "local retirada": "local_retirada",
  "local de retirada": "local_retirada",
  retirada: "local_retirada",
  origem: "local_retirada",
  "local entrega": "local_entrega",
  "local de entrega": "local_entrega",
  entrega: "local_entrega",
  destino: "local_entrega",
  "veiculo eq": "veiculo_eq",
  "veículo eq": "veiculo_eq",
  "equipamento": "veiculo_eq",
  "veiculo equipamento": "veiculo_eq",
  "veículo equipamento": "veiculo_eq",
  "equipamento transportado": "veiculo_eq",
  motorista: "motorista",
  "veiculo utilizado": "veiculo_utilizado",
  "veículo utilizado": "veiculo_utilizado",
  veiculo: "veiculo_utilizado",
  "veículo": "veiculo_utilizado",
  "numero pedido": "numero_pedido",
  "número pedido": "numero_pedido",
  "nº pedido": "numero_pedido",
  pedido: "numero_pedido",
  "nota fiscal": "nota_fiscal",
  nf: "nota_fiscal",
  vencimento: "vencimento",
  pago: "pago",
  paid: "pago",
  "forma pagamento": "forma_pagamento",
  "forma de pagamento": "forma_pagamento",
  pagamento: "forma_pagamento",
  observacao: "observacao",
  "observação": "observacao",
  obs: "observacao",
  observacoes: "observacao",
  "observações": "observacao",
};

type Step = "upload" | "preview" | "result";

interface ParsedRow {
  [key: string]: string | undefined;
}

interface ImportResult {
  imported: number;
  errors: Array<{ linha: number; motivo: string }>;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): string[] {
  return headers.map((h) => COLUMN_MAP[normalizeHeader(h)] ?? normalizeHeader(h));
}

export default function ImportarPage() {
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [allRows, setAllRows] = useState<ParsedRow[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<string[]>([]);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Selecione um arquivo CSV válido.");
      return;
    }
    setFileName(file.name);
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const [headerRow, ...dataRows] = result.data as string[][];
        if (!headerRow || headerRow.length === 0) {
          toast.error("CSV sem cabeçalho.");
          return;
        }
        const origHeaders = headerRow.map((h) => h.trim());
        const mapped = mapHeaders(origHeaders);

        const rows: ParsedRow[] = dataRows.map((cells) => {
          const obj: ParsedRow = {};
          mapped.forEach((key, i) => {
            obj[key] = cells[i]?.trim() ?? "";
          });
          return obj;
        });

        setOriginalHeaders(origHeaders);
        setMappedHeaders(mapped);
        setAllRows(rows);
        setStep("preview");
      },
      error: () => toast.error("Erro ao processar o CSV."),
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: allRows }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
      if (data.imported > 0) {
        toast.success(`${data.imported} registros importados com sucesso.`);
      }
    } catch {
      toast.error("Erro ao importar dados.");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setAllRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const PREVIEW_COLS = ["data", "solicitante", "valor", "local_retirada", "local_entrega", "motorista", "veiculo_eq"];
  const previewRows = allRows.slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Importar Dados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importe o histórico de atendimentos a partir de um arquivo CSV.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 text-sm">
        {(["upload", "preview", "result"] as Step[]).map((s, idx) => {
          const labels = ["1. Upload", "2. Prévia", "3. Resultado"];
          const done = step === "result" || (step === "preview" && s === "upload");
          const active = step === s;
          return (
            <div key={s} className="flex items-center gap-3">
              <span
                className={cn(
                  "font-medium",
                  active ? "text-red-600" : done ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {labels[idx]}
              </span>
              {idx < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selecionar Arquivo CSV</CardTitle>
            <CardDescription>
              O arquivo deve ter cabeçalho na primeira linha. Colunas reconhecidas: Data, Solicitante,
              Valor, Local Retirada, Local Entrega, Equipamento, Motorista, Veículo Utilizado,
              Vencimento, Pago, Forma Pagamento, Observação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                dragging
                  ? "border-red-600 bg-red-600/5"
                  : "border-muted-foreground/20 hover:border-red-600/50 hover:bg-muted/10"
              )}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium">Arraste o CSV aqui ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground mt-1">Somente arquivos .csv</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Prévia dos Dados</CardTitle>
                  <CardDescription>
                    Arquivo: <span className="font-medium text-foreground">{fileName}</span> —{" "}
                    <span className="font-medium text-foreground">{allRows.length.toLocaleString("pt-BR")}</span> registros
                    encontrados. Abaixo as primeiras 10 linhas.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {PREVIEW_COLS.map((col) => (
                        <th key={col} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                        {PREVIEW_COLS.map((col) => (
                          <td key={col} className="px-3 py-2 max-w-[160px] truncate" title={row[col]}>
                            {row[col] || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Column mapping summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mapeamento de Colunas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {originalHeaders.map((orig, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground truncate max-w-[100px]" title={orig}>{orig}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Badge
                      variant={mappedHeaders[i] === normalizeHeader(orig) ? "outline" : "secondary"}
                      className="text-xs font-mono truncate"
                    >
                      {mappedHeaders[i]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-zinc-950 hover:bg-zinc-800 text-white"
            >
              {importing ? (
                <>Importando {allRows.length.toLocaleString("pt-BR")} registros...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Importação ({allRows.length.toLocaleString("pt-BR")} registros)
                </>
              )}
            </Button>
            <Button variant="outline" onClick={reset} disabled={importing}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-green-600/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{result.imported.toLocaleString("pt-BR")}</p>
                    <p className="text-sm text-muted-foreground">Registros importados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={result.errors.length > 0 ? "border-red-600/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className={cn("h-8 w-8 shrink-0", result.errors.length > 0 ? "text-red-500" : "text-muted-foreground/30")} />
                  <div>
                    <p className="text-2xl font-bold">{result.errors.length.toLocaleString("pt-BR")}</p>
                    <p className="text-sm text-muted-foreground">Erros / linhas ignoradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-500">Log de Erros</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">Linha</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-mono">{e.linha}</td>
                          <td className="px-4 py-2 text-red-400">{e.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button asChild className="bg-zinc-950 hover:bg-zinc-800 text-white">
              <a href="/atendimentos">Ver Atendimentos</a>
            </Button>
            <Button variant="outline" onClick={reset}>
              Nova Importação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
