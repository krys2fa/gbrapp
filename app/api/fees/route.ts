import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    const jobCardIds = searchParams.get("jobCardIds");
    const largeScaleJobCardIds = searchParams.get("largeScaleJobCardIds");

    if (jobCardId) {
      const fees = await prisma.fee.findMany({
        where: { jobCardId },
        orderBy: { paymentDate: "desc" },
      });
      return NextResponse.json({ fees });
    }

    if (jobCardIds) {
      const ids = jobCardIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const fees = await prisma.fee.findMany({
        where: { jobCardId: { in: ids } },
        orderBy: { paymentDate: "desc" },
      });
      return NextResponse.json({ fees });
    }

    if (largeScaleJobCardIds) {
      const ids = largeScaleJobCardIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const fees = await prisma.fee.findMany({
        where: { largeScaleJobCardId: { in: ids } },
        orderBy: { paymentDate: "desc" },
      });
      return NextResponse.json({ fees });
    }

    // default: return recent fees
    const fees = await prisma.fee.findMany({
      orderBy: { paymentDate: "desc" },
      take: 50,
    });
    return NextResponse.json({ fees });
  } catch (err) {
    void logger.error(LogCategory.FEE, "Failed to fetch fees", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to fetch fees" },
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
      feeType,
      amount,
      currencyId,
      paymentDate,
      receiptNumber,
      notes,
      paymentType,
    } = body;

    const targetJobCardId = jobCardId || largeScaleJobCardId;

    void logger.info(LogCategory.FEE, "Creating fee", {
      jobCardId,
      largeScaleJobCardId,
      targetJobCardId,
      feeType,
      amount,
    });

    if (!targetJobCardId || !feeType || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const currency = currencyId
      ? await prisma.currency.findUnique({ where: { id: currencyId } })
      : await prisma.currency.findFirst();

    const combinedNotes = `${notes || ""}${
      paymentType ? ` (paymentType:${paymentType})` : ""
    }`;

    const feeData = {
      ...(jobCardId ? { jobCardId } : { largeScaleJobCardId }),
      feeType,
      amountPaid: Number(amount),
      currencyId: currency?.id || "",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: "paid",
      receiptNumber: receiptNumber || `RCPT-${Date.now()}`,
      balance: "0",
      whtTotal: 0,
      notes: combinedNotes,
    };

    void logger.debug(LogCategory.FEE, "Fee data to create", {
      keys: Object.keys(feeData || {}),
    });

    const fee = await prisma.fee.create({
      data: feeData,
    });

    // Update the corresponding invoice status to "paid"
    try {
      // Find the invoice for this job card that matches the fee type
      const invoiceTypeMapping: Record<string, string[]> = {
        ASSAY_FEE: ["assay", "valuation"],
        WHT_FEE: ["wht", "withholding"],
      };

      const typeKeywords = invoiceTypeMapping[feeType] || [];

      if (typeKeywords.length > 0) {
        // Find invoices for this job card with matching type
        const invoiceWhere = jobCardId
          ? { jobCardId: jobCardId }
          : { largeScaleJobCardId: largeScaleJobCardId };

        const invoices = await prisma.invoice.findMany({
          where: {
            ...invoiceWhere,
            invoiceType: {
              name: {
                contains: typeKeywords[0],
                mode: "insensitive",
              },
            },
          },
        });

        // Update all matching invoices to "paid" status
        if (invoices.length > 0) {
          await prisma.invoice.updateMany({
            where: {
              id: { in: invoices.map((inv) => inv.id) },
            },
            data: { status: "paid" },
          });
          void logger.info(
            LogCategory.INVOICE,
            `Updated ${invoices.length} invoice(s) to paid status`,
            { jobCardId: targetJobCardId, count: invoices.length }
          );
        }
      }
    } catch (e) {
      // non-fatal: log and continue
      void logger.error(
        LogCategory.INVOICE,
        "Failed to update invoice status to paid",
        {
          error: e instanceof Error ? e.message : String(e),
        }
      );
    }

    // mark job card as paid so details page reflects paid status
    try {
      if (jobCardId) {
        await prisma.jobCard.update({
          where: { id: jobCardId },
          data: { status: "paid" },
        });
      } else if (largeScaleJobCardId) {
        await prisma.largeScaleJobCard.update({
          where: { id: largeScaleJobCardId },
          data: { status: "paid" },
        });
      }
    } catch (e) {
      // non-fatal: log and continue
      void logger.debug(
        LogCategory.JOB_CARD,
        "Failed to update job card status to paid",
        {
          error: e instanceof Error ? e.message : String(e),
        }
      );
    }

    return NextResponse.json(
      {
        fee,
        message: "Payment recorded and invoice status updated to paid",
      },
      { status: 201 }
    );
  } catch (err) {
    void logger.error(LogCategory.API, "Failed to create fee", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to create fee" },
      { status: 500 }
    );
  }
}
