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
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table2>
        <TableHeader2>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow2 key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead2 key={header.id}>
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
              <TableCell2 colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                Nenhum atendimento encontrado
              </TableCell2>
            </TableRow2>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow2 key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell2 key={cell.id}>
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
