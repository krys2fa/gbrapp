import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const commodities = await prisma.commodity.findMany();
  return NextResponse.json(commodities);
}

export async function POST(req: Request) {
  const { name, symbol } = await req.json();
  if (!name || !symbol)
    return NextResponse.json(
      { error: "Name and symbol required" },
      { status: 400 }
    );
  const commodity = await prisma.commodity.create({ data: { name, symbol } });
  return NextResponse.json(commodity);
}
