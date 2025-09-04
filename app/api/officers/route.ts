import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all officers
 */
async function getAllOfficers(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Build where clause for filtering
    const where: any = {};
    if (type) {
      where.officerType = type;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Fetch all officer types
    const [
      customsOfficers,
      assayOfficers,
      technicalDirectors,
      nacobOfficers,
      nationalSecurityOfficers,
    ] = await Promise.all([
      prisma.customsOfficer.findMany({
        where:
          type === "CUSTOMS_OFFICER"
            ? where
            : search
            ? { name: { contains: search, mode: "insensitive" } }
            : {},
        select: {
          id: true,
          name: true,
          badgeNumber: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.assayOfficer.findMany({
        where:
          type === "ASSAY_OFFICER"
            ? where
            : search
            ? { name: { contains: search, mode: "insensitive" } }
            : {},
        select: {
          id: true,
          name: true,
          badgeNumber: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.technicalDirector.findMany({
        where:
          type === "TECHNICAL_DIRECTOR"
            ? where
            : search
            ? { name: { contains: search, mode: "insensitive" } }
            : {},
        select: {
          id: true,
          name: true,
          badgeNumber: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.nACOBOfficer.findMany({
        where:
          type === "NACOB_OFFICER"
            ? where
            : search
            ? { name: { contains: search, mode: "insensitive" } }
            : {},
        select: {
          id: true,
          name: true,
          badgeNumber: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.nationalSecurityOfficer.findMany({
        where:
          type === "NATIONAL_SECURITY_OFFICER"
            ? where
            : search
            ? { name: { contains: search, mode: "insensitive" } }
            : {},
        select: {
          id: true,
          name: true,
          badgeNumber: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    // Combine and format results
    const officers = [
      ...customsOfficers.map((officer) => ({
        ...officer,
        officerType: "CUSTOMS_OFFICER",
      })),
      ...assayOfficers.map((officer) => ({
        ...officer,
        officerType: "ASSAY_OFFICER",
      })),
      ...technicalDirectors.map((officer) => ({
        ...officer,
        officerType: "TECHNICAL_DIRECTOR",
      })),
      ...nacobOfficers.map((officer) => ({
        ...officer,
        officerType: "NACOB_OFFICER",
      })),
      ...nationalSecurityOfficers.map((officer) => ({
        ...officer,
        officerType: "NATIONAL_SECURITY_OFFICER",
      })),
    ];

    // Sort by creation date (newest first)
    officers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(officers);
  } catch (error) {
    console.error("Error fetching officers:", error);
    return NextResponse.json(
      { error: "Error fetching officers" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new officer
 */
async function createOfficer(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.badgeNumber || !data.officerType) {
      return NextResponse.json(
        { error: "Missing required fields: name, badgeNumber, officerType" },
        { status: 400 }
      );
    }

    // Check if badge number already exists for this officer type
    let existingOfficer;
    switch (data.officerType) {
      case "CUSTOMS_OFFICER":
        existingOfficer = await prisma.customsOfficer.findFirst({
          where: { badgeNumber: data.badgeNumber },
        });
        break;
      case "ASSAY_OFFICER":
        existingOfficer = await prisma.assayOfficer.findFirst({
          where: { badgeNumber: data.badgeNumber },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        existingOfficer = await prisma.technicalDirector.findFirst({
          where: { badgeNumber: data.badgeNumber },
        });
        break;
      case "NACOB_OFFICER":
        existingOfficer = await prisma.nACOBOfficer.findFirst({
          where: { badgeNumber: data.badgeNumber },
        });
        break;
      case "NATIONAL_SECURITY_OFFICER":
        existingOfficer = await prisma.nationalSecurityOfficer.findFirst({
          where: { badgeNumber: data.badgeNumber },
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

    // Create the officer based on type
    let officer;
    switch (data.officerType) {
      case "CUSTOMS_OFFICER":
        officer = await prisma.customsOfficer.create({
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "ASSAY_OFFICER":
        officer = await prisma.assayOfficer.create({
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "TECHNICAL_DIRECTOR":
        officer = await prisma.technicalDirector.create({
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "NACOB_OFFICER":
        officer = await prisma.nACOBOfficer.create({
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
      case "NATIONAL_SECURITY_OFFICER":
        officer = await prisma.nationalSecurityOfficer.create({
          data: {
            name: data.name,
            badgeNumber: data.badgeNumber,
            email: data.email || null,
            phone: data.phone || null,
          },
        });
        break;
    }

    return NextResponse.json(
      { ...officer, officerType: data.officerType },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating officer:", error);
    return NextResponse.json(
      { error: "Error creating officer" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with audit trail
export const GET = withAuditTrail(getAllOfficers, { entityType: "Officer" });
export const POST = withAuditTrail(createOfficer, { entityType: "Officer" });
