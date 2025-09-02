import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get("jobCardId");
    const jobCardIds = searchParams.get("jobCardIds");

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

    // default: return recent fees
    const fees = await prisma.fee.findMany({
      orderBy: { paymentDate: "desc" },
      take: 50,
    });
    return NextResponse.json({ fees });
  } catch (err) {
    console.error(err);
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
      feeType,
      amount,
      currencyId,
      paymentDate,
      receiptNumber,
      notes,
      paymentType,
    } = body;
    if (!jobCardId || !feeType || !amount) {
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

    const fee = await prisma.fee.create({
      data: {
        jobCardId: jobCardId,
        feeType,
        amountPaid: Number(amount),
        currencyId: currency?.id || "",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: "paid",
        receiptNumber: receiptNumber || `RCPT-${Date.now()}`,
        balance: "0",
        whtTotal: 0,
        notes: combinedNotes,
      },
    });

    // mark job card as paid so details page reflects paid status
    try {
      await prisma.jobCard.update({
        where: { id: jobCardId },
        data: { status: "paid" },
      });
    } catch (e) {
      // non-fatal: log and continue
      console.debug("Failed to update job card status to paid:", e);
    }

    return NextResponse.json({ fee }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create fee" },
      { status: 500 }
    );
  }
}
