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
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { href: "/atendimentos",  label: "Atendimentos",    icon: ClipboardList },
  { href: "/clientes",      label: "Clientes",        icon: Users },
  { href: "/motoristas",    label: "Motoristas",      icon: Truck },
  { href: "/veiculos",      label: "Veículos",        icon: Car },
  { href: "/equipamentos",  label: "Equipamentos",    icon: Wrench },
  { href: "/financeiro",    label: "Financeiro",      icon: DollarSign },
  { href: "/importar",      label: "Importar",        icon: Upload },
  { href: "/configuracoes", label: "Configurações",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-zinc-950 text-white flex flex-col h-full border-r border-zinc-800/60 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 rounded-lg p-1.5 shrink-0">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 18h8M3 10h18l-2-6H5L3 10zm0 0v6a2 2 0 002 2h14a2 2 0 002-2v-6" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm tracking-tight text-white">Guincho na Hora</p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              {/* Left active indicator */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-red-500 transition-all duration-200",
                  isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                )}
              />

              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800/60">
        <p className="text-[10px] text-zinc-600 font-medium">v1.0.0</p>
      </div>
    </aside>
  );
}
