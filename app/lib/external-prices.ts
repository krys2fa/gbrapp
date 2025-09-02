import { prisma } from "@/app/lib/prisma";

// Map common commodity symbols to names understood by the external API
const SYMBOL_TO_NAME: Record<string, string> = {
  XAU: "gold",
  XAG: "silver",
  XPT: "platinum",
  XPD: "palladium",
};

/**
 * Try fetching a commodity spot price from a free API and persist it.
 * Returns the created DailyPrice record, or null if nothing was fetched.
 */
export async function fetchAndSaveCommodityPriceIfMissing(commodityId: string) {
  // find commodity to get its symbol
  const commodity = await prisma.commodity.findUnique({
    where: { id: commodityId },
  });
  if (!commodity) return null;

  const symbol = (commodity.symbol || "").toUpperCase();
  const mapped = SYMBOL_TO_NAME[symbol] || commodity.name?.toLowerCase();
  if (!mapped) return null;

  try {
    // Try first provider: metals.live (various shapes)
    try {
      const res = await fetch("https://api.metals.live/v1/spot");
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body) {
          // Normalize several shapes into { metal, price }
          const normalized: Array<{ metal: string; price: number }> = [];
          if (Array.isArray(body)) {
            for (const item of body) {
              if (item && typeof item === "object") {
                if (typeof item.metal === "string" && item.price != null) {
                  normalized.push({
                    metal: String(item.metal).toLowerCase(),
                    price: Number(item.price),
                  });
                } else {
                  // maybe shape like { "gold": 1960.5 }
                  const keys = Object.keys(item);
                  if (keys.length === 1 && typeof item[keys[0]] === "number") {
                    normalized.push({
                      metal: String(keys[0]).toLowerCase(),
                      price: Number(item[keys[0]]),
                    });
                  }
                }
              }
            }
          } else if (typeof body === "object") {
            // maybe object mapping metal->price
            for (const k of Object.keys(body)) {
              const v = (body as any)[k];
              if (typeof v === "number")
                normalized.push({
                  metal: String(k).toLowerCase(),
                  price: Number(v),
                });
            }
          }

          const found = normalized.find((n) => n.metal === String(mapped));
          if (found && Number.isFinite(found.price)) {
            const price = Number(found.price);
            const rounded = Number(price.toFixed(2));
            const created = await prisma.dailyPrice.create({
              data: {
                type: "COMMODITY",
                price: rounded,
                commodityId,
              },
            });
            return created;
          }
        }
      }
    } catch (e) {
      console.warn("metals.live fetch failed", e);
    }

    // Fallback provider: goldprice.org / data-asg endpoint returns nested data
    try {
      const alt = await fetch("https://data-asg.goldprice.org/dbXRates/USD");
      if (alt.ok) {
        const j = await alt.json().catch(() => null);
        // try to extract xau price from j.items[0].xauPrice or similar
        const items = j?.items;
        if (Array.isArray(items) && items.length > 0) {
          const item0 = items[0];
          // common fields: xauPrice (gold), xagPrice (silver)
          const keyMap: Record<string, string> = {
            gold: "xauPrice",
            silver: "xagPrice",
            platinum: "xptPrice",
            palladium: "xpdPrice",
          };
          const probe = keyMap[mapped] || null;
          if (probe && typeof item0[probe] === "number") {
            const price = Number(item0[probe]);
            if (Number.isFinite(price)) {
              const rounded = Number(price.toFixed(2));
              const created = await prisma.dailyPrice.create({
                data: {
                  type: "COMMODITY",
                  price: rounded,
                  commodityId,
                },
              });
              return created;
            }
          }
        }
      }
    } catch (e) {
      console.warn("goldprice fallback fetch failed", e);
    }

    // nothing found

    return null;
  } catch (err) {
    console.error("external price fetch failed", err);
    return null;
  }
}
