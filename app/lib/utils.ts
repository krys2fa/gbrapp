import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatExchangeRate(
  rate: number | string | null | undefined
): string {
  if (rate === null || rate === undefined || rate === "") {
    return "-";
  }

  const numRate = typeof rate === "string" ? parseFloat(rate) : rate;

  if (isNaN(numRate)) {
    return "-";
  }

  return numRate.toFixed(4);
}

export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode = "USD",
  showSymbol = true
): string {
  if (value === null || value === undefined || value === "") {
    return showSymbol ? `${currencyCode} 0.00` : "0.00";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return showSymbol ? `${currencyCode} 0.00` : "0.00";
  }

  const formatted = numValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `${currencyCode === "USD" ? "$" : currencyCode === "GHS" ? "GHS" : currencyCode} ${formatted}` : formatted;
}
