import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching a single job card
 */
async function getJobCard(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: params.id },
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        shipmentType: true,
        customsOfficer: true,
        nacobOfficer: true,
        securityOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        seals: true,
        assays: true,
        invoices: true,
        fees: true,
        levies: true,
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error("Error fetching job card:", error);
    return NextResponse.json(
      { error: "Error fetching job card" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a job card
 */
async function updateJobCard(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    // Check if job card exists
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id: params.id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Update the job card
    const updatedJobCard = await prisma.jobCard.update({
      where: { id: params.id },
      data,
      include: {
        exporter: true,
        shipmentType: true,
        customsOfficer: true,
        nacobOfficer: true,
        securityOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
      },
    });

    return NextResponse.json(updatedJobCard);
  } catch (error) {
    console.error("Error updating job card:", error);
    return NextResponse.json(
      { error: "Error updating job card" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a job card
 */
async function deleteJobCard(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if job card exists
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id: params.id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Delete the job card
    await prisma.jobCard.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Job card deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job card:", error);
    return NextResponse.json(
      { error: "Error deleting job card" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with auth and audit trail
export const GET = withProtectedRoute(getJobCard, {
  entityType: "JobCard",
  requiredRoles: [Role.ADMIN, Role.USER, Role.SUPERADMIN],
});

export const PUT = withProtectedRoute(updateJobCard, {
  entityType: "JobCard",
  requiredRoles: [Role.ADMIN, Role.SUPERADMIN],
});

export const DELETE = withProtectedRoute(deleteJobCard, {
  entityType: "JobCard",
  requiredRoles: [Role.SUPERADMIN],
});
