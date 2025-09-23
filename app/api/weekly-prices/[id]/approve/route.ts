// app/api/weekly-prices/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { NotificationService } from "../../../../../lib/notification-service";
import { NotificationScheduler } from "../../../../../lib/notification-scheduler";
import * as jose from "jose";
import { logger, LogCategory } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, reason } = await req.json();

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

      // Validate that the user exists in the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) {
        void logger.error(
          LogCategory.AUTH,
          `User with ID not found in database`,
          {
            userId,
          }
        );
        return NextResponse.json(
          {
            error: "User not found. Please log in again.",
          },
          { status: 401 }
        );
      }

      // Verify role from database matches JWT
      if (user.role !== userRole) {
        void logger.warn(LogCategory.AUTH, "Role mismatch for user role", {
          userId,
          jwtRole: userRole,
          dbRole: user.role,
        });
        userRole = user.role; // Use role from database
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    // Only allow super admins, CEO, and deputy CEO to approve/reject rates
    if (!["SUPERADMIN", "CEO", "DEPUTY_CEO"].includes(userRole)) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only system admin, CEO, and deputy CEO can approve or reject exchange rates.",
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

    // Cancel any scheduled delayed notifications since the rate has been processed
    NotificationScheduler.cancelScheduledNotification(id);

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
        void logger.error(
          LogCategory.NOTIFICATION,
          "Failed to send approval notification",
          {
            error:
              notificationError instanceof Error
                ? notificationError.message
                : String(notificationError),
          }
        );
      }
    }

    return NextResponse.json(updatedPrice);
  } catch (_error) {
    void logger.error(LogCategory.EXCHANGE_RATE, "Error processing approval", {
      error: _error instanceof Error ? _error.message : String(_error),
    });
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
