import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    let limit = parseInt(searchParams.get("limit") || "100");
    if (isNaN(limit) || limit <= 0) limit = 100;
    limit = Math.min(limit, 1000);
    const skip = (page - 1) * limit;

    const reference = searchParams.get("reference");
    const invoice = searchParams.get("invoice");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (reference) {
      where.jobCard = {
        referenceNumber: { contains: reference, mode: "insensitive" },
      };
    }
    if (invoice) {
      where.invoiceNumber = { contains: invoice, mode: "insensitive" };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          createdAt: true,
          status: true,
          jobCardId: true,
          largeScaleJobCardId: true,
          invoiceType: {
            select: {
              id: true,
              name: true,
            },
          },
          jobCard: {
            select: {
              id: true,
              referenceNumber: true,
              exporter: { select: { id: true, name: true } },
            },
          },
          largeScaleJobCard: {
            select: {
              id: true,
              referenceNumber: true,
              exporter: { select: { id: true, name: true } },
            },
          },
          assays: true,
          currency: { select: { id: true, code: true, symbol: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total }, { status: 200 });
  } catch (_err) {
    void logger.error(LogCategory.API, "Failed to fetch invoices", {
      error: _err instanceof Error ? _err.message : String(_err),
    });
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobCardId,
      largeScaleJobCardId,
      amount: _amount,
      currencyCode = "USD",
    } = body;

    const targetJobCardId = jobCardId || largeScaleJobCardId;
    const isLargeScale = !!largeScaleJobCardId;

    if (!targetJobCardId) {
      return NextResponse.json(
        { error: "Job card ID is required" },
        { status: 400 }
      );
    }

    // Check if an invoice already exists for this job card
    const existingInvoice = await prisma.invoice.findFirst({
      where: isLargeScale
        ? { largeScaleJobCardId: targetJobCardId }
        : { jobCardId: targetJobCardId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "An invoice already exists for this job card" },
        { status: 400 }
      );
    }

    // Get the job card with assays to calculate invoice amount
    let jobCard: any;
    let assayUsdValue = 0;
    let assayGhsValue = 0;
    let exchangeRate = 0;

    if (isLargeScale) {
      jobCard = await prisma.largeScaleJobCard.findUnique({
        where: { id: targetJobCardId },
        include: {
          assays: {
            select: {
              id: true,
              totalGoldValue: true,
              totalSilverValue: true,
              totalCombinedValue: true,
              totalValueGhs: true,
              exchangeRate: true,
              comments: true,
            },
          },
        },
      });

      if (!jobCard) {
        return NextResponse.json(
          { error: "Large scale job card not found" },
          { status: 404 }
        );
      }

      if (!jobCard.assays || jobCard.assays.length === 0) {
        return NextResponse.json(
          { error: "No assays found for this large scale job card" },
          { status: 400 }
        );
      }

      // Calculate totals from large scale assays
      for (const assay of jobCard.assays) {
        if (assay.totalCombinedValue) {
          assayUsdValue += Number(assay.totalCombinedValue);
        }
        if (assay.totalValueGhs) {
          assayGhsValue += Number(assay.totalValueGhs);
        }
        if (assay.exchangeRate && exchangeRate === 0) {
          exchangeRate = Number(assay.exchangeRate);
        }
      }
    } else {
      jobCard = await prisma.jobCard.findUnique({
        where: { id: targetJobCardId },
        include: {
          assays: {
            select: {
              id: true,
              totalUsdValue: true,
              totalGhsValue: true,
              exchangeRate: true,
              comments: true,
            },
          },
          commodity: true,
        },
      });

      if (!jobCard) {
        return NextResponse.json(
          { error: "Job card not found" },
          { status: 404 }
        );
      }

      if (!jobCard.assays || jobCard.assays.length === 0) {
        return NextResponse.json(
          { error: "No assays found for this job card" },
          { status: 400 }
        );
      }

      // Calculate totals from regular assays
      for (const assay of jobCard.assays) {
        // Use stored assay values if available
        if (assay.totalUsdValue) {
          assayUsdValue += Number(assay.totalUsdValue);
        }
        if (assay.totalGhsValue) {
          assayGhsValue += Number(assay.totalGhsValue);
        }

        // Get exchange rate from assay (prioritize stored field over comments)
        if (assay.exchangeRate && exchangeRate === 0) {
          exchangeRate = Number(assay.exchangeRate);
        }

        // Try to extract exchange rate and values from assay comments if not available
        if (
          (!assay.totalUsdValue ||
            !assay.totalGhsValue ||
            exchangeRate === 0) &&
          assay.comments
        ) {
          try {
            let meta: any = null;
            if (typeof assay.comments === "string") {
              meta = JSON.parse(assay.comments || "{}")?.meta;
            } else {
              meta = (assay.comments as any)?.meta;
            }
            if (meta) {
              if (meta.valueUsd && !assay.totalUsdValue)
                assayUsdValue += Number(meta.valueUsd);
              if (meta.valueGhs && !assay.totalGhsValue)
                assayGhsValue += Number(meta.valueGhs);
              if (meta.weeklyExchange && exchangeRate === 0)
                exchangeRate = Number(meta.weeklyExchange);
              if (meta.exchangeRate && exchangeRate === 0)
                exchangeRate = Number(meta.exchangeRate);
            }
          } catch (_e) {
            // ignore parsing errors
          }
        }
      }
    }

    // Round assay values to 2 decimal places
    assayUsdValue = Number(assayUsdValue.toFixed(2));
    assayGhsValue = Number(assayGhsValue.toFixed(2));
    exchangeRate = Number(exchangeRate.toFixed(4));

    if (exchangeRate === 0) {
      return NextResponse.json(
        {
          error:
            "Invoice cannot be generated due to missing exchange rate from assay. Please ensure the assay has a valid exchange rate before generating an invoice.",
        },
        { status: 400 }
      );
    }

    // Fixed rates for calculations
    const rate = 0.258;
    const inclusiveVatRate = 1.219;
    const nhilRate = 0.025; // 2.5%
    const getfundRate = 0.025; // 2.5%
    const covidRate = 0.01; // 1%
    const vatRate = 0.15; // 15%

    // Perform calculations using assayGhsValue
    const totalInclusive = Number(((assayGhsValue * rate) / 100).toFixed(2));
    const totalExclusive = Number(
      (totalInclusive / inclusiveVatRate).toFixed(2)
    );

    // Assay Service Charge
    const rateCharge = 0.258;

    // Levies/Taxes (percentages of assay value in GHS)
    const nhil = Number((totalExclusive * nhilRate).toFixed(2)); // 2.5%
    const getfund = Number((totalExclusive * getfundRate).toFixed(2)); // 2.5%
    const covid = Number((totalExclusive * covidRate).toFixed(2)); // 1%
    const subTotal = Number(
      (totalExclusive + nhil + getfund + covid).toFixed(2)
    );
    const vat = Number((subTotal * vatRate).toFixed(2)); // 15%
    const grandTotal = subTotal + vat;

    // Use calculated amount as the invoice amount
    const invoiceAmount = grandTotal;

    // Get or create invoice type
    let invoiceType = await prisma.invoiceType.findUnique({
      where: { name: "Assay Invoice" },
    });
    if (!invoiceType) {
      invoiceType = await prisma.invoiceType.create({
        data: {
          name: "Assay Invoice",
          description: "Generated invoice for assay valuation",
        },
      });
    }

    // Get currency
    let currency = await prisma.currency.findFirst({
      where: { code: currencyCode },
    });
    if (!currency) {
      currency = await prisma.currency.findFirst();
    }

    if (!currency) {
      return NextResponse.json({ error: "No currency found" }, { status: 500 });
    }

    // Create the invoice
    const invoiceData: any = {
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceTypeId: invoiceType.id,
      amount: invoiceAmount,
      currencyId: currency.id,
      assayUsdValue: assayUsdValue,
      assayGhsValue: assayGhsValue,
      rate: rate,
      issueDate: new Date(),
      status: "pending",
      // Save calculated fields
      grandTotal: grandTotal,
      subTotal: subTotal,
      covid: covid,
      getfund: getfund,
      nhil: nhil,
      rateCharge: rateCharge,
      totalInclusive: totalInclusive,
      totalExclusive: totalExclusive,
      vat: vat,
      exchangeRate: exchangeRate,
    };

    // Set the appropriate job card ID
    if (isLargeScale) {
      invoiceData.largeScaleJobCardId = targetJobCardId;
    } else {
      invoiceData.jobCardId = targetJobCardId;
      invoiceData.assays = {
        connect: jobCard.assays.map((assay: any) => ({ id: assay.id })),
      };
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        currency: true,
        jobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { name: true } },
          },
        },
        largeScaleJobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    void logger.error(LogCategory.API, "Error creating invoice", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
