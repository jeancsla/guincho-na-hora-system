"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Atendimento } from "@/types";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { DueDateBadge } from "./DueDateBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// shadcn table primitives
function Table2({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className ?? ""}`} {...props} />
    </div>
  );
}
function TableHeader2({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`[&_tr]:border-b ${className ?? ""}`} {...props} />;
}
function TableBody2({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className ?? ""}`} {...props} />;
}
function TableHead2({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className ?? ""}`}
      {...props}
    />
  );
}
function TableRow2({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className ?? ""}`}
      {...props}
    />
  );
}
function TableCell2({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className ?? ""}`} {...props} />
  );
}

interface Props {
  data: Atendimento[];
  loading?: boolean;
  onMarkPaid: (atendimento: Atendimento) => void;
  onCancel: (atendimento: Atendimento) => void;
}

export function AtendimentoTable({ data, loading, onMarkPaid, onCancel }: Props) {
  const router = useRouter();

  const columns: ColumnDef<Atendimento>[] = [
    {
      accessorKey: "numero_atendimento",
      header: "Nº",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{row.original.numero_atendimento}</span>
      ),
    },
    {
      accessorKey: "data",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.data),
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.cliente?.nome ?? "—"}</span>
      ),
    },
    {
      accessorKey: "equipamento",
      header: "Equipamento",
      cell: ({ row }) => row.original.equipamento?.tipo ?? "—",
    },
    {
      accessorKey: "motorista",
      header: "Motorista",
      cell: ({ row }) => row.original.motorista?.nome ?? "—",
    },
    {
      accessorKey: "valor",
      header: "Valor",
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(Number(row.original.valor))}</span>
      ),
    },
    {
      accessorKey: "status_pagamento",
      header: "Status",
      cell: ({ row }) => (
        <PaymentStatusBadge
          status={row.original.status_pagamento}
          dataVencimento={row.original.data_vencimento}
        />
      ),
    },
    {
      accessorKey: "data_vencimento",
      header: "Vencimento",
      cell: ({ row }) => (
        <DueDateBadge
          dataVencimento={row.original.data_vencimento}
          statusPagamento={row.original.status_pagamento}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/atendimentos/${a.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/atendimentos/${a.id}?edit=true`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {a.status_pagamento !== "pago" && a.status_pagamento !== "cancelado" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onMarkPaid(a)}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como pago
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel(a)} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <Table2>
          <TableHeader2>
            <TableRow2>
              {["Nº", "Data", "Cliente", "Equipamento", "Motorista", "Valor", "Status", "Vencimento", ""].map((h) => (
                <TableHead2 key={h}>{h}</TableHead2>
              ))}
            </TableRow2>
          </TableHeader2>
          <TableBody2>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow2 key={i}>
                <TableCell2><div className="skeleton-shimmer h-4 w-16 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-20 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-32 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-24 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-28 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-16 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-5 w-20 rounded-full" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-4 w-20 rounded" /></TableCell2>
                <TableCell2><div className="skeleton-shimmer h-7 w-7 rounded" /></TableCell2>
              </TableRow2>
            ))}
          </TableBody2>
        </Table2>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table2>
        <TableHeader2>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow2 key={headerGroup.id} className="bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50">
              {headerGroup.headers.map((header) => (
                <TableHead2 key={header.id} className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead2>
              ))}
            </TableRow2>
          ))}
        </TableHeader2>
        <TableBody2>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow2>
              <TableCell2 colSpan={columns.length}>
                <div className="flex flex-col items-center gap-2 py-16 text-zinc-400 dark:text-zinc-500">
                  <svg className="h-10 w-10 text-zinc-200 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium">Nenhum atendimento encontrado</p>
                  <p className="text-xs">Tente ajustar os filtros ou criar um novo atendimento</p>
                </div>
              </TableCell2>
            </TableRow2>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow2
                key={row.id}
                className="table-row-hover cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => router.push(`/atendimentos/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell2 key={cell.id} onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell2>
                ))}
              </TableRow2>
            ))
          )}
        </TableBody2>
      </Table2>
    </div>
  );
}
