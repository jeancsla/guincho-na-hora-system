"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function updateUser(userId: string, updates: { is_approved?: boolean; role?: string }) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar usuário");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
      toast.success("Usuário atualizado");
    } catch {
      toast.error("Erro ao atualizar usuário");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
        <CardDescription>
          Aprove ou desative usuários que solicitaram acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Nenhum usuário encontrado</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const initials = u.full_name
                ? u.full_name.slice(0, 2).toUpperCase()
                : u.email.slice(0, 2).toUpperCase();
              const isUpdating = updating === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-zinc-900 text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {u.full_name ?? u.email}
                      </p>
                      {u.role === "superadmin" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={u.is_approved ? "success" : "warning"}
                      className="text-xs"
                    >
                      {u.is_approved ? "Aprovado" : "Pendente"}
                    </Badge>
                    {u.role !== "superadmin" && (
                      <>
                        {u.is_approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateUser(u.id, { is_approved: false })}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => updateUser(u.id, { is_approved: true })}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            Aprovar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
