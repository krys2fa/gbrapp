import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper to extract ID from the URL
function getIdFromUrl(req: NextRequest): string | null {
  try {
    // Extract the ID from the URL pathname
    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/");
    // The ID should be the last segment
    const id = segments[segments.length - 1];
    return id || null;
  } catch (error) {
    console.error("Error extracting ID from URL:", error);
    return null;
  }
}

/**
 * GET handler for fetching a single job card
 */
export async function GET(req: NextRequest) {
  try {
    const id = await getIdFromUrl(req);
    console.log("GET request for job card with ID:", id);

    // Ensure id exists
    if (!id) {
      return NextResponse.json(
        { error: "Job card ID is required" },
        { status: 400 }
      );
    }

    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
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
export async function PUT(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);
    console.log("PUT request for job card with ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing job card ID" },
        { status: 400 }
      );
    }

    // Check if job card exists first
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Get the data from the request
    const requestData = await req.json();
    console.log("Received update data:", JSON.stringify(requestData, null, 2));

    // Create update object with all the provided fields
    const updateData: any = {};

    // Update only the fields that are provided and belong to JobCard model
    if (requestData.referenceNumber !== undefined) {
      updateData.referenceNumber = requestData.referenceNumber;
    }
    if (requestData.receivedDate !== undefined) {
      updateData.receivedDate = new Date(requestData.receivedDate);
    }
    if (requestData.exporterId !== undefined) {
      updateData.exporterId = requestData.exporterId;
    }
    if (requestData.shipmentTypeId !== undefined) {
      updateData.shipmentTypeId = requestData.shipmentTypeId;
    }
    if (requestData.status !== undefined) {
      updateData.status = requestData.status;
    }
    if (requestData.notes !== undefined) {
      updateData.notes = requestData.notes;
    }
    // Add all the new fields from the form
    if (requestData.unitOfMeasure !== undefined) {
      updateData.unitOfMeasure = requestData.unitOfMeasure;
    }
    if (requestData.idType !== undefined) {
      updateData.idType = requestData.idType;
    }
    if (requestData.buyerIdNumber !== undefined) {
      updateData.buyerIdNumber = requestData.buyerIdNumber;
    }
    if (requestData.buyerName !== undefined) {
      updateData.buyerName = requestData.buyerName;
    }
    if (requestData.buyerPhone !== undefined) {
      updateData.buyerPhone = requestData.buyerPhone;
    }
    if (requestData.exporterPricePerOz !== undefined) {
      updateData.exporterPricePerOz = parseFloat(
        requestData.exporterPricePerOz
      );
    }
    if (requestData.teamLeader !== undefined) {
      updateData.teamLeader = requestData.teamLeader;
    }
    if (requestData.totalGrossWeight !== undefined) {
      updateData.totalGrossWeight = parseFloat(requestData.totalGrossWeight);
    }
    if (requestData.destinationCountry !== undefined) {
      updateData.destinationCountry = requestData.destinationCountry;
    }
    if (requestData.fineness !== undefined) {
      updateData.fineness = parseFloat(requestData.fineness);
    }
    if (requestData.sourceOfGold !== undefined) {
      updateData.sourceOfGold = requestData.sourceOfGold;
    }
    if (requestData.totalNetWeight !== undefined) {
      updateData.totalNetWeight = parseFloat(requestData.totalNetWeight);
    }
    if (requestData.totalNetWeightOz !== undefined) {
      updateData.totalNetWeightOz = parseFloat(requestData.totalNetWeightOz);
    }
    if (requestData.numberOfPersons !== undefined) {
      updateData.numberOfPersons = parseInt(requestData.numberOfPersons);
    }
    if (requestData.exporterValueUsd !== undefined) {
      updateData.exporterValueUsd = parseFloat(requestData.exporterValueUsd);
    }
    if (requestData.exporterValueGhs !== undefined) {
      updateData.exporterValueGhs = parseFloat(requestData.exporterValueGhs);
    }
    if (requestData.graDeclarationNumber !== undefined) {
      updateData.graDeclarationNumber = requestData.graDeclarationNumber;
    }
    if (requestData.numberOfBoxes !== undefined) {
      updateData.numberOfBoxes = parseInt(requestData.numberOfBoxes);
    }
    if (requestData.remittanceType !== undefined) {
      updateData.remittanceType = requestData.remittanceType;
    }

    console.log("Updating with data:", updateData);

    try {
      // Update the job card with the provided data
      const updatedJobCard = await prisma.jobCard.update({
        where: { id },
        data: updateData,
        include: {
          exporter: true,
          shipmentType: true,
        },
      });

      return NextResponse.json(updatedJobCard);
    } catch (updateError) {
      console.error("Error during update operation:", updateError);
      return NextResponse.json(
        {
          error: "Error updating job card",
          details:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating job card:", error);
    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: "Error updating job card",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause:
          error instanceof Error
            ? error.cause
              ? String(error.cause)
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a job card
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);
    console.log("DELETE request for job card with ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing job card ID" },
        { status: 400 }
      );
    }

    // Check if job card exists
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Delete the job card
    await prisma.jobCard.delete({
      where: { id },
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
