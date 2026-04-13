"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface SparklineChartProps {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
}

export function SparklineChart({
  data,
  height = 40,
  color = "#FFC62C",
}: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
