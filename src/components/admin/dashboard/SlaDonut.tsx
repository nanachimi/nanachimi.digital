"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SlaDonutProps {
  active: number;
  breached: number;
  size?: number;
}

export function SlaDonut({ active, breached, size = 80 }: SlaDonutProps) {
  const total = active + breached;
  const data =
    total > 0
      ? [
          { name: "Aktiv", value: active },
          { name: "Verletzt", value: breached },
        ]
      : [{ name: "Keine", value: 1 }];

  const COLORS = total > 0 ? ["#4ade80", "#f87171"] : ["#3f3f46"];

  return (
    <div className="flex items-center gap-3">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={size * 0.32}
            outerRadius={size * 0.45}
            paddingAngle={total > 0 ? 4 : 0}
            dataKey="value"
            isAnimationActive={false}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-zinc-400">
            Aktiv: <span className="text-white font-medium">{active}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-zinc-400">
            Verletzt: <span className="text-white font-medium">{breached}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
