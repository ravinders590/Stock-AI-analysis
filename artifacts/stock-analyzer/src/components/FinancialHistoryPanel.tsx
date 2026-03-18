import React, { useState } from "react";
import { useGetStockFinancials } from "@workspace/api-client-react";
import { cn, formatCompactNumber, isIndianSymbol } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

interface FinancialHistoryPanelProps {
  symbol: string;
}

type ViewType = "revenue_income" | "eps" | "margins";

const METRICS: { key: ViewType; label: string }[] = [
  { key: "revenue_income", label: "Revenue & Net Income" },
  { key: "eps", label: "EPS Trend" },
  { key: "margins", label: "Profitability" },
];

function CustomTooltip({ active, payload, label, currency, isIndex }: any) {
  if (!active || !payload || !payload.length) return null;
  const cur = currency === "INR" ? "₹" : "$";
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <div className="font-bold mb-1.5 text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-mono font-bold text-foreground">
            {p.name === "EPS" ? `${cur}${p.value?.toFixed(2) ?? "—"}` :
             p.name.includes("%") ? `${p.value?.toFixed(2)}%` :
             `${cur}${formatCompactNumber(p.value)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FinancialHistoryPanel({ symbol }: FinancialHistoryPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>("revenue_income");
  const isIndex = symbol.startsWith("^");
  const { data: financials, isLoading, error } = useGetStockFinancials(
    { symbol },
    { query: { enabled: !isIndex } }
  );
  const currency = isIndianSymbol(symbol) ? "INR" : "USD";

  if (isIndex) return null;

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border h-14 bg-muted animate-pulse" />
        <div className="p-4 h-64 bg-muted animate-pulse mx-4 my-4 rounded-lg" />
      </div>
    );
  }

  if (error || !financials || financials.annualData.length === 0) {
    return null;
  }

  const cur = currency === "INR" ? "₹" : "$";

  // Prepare chart data
  const data = financials.annualData.map((d) => ({
    year: d.year,
    revenue: d.revenue ?? 0,
    netIncome: d.netIncome ?? 0,
    eps: d.eps ?? null,
    operatingIncome: d.operatingIncome ?? 0,
    grossProfit: d.grossProfit ?? 0,
    profitMarginPct: d.revenue && d.netIncome ? ((d.netIncome / d.revenue) * 100) : null,
    operatingMarginPct: d.revenue && d.operatingIncome ? ((d.operatingIncome / d.revenue) * 100) : null,
  }));

  const yFormatter = (v: number) => {
    if (!v) return "0";
    const abs = Math.abs(v);
    if (abs >= 1e12) return `${cur}${(v / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `${cur}${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${cur}${(v / 1e6).toFixed(1)}M`;
    return `${cur}${v.toFixed(0)}`;
  };

  const isRevIncomePositive = data.length > 1 &&
    data[data.length - 1].netIncome > data[0].netIncome;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Financial History</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveView(m.key)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all",
                activeView === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Stats row */}
        {activeView === "revenue_income" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Latest Revenue", value: data.at(-1)?.revenue, good: true },
              { label: "Latest Net Income", value: data.at(-1)?.netIncome, good: (data.at(-1)?.netIncome ?? 0) > 0 },
              { label: "Revenue Growth", value: data.length > 1 && data[0].revenue ? ((data.at(-1)!.revenue - data[0].revenue) / Math.abs(data[0].revenue) * 100) : null, isPercent: true },
              { label: "Income Growth", value: data.length > 1 && data[0].netIncome ? ((data.at(-1)!.netIncome - data[0].netIncome) / Math.abs(data[0].netIncome) * 100) : null, isPercent: true },
            ].map(({ label, value, good, isPercent }) => (
              <div key={label} className="bg-secondary/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
                <div className={cn("font-mono font-bold text-sm", good ? "text-success" : "text-destructive")}>
                  {value != null
                    ? isPercent ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : `${cur}${formatCompactNumber(value)}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {activeView === "revenue_income" ? (
              <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={yFormatter} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="netIncome" name="Net Income" fill={isRevIncomePositive ? "#22c55e" : "#ef4444"} radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : activeView === "eps" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${cur}${v.toFixed(1)}`} width={55} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Line
                  type="monotone" dataKey="eps" name="EPS"
                  stroke="#a855f7" strokeWidth={2.5}
                  dot={{ fill: "#a855f7", r: 4 }}
                  activeDot={{ r: 6, fill: "#a855f7" }}
                  connectNulls
                />
              </LineChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(0)}%`} width={45} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="profitMarginPct" name="Net Margin %" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} connectNulls />
                <Line type="monotone" dataKey="operatingMarginPct" name="Operating Margin %" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} connectNulls />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
