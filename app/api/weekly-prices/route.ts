import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getWeekBounds } from "@/app/lib/week-utils";
import { NotificationService } from "../../../lib/notification-service";
import { NotificationScheduler } from "../../../lib/notification-scheduler";
import {
  extractTokenFromReq,
  validateTokenAndLoadUser,
} from "@/app/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const itemId = searchParams.get("itemId");
  const week = searchParams.get("week"); // optional week parameter in YYYY-MM-DD format
  const approvedOnly = searchParams.get("approvedOnly") === "true"; // New parameter

  const where: any = {};
  if (type) where.type = type;
  if (itemId) {
    if (type === "COMMODITY") where.commodityId = itemId;
    if (type === "EXCHANGE") where.exchangeId = itemId;
  }

  // Filter by approval status if requested
  if (approvedOnly) {
    where.status = "APPROVED";
  }

  // If week is specified, filter by that week
  if (week) {
    const weekDate = new Date(week);
    const { startOfWeek, endOfWeek } = getWeekBounds(weekDate);
    where.weekStartDate = {
      gte: startOfWeek,
      lte: endOfWeek,
    };
  }

  try {
    const prices = await prisma.weeklyPrice.findMany({
      where,
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
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { weekStartDate: "desc" },
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching weekly prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly prices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, itemId, price, weekStartDate } = body;

    if (!type || !itemId || price == null) {
      return NextResponse.json(
        { error: "type, itemId, and price are required" },
        { status: 400 }
      );
    }

    // Extract token (header or cookie) and validate + load user
    const token = await extractTokenFromReq(req as any);
    const validation = await validateTokenAndLoadUser(token);

    if (!validation.success || !validation.user) {
      return NextResponse.json(
        { error: validation.error || "Unauthorized" },
        { status: validation.statusCode || 401 }
      );
    }

    const submittedBy = validation.user.id;

    // If weekStartDate is not provided, use current week
    let startDate: Date;
    if (weekStartDate) {
      startDate = new Date(weekStartDate);
    } else {
      const { startOfWeek } = getWeekBounds(new Date());
      startDate = startOfWeek;
    }

    const { endOfWeek } = getWeekBounds(startDate);

    const data: any = {
      type,
      price,
      weekStartDate: startDate,
      weekEndDate: endOfWeek,
      status: "PENDING", // New rates start as pending approval
      submittedBy,
      notificationSent: false,
    };

    if (type === "COMMODITY") data.commodityId = itemId;
    if (type === "EXCHANGE") data.exchangeId = itemId;

    // Check if a price already exists for this week
    const existingPrice = await prisma.weeklyPrice.findFirst({
      where: {
        type,
        ...(type === "COMMODITY"
          ? { commodityId: itemId }
          : { exchangeId: itemId }),
        weekStartDate: startDate,
      },
    });

    if (existingPrice) {
      return NextResponse.json(
        { error: "A price already exists for this week" },
        { status: 409 }
      );
    }

    const weeklyPrice = await prisma.weeklyPrice.create({
      data,
      include: {
        commodity: true,
        exchange: true,
        submittedByUser: true,
      },
    });

    // Send immediate SMS notification to SUPERADMIN and CEO for exchange rates
    if (type === "EXCHANGE" && weeklyPrice.exchange) {
      console.log("🔔 Exchange rate created, sending SMS notifications...");
      console.log("Exchange:", weeklyPrice.exchange.name);
      console.log("Rate:", weeklyPrice.price);

      // Check SMS readiness for immediate notifications
      const immediateReadiness = await NotificationService.checkSMSReadiness([
        "SUPERADMIN",
        "CEO",
      ]);
      console.log("📊 Immediate SMS Readiness:", {
        total: immediateReadiness.totalUsers,
        valid: immediateReadiness.validPhoneUsers,
        invalid: immediateReadiness.invalidPhoneUsers,
        noPhone: immediateReadiness.noPhoneUsers,
      });

      try {
        await NotificationService.notifyExchangeRateApproval(
          weeklyPrice.id,
          weeklyPrice.exchange.name,
          weeklyPrice.price,
          weeklyPrice.weekStartDate.toISOString().split("T")[0],
          weeklyPrice.submittedByUser?.name || "Unknown User"
        );
        console.log("✅ SMS notification service called successfully");

        // Schedule delayed notification to DEPUTY_CEO and SUPERADMIN after 5 minutes
        NotificationScheduler.scheduleDelayedNotification(
          weeklyPrice.id,
          weeklyPrice.exchange.name,
          weeklyPrice.price,
          weeklyPrice.weekStartDate.toISOString().split("T")[0],
          weeklyPrice.submittedByUser?.name || "Unknown User",
          5 // 5 minutes delay
        );

        // Mark notification as sent
        await prisma.weeklyPrice.update({
          where: { id: weeklyPrice.id },
          data: { notificationSent: true },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send approval notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(weeklyPrice);
  } catch (error) {
    console.error("Error creating weekly price:", error);
    return NextResponse.json(
      { error: "Failed to create weekly price" },
      { status: 500 }
    );
  }
}
