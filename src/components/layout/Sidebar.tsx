"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  Car,
  Wrench,
  DollarSign,
  ChevronRight,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/motoristas", label: "Motoristas", icon: Truck },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/equipamentos", label: "Equipamentos", icon: Wrench },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/importar", label: "Importar Dados", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 rounded-lg p-2">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Guincho na Hora</p>
            <p className="text-xs text-slate-400">CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">v1.0.0 — MVP</p>
      </div>
    </aside>
  );
}
