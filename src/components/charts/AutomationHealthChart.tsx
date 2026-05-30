"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AutomationHealthChartProps {
  success: number;
  failed: number;
  pending: number;
}

export function AutomationHealthChart({ success, failed, pending }: AutomationHealthChartProps) {
  const data = [
    { name: "Exitosos", value: success, color: "#10b981" },
    { name: "Fallidos", value: failed, color: "#ef4444" },
    { name: "Pendientes", value: pending, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-slate-400">Sin eventos de automatización</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(value: number) => [value, "eventos"]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
