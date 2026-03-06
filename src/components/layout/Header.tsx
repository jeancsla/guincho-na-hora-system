"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/atendimentos": "Atendimentos",
  "/atendimentos/novo": "Novo Atendimento",
  "/clientes": "Clientes",
  "/motoristas": "Motoristas",
  "/veiculos": "Veículos",
  "/equipamentos": "Equipamentos",
  "/financeiro": "Financeiro",
};

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const title = breadcrumbMap[pathname] ?? breadcrumbMap[pathname.split("/").slice(0, 2).join("/")] ?? "CRM";
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-xs font-medium leading-none">Usuário</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail ?? "—"}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
