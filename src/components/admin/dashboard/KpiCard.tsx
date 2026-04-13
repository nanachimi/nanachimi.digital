"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  href,
  trend,
  className,
  children,
}: KpiCardProps) {
  const cardClasses = cn(
    "rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col gap-3",
    href && "hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors cursor-pointer",
    className
  );

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" && "text-emerald-400",
              trend.direction === "down" && "text-red-400",
              trend.direction === "neutral" && "text-zinc-500"
            )}
          >
            {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
            {trend.direction === "down" && (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {subtitle && (
          <span className="text-sm text-zinc-500">{subtitle}</span>
        )}
      </div>

      {/* Chart / Children slot */}
      {children && <div className="mt-1">{children}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}
