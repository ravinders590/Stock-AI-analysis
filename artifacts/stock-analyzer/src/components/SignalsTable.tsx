import React from "react";
import { useGetStockAnalysis, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SignalsTableProps {
  symbol: string;
  period: GetStockHistoryPeriod;
}

export function SignalsTable({ symbol, period }: SignalsTableProps) {
  const { data: analysis, isLoading } = useGetStockAnalysis({ symbol, period });

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!analysis?.signals || analysis.signals.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-card/50">
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> 
          Technical Signal Breakdown
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-bold">Indicator</th>
              <th className="px-6 py-4 font-bold">Value</th>
              <th className="px-6 py-4 font-bold">Signal</th>
              <th className="px-6 py-4 font-bold hidden sm:table-cell">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {analysis.signals.map((signal, idx) => (
              <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 font-bold text-foreground">
                  {signal.name}
                </td>
                <td className="px-6 py-4 font-mono">
                  {signal.value}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                    signal.signal === "BUY" ? "bg-success/10 text-success border-success/30" :
                    signal.signal === "SELL" ? "bg-destructive/10 text-destructive border-destructive/30" :
                    "bg-warning/10 text-warning border-warning/30"
                  )}>
                    {signal.signal}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell max-w-md truncate">
                  {signal.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
