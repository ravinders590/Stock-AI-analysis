import React from "react";
import { useGetStockQuote } from "@workspace/api-client-react";
import { formatCurrency, formatCompactNumber, formatPercentage, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";

export function QuoteHeader({ symbol }: { symbol: string }) {
  const { data: quote, isLoading, error } = useGetStockQuote({ symbol });

  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-xl animate-pulse">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="h-8 w-28 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <div className="h-10 w-36 bg-muted rounded" />
            <div className="h-6 w-28 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="glass-panel p-5 rounded-xl flex items-center gap-3 text-destructive border-destructive/20 bg-destructive/5">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">Failed to retrieve quote</h3>
          <p className="text-sm opacity-80">Data feed for {symbol} is unavailable.</p>
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  const cur = quote.currency;

  return (
    <div className="glass-panel p-5 rounded-xl relative overflow-hidden">
      <div className={cn(
        "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none transition-colors duration-500",
        isPositive ? "bg-success" : "bg-destructive"
      )} />

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">

        {/* Symbol + name */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-0.5">
            <h2 className="text-2xl font-black tracking-tight">{quote.symbol}</h2>
            {quote.exchange && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                {quote.exchange}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[220px]">{quote.name}</p>
        </div>

        {/* Price + 1D change */}
        <div className="flex flex-col">
          <span className="text-4xl font-mono font-bold tracking-tighter leading-none">
            {formatCurrency(quote.price, cur)}
          </span>
          <div className={cn(
            "flex items-center gap-1.5 mt-1.5 text-base font-mono font-bold",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isPositive ? "+" : ""}{formatCurrency(quote.change, cur)}</span>
            <span className="text-sm">({isPositive ? "+" : ""}{formatPercentage(quote.changePercent)})</span>
          </div>
        </div>

        {/* 1D Return badge — prominent */}
        <div className={cn(
          "flex-shrink-0 flex flex-col items-center justify-center rounded-xl border-2 px-5 py-3 min-w-[120px]",
          isPositive
            ? "border-success/40 bg-success/10 text-success"
            : "border-destructive/40 bg-destructive/10 text-destructive"
        )}>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
            <Clock className="w-3 h-3" /> 1D Return
          </div>
          <span className="text-2xl font-mono font-black leading-none">
            {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
          </span>
          <span className="text-xs font-mono mt-0.5 opacity-80">
            {isPositive ? "+" : ""}{formatCurrency(quote.change, cur)}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3 lg:border-l border-border lg:pl-6 w-full lg:w-auto">
          <StatCell label="Prev Close" value={quote.previousClose ? formatCurrency(quote.previousClose, cur) : "—"} />
          <StatCell label="Day High" value={quote.high ? formatCurrency(quote.high, cur) : "—"} highlight="success" />
          <StatCell label="Day Low" value={quote.low ? formatCurrency(quote.low, cur) : "—"} highlight="destructive" />
          <StatCell label="Volume" value={quote.volume ? formatCompactNumber(quote.volume) : "—"} />
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: "success" | "destructive" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</span>
      <span className={cn(
        "font-mono text-sm font-semibold",
        highlight === "success" ? "text-success" : highlight === "destructive" ? "text-destructive" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
