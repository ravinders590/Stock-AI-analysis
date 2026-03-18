import { Router, type IRouter } from "express";
import YahooFinance from "yahoo-finance2";
import {
  GetStockFundamentalsResponse,
  GetStockFinancialsResponse,
  GetPopularStocksResponse,
} from "@workspace/api-zod";

const yahooFinance = new YahooFinance();

const router: IRouter = Router();

const POPULAR_STOCKS = [
  // Indices
  { symbol: "^NSEI",    name: "Nifty 50",           sector: "Index",        category: "Index" },
  { symbol: "^NSEBANK", name: "Bank Nifty",          sector: "Banking",      category: "Index" },
  { symbol: "^CNXIT",   name: "Nifty IT",            sector: "Technology",   category: "Index" },
  // Large Cap
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy",     category: "Large Cap" },
  { symbol: "TCS.NS",      name: "Tata Consultancy",    sector: "IT",         category: "Large Cap" },
  { symbol: "INFY.NS",     name: "Infosys",             sector: "IT",         category: "Large Cap" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank",           sector: "Banking",    category: "Large Cap" },
  { symbol: "ICICIBANK.NS",name: "ICICI Bank",          sector: "Banking",    category: "Large Cap" },
  { symbol: "SBIN.NS",     name: "State Bank of India", sector: "Banking",    category: "Large Cap" },
  { symbol: "WIPRO.NS",    name: "Wipro",               sector: "IT",         category: "Large Cap" },
  { symbol: "HINDUNILVR.NS",name:"Hindustan Unilever",  sector: "FMCG",       category: "Large Cap" },
  { symbol: "BHARTIARTL.NS",name:"Bharti Airtel",       sector: "Telecom",    category: "Large Cap" },
  { symbol: "ITC.NS",      name: "ITC Ltd",             sector: "FMCG",       category: "Large Cap" },
  { symbol: "KOTAKBANK.NS",name: "Kotak Mahindra Bank", sector: "Banking",    category: "Large Cap" },
  { symbol: "LT.NS",       name: "Larsen & Toubro",     sector: "Infrastructure", category: "Large Cap" },
  { symbol: "AXISBANK.NS", name: "Axis Bank",           sector: "Banking",    category: "Large Cap" },
  { symbol: "ASIANPAINT.NS",name:"Asian Paints",        sector: "Consumer",   category: "Large Cap" },
  { symbol: "MARUTI.NS",   name: "Maruti Suzuki",       sector: "Auto",       category: "Large Cap" },
  { symbol: "SUNPHARMA.NS",name: "Sun Pharmaceutical",  sector: "Pharma",     category: "Large Cap" },
  { symbol: "TITAN.NS",    name: "Titan Company",       sector: "Consumer",   category: "Large Cap" },
  { symbol: "NESTLEIND.NS",name: "Nestle India",        sector: "FMCG",       category: "Large Cap" },
  { symbol: "HCLTECH.NS",  name: "HCL Technologies",    sector: "IT",         category: "Large Cap" },
  { symbol: "TECHM.NS",    name: "Tech Mahindra",       sector: "IT",         category: "Large Cap" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises",   sector: "Conglomerate", category: "Large Cap" },
  { symbol: "ADANIPORTS.NS",name:"Adani Ports",         sector: "Logistics",  category: "Large Cap" },
  { symbol: "BAJFINANCE.NS",name:"Bajaj Finance",       sector: "NBFC",       category: "Large Cap" },
  { symbol: "ULTRACEMCO.NS",name:"UltraTech Cement",    sector: "Cement",     category: "Large Cap" },
  // Mid Cap
  { symbol: "ZOMATO.NS",   name: "Zomato",              sector: "Technology", category: "Mid Cap" },
  { symbol: "PAYTM.NS",    name: "One97 (Paytm)",       sector: "Fintech",    category: "Mid Cap" },
  { symbol: "NYKAA.NS",    name: "Nykaa (FSN E-Commerce)", sector: "E-Commerce", category: "Mid Cap" },
];

function buildProsAndCons(data: {
  peRatio?: number | null;
  pbRatio?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  revenueGrowthYoY?: number | null;
  profitMargin?: number | null;
  dividendYield?: number | null;
  currentRatio?: number | null;
  operatingMargin?: number | null;
}) {
  const pros: { point: string; detail: string }[] = [];
  const cons: { point: string; detail: string }[] = [];

  if (data.peRatio != null) {
    if (data.peRatio < 15) pros.push({ point: "Low Valuation (P/E)", detail: `P/E of ${data.peRatio.toFixed(1)}x suggests stock may be undervalued relative to peers.` });
    else if (data.peRatio > 50) cons.push({ point: "High Valuation (P/E)", detail: `P/E of ${data.peRatio.toFixed(1)}x is elevated — stock may be overpriced.` });
  }
  if (data.roe != null) {
    if (data.roe > 0.15) pros.push({ point: "Strong Return on Equity", detail: `ROE of ${(data.roe * 100).toFixed(1)}% indicates efficient use of shareholder capital.` });
    else if (data.roe < 0.05) cons.push({ point: "Weak Return on Equity", detail: `ROE of ${(data.roe * 100).toFixed(1)}% is below industry standard — poor capital efficiency.` });
  }
  if (data.debtToEquity != null) {
    if (data.debtToEquity < 0.5) pros.push({ point: "Low Debt Levels", detail: `D/E of ${data.debtToEquity.toFixed(2)} — company has minimal debt obligations, reducing financial risk.` });
    else if (data.debtToEquity > 2) cons.push({ point: "High Debt", detail: `D/E of ${data.debtToEquity.toFixed(2)} — heavy debt load increases financial risk in rising rate environment.` });
  }
  if (data.revenueGrowthYoY != null) {
    if (data.revenueGrowthYoY > 0.10) pros.push({ point: "Strong Revenue Growth", detail: `Revenue grew ${(data.revenueGrowthYoY * 100).toFixed(1)}% YoY — business is expanding rapidly.` });
    else if (data.revenueGrowthYoY < 0) cons.push({ point: "Declining Revenue", detail: `Revenue fell ${(Math.abs(data.revenueGrowthYoY) * 100).toFixed(1)}% YoY — potential business headwinds.` });
  }
  if (data.profitMargin != null) {
    if (data.profitMargin > 0.15) pros.push({ point: "High Profit Margin", detail: `Net margin of ${(data.profitMargin * 100).toFixed(1)}% shows strong pricing power and cost control.` });
    else if (data.profitMargin < 0) cons.push({ point: "Negative Profit Margin", detail: `Company is losing money — net margin of ${(data.profitMargin * 100).toFixed(1)}%. Watch cash burn rate.` });
    else if (data.profitMargin < 0.05) cons.push({ point: "Thin Profit Margin", detail: `Net margin of ${(data.profitMargin * 100).toFixed(1)}% leaves little cushion for downturns.` });
  }
  if (data.dividendYield != null && data.dividendYield > 0) {
    if (data.dividendYield > 0.03) pros.push({ point: "Attractive Dividend Yield", detail: `${(data.dividendYield * 100).toFixed(2)}% yield provides a steady income stream for investors.` });
    else pros.push({ point: "Dividend Paying", detail: `Company returns ${(data.dividendYield * 100).toFixed(2)}% dividend yield to shareholders.` });
  }
  if (data.currentRatio != null) {
    if (data.currentRatio > 1.5) pros.push({ point: "Strong Liquidity", detail: `Current ratio of ${data.currentRatio.toFixed(2)} — ample short-term assets to cover obligations.` });
    else if (data.currentRatio < 1) cons.push({ point: "Liquidity Risk", detail: `Current ratio of ${data.currentRatio.toFixed(2)} — current liabilities exceed current assets.` });
  }
  if (data.pbRatio != null) {
    if (data.pbRatio < 1) pros.push({ point: "Trades Below Book Value", detail: `P/B of ${data.pbRatio.toFixed(2)}x — stock is priced below net asset value (deep value opportunity).` });
    else if (data.pbRatio > 10) cons.push({ point: "High Price-to-Book", detail: `P/B of ${data.pbRatio.toFixed(2)}x — significant premium to book may limit upside.` });
  }
  if (data.operatingMargin != null && data.operatingMargin > 0.20) {
    pros.push({ point: "High Operating Efficiency", detail: `Operating margin of ${(data.operatingMargin * 100).toFixed(1)}% reflects a highly efficient, scalable business.` });
  }
  if (pros.length === 0) pros.push({ point: "Established Business", detail: "Company has a track record in its sector. Fundamental data may be limited — check annual reports." });
  if (cons.length === 0) cons.push({ point: "Market Competition", detail: "Subject to competitive pressures. Monitor peer performance and market share trends regularly." });
  return { pros: pros.slice(0, 5), cons: cons.slice(0, 5) };
}

// GET /stocks/popular
router.get("/popular", async (_req, res) => {
  try {
    res.json(GetPopularStocksResponse.parse({ stocks: POPULAR_STOCKS }));
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err.message });
  }
});

