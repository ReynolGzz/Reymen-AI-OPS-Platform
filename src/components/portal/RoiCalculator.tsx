"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface RoiCalculatorProps {
  totalLeads: number;
  wonLeads: number;
}

const PLANS = [
  { key: "starter", label: "Starter", price: 299 },
  { key: "professional", label: "Professional", price: 699 },
  { key: "enterprise", label: "Enterprise", price: 1499 },
];

export function RoiCalculator({ totalLeads, wonLeads }: RoiCalculatorProps) {
  const [avgDealValue, setAvgDealValue] = useState(5000);
  const [plan, setPlan] = useState("starter");

  const planCost = PLANS.find((p) => p.key === plan)?.price ?? 299;
  const revenue = wonLeads * avgDealValue;
  const roi = planCost > 0 ? Math.round(((revenue - planCost) / planCost) * 100) : 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Simulador de ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Valor promedio de venta (USD)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                step={500}
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Plan de Reymen</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {PLANS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} — ${p.price}/mes
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Leads totales", value: totalLeads.toLocaleString("en-US"), color: "text-slate-900" },
            { label: "Leads ganados", value: wonLeads.toLocaleString("en-US"), color: "text-emerald-600" },
            { label: "Tasa de cierre", value: `${conversionRate}%`, color: "text-brand-600" },
            { label: "ROI estimado", value: `${roi}%`, color: roi > 0 ? "text-emerald-600" : "text-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-3">
          <p className="text-sm font-medium text-brand-900">
            Ingresos estimados:{" "}
            <span className="text-brand-700">${revenue.toLocaleString("en-US")} USD</span>
            {" "}vs. inversión en plataforma:{" "}
            <span className="text-brand-700">${planCost}/mes</span>
          </p>
          <p className="text-xs text-brand-700 mt-0.5">
            Basado en {wonLeads} leads ganados × ${avgDealValue.toLocaleString("en-US")} valor promedio.
            Ajusta los valores para simular distintos escenarios.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
