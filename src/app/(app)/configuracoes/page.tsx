"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./_components/ProfileTab";
import { SecurityTab } from "./_components/SecurityTab";
import { AppearanceTab } from "./_components/AppearanceTab";
import { UsersTab } from "./_components/UsersTab";

export default function ConfiguracoesPage() {
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role === "superadmin") setIsSuperadmin(true);
      });
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Configurações
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Gerencie sua conta e preferências do sistema
        </p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="perfil" className="mt-4">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="seguranca" className="mt-4">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="aparencia" className="mt-4">
          <AppearanceTab />
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="usuarios" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