// GET /stocks/fundamentals?symbol=
router.get("/fundamentals", async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ error: "bad_request", message: "symbol is required" }); return; }

  try {
    // Fetch quote summary modules
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ["summaryProfile", "financialData", "defaultKeyStatistics", "assetProfile"],
    });

    const profile = (summary.summaryProfile || summary.assetProfile || {}) as any;
    const fd = (summary.financialData || {}) as any;
    const ks = (summary.defaultKeyStatistics || {}) as any;

    // Fetch basic quote for market cap and 52w
    const quote = await yahooFinance.quote(symbol);

    const peRatio = ks.trailingPE ?? fd.trailingPE ?? null;
    const pbRatio = ks.priceToBook ?? null;
    const eps = ks.trailingEps ?? null;
    const dividendYield = ks.dividendYield ?? fd.dividendYield ?? null;
    const roe = fd.returnOnEquity ?? null;
    const rawDE = fd.debtToEquity ?? null;
    const debtToEquity = rawDE !== null ? rawDE / 100 : null;
    const currentRatio = fd.currentRatio ?? null;
    const revenueGrowthYoY = fd.revenueGrowth ?? null;
    const profitMargin = fd.profitMargins ?? null;
    const operatingMargin = fd.operatingMargins ?? null;
    const revenue = fd.totalRevenue ?? null;
    const netIncome = fd.netIncomeToCommon ?? null;
    const bookValue = ks.bookValue ?? null;

    const { pros, cons } = buildProsAndCons({
      peRatio, pbRatio, roe, debtToEquity, revenueGrowthYoY,
      profitMargin, dividendYield, currentRatio, operatingMargin,
    });

    const response = GetStockFundamentalsResponse.parse({
      symbol,
      name: (quote as any).longName || (quote as any).shortName || profile.longName || symbol,
      description: profile.longBusinessSummary || null,
      sector: profile.sector || null,
      industry: profile.industry || null,
      website: profile.website || null,
      employees: profile.fullTimeEmployees || null,
      marketCap: (quote as any).marketCap ?? null,
      peRatio: peRatio ?? null,
      pbRatio: pbRatio ?? null,
      eps: eps ?? null,
      dividendYield: dividendYield ?? null,
      roe: roe ?? null,
      roce: null,
      debtToEquity: debtToEquity ?? null,
      currentRatio: currentRatio ?? null,
      revenueGrowthYoY: revenueGrowthYoY ?? null,
      profitMargin: profitMargin ?? null,
      operatingMargin: operatingMargin ?? null,
      revenue: revenue ?? null,
      netIncome: netIncome ?? null,
      bookValue: bookValue ?? null,
      fiftyTwoWeekHigh: (quote as any).fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: (quote as any).fiftyTwoWeekLow ?? null,
      pros,
      cons,
      currency: (quote as any).currency || "INR",
    });

    res.json(response);
  } catch (err: any) {
    console.error("Fundamentals error:", err.message);
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

// GET /stocks/financials?symbol=
router.get("/financials", async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ error: "bad_request", message: "symbol is required" }); return; }

  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ["incomeStatementHistory"],
    });

    const quote = await yahooFinance.quote(symbol);
    const currency = (quote as any).currency || "INR";

    const statements = (summary.incomeStatementHistory?.incomeStatementHistory || []) as any[];
    const annualData = [...statements].reverse().map((s: any) => {
      const endDate = s.endDate;
      const year = endDate instanceof Date
        ? endDate.getFullYear().toString()
        : typeof endDate === "string"
        ? endDate.slice(0, 4)
        : new Date(endDate * 1000).getFullYear().toString();
      return {
        year,
        revenue: s.totalRevenue ?? null,
        netIncome: s.netIncome ?? null,
        eps: s.dilutedEPS ?? null,
        operatingIncome: s.operatingIncome ?? null,
        grossProfit: s.grossProfit ?? null,
      };
    });

    res.json(GetStockFinancialsResponse.parse({ symbol, currency, annualData }));
  } catch (err: any) {
    console.error("Financials error:", err.message);
    res.status(502).json({ error: "upstream_error", message: err.message });
  }
});

export default router;
