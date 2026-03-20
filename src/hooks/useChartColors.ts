"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface ChartColors {
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  mutedLine: string;       // for neutral lines/areas (TicketTrendChart)
  mutedGradient: string;   // gradient fill for neutral areas
}

const LIGHT: ChartColors = {
  grid: "#e4e4e7",
  tick: "#71717a",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e4e4e7",
  tooltipText: "#18181b",
  mutedLine: "#18181b",
  mutedGradient: "#18181b",
};

const DARK: ChartColors = {
  grid: "#3f3f46",
  tick: "#a1a1aa",
  tooltipBg: "#18181b",
  tooltipBorder: "#3f3f46",
  tooltipText: "#f4f4f5",
  mutedLine: "#d4d4d8",
  mutedGradient: "#d4d4d8",
};

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(LIGHT);

  useEffect(() => {
    setColors(resolvedTheme === "dark" ? DARK : LIGHT);
  }, [resolvedTheme]);

  return colors;
}
