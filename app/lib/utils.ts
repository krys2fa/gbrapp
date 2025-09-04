import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
