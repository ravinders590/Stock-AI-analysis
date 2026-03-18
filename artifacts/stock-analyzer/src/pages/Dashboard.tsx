import React, { useState } from "react";
import { GetStockHistoryPeriod } from "@workspace/api-client-react";
import { TopNav } from "@/components/TopNav";
import { QuickPicks } from "@/components/QuickPicks";
import { QuoteHeader } from "@/components/QuoteHeader";
import { ChartPanel } from "@/components/ChartPanel";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { SignalsTable } from "@/components/SignalsTable";
import { TradingPanel } from "@/components/TradingPanel";
import { FundamentalsPanel } from "@/components/FundamentalsPanel";
import { FinancialHistoryPanel } from "@/components/FinancialHistoryPanel";

export default function Dashboard() {
  const [symbol, setSymbol] = useState("^NSEI");
  const [period, setPeriod] = useState<GetStockHistoryPeriod>("3mo");

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <TopNav currentSymbol={symbol} onSelectSymbol={setSymbol} />
      <QuickPicks currentSymbol={symbol} onSelect={setSymbol} />

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Quote header with 1D return */}
        <QuoteHeader symbol={symbol} />

        {/* Company Fundamentals + Pros/Cons — shown at top */}
        <FundamentalsPanel symbol={symbol} />

        {/* Price Chart + Analysis engine side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ChartPanel symbol={symbol} period={period} onPeriodChange={setPeriod} />
          </div>
          <div className="lg:col-span-1">
            <AnalysisPanel symbol={symbol} period={period} />
          </div>
        </div>

        {/* Financial History Graph */}
        <FinancialHistoryPanel symbol={symbol} />

        {/* AI Trading Recommendations + Signal breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <TradingPanel symbol={symbol} period={period} />
          </div>
          <div className="lg:col-span-2">
            <SignalsTable symbol={symbol} period={period} />
          </div>
        </div>

      </main>
    </div>
  );
}
