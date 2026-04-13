"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MiniBarChartProps {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function MiniBarChart({
  data,
  height = 100,
  color = "#FFC62C",
}: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#52525b", fontSize: 10 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 12,
            color: "#fff",
          }}
          labelFormatter={formatDate}
          formatter={(val: number) => [val, "Anfragen"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
