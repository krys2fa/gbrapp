import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const exchanges = await prisma.exchange.findMany();
  return NextResponse.json(exchanges);
}

export async function POST(req: Request) {
  const { name, symbol } = await req.json();
  if (!name || !symbol)
    return NextResponse.json(
      { error: "Name and symbol required" },
      { status: 400 }
    );
  const exchange = await prisma.exchange.create({ data: { name, symbol } });
  return NextResponse.json(exchange);
}
