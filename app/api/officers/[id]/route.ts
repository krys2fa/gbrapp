import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory } from "@/lib/logger";

/**
 * GET handler for fetching a specific officer by ID
 */
async function getOfficerById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const params = await ctx.params;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Officer type is required" },
        { status: 400 }
      );
    }

    let officer;
    switch (type) {
      case "CUSTOMS_OFFICER":
        officer = await prisma.customsOfficer.findUnique({
          where: { id },
        });
        break;
      case "ASSAY_OFFICER":
        officer = await prisma.assayOfficer.findUnique({
          where: { id },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        officer = await prisma.technicalDirector.findUnique({
          where: { id },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid officer type" },
          { status: 400 }
        );
    }

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    return NextResponse.json({ ...officer, officerType: type });
  } catch (error) {
    void logger.error(LogCategory.USER_MANAGEMENT, "Error fetching officer", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error fetching officer" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a specific officer by ID
 */
async function updateOfficerById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const params = await ctx.params;
    const { id } = params;
    const data = await req.json();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Officer type is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.name || !data.badgeNumber) {
      return NextResponse.json(
        { error: "Missing required fields: name, badgeNumber" },
        { status: 400 }
      );
    }

    // Check if badge number already exists for another officer of the same type
    let existingOfficer;
    switch (type) {
      case "CUSTOMS_OFFICER":
        existingOfficer = await prisma.customsOfficer.findFirst({
          where: {
            badgeNumber: data.badgeNumber,
            id: { not: id },
          },
        });
        break;
      case "ASSAY_OFFICER":
        existingOfficer = await prisma.assayOfficer.findFirst({
          where: {
            badgeNumber: data.badgeNumber,
            id: { not: id },
          },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        existingOfficer = await prisma.technicalDirector.findFirst({
          where: {
            badgeNumber: data.badgeNumber,
            id: { not: id },
          },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid officer type" },
          { status: 400 }
        );
    }

    if (existingOfficer) {
      return NextResponse.json(
        { error: "An officer with this badge number already exists" },
        { status: 409 }
      );
    }

    // Update the officer based on type
    let officer;
    switch (type) {
      case "CUSTOMS_OFFICER":
        officer = await prisma.customsOfficer.update({
          where: { id },
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "ASSAY_OFFICER":
        officer = await prisma.assayOfficer.update({
          where: { id },
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        officer = await prisma.technicalDirector.update({
          where: { id },
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
    }

    return NextResponse.json({ ...officer, officerType: type });
  } catch (error) {
    void logger.error(LogCategory.USER_MANAGEMENT, "Error updating officer", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error updating officer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific officer by ID
 */
async function deleteOfficerById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const params = await ctx.params;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Officer type is required" },
        { status: 400 }
      );
    }

    // Check if officer is being used in any job cards
    let isUsed = false;
    switch (type) {
      case "CUSTOMS_OFFICER":
        const customsUsage = await prisma.jobCard.findFirst({
          where: { customsOfficerId: id },
        });
        isUsed = !!customsUsage;
        break;
      case "ASSAY_OFFICER":
        const assayUsage = await prisma.jobCard.findFirst({
          where: { assayOfficerId: id },
        });
        isUsed = !!assayUsage;
        break;
      case "TECHNICAL_DIRECTOR":
        const directorUsage = await prisma.jobCard.findFirst({
          where: { technicalDirectorId: id },
        });
        isUsed = !!directorUsage;
        break;
    }

    if (isUsed) {
      return NextResponse.json(
        {
          error:
            "Cannot delete officer as they are assigned to existing job cards",
        },
        { status: 409 }
      );
    }

    // Delete the officer based on type
    switch (type) {
      case "CUSTOMS_OFFICER":
        await prisma.customsOfficer.delete({
          where: { id },
        });
        break;
      case "ASSAY_OFFICER":
        await prisma.assayOfficer.delete({
          where: { id },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        await prisma.technicalDirector.delete({
          where: { id },
        });
        break;
    }

    return NextResponse.json({ message: "Officer deleted successfully" });
  } catch (error) {
    void logger.error(LogCategory.USER_MANAGEMENT, "Error deleting officer", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error deleting officer" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with audit trail
export const GET = withAuditTrail(getOfficerById, { entityType: "Officer" });
export const PUT = withAuditTrail(updateOfficerById, { entityType: "Officer" });
export const DELETE = withAuditTrail(deleteOfficerById, {
  entityType: "Officer",
});
