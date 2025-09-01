import { prisma } from "@/app/lib/prisma";

const GRAMS_PER_TROY_OUNCE = 31.1034768;

function csvEscape(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "10");
  const exporterId = url.searchParams.get("exporterId") || undefined;
  const startDate = url.searchParams.get("startDate")
    ? new Date(url.searchParams.get("startDate")!)
    : undefined;
  const endDate = url.searchParams.get("endDate")
    ? new Date(url.searchParams.get("endDate")!)
    : undefined;
  const minNetGold = url.searchParams.get("minNetGold")
    ? Number(url.searchParams.get("minNetGold"))
    : undefined;
  const maxNetGold = url.searchParams.get("maxNetGold")
    ? Number(url.searchParams.get("maxNetGold"))
    : undefined;
  const includeFees =
    url.searchParams.get("includeFees") === "1" ||
    url.searchParams.get("includeFees") === "true";
  const download = url.searchParams.get("download") === "csv";
  const columnsParam = url.searchParams.get("columns") || undefined;
  const requestedColumns = columnsParam
    ? columnsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  // Build where clause for jobCards
  const where: any = {};
  if (exporterId) where.exporterId = exporterId;
  if (startDate || endDate) where.createdAt = {};
  if (startDate) where.createdAt.gte = startDate;
  if (endDate) where.createdAt.lte = endDate;

  // Fetch job cards with extra relations needed for the minimal expanded set
  const [total, jobCards] = await Promise.all([
    prisma.jobCard.count({ where }),
    prisma.jobCard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        referenceNumber: true,
        receivedDate: true,
        createdAt: true,
        exporter: { select: { id: true, name: true, code: true } },
        destinationCountry: true,
        totalGrossWeight: true,
        totalNetWeight: true,
        totalNetWeightOz: true,
        assays: {
          select: {
            id: true,
            certificateNumber: true,
            assayDate: true,
            silverContent: true,
            measurements: { select: { id: true, netWeight: true } },
          },
        },
        fees: true,
        seals: true,
        shipmentType: { select: { id: true, name: true } },
      },
    }),
  ]);

  const computed = jobCards.map((jc: any) => {
    const storedNet = Number(jc.totalNetWeight) || 0;
    let netGoldGrams = storedNet;
    if (!storedNet || storedNet === 0) {
      netGoldGrams = (jc.assays || []).reduce((acc: number, a: any) => {
        const s = (a.measurements || []).reduce(
          (mAcc: number, m: any) => mAcc + (Number(m.netWeight) || 0),
          0
        );
        return acc + s;
      }, 0);
    }
    const netSilverGrams = (jc.assays || []).reduce(
      (acc: number, a: any) => acc + (Number(a.silverContent) || 0),
      0
    );
    return { jc, netGoldGrams, netSilverGrams };
  });

  // Optionally filter by net gold bounds (server-side)
  const rows = [] as any[];
  for (const c of computed) {
    if (minNetGold != null && c.netGoldGrams < minNetGold) continue;
    if (maxNetGold != null && c.netGoldGrams > maxNetGold) continue;
    rows.push(c);
  }

  // Map to response rows and optionally fetch fees totals
  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    orderBy: { createdAt: "desc" },
  });
  const commodityPrice = dailyPrice?.price || 0;

  const responseRows = await Promise.all(
    rows.map(async (c: any) => {
      const r = c.jc;
      const ounces = c.netGoldGrams / GRAMS_PER_TROY_OUNCE;
      const estimatedValue = ounces * commodityPrice;

      // fees aggregate
      let feesTotal = 0;
      let whtTotal = 0;
      let lastPaymentDate: Date | null = null;
      if (r.fees && r.fees.length) {
        for (const f of r.fees) {
          feesTotal += Number(f.amountPaid ?? f.amount ?? 0);
          whtTotal += Number(f.whtTotal ?? 0);
          if (f.paymentDate) {
            const pd = new Date(f.paymentDate);
            if (!lastPaymentDate || pd > lastPaymentDate) lastPaymentDate = pd;
          }
        }
      } else if (includeFees) {
        // fallback: query fees if not included
        const fees = await prisma.fee.findMany({ where: { jobCardId: r.id } });
        feesTotal = fees.reduce(
          (s: number, f: any) => s + Number(f.amountPaid ?? f.amount ?? 0),
          0
        );
        whtTotal = fees.reduce(
          (s: number, f: any) => s + Number(f.whtTotal ?? 0),
          0
        );
        lastPaymentDate = fees.reduce((latest: Date | null, f: any) => {
          if (!f.paymentDate) return latest;
          const pd = new Date(f.paymentDate);
          return !latest || pd > latest ? pd : latest;
        }, null);
      }

      // seals
      const sealCount = Array.isArray(r.seals) ? r.seals.length : 0;

      // latest assay certificate and date
      let certificateNumber =
        r.assays && r.assays.length ? r.assays[0].certificateNumber : undefined;
      let assayDate =
        r.assays && r.assays.length ? r.assays[0].assayDate : undefined;
      if (r.assays && r.assays.length > 1) {
        // try to pick the most recent assay
        const sorted = [...r.assays].sort(
          (a: any, b: any) =>
            new Date(b.assayDate).getTime() - new Date(a.assayDate).getTime()
        );
        certificateNumber = sorted[0].certificateNumber;
        assayDate = sorted[0].assayDate;
      }

      const totalGrossWeight = Number(r.totalGrossWeight ?? 0);
      const totalNetWeightOz = Number(
        r.totalNetWeightOz ?? c.netGoldGrams / GRAMS_PER_TROY_OUNCE
      );
      const goldOunces = c.netGoldGrams / GRAMS_PER_TROY_OUNCE;
      const valuePerGram = c.netGoldGrams ? estimatedValue / c.netGoldGrams : 0;

      const daysSinceReceived = r.receivedDate
        ? Math.floor(
            (Date.now() - new Date(r.receivedDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        id: r.id,
        jobCardId: r.id,
        referenceNumber: r.referenceNumber,
        receivedDate: r.receivedDate,
        exporter: r.exporter?.name || "-",
        exporterCode: r.exporter?.code || "",
        createdAt: r.createdAt,
        destinationCountry: r.destinationCountry ?? "",
        totalGrossWeight,
        netGoldGrams: c.netGoldGrams,
        netSilverGrams: c.netSilverGrams,
        totalNetWeightOz,
        goldOunces,
        estimatedValue,
        valuePerGram,
        feesTotal,
        whtTotal,
        lastPaymentDate,
        sealCount,
        certificateNumber,
        assayDate,
        dailyCommodityPrice: commodityPrice,
        daysSinceReceived,
      };
    })
  );

  if (download) {
    const defaultOrder = [
      "createdAt",
      "exporter",
      "jobCardId",
      "netGoldGrams",
      "netSilverGrams",
      "estimatedValue",
      "feesTotal",
    ];
    const colOrder =
      requestedColumns && requestedColumns.length
        ? requestedColumns
        : defaultOrder;
    const headers = colOrder.map((c) => {
      switch (c) {
        case "createdAt":
          return "Date";
        case "exporter":
          return "Exporter";
        case "jobCardId":
          return "JobCardId";
        case "netGoldGrams":
          return "NetGold_g";
        case "netSilverGrams":
          return "NetSilver_g";
        case "estimatedValue":
          return "EstimatedValue_USD";
        case "feesTotal":
          return "FeesTotal";
        default:
          return c;
      }
    });
    const lines = [headers.join(",")];
    for (const r of responseRows) {
      const rowValues = colOrder.map((c) => {
        switch (c) {
          case "createdAt":
            return csvEscape(
              r.createdAt ? new Date(r.createdAt).toISOString() : ""
            );
          case "exporter":
            return csvEscape(r.exporter);
          case "jobCardId":
            return csvEscape(r.jobCardId);
          case "netGoldGrams":
            return csvEscape(
              typeof r.netGoldGrams === "number"
                ? r.netGoldGrams.toFixed(2)
                : r.netGoldGrams
            );
          case "netSilverGrams":
            return csvEscape(
              typeof r.netSilverGrams === "number"
                ? r.netSilverGrams.toFixed(2)
                : r.netSilverGrams
            );
          case "estimatedValue":
            return csvEscape(
              typeof r.estimatedValue === "number"
                ? r.estimatedValue.toFixed(2)
                : r.estimatedValue
            );
          case "feesTotal":
            return csvEscape(
              typeof r.feesTotal === "number"
                ? r.feesTotal.toFixed(2)
                : r.feesTotal
            );
          default:
            return csvEscape((r as any)[c]);
        }
      });
      lines.push(rowValues.join(","));
    }
    return new Response(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="custom-report-${Date.now()}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify({ rows: responseRows, total }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
