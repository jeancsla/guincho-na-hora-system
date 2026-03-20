"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Moon } from "lucide-react";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aparência</CardTitle>
        <CardDescription>Escolha entre o tema claro ou escuro</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer w-32 ${
              theme === "light"
                ? "border-red-600 bg-red-50 dark:bg-red-950"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <Sun className={`h-6 w-6 ${theme === "light" ? "text-red-600" : "text-zinc-400"}`} />
            <span className={`text-sm font-medium ${theme === "light" ? "text-red-600" : "text-zinc-500"}`}>
              Claro
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer w-32 ${
              theme === "dark"
                ? "border-red-600 bg-red-50 dark:bg-red-950"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <Moon className={`h-6 w-6 ${theme === "dark" ? "text-red-600" : "text-zinc-400"}`} />
            <span className={`text-sm font-medium ${theme === "dark" ? "text-red-600" : "text-zinc-500"}`}>
              Escuro
            </span>
          </button>
        </div>
        {/* Preview note */}
        <p className="text-xs text-zinc-500 mt-4">
          O tema será aplicado imediatamente e salvo no navegador.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          Alternar tema
        </Button>
      </CardContent>
    </Card>
  );
}
