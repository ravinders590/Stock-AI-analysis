import { Router, type IRouter } from "express";
import {
  GetStockQuoteResponse,
  GetStockHistoryResponse,
  GetStockAnalysisResponse,
  SearchStocksResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const YAHOO_BASE = "https://query1.finance.yahoo.com";

async function yahooFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  return res.json();
}

const PERIOD_RANGE: Record<string, { range: string; interval: string }> = {
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y":  { range: "1y",  interval: "1wk" },
  "2y":  { range: "2y",  interval: "1wk" },
  "5y":  { range: "5y",  interval: "1mo" },
};

function calcSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? -c : 0));
  let avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  for (let i = changes.length - period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(closes: number[]): {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
} {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (ema12 === null || ema26 === null) return { macd: null, signal: null, histogram: null };
  const macd = ema12 - ema26;
  const macdLine = closes.slice(-35).map((_, i, arr) => {
    const slice = arr.slice(0, i + 1);
    const e12 = calcEMA(slice, 12);
    const e26 = calcEMA(slice, 26);
    if (e12 === null || e26 === null) return null;
    return e12 - e26;
  }).filter((v): v is number => v !== null);
  const signal = calcEMA(macdLine, 9);
  const histogram = signal !== null ? macd - signal : null;
  return { macd, signal, histogram };
}

function calcBollinger(closes: number[], period = 20): { upper: number | null; middle: number | null; lower: number | null } {
  const sma = calcSMA(closes, period);
  if (sma === null) return { upper: null, middle: null, lower: null };
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, c) => sum + Math.pow(c - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: sma + 2 * std, middle: sma, lower: sma - 2 * std };
}

function calcStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): { k: number | null; d: number | null } {
  if (closes.length < kPeriod) return { k: null, d: null };
  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const hh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const ll = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    kValues.push(hh === ll ? 0 : ((closes[i] - ll) / (hh - ll)) * 100);
  }
  const k = kValues[kValues.length - 1];
  const dSlice = kValues.slice(-dPeriod);
  const d = dSlice.length === dPeriod ? dSlice.reduce((a, b) => a + b, 0) / dPeriod : null;
  return { k, d };
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  if (highs.length < period + 1) return null;
  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hc, lc));
  }
  const recent = trueRanges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

function calcSupportResistance(highs: number[], lows: number[], closes: number[], lookback = 20): { support: number; resistance: number } {
  const recentHighs = highs.slice(-lookback);
  const recentLows = lows.slice(-lookback);
  return {
    resistance: Math.max(...recentHighs),
    support: Math.min(...recentLows),
  };
}

