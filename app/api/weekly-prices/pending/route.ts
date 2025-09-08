// app/api/weekly-prices/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import * as jose from "jose";

export async function GET(req: NextRequest) {
  try {
    // Extract and verify JWT token to get user role
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized. Authentication required.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);

    let userRole: string;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      userRole = payload.role as string;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    // Only allow super admins to view pending approvals
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error: "Unauthorized. Only super admins can view pending approvals.",
        },
        { status: 403 }
      );
    }

    const pendingPrices = await prisma.weeklyPrice.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        commodity: true,
        exchange: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pendingPrices);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}
