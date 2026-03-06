import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "-";
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
}

export function formatDatetime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "-";
    return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
}

export function generateNumeroAtendimento(count: number): string {
  const today = format(new Date(), "yyyyMMdd");
  const seq = String(count + 1).padStart(3, "0");
  return `${today}-${seq}`;
}