function buildTradingRecommendation(
  overallSignal: string,
  currentPrice: number,
  atr: number,
  bollinger: { upper: number | null; middle: number | null; lower: number | null },
  support: number,
  resistance: number,
  rsi: number | null,
  signalStrength: number
) {
  const isBull = overallSignal === "STRONG_BUY" || overallSignal === "BUY";
  const isBear = overallSignal === "STRONG_SELL" || overallSignal === "SELL";
  const isStrong = overallSignal === "STRONG_BUY" || overallSignal === "STRONG_SELL";

  // ATR multipliers vary by signal strength
  const slMult = isStrong ? 1.2 : 1.5;
  const t1Mult = isStrong ? 1.5 : 1.0;
  const t2Mult = isStrong ? 2.5 : 1.8;
  const t3Mult = isStrong ? 4.0 : 2.8;

  let stopLoss: number;
  let target1: number;
  let target2: number;
  let target3: number;
  let action: "BUY" | "SELL" | "HOLD";
  let holdingPeriod: string;
  let positionAdvice: string;

  if (isBull) {
    action = "BUY";
    // Stop below lower Bollinger or ATR-based
    const bbStop = bollinger.lower ?? (currentPrice - atr * slMult);
    stopLoss = Math.min(bbStop, currentPrice - atr * slMult, support * 0.995);
    stopLoss = Math.max(stopLoss, currentPrice * 0.92); // cap at 8% max loss

    target1 = currentPrice + atr * t1Mult;
    target2 = currentPrice + atr * t2Mult;
    target3 = Math.min(currentPrice + atr * t3Mult, resistance * 1.02);
    target3 = Math.max(target3, target2 * 1.01);

    holdingPeriod = isStrong
      ? "3–7 trading days (short-term swing)"
      : "1–2 weeks (medium-term swing)";
    positionAdvice = rsi !== null && rsi < 35
      ? `Oversold bounce setup — enter between ₹${stopLoss.toFixed(0)}–₹${currentPrice.toFixed(0)}. Use 25–30% capital. Trail stop-loss to entry after T1 hit.`
      : `Bullish breakout — enter near ₹${currentPrice.toFixed(0)}. Allocate 20–25% of capital. Move stop to cost after T1 target. Book 50% at T2, hold rest for T3.`;
  } else if (isBear) {
    action = "SELL";
    // Stop above upper Bollinger or ATR-based
    const bbStop = bollinger.upper ?? (currentPrice + atr * slMult);
    stopLoss = Math.max(bbStop, currentPrice + atr * slMult, resistance * 1.005);
    stopLoss = Math.min(stopLoss, currentPrice * 1.08); // cap at 8% max loss

    target1 = currentPrice - atr * t1Mult;
    target2 = currentPrice - atr * t2Mult;
    target3 = Math.max(currentPrice - atr * t3Mult, support * 0.98);
    target3 = Math.min(target3, target2 * 0.99);

    holdingPeriod = isStrong
      ? "3–7 trading days (short-term short/put)"
      : "1–2 weeks (medium-term short)";
    positionAdvice = rsi !== null && rsi > 65
      ? `Overbought reversal — short/exit near ₹${currentPrice.toFixed(0)}. Cover 50% at T1. Trail stop to entry after T1. Book rest at T2.`
      : `Bearish trend — sell/exit longs near ₹${currentPrice.toFixed(0)}. Keep position small (15–20% of capital). Use options for defined risk.`;
  } else {
    action = "HOLD";
    stopLoss = currentPrice - atr * 2;
    target1 = currentPrice + atr * 1.0;
    target2 = currentPrice + atr * 2.0;
    target3 = currentPrice + atr * 3.0;
    holdingPeriod = "Wait for clear breakout signal (1–5 days)";
    positionAdvice = `Mixed signals — hold existing positions with stop at ₹${stopLoss.toFixed(0)}. Avoid fresh entries. Wait for RSI/MACD alignment before adding.`;
  }

  const riskAmount = Math.abs(currentPrice - stopLoss);
  const rewardT1 = Math.abs(target1 - currentPrice);
  const riskRewardRatio = riskAmount > 0 ? rewardT1 / riskAmount : 0;

  const pct = (a: number, b: number) => ((Math.abs(a - b) / b) * 100);
  const sign = isBear ? -1 : 1;

  return {
    action,
    entryPrice: Number(currentPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    target1: Number(target1.toFixed(2)),
    target2: Number(target2.toFixed(2)),
    target3: Number(target3.toFixed(2)),
    riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
    holdingPeriod,
    positionAdvice,
    stopLossPct: Number((pct(stopLoss, currentPrice) * -1).toFixed(2)),
    target1Pct: Number((pct(target1, currentPrice) * sign).toFixed(2)),
    target2Pct: Number((pct(target2, currentPrice) * sign).toFixed(2)),
    target3Pct: Number((pct(target3, currentPrice) * sign).toFixed(2)),
    maxProfitPotential: Number(Math.abs(target3 - currentPrice).toFixed(2)),
    riskAmount: Number(riskAmount.toFixed(2)),
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get("/quote", async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ error: "bad_request", message: "symbol is required" }); return; }

  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const data = (await yahooFetch(url)) as any;
    const result = data?.chart?.result?.[0];
    if (!result) { res.status(404).json({ error: "not_found", message: `Symbol ${symbol} not found` }); return; }

    const meta = result.meta;
    const quote = GetStockQuoteResponse.parse({
      symbol: meta.symbol || symbol,
      name: meta.shortName || meta.longName || symbol,
      price: meta.regularMarketPrice || meta.previousClose,
      change: (meta.regularMarketPrice || meta.previousClose) - (meta.previousClose || 0),
      changePercent: meta.previousClose
        ? (((meta.regularMarketPrice || meta.previousClose) - meta.previousClose) / meta.previousClose) * 100 : 0,
      open: meta.regularMarketOpen ?? meta.previousClose,
      high: meta.regularMarketDayHigh ?? meta.previousClose,
      low: meta.regularMarketDayLow ?? meta.previousClose,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: meta.marketCap ?? 0,
      previousClose: meta.previousClose ?? 0,
      currency: meta.currency || "USD",
      exchange: meta.exchangeName || meta.fullExchangeName || "",
      updatedAt: new Date().toISOString(),
    });
    res.json(quote);
  } catch (err: any) {
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

router.get("/history", async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase().trim();
  const period = String(req.query.period || "3mo");
  if (!symbol) { res.status(400).json({ error: "bad_request", message: "symbol is required" }); return; }
  const conf = PERIOD_RANGE[period] || PERIOD_RANGE["3mo"];

  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${symbol}?interval=${conf.interval}&range=${conf.range}`;
    const raw = (await yahooFetch(url)) as any;
    const result = raw?.chart?.result?.[0];
    if (!result) { res.status(404).json({ error: "not_found", message: `Symbol ${symbol} not found` }); return; }

    const timestamps: number[] = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};
    const opens: number[] = ohlcv.open || [];
    const highs: number[] = ohlcv.high || [];
    const lows: number[] = ohlcv.low || [];
    const closesRaw: number[] = ohlcv.close || [];
    const volumes: number[] = ohlcv.volume || [];

    const data = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      open: Number((opens[i] || 0).toFixed(2)),
      high: Number((highs[i] || 0).toFixed(2)),
      low: Number((lows[i] || 0).toFixed(2)),
      close: Number((closesRaw[i] || 0).toFixed(2)),
      volume: volumes[i] || 0,
    })).filter((d) => d.close > 0);

    res.json(GetStockHistoryResponse.parse({ symbol, period, data }));
  } catch (err: any) {
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

router.get("/analysis", async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase().trim();
  const period = String(req.query.period || "3mo");
  if (!symbol) { res.status(400).json({ error: "bad_request", message: "symbol is required" }); return; }

  try {
    const extendedRange = period === "1mo" ? "6mo" : period === "3mo" ? "1y" : "2y";
    const url = `${YAHOO_BASE}/v8/finance/chart/${symbol}?interval=1d&range=${extendedRange}`;
    const raw = (await yahooFetch(url)) as any;
    const result = raw?.chart?.result?.[0];
    if (!result) { res.status(404).json({ error: "not_found", message: `Symbol ${symbol} not found` }); return; }

    const ohlcv = result.indicators?.quote?.[0] || {};
    const closes:  number[] = (ohlcv.close  || []).filter((v: number) => v != null && !isNaN(v));
    const highs:   number[] = (ohlcv.high   || []).filter((v: number) => v != null && !isNaN(v));
    const lows:    number[] = (ohlcv.low    || []).filter((v: number) => v != null && !isNaN(v));

    const currentPrice = closes[closes.length - 1] || 0;

    // Technical indicators
    const sma20  = calcSMA(closes, 20);
    const sma50  = calcSMA(closes, 50);
    const sma200 = calcSMA(closes, 200);
    const ema12  = calcEMA(closes, 12);
    const ema26  = calcEMA(closes, 26);
    const rsi    = calcRSI(closes);
    const { macd, signal: macdSignal, histogram: macdHistogram } = calcMACD(closes);
    const bollinger  = calcBollinger(closes);
    const stochastic = calcStochastic(highs, lows, closes);
    const atr        = calcATR(highs, lows, closes, 14);
    const { support, resistance } = calcSupportResistance(highs, lows, closes, 20);

    // Generate signals
    const signals: { name: string; signal: "BUY" | "SELL" | "NEUTRAL"; value: string; description: string }[] = [];
    let buyCount = 0, sellCount = 0;

    const addSignal = (name: string, signal: "BUY" | "SELL" | "NEUTRAL", value: string, description: string) => {
      if (signal === "BUY") buyCount++;
      if (signal === "SELL") sellCount++;
      signals.push({ name, signal, value, description });
    };

    if (rsi !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : "NEUTRAL";
      addSignal("RSI (14)", s, rsi.toFixed(1),
        rsi < 30 ? "Oversold — potential reversal upward" : rsi > 70 ? "Overbought — potential reversal downward" : `Neutral (${rsi.toFixed(1)})`);
    }
    if (macd !== null && macdSignal !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = macd > macdSignal ? "BUY" : macd < macdSignal ? "SELL" : "NEUTRAL";
      addSignal("MACD", s, `${macd.toFixed(2)} / ${macdSignal.toFixed(2)}`,
        s === "BUY" ? "MACD above signal — bullish momentum" : s === "SELL" ? "MACD below signal — bearish momentum" : "MACD at signal");
    }
    if (sma20 !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = currentPrice > sma20 ? "BUY" : currentPrice < sma20 ? "SELL" : "NEUTRAL";
      addSignal("SMA 20", s, `₹${sma20.toFixed(2)}`,
        s === "BUY" ? `Price above 20-day MA (₹${sma20.toFixed(0)})` : `Price below 20-day MA (₹${sma20.toFixed(0)})`);
    }
    if (sma50 !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = currentPrice > sma50 ? "BUY" : currentPrice < sma50 ? "SELL" : "NEUTRAL";
      addSignal("SMA 50", s, `₹${sma50.toFixed(2)}`,
        s === "BUY" ? `Price above 50-day MA (₹${sma50.toFixed(0)})` : `Price below 50-day MA (₹${sma50.toFixed(0)})`);
    }
    if (sma200 !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = currentPrice > sma200 ? "BUY" : currentPrice < sma200 ? "SELL" : "NEUTRAL";
      addSignal("SMA 200", s, `₹${sma200.toFixed(2)}`,
        s === "BUY" ? "Price above 200-day MA (long-term bullish)" : "Price below 200-day MA (long-term bearish)");
    }
    if (bollinger.upper !== null && bollinger.lower !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = currentPrice < bollinger.lower! ? "BUY" : currentPrice > bollinger.upper! ? "SELL" : "NEUTRAL";
      addSignal("Bollinger Bands", s, `₹${bollinger.lower!.toFixed(0)} – ₹${bollinger.upper!.toFixed(0)}`,
        s === "BUY" ? "Below lower band — oversold" : s === "SELL" ? "Above upper band — overbought" : "Within bands — neutral");
    }
    if (stochastic.k !== null && stochastic.d !== null) {
      const s: "BUY" | "SELL" | "NEUTRAL" = stochastic.k < 20 && stochastic.d < 20 ? "BUY" : stochastic.k > 80 && stochastic.d > 80 ? "SELL" : "NEUTRAL";
      addSignal("Stochastic (%K/%D)", s, `${stochastic.k.toFixed(1)} / ${stochastic.d.toFixed(1)}`,
        s === "BUY" ? "Oversold stochastic — bullish reversal" : s === "SELL" ? "Overbought — bearish reversal" : "Neutral territory");
    }

    const total = signals.length;
    const strength = total > 0 ? Math.round(Math.max(buyCount, sellCount) / total * 100) : 50;
    const dominance = total > 0 ? buyCount / total : 0.5;

    const overallSignal =
      buyCount > sellCount ? (dominance >= 0.7 ? "STRONG_BUY" : "BUY") :
      sellCount > buyCount ? ((sellCount / Math.max(total, 1)) >= 0.7 ? "STRONG_SELL" : "SELL") : "HOLD";

    const summaryMap: Record<string, string> = {
      STRONG_BUY: `Strong buy: ${buyCount}/${total} indicators bullish. RSI${rsi !== null ? ` at ${rsi.toFixed(0)}` : ""}, trend and momentum support upside.`,
      BUY: `Buy signal: ${buyCount}/${total} indicators bullish. Momentum tilts positive.`,
      HOLD: `Hold: mixed signals (${buyCount} buy / ${sellCount} sell). No clear trend — wait for confirmation.`,
      SELL: `Sell signal: ${sellCount}/${total} indicators bearish. Momentum tilts negative.`,
      STRONG_SELL: `Strong sell: ${sellCount}/${total} indicators bearish. Consider reducing exposure.`,
    };

    // Build AI trading recommendation using ATR
    const effectiveATR = atr ?? currentPrice * 0.015; // fallback to 1.5% if ATR unavailable
    const trading = buildTradingRecommendation(
      overallSignal, currentPrice, effectiveATR,
      bollinger, support, resistance, rsi, strength
    );

    const analysis = GetStockAnalysisResponse.parse({
      symbol,
      currentPrice,
      overallSignal,
      signalStrength: strength,
      summary: summaryMap[overallSignal] || "Analysis complete.",
      indicators: {
        sma20:          sma20   ? Number(sma20.toFixed(2))   : null,
        sma50:          sma50   ? Number(sma50.toFixed(2))   : null,
        sma200:         sma200  ? Number(sma200.toFixed(2))  : null,
        ema12:          ema12   ? Number(ema12.toFixed(2))   : null,
        ema26:          ema26   ? Number(ema26.toFixed(2))   : null,
        rsi:            rsi     ? Number(rsi.toFixed(2))     : null,
        macd:           macd    ? Number(macd.toFixed(4))    : null,
        macdSignal:     macdSignal ? Number(macdSignal.toFixed(4)) : null,
        macdHistogram:  macdHistogram ? Number(macdHistogram.toFixed(4)) : null,
        bollingerUpper: bollinger.upper ? Number(bollinger.upper.toFixed(2)) : null,
        bollingerMiddle:bollinger.middle ? Number(bollinger.middle.toFixed(2)) : null,
        bollingerLower: bollinger.lower ? Number(bollinger.lower.toFixed(2)) : null,
        stochasticK:    stochastic.k ? Number(stochastic.k.toFixed(2)) : null,
        stochasticD:    stochastic.d ? Number(stochastic.d.toFixed(2)) : null,
        atr:            atr ? Number(atr.toFixed(2)) : null,
        support:        Number(support.toFixed(2)),
        resistance:     Number(resistance.toFixed(2)),
      },
      signals,
      trading,
      period,
      analyzedAt: new Date().toISOString(),
    });

    res.json(analysis);
  } catch (err: any) {
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

router.get("/search", async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (!query) { res.status(400).json({ error: "bad_request", message: "query is required" }); return; }

  try {
    const [rawGeneral, rawNSE] = await Promise.allSettled([
      yahooFetch(`${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`),
      yahooFetch(`${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query + ".NS")}&quotesCount=6&newsCount=0`),
    ]);

    const generalQuotes = (rawGeneral.status === "fulfilled" ? (rawGeneral.value as any)?.quotes : []) || [];
    const nseQuotes = (rawNSE.status === "fulfilled" ? (rawNSE.value as any)?.quotes : []) || [];

    const INDIAN_EXCHANGES = new Set(["NSI", "BSE", "NSE"]);
    const seen = new Set<string>();

    const prioritized = [...generalQuotes, ...nseQuotes]
      .filter((q: any) => q.symbol && (q.shortname || q.longname))
      .filter((q: any) => { if (seen.has(q.symbol)) return false; seen.add(q.symbol); return true; })
      .sort((a: any, b: any) => {
        const aI = INDIAN_EXCHANGES.has(a.exchange) || a.symbol?.endsWith(".NS") || a.symbol?.endsWith(".BO");
        const bI = INDIAN_EXCHANGES.has(b.exchange) || b.symbol?.endsWith(".NS") || b.symbol?.endsWith(".BO");
        return aI && !bI ? -1 : !aI && bI ? 1 : 0;
      })
      .slice(0, 8)
      .map((q: any) => ({ symbol: q.symbol, name: q.shortname || q.longname || q.symbol, exchange: q.exchange || "", type: q.quoteType || "EQUITY" }));

    res.json(SearchStocksResponse.parse({ results: prioritized, query }));
  } catch (err: any) {
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

export default router;
