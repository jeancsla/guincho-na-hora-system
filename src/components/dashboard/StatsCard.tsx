import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  trend?: { value: number; label: string };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-zinc-400",
  loading = false,
  trend,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-3.5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-24 mb-1.5" />
          <Skeleton className="h-3 w-36" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden card-hover group cursor-default">
      {/* Subtle top accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />

      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      </CardHeader>
      <CardContent className="pb-5">
        <div className="text-2xl font-bold tabular-nums animate-value-in">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
