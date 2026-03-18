import React, { useState } from "react";
import { useGetStockFundamentals } from "@workspace/api-client-react";
import { formatCompactNumber, formatCurrency, cn, isIndianSymbol } from "@/lib/utils";
import {
  Building2, Globe, Users, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, TrendingUp, BarChart2, Shield
} from "lucide-react";

interface FundamentalsPanelProps {
  symbol: string;
}

function MetricCell({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: "good" | "bad" | "neutral" }) {
  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className={cn(
        "font-mono font-bold text-sm",
        highlight === "good" ? "text-success" : highlight === "bad" ? "text-destructive" : "text-foreground"
      )}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function FundamentalsPanel({ symbol }: FundamentalsPanelProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const isIndex = symbol.startsWith("^");
  const { data: fund, isLoading, error } = useGetStockFundamentals(
    { symbol },
    { query: { enabled: !isIndex } }
  );
  const currency = isIndianSymbol(symbol) ? "INR" : "USD";

  // Don't show fundamentals for indices
  if (isIndex) return null;

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50 h-14 animate-pulse bg-muted" />
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return null;
  }

  const pct = (v: number | null | undefined) => v != null ? `${(v * 100).toFixed(2)}%` : "—";
  const num = (v: number | null | undefined) => v != null ? v.toFixed(2) : "—";
  const crore = (v: number | null | undefined) => v != null ? `₹${formatCompactNumber(v / 1e7)} Cr` : "—";

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Company Fundamentals</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {fund.sector && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">{fund.sector}</span>
              )}
              {fund.industry && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{fund.industry}</span>
              )}
              {fund.employees && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                  <Users className="w-3 h-3" /> {formatCompactNumber(fund.employees)} employees
                </span>
              )}
              {fund.website && (
                <a href={fund.website} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border flex items-center gap-1 hover:text-primary transition-colors">
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Business description */}
        {fund.description && (
          <div className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
            {showFullDesc ? fund.description : fund.description.slice(0, 300) + (fund.description.length > 300 ? "..." : "")}
            {fund.description.length > 300 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="ml-2 text-primary hover:underline text-[11px] inline-flex items-center gap-0.5"
              >
                {showFullDesc ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
              </button>
            )}
          </div>
        )}

        {/* Key metrics grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Key Metrics</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <MetricCell label="Market Cap" value={fund.marketCap ? crore(fund.marketCap) : "—"} />
            <MetricCell
              label="P/E Ratio"
              value={num(fund.peRatio)}
              sub={fund.peRatio && fund.peRatio > 50 ? "Overvalued" : fund.peRatio && fund.peRatio < 15 ? "Undervalued" : undefined}
              highlight={fund.peRatio ? (fund.peRatio > 50 ? "bad" : fund.peRatio < 15 ? "good" : "neutral") : "neutral"}
            />
            <MetricCell label="P/B Ratio" value={num(fund.pbRatio)} highlight={fund.pbRatio && fund.pbRatio < 1 ? "good" : fund.pbRatio && fund.pbRatio > 8 ? "bad" : "neutral"} />
            <MetricCell label="EPS" value={fund.eps != null ? formatCurrency(fund.eps, currency) : "—"} highlight={fund.eps && fund.eps > 0 ? "good" : fund.eps && fund.eps < 0 ? "bad" : "neutral"} />
            <MetricCell
              label="ROE"
              value={pct(fund.roe)}
              sub={fund.roe && fund.roe > 0.15 ? "Excellent" : fund.roe && fund.roe > 0.1 ? "Good" : undefined}
              highlight={fund.roe && fund.roe > 0.15 ? "good" : fund.roe && fund.roe < 0.05 ? "bad" : "neutral"}
            />
            <MetricCell label="Profit Margin" value={pct(fund.profitMargin)} highlight={fund.profitMargin && fund.profitMargin > 0.15 ? "good" : fund.profitMargin && fund.profitMargin < 0 ? "bad" : "neutral"} />
            <MetricCell label="Debt/Equity" value={num(fund.debtToEquity)} highlight={fund.debtToEquity && fund.debtToEquity < 0.5 ? "good" : fund.debtToEquity && fund.debtToEquity > 2 ? "bad" : "neutral"} />
            <MetricCell label="Dividend Yield" value={pct(fund.dividendYield)} highlight={fund.dividendYield && fund.dividendYield > 0.03 ? "good" : "neutral"} />
            <MetricCell label="52W High" value={fund.fiftyTwoWeekHigh != null ? formatCurrency(fund.fiftyTwoWeekHigh, currency) : "—"} highlight="good" />
            <MetricCell label="52W Low" value={fund.fiftyTwoWeekLow != null ? formatCurrency(fund.fiftyTwoWeekLow, currency) : "—"} highlight="bad" />
            <MetricCell label="Current Ratio" value={num(fund.currentRatio)} highlight={fund.currentRatio && fund.currentRatio > 1.5 ? "good" : fund.currentRatio && fund.currentRatio < 1 ? "bad" : "neutral"} />
            <MetricCell label="Revenue Growth" value={pct(fund.revenueGrowthYoY)} sub="YoY" highlight={fund.revenueGrowthYoY && fund.revenueGrowthYoY > 0.1 ? "good" : fund.revenueGrowthYoY && fund.revenueGrowthYoY < 0 ? "bad" : "neutral"} />
          </div>
        </div>

        {/* Pros and Cons */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Strengths & Risks</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Pros */}
            <div className="rounded-lg border border-success/25 bg-success/5 p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-success">Strengths</span>
              </div>
              <ul className="space-y-2">
                {fund.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{p.point}</div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">{p.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">Risks</span>
              </div>
              <ul className="space-y-2">
                {fund.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{c.point}</div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">{c.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
