"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  "/dashboard":         "Dashboard",
  "/atendimentos":      "Atendimentos",
  "/atendimentos/novo": "Novo Atendimento",
  "/clientes":          "Clientes",
  "/motoristas":        "Motoristas",
  "/veiculos":          "Veículos",
  "/equipamentos":      "Equipamentos",
  "/financeiro":        "Financeiro",
  "/importar":          "Importar Dados",
};

function buildCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    const label = breadcrumbMap[acc];
    if (label) crumbs.push({ label, href: acc });
    else crumbs.push({ label: part, href: acc });
  }
  return crumbs;
}

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  // Shadow when the page content is scrolled
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    mainRef.current = main;

    function onScroll() {
      setScrolled((mainRef.current?.scrollTop ?? 0) > 4);
    }
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  const crumbs = buildCrumbs(pathname);
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "h-16 bg-white flex items-center justify-between px-6 shrink-0 transition-shadow duration-200",
        scrolled ? "shadow-sm border-b border-zinc-100" : "border-b border-zinc-100"
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
            <span
              className={cn(
                "font-medium",
                i === crumbs.length - 1
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full p-0 ring-offset-1 hover:ring-2 hover:ring-zinc-200 transition-all"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-zinc-900 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col gap-0.5 p-2">
            <p className="text-xs font-semibold text-zinc-900">Conta</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail ?? "—"}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
