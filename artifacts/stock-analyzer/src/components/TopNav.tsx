import React, { useState, useRef, useEffect } from "react";
import { Search, Activity, Terminal, ArrowRight, TrendingUp, Layers } from "lucide-react";
import { useSearchStocks, useGetPopularStocks } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface TopNavProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Index":     "bg-primary/15 text-primary border-primary/30",
  "Large Cap": "bg-success/10 text-success border-success/30",
  "Mid Cap":   "bg-warning/10 text-warning border-warning/30",
};

export function TopNav({ currentSymbol, onSelectSymbol }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = debouncedQuery.length > 1;

  const { data: searchResults, isLoading: searchLoading } = useSearchStocks(
    { query: debouncedQuery },
    { query: { enabled: isSearching } }
  );

  const { data: popularData } = useGetPopularStocks(
    { query: { enabled: isFocused && !isSearching } }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
      if (e.key === "Escape") {
        setIsFocused(false);
        setSearchQuery("");
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (symbol: string) => {
    onSelectSymbol(symbol);
    setSearchQuery("");
    setIsFocused(false);
  };

  const displaySymbol =
    currentSymbol === "^NSEI"    ? "NIFTY 50"   :
    currentSymbol === "^NSEBANK" ? "BANKNIFTY"  :
    currentSymbol === "^CNXIT"   ? "NIFTY IT"   :
    currentSymbol;

  const showDropdown = isFocused && (isSearching || true);

  // Group popular stocks by category
  const grouped = popularData?.stocks?.reduce((acc: Record<string, typeof popularData.stocks>, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {}) ?? {};

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-foreground">NSE<span className="text-primary">TERMINAL</span></h1>
            <div className="flex items-center gap-1.5 text-[10px] text-success terminal-text uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              India Markets Live
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-auto relative" ref={dropdownRef}>
          <div className={cn(
            "relative group flex items-center w-full rounded-lg border bg-card px-3 py-2 transition-all duration-200",
            isFocused
              ? "border-primary ring-1 ring-primary/50 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
              : "border-border hover:border-border/80"
          )}>
            <Search className="w-4 h-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search any NSE/BSE stock, index or company name..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground terminal-text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground text-xs ml-2 px-1"
              >✕</button>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/50 flex-shrink-0">
                <kbd>⌘</kbd><kbd>K</kbd>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
              {isSearching ? (
                // Live search results
                searchLoading ? (
                  <div className="p-4 flex items-center justify-center text-sm text-muted-foreground gap-2">
                    <Activity className="w-4 h-4 animate-spin" /> Searching NSE/BSE...
                  </div>
                ) : searchResults?.results && searchResults.results.length > 0 ? (
                  <ul className="py-1">
                    <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" /> Search Results
                    </div>
                    {searchResults.results.map((r) => (
                      <li key={r.symbol}>
                        <button
                          onClick={() => handleSelect(r.symbol)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary text-left transition-colors group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{r.symbol}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[280px]">{r.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">{r.exchange}</span>
                            <span className="text-[10px] text-muted-foreground">{r.type}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 duration-150" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground terminal-text">No assets found for "{searchQuery}"</div>
                )
              ) : (
                // Popular stocks (default when focused, no query)
                <div>
                  <div className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Popular Indian Stocks &amp; Indices
                  </div>
                  {Object.entries(grouped).map(([category, stocks]) => (
                    <div key={category}>
                      <div className={cn(
                        "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                        category === "Index" ? "text-primary" : category === "Large Cap" ? "text-success" : "text-warning"
                      )}>
                        {category}
                      </div>
                      <ul className="py-0.5">
                        {stocks.map((s) => (
                          <li key={s.symbol}>
                            <button
                              onClick={() => handleSelect(s.symbol)}
                              className={cn(
                                "w-full flex items-center justify-between px-4 py-2 hover:bg-secondary text-left transition-colors group",
                                currentSymbol === s.symbol && "bg-primary/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-sm font-bold transition-colors",
                                    currentSymbol === s.symbol ? "text-primary" : "text-foreground group-hover:text-primary"
                                  )}>{s.symbol.replace(".NS", "").replace(".BO", "")}</span>
                                  <span className="text-xs text-muted-foreground">{s.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                  CATEGORY_COLORS[category] || "bg-secondary text-muted-foreground border-border"
                                )}>{s.sector}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 duration-150" />
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">Start typing to search any NSE/BSE listed company</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active symbol indicator */}
        <div className="flex-shrink-0 flex items-center text-xs text-muted-foreground terminal-text border border-border rounded px-3 py-1.5 bg-secondary">
          INDEX: <span className="text-foreground font-bold ml-2">{displaySymbol}</span>
        </div>
      </div>
    </header>
  );
}
