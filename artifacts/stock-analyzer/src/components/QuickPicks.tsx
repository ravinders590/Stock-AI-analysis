import React from "react";
import { cn } from "@/lib/utils";

const INDIAN_ASSETS = [
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^NSEBANK", label: "BANKNIFTY" },
  { symbol: "^CNXIT", label: "NIFTY IT" },
  { symbol: "RELIANCE.NS", label: "RELIANCE" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "INFY.NS", label: "INFOSYS" },
  { symbol: "HDFCBANK.NS", label: "HDFC BANK" },
  { symbol: "ICICIBANK.NS", label: "ICICI BANK" },
  { symbol: "SBIN.NS", label: "SBI" },
  { symbol: "WIPRO.NS", label: "WIPRO" },
];

interface QuickPicksProps {
  currentSymbol: string;
  onSelect: (symbol: string) => void;
}

export function QuickPicks({ currentSymbol, onSelect }: QuickPicksProps) {
  return (
    <div className="w-full overflow-x-auto border-b border-border bg-card/50">
      <div className="container mx-auto px-4 flex items-center gap-2 py-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2 whitespace-nowrap">
          NSE India
        </span>
        <div className="flex gap-2">
          {INDIAN_ASSETS.map(({ symbol, label }) => (
            <button
              key={symbol}
              onClick={() => onSelect(symbol)}
              className={cn(
                "px-3 py-1 rounded text-xs font-mono font-medium transition-all duration-200 border whitespace-nowrap",
                currentSymbol === symbol
                  ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                  : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
