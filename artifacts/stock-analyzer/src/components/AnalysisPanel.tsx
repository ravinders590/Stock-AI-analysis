import React from "react";
import { useGetStockAnalysis, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldAlert, Zap, Cpu, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisPanelProps {
  symbol: string;
  period: GetStockHistoryPeriod;
}

export function AnalysisPanel({ symbol, period }: AnalysisPanelProps) {
  const { data: analysis, isLoading, error } = useGetStockAnalysis({ symbol, period });

  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 h-[450px]">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="glass-panel p-6 rounded-xl flex items-center justify-center h-[450px] text-muted-foreground border-dashed">
        <div className="text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-mono text-sm uppercase tracking-widest">Analysis Engine Offline</p>
          <p className="text-xs mt-2 max-w-[200px]">Insufficient data available to compute technical signals for this asset.</p>
        </div>
      </div>
    );
  }

  const { overallSignal, signalStrength, summary, indicators } = analysis;

  const signalColors = {
    STRONG_BUY: "text-success border-success/50 bg-success/10 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-glow-success",
    BUY: "text-success border-success/30 bg-success/5",
    HOLD: "text-warning border-warning/50 bg-warning/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    SELL: "text-destructive border-destructive/30 bg-destructive/5",
    STRONG_SELL: "text-destructive border-destructive/50 bg-destructive/10 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-glow-destructive"
  };

  const signalIcons = {
    STRONG_BUY: <ArrowUpRight className="w-8 h-8" />,
    BUY: <ArrowUpRight className="w-6 h-6" />,
    HOLD: <Minus className="w-6 h-6" />,
    SELL: <ArrowDownRight className="w-6 h-6" />,
    STRONG_SELL: <ArrowDownRight className="w-8 h-8" />
  };

  const meterColor = 
    signalStrength > 70 ? "bg-success" : 
    signalStrength > 40 ? "bg-warning" : 
    "bg-destructive";

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[450px] overflow-hidden">
      <div className="p-4 border-b border-border bg-card/50">
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" /> 
          AI Recommendation Engine
        </h3>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Massive Signal Badge */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "w-full rounded-2xl border-2 py-6 flex flex-col items-center justify-center transition-all duration-500",
            signalColors[overallSignal]
          )}
        >
          <div className="flex items-center gap-3 mb-1">
            {signalIcons[overallSignal]}
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
              {overallSignal.replace("_", " ")}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase opacity-80 mt-2">
            Consensus Signal
          </span>
        </motion.div>

        {/* Strength Meter */}
        <div className="mt-8 mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confidence Score</span>
            <span className="text-xl font-mono font-bold">{signalStrength}/100</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${signalStrength}%` }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={cn("h-full", meterColor)}
            />
          </div>
        </div>

        {/* Technicals Grid */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">RSI (14)</span>
            <span className={cn(
              "font-mono font-bold text-lg",
              (indicators.rsi ?? 50) > 70 ? "text-destructive" : (indicators.rsi ?? 50) < 30 ? "text-success" : "text-foreground"
            )}>
              {indicators.rsi?.toFixed(2) ?? "—"}
            </span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">MACD</span>
            <span className={cn(
              "font-mono font-bold text-lg",
              (indicators.macd ?? 0) > 0 ? "text-success" : "text-destructive"
            )}>
              {indicators.macd?.toFixed(2) ?? "—"}
            </span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">SMA 20</span>
            <span className="font-mono font-bold text-lg text-foreground">
              {indicators.sma20 ? indicators.sma20.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
            </span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">SMA 200</span>
            <span className="font-mono font-bold text-lg text-foreground">
              {indicators.sma200 ? indicators.sma200.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
