import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

    return NextResponse.json({ fee }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create fee" },
      { status: 500 }
    );
  }
}
