"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FunnelStep {
  stepName: string;
  entries: number;
  completions: number;
  dropOff: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  height?: number;
}

const GOLD = "#FFC62C";
const GOLD_DIM = "rgba(255, 198, 44, 0.25)";

export function FunnelChart({ steps, height = 220 }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <p className="text-xs text-zinc-500 py-4">Keine Funnel-Daten vorhanden</p>
    );
  }

  const maxEntries = Math.max(...steps.map((s) => s.entries), 1);

  const data = steps.map((s) => ({
    name: s.stepName,
    entries: s.entries,
    completions: s.completions,
    dropOff: s.dropOff,
    pct: Math.round((s.entries / maxEntries) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" barCategoryGap="18%">
        <XAxis
          type="number"
          tick={{ fill: "#52525b", fontSize: 10 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 12,
            color: "#fff",
          }}
          formatter={(val: number, name: string) => {
            if (name === "entries") return [val, "Eintritte"];
            return [val, name];
          }}
          labelFormatter={(label: string) => label}
        />
        <Bar dataKey="entries" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.dropOff > 50 ? GOLD_DIM : GOLD}
              opacity={0.3 + (entry.pct / 100) * 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
