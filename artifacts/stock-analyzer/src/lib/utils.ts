import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "USD"): string {
  const isIndian = currency === "INR";
  return new Intl.NumberFormat(isIndian ? "en-IN" : "en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPrice(value: number, currency: string = "USD"): string {
  const isIndian = currency === "INR";
  const symbol = isIndian ? "₹" : "$";
  if (isIndian) {
    return `${symbol}${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  }
  return `${symbol}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatPriceShort(value: number, currency: string = "USD"): string {
  const isIndian = currency === "INR";
  const symbol = isIndian ? "₹" : "$";
  if (value >= 1000) {
    return `${symbol}${new Intl.NumberFormat(isIndian ? "en-IN" : "en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(value))}`;
  }
  return `${symbol}${value.toFixed(2)}`;
}

export function formatCompactNumber(number: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number);
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function isIndianSymbol(symbol: string): boolean {
  return (
    symbol.endsWith(".NS") ||
    symbol.endsWith(".BO") ||
    symbol.startsWith("^NSEI") ||
    symbol.startsWith("^NSEB") ||
    symbol.startsWith("^CNX") ||
    symbol === "^NSEBANK" ||
    symbol === "^CNXIT"
  );
}
