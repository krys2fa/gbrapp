// app/api/weekly-prices/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { NotificationService } from "../../../../../lib/notification-service";
import * as jose from "jose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, reason } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Extract and verify JWT token to get user information
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    // Check Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie if no Authorization header
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies["auth-token"];
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized. Authentication required. Please login first.",
        },
        { status: 401 }
      );
    }

    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);

    let userId: string;
    let userRole: string;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      userId = payload.userId as string;
      userRole = payload.role as string;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    // Only allow super admins and admins to approve/reject rates
    if (!["SUPERADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only admins and super admins can approve or reject rates.",
        },
        { status: 403 }
      );
    }

    // Get current user
    const approvedBy = userId;

    const weeklyPrice = await prisma.weeklyPrice.findUnique({
      where: { id: id },
      include: {
        exchange: true,
        submittedByUser: true,
      },
    });

    if (!weeklyPrice) {
      return NextResponse.json(
        { error: "Weekly price not found" },
        { status: 404 }
      );
    }

    if (weeklyPrice.status !== "PENDING") {
      return NextResponse.json(
        { error: "Price is not pending approval" },
        { status: 400 }
      );
    }

    const updateData: any = {
      approvedBy,
      approvedAt: new Date(),
      status: action === "approve" ? "APPROVED" : "REJECTED",
    };

    if (action === "reject") {
      updateData.rejectionReason = reason;
    }

    const updatedPrice = await prisma.weeklyPrice.update({
      where: { id: id },
      data: updateData,
      include: {
        exchange: true,
        submittedByUser: true,
        approvedByUser: true,
      },
    });

    // Send notification
    if (weeklyPrice.type === "EXCHANGE" && weeklyPrice.exchange) {
      try {
        if (action === "approve") {
          await NotificationService.notifyExchangeRateApproved(
            updatedPrice.id,
            weeklyPrice.exchange.name,
            weeklyPrice.price,
            updatedPrice.approvedByUser?.name || "System"
          );
        } else {
          await NotificationService.notifyExchangeRateRejected(
            updatedPrice.id,
            weeklyPrice.exchange.name,
            weeklyPrice.price,
            updatedPrice.approvedByUser?.name || "System",
            reason
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send approval notification:",
          notificationError
        );
      }
    }

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
