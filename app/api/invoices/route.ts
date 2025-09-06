import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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
          jobCard: {
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
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobCardId, amount, currencyCode = "USD" } = body;

    if (!jobCardId) {
      return NextResponse.json(
        { error: "Job card ID is required" },
        { status: 400 }
      );
    }

    // Check if an invoice already exists for this job card
    const existingInvoice = await prisma.invoice.findFirst({
      where: { jobCardId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "An invoice already exists for this job card" },
        { status: 400 }
      );
    }

    // Get the job card with assays to calculate invoice amount
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: jobCardId },
      include: {
        assays: true,
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

    // Calculate total value from assays
    let totalUsdValue = 0;
    let totalGhsValue = 0;

    for (const assay of jobCard.assays) {
      totalUsdValue += assay.totalUsdValue || 0;
      totalGhsValue += assay.totalGhsValue || 0;
    }

    // Use provided amount or calculated total
    const invoiceAmount = amount !== undefined ? Number(amount) : totalUsdValue;

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
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        jobCardId,
        invoiceTypeId: invoiceType.id,
        amount: invoiceAmount,
        currencyId: currency.id,
        assays: {
          connect: jobCard.assays.map((assay) => ({ id: assay.id })),
        },
        assayUsdValue: totalUsdValue,
        assayGhsValue: totalGhsValue,
        rate: 1,
        issueDate: new Date(),
        status: "pending",
      },
      include: {
        currency: true,
        jobCard: {
          select: {
            id: true,
            referenceNumber: true,
            exporter: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("Error creating invoice:", err);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
