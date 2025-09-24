import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function createLargeScaleInvoice(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobCardId, amount: _amount, currencyCode = "USD" } = body;

    if (!jobCardId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check if an invoice already exists for this large scale job card
    const existingInvoice = await prisma.invoice.findFirst({
      where: { largeScaleJobCardId: jobCardId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "An invoice already exists for this job card" },
        { status: 400 }
      );
    }

    // Get the large scale job card with assays to calculate invoice amount
    const jobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id: jobCardId },
      include: {
        assays: {
          select: {
            id: true,
            totalValueGhs: true,
            totalGoldValue: true,
            totalSilverValue: true,
            totalCombinedValue: true,
            exchangeRate: true,
            dateOfAnalysis: true,
          },
        },
        commodities: {
          include: {
            commodity: true,
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
        { error: "No assays found for this job card" },
        { status: 400 }
      );
    }

    // Calculate totals from all large scale assays
    let assayUsdValue = 0;
    let assayGhsValue = 0;
    let exchangeRate = 0;

    for (const assay of jobCard.assays) {
      // Use stored assay values
      if (assay.totalCombinedValue) {
        assayUsdValue += Number(assay.totalCombinedValue);
      } else if (assay.totalValueGhs && assay.exchangeRate) {
        // Calculate USD from GHS and exchange rate
        assayUsdValue +=
          Number(assay.totalValueGhs) / Number(assay.exchangeRate);
      }

      if (assay.totalValueGhs) {
        assayGhsValue += Number(assay.totalValueGhs);
      }

      // Get exchange rate from assay
      if (assay.exchangeRate && exchangeRate === 0) {
        exchangeRate = Number(assay.exchangeRate);
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

    // Fixed rates for calculations (same as regular invoices)
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
      where: { name: "Large Scale Assay Invoice" },
    });
    if (!invoiceType) {
      invoiceType = await prisma.invoiceType.create({
        data: {
          name: "Large Scale Assay Invoice",
          description: "Generated invoice for large scale assay valuation",
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
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `LS-INV-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`,
        largeScaleJobCardId: jobCardId,
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
      },
      include: {
        currency: true,
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
  } catch (_err) {
    void logger.error(
      LogCategory.INVOICE,
      "Error creating large scale invoice",
      {
        error: _err instanceof Error ? _err.message : String(_err),
      }
    );
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createLargeScaleInvoice, []);
