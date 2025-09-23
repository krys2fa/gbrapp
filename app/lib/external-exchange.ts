import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Fetch USD->GHS rate from Bank of Ghana page when possible, else fallback to exchangerate.host.
 * Persist a DailyPrice record of type EXCHANGE under the given exchangeId with rounded 2 decimals.
 */
export async function fetchAndSaveExchangeRateIfMissing(exchangeId: string) {
  // find exchange entry
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
  });
  if (!exchange) return null;

  // We expect to store USD->GHS rate under the exchange record for USD (symbol 'USD')
  // If the exchange record is not USD, we still attempt to get USD-><symbol> via fallback provider.
  const symbol = (exchange.symbol || exchange.name || "USD").toUpperCase();

  try {
    // Attempt Bank of Ghana first (HTML page). Parse using the saved exchange symbol/name
    // (for example symbol = 'USD', name = 'US Dollar') and extract the nearest numeric rate.
    try {
      const res = await fetch("https://www.bog.gov.gh/currency-exchange-rate/");
      if (res.ok) {
        const html = await res.text().catch(() => "");
        if (html) {
          // Build candidate search terms from the exchange record. For USD prefer common labels.
          const candidates: string[] = [];
          const rawSymbol = (exchange.symbol || "").toString().trim();
          const rawName = (exchange.name || "").toString().trim();
          if (rawSymbol) candidates.push(rawSymbol);
          if (rawName) candidates.push(rawName);
          // Add common alternatives for USD
          if (rawSymbol.toUpperCase() === "USD" || /dollar/i.test(rawName)) {
            candidates.push(
              "US Dollar",
              "United States Dollar",
              "U.S. Dollar",
              "USD"
            );
          }

          // Normalize html to a single line-per-block to improve locality searches
          const normalized = html.replace(/>\s+</g, "><").replace(/\n+/g, " ");

          // Helper to parse a numeric string like '11.97' or '11,970.50'
          const parseNumber = (s: string) => {
            if (!s) return NaN;
            const cleaned = s.replace(/[,\s]/g, "");
            return Number(cleaned);
          };

          let foundRate: number | null = null;

          for (const term of candidates) {
            if (!term) continue;
            // Search for the term then find the first number within the next ~120 characters
            const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const reNear = new RegExp(
              `${safeTerm}.{0,120}?([0-9]{1,3}(?:[.,\\s][0-9]{3})*(?:\\.[0-9]+)?)`,
              "i"
            );
            const m = normalized.match(reNear);
            if (m && m[1]) {
              const n = parseNumber(m[1]);
              if (Number.isFinite(n) && n > 0) {
                foundRate = n;
                break;
              }
            }

            // Also try to find a number that precedes the term (some pages place the rate before the label)
            const reBefore = new RegExp(
              `([0-9]{1,3}(?:[.,\\s][0-9]{3})*(?:\\.[0-9]+)?).{0,60}?${safeTerm}`,
              "i"
            );
            const mb = normalized.match(reBefore);
            if (mb && mb[1]) {
              const n = parseNumber(mb[1]);
              if (Number.isFinite(n) && n > 0) {
                foundRate = n;
                break;
              }
            }
          }

          // Last-resort: fallback to crude USD regex if nothing found
          if (foundRate == null) {
            const crude = normalized.match(
              /(?:US\s*Dollar|USD)[^0-9]{0,30}([0-9]+(?:\.[0-9]+)?)/i
            );
            if (crude && crude[1]) foundRate = parseNumber(crude[1]);
          }

          if (foundRate != null && Number.isFinite(foundRate)) {
            const rounded = Number(foundRate.toFixed(2));
            const created = await prisma.dailyPrice.create({
              data: {
                type: "EXCHANGE",
                price: rounded,
                exchangeId,
                date: new Date(),
              },
            });
            return created;
          }
        }
      }
    } catch (e) {
      await logger.warn(LogCategory.EXCHANGE_RATE, "BOG fetch/parse failed", {
        error: String(e),
      });
    }

    // Fallback: use exchangerate.host to get USD -> target currency
    // If the exchange symbol is GHS, we want USD->GHS; if exchange symbol is USD, we store 1.00
    let target = symbol === "USD" ? "USD" : symbol || "GHS";
    // If the exchange record is GHS or symbol missing, default to GHS
    if (!target) target = "GHS";
    // Use exchangerate.host latest endpoint (free tier)
    const fr = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    if (fr.ok) {
      const j = await fr.json().catch(() => null);
      const rate = j?.rates?.[target];
      if (rate && Number.isFinite(Number(rate))) {
        const rounded = Number(Number(rate).toFixed(2));
        const created = await prisma.dailyPrice.create({
          data: {
            type: "EXCHANGE",
            price: rounded,
            exchangeId,
            date: new Date(),
          },
        });
        return created;
      }
    }

    return null;
  } catch (err) {
    await logger.error(
      LogCategory.EXCHANGE_RATE,
      "external exchange fetch failed",
      { error: String(err) }
    );
    return null;
  }
}
