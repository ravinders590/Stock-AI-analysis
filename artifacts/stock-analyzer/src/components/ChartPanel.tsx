import React, { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useGetStockHistory, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { formatPriceShort, formatPrice, formatPercentage, isIndianSymbol, cn } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface ChartPanelProps {
  symbol: string;
  period: GetStockHistoryPeriod;
  onPeriodChange: (period: GetStockHistoryPeriod) => void;
}

const PERIODS: { label: string; value: GetStockHistoryPeriod }[] = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
  basePrice,
}: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  const change = basePrice ? data.close - basePrice : 0;
  const changePct = basePrice ? (change / basePrice) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl min-w-[180px]">
      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-muted-foreground">CLOSE</span>
          <span className="font-mono font-bold text-sm">{formatPrice(data.close, currency)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-muted-foreground">OPEN</span>
          <span className="font-mono text-xs text-muted-foreground">{formatPrice(data.open, currency)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-muted-foreground">HIGH</span>
          <span className="font-mono text-xs text-success">{formatPrice(data.high, currency)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-muted-foreground">LOW</span>
          <span className="font-mono text-xs text-destructive">{formatPrice(data.low, currency)}</span>
        </div>
        <div className="border-t border-border mt-1 pt-1 flex justify-between items-center gap-4">
          <span className="text-[10px] text-muted-foreground">CHG</span>
          <span className={cn("font-mono font-bold text-xs", isUp ? "text-success" : "text-destructive")}>
            {isUp ? "+" : ""}{formatPrice(change, currency)} ({formatPercentage(changePct)})
          </span>
        </div>
      </div>
    </div>
  );
};

export function ChartPanel({ symbol, period, onPeriodChange }: ChartPanelProps) {
  const { data: history, isLoading } = useGetStockHistory({ symbol, period });
  const currency = isIndianSymbol(symbol) ? "INR" : "USD";

  const { chartData, basePrice, totalChange, totalChangePct, minPrice, maxPrice } = useMemo(() => {
    if (!history?.data || history.data.length === 0) {
      return { chartData: [], basePrice: 0, totalChange: 0, totalChangePct: 0, minPrice: 0, maxPrice: 0 };
    }

    const base = history.data[0].close;
    const last = history.data[history.data.length - 1].close;
    const change = last - base;
    const changePct = base ? (change / base) * 100 : 0;

    const minP = Math.min(...history.data.map((d) => d.low));
    const maxP = Math.max(...history.data.map((d) => d.high));

    const data = history.data.map((d) => ({
      ...d,
      displayDate: format(
        parseISO(d.date),
        period === "1mo" ? "dd MMM" : period === "3mo" || period === "6mo" ? "dd MMM" : "MMM yy"
      ),
      pctChange: base ? ((d.close - base) / base) * 100 : 0,
    }));

    return {
      chartData: data,
      basePrice: base,
      totalChange: change,
      totalChangePct: changePct,
      minPrice: minP,
      maxPrice: maxP,
    };
  }, [history, period]);

  const isPositiveTrend = totalChange >= 0;
  const strokeColor = isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--destructive))";
  const fillId = isPositiveTrend ? "colorSuccess" : "colorDestructive";

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[450px]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Price Action
          </h3>
          {chartData.length > 0 && (
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-mono font-bold px-2 py-0.5 rounded border",
              isPositiveTrend
                ? "text-success border-success/30 bg-success/10"
                : "text-destructive border-destructive/30 bg-destructive/10"
            )}>
              {isPositiveTrend ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositiveTrend ? "+" : ""}{formatPrice(totalChange, currency)}</span>
              <span className="opacity-80">({formatPercentage(totalChangePct)})</span>
            </div>
          )}
        </div>

        <div className="flex bg-secondary rounded border border-border p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={cn(
                "px-3 py-1 rounded text-xs font-mono font-medium transition-all duration-200",
                period === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-2 pt-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
              <span className="font-mono text-sm text-primary tracking-widest">LOADING CHART DATA...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 55, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDestructive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={35}
              fontFamily="Fira Code, monospace"
            />

            {/* Left Y-axis: Price in INR/USD */}
            <YAxis
              yAxisId="price"
              orientation="left"
              domain={[minPrice * 0.97, maxPrice * 1.03]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatPriceShort(val, currency)}
              fontFamily="Fira Code, monospace"
              width={70}
            />

            {/* Right Y-axis: Percentage change */}
            <YAxis
              yAxisId="pct"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`}
              fontFamily="Fira Code, monospace"
              width={52}
            />

            <Tooltip
              content={
                <CustomTooltip
                  currency={currency}
                  basePrice={basePrice}
                />
              }
            />

            {/* Reference line at period start */}
            {chartData.length > 0 && (
              <ReferenceLine
                yAxisId="price"
                y={basePrice}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                opacity={0.5}
              />
            )}

            {/* Price area */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${fillId})`}
              animationDuration={800}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
            />

            {/* % change line */}
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="pctChange"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              opacity={0.4}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: period summary */}
      {chartData.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-card/30 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>
            PERIOD OPEN: <span className="text-foreground font-bold">{formatPrice(basePrice, currency)}</span>
          </span>
          <span>
            PERIOD RETURN:{" "}
            <span className={cn("font-bold", isPositiveTrend ? "text-success" : "text-destructive")}>
              {isPositiveTrend ? "+" : ""}{formatPercentage(totalChangePct)}
            </span>
          </span>
          <span>
            LAST CLOSE:{" "}
            <span className="text-foreground font-bold">
              {chartData.length > 0 ? formatPrice(chartData[chartData.length - 1].close, currency) : "—"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
