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
        include: {
          jobCard: { include: { exporter: true } },
          assays: true,
          currency: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
