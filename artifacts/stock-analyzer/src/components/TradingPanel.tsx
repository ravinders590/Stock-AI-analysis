import React from "react";
import { useGetStockAnalysis, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { cn, formatPrice, isIndianSymbol } from "@/lib/utils";
import {
  ShieldOff, Target, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Zap, Brain, Timer, BarChart3
} from "lucide-react";

interface TradingPanelProps {
  symbol: string;
  period: GetStockHistoryPeriod;
}

function LevelRow({
  label, price, pct, color, icon, currency,
}: {
  label: string;
  price: number;
  pct: number;
  color: string;
  icon: React.ReactNode;
  currency: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg border", color)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-sm">{formatPrice(price, currency)}</span>
        <span className={cn(
          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
          pct >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
        )}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export function TradingPanel({ symbol, period }: TradingPanelProps) {
  const { data: analysis, isLoading, error } = useGetStockAnalysis({ symbol, period });
  const currency = isIndianSymbol(symbol) ? "INR" : "USD";

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50">
          <div className="h-5 w-52 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analysis?.trading) {
    return (
      <div className="glass-panel p-6 rounded-xl flex items-center justify-center text-muted-foreground border-dashed">
        <div className="text-center">
          <Brain className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="font-mono text-xs uppercase tracking-widest">AI Engine Unavailable</p>
        </div>
      </div>
    );
  }

  const t = analysis.trading;
  const isBuy = t.action === "BUY";
  const isSell = t.action === "SELL";
  const isHold = t.action === "HOLD";

  const actionConfig = {
    BUY: {
      color: "text-success",
      bg: "bg-success/10 border-success/40",
      icon: <TrendingUp className="w-5 h-5" />,
      label: "BUY / LONG",
    },
    SELL: {
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/40",
      icon: <TrendingDown className="w-5 h-5" />,
      label: "SELL / SHORT",
    },
    HOLD: {
      color: "text-warning",
      bg: "bg-warning/10 border-warning/40",
      icon: <Minus className="w-5 h-5" />,
      label: "HOLD / WAIT",
    },
  }[t.action];

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
          AI Trading Recommendation
        </h3>
      </div>

      <div className="p-4 flex flex-col gap-3">

        {/* Action badge */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center justify-between rounded-xl border-2 px-4 py-3",
            actionConfig.bg
          )}
        >
          <div className={cn("flex items-center gap-2 font-black text-xl tracking-tight", actionConfig.color)}>
            {actionConfig.icon}
            {actionConfig.label}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Entry</div>
            <div className="font-mono font-bold text-sm">{formatPrice(t.entryPrice, currency)}</div>
          </div>
        </motion.div>

        {/* Stop Loss */}
        <LevelRow
          label="Stop Loss"
          price={t.stopLoss}
          pct={t.stopLossPct}
          color="border-destructive/30 bg-destructive/5"
          icon={<ShieldOff className="w-4 h-4 text-destructive" />}
          currency={currency}
        />

        {/* Targets */}
        <LevelRow
          label="Target 1 (Conservative)"
          price={t.target1}
          pct={t.target1Pct}
          color="border-success/20 bg-success/5"
          icon={<Target className="w-4 h-4 text-success opacity-60" />}
          currency={currency}
        />
        <LevelRow
          label="Target 2 (Moderate)"
          price={t.target2}
          pct={t.target2Pct}
          color="border-success/30 bg-success/8"
          icon={<Target className="w-4 h-4 text-success opacity-80" />}
          currency={currency}
        />
        <LevelRow
          label="Target 3 (Aggressive)"
          price={t.target3}
          pct={t.target3Pct}
          color="border-success/50 bg-success/10"
          icon={<Target className="w-4 h-4 text-success" />}
          currency={currency}
        />

        {/* Risk/Reward + Max Profit */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-secondary/50 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Risk : Reward
            </div>
            <div className={cn(
              "font-mono font-bold text-lg",
              t.riskRewardRatio >= 2 ? "text-success" : t.riskRewardRatio >= 1 ? "text-warning" : "text-destructive"
            )}>
              1 : {t.riskRewardRatio.toFixed(2)}
            </div>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Max Profit
            </div>
            <div className="font-mono font-bold text-lg text-success">
              +{formatPrice(t.maxProfitPotential, currency)}
            </div>
          </div>
        </div>

        {/* Holding period */}
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <Timer className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Holding Period</div>
            <div className="text-xs font-semibold text-foreground">{t.holdingPeriod}</div>
          </div>
        </div>

        {/* Position advice */}
        <div className="flex items-start gap-2 bg-warning/5 border border-warning/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Position Advice</div>
            <div className="text-xs text-foreground leading-relaxed">{t.positionAdvice}</div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed px-2">
          For educational purposes only. Not financial advice. Always do your own research before trading.
        </p>
      </div>
    </div>
  );
}
