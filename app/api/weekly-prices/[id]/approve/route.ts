// app/api/weekly-prices/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { NotificationService } from "../../../../../lib/notification-service";
import { NotificationScheduler } from "../../../../../lib/notification-scheduler";
import {
  extractTokenFromReq,
  validateTokenAndLoadUser,
} from "@/app/lib/auth-utils";

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

    // Extract token and validate user
    const token = await extractTokenFromReq(req as any);
    const validation = await validateTokenAndLoadUser(token);
    if (!validation.success || !validation.user) {
      return NextResponse.json(
        { error: validation.error || "Unauthorized" },
        { status: validation.statusCode || 401 }
      );
    }

    const userId = validation.user.id;
    const userRole = validation.user.role as string;

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
