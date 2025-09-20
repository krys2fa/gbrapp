import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import * as jose from "jose";
import {
  validateAPIPermission,
  createUnauthorizedResponse,
} from "@/app/lib/api-validation";

/**
 * GET handler for fetching a single large scale job card by ID
 */
async function getLargeScaleJobCard(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user has large-scale job-cards permission
    const validation = await validateAPIPermission(
      req,
      "job-cards/large-scale"
    );
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    const { id } = await params;

    const jobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id },
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        commodities: {
          include: {
            commodity: true,
          },
        },
        assays: {
          include: {
            measurements: {
              orderBy: { piece: "asc" },
            },
            shipmentType: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            issueDate: true,
            currency: {
              select: {
                symbol: true,
              },
            },
          },
        },
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: "Large scale job card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error("Error fetching large scale job card:", error);
    return NextResponse.json(
      { error: "Failed to fetch large scale job card" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a large scale job card
 */
async function updateLargeScaleJobCard(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user has large-scale job-cards permission
    const validation = await validateAPIPermission(
      req,
      "job-cards/large-scale"
    );
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    const { id } = await params;
    const body = await req.json();

    const {
      referenceNumber,
      receivedDate,
      exporterId,
      unitOfMeasure,
      status,
      notes,
      destinationCountry,
      sourceOfGold,
      numberOfBoxes,
      customsOfficerId,
      assayOfficerId,
      technicalDirectorId,
      consigneeAddress,
      consigneeTelephone,
      consigneeMobile,
      consigneeEmail,
      deliveryLocation,
      exporterTelephone,
      exporterEmail,
      exporterWebsite,
      exporterLicenseNumber,
      notifiedPartyName,
      notifiedPartyAddress,
      notifiedPartyEmail,
      notifiedPartyContactPerson,
      notifiedPartyTelephone,
      notifiedPartyMobile,
      commodities,
    } = body;

    // Check if job card exists
    const existingJobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Large scale job card not found" },
        { status: 404 }
      );
    }

    // Check if reference number is being changed and if it conflicts
    if (
      referenceNumber &&
      referenceNumber !== existingJobCard.referenceNumber
    ) {
      const referenceConflict = await prisma.largeScaleJobCard.findUnique({
        where: { referenceNumber },
      });

      if (referenceConflict) {
        return NextResponse.json(
          { error: "A job card with this reference number already exists" },
          { status: 409 }
        );
      }
    }

    // Update the job card
    const updateData: any = {};

    if (referenceNumber !== undefined)
      updateData.referenceNumber = referenceNumber;
    if (receivedDate !== undefined)
      updateData.receivedDate = receivedDate ? new Date(receivedDate) : null;
    if (exporterId !== undefined) updateData.exporterId = exporterId;
    if (unitOfMeasure !== undefined) updateData.unitOfMeasure = unitOfMeasure;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (destinationCountry !== undefined)
      updateData.destinationCountry = destinationCountry;
    if (sourceOfGold !== undefined) updateData.sourceOfGold = sourceOfGold;
    if (numberOfBoxes !== undefined) updateData.numberOfBoxes = numberOfBoxes;
    if (customsOfficerId !== undefined)
      updateData.customsOfficerId = customsOfficerId;
    if (assayOfficerId !== undefined)
      updateData.assayOfficerId = assayOfficerId;
    if (technicalDirectorId !== undefined)
      updateData.technicalDirectorId = technicalDirectorId;
    if (consigneeAddress !== undefined)
      updateData.consigneeAddress = consigneeAddress;
    if (consigneeTelephone !== undefined)
      updateData.consigneeTelephone = consigneeTelephone;
    if (consigneeMobile !== undefined)
      updateData.consigneeMobile = consigneeMobile;
    if (consigneeEmail !== undefined)
      updateData.consigneeEmail = consigneeEmail;
    if (deliveryLocation !== undefined)
      updateData.deliveryLocation = deliveryLocation;
    if (exporterTelephone !== undefined)
      updateData.exporterTelephone = exporterTelephone;
    if (exporterEmail !== undefined) updateData.exporterEmail = exporterEmail;
    if (exporterWebsite !== undefined)
      updateData.exporterWebsite = exporterWebsite;
    if (exporterLicenseNumber !== undefined)
      updateData.exporterLicenseNumber = exporterLicenseNumber;
    if (notifiedPartyName !== undefined)
      updateData.notifiedPartyName = notifiedPartyName;
    if (notifiedPartyAddress !== undefined)
      updateData.notifiedPartyAddress = notifiedPartyAddress;
    if (notifiedPartyEmail !== undefined)
      updateData.notifiedPartyEmail = notifiedPartyEmail;
    if (notifiedPartyContactPerson !== undefined)
      updateData.notifiedPartyContactPerson = notifiedPartyContactPerson;
    if (notifiedPartyTelephone !== undefined)
      updateData.notifiedPartyTelephone = notifiedPartyTelephone;
    if (notifiedPartyMobile !== undefined)
      updateData.notifiedPartyMobile = notifiedPartyMobile;

    const updatedJobCard = await prisma.largeScaleJobCard.update({
      where: { id },
      data: updateData,
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        commodities: {
          include: {
            commodity: true,
          },
        },
      },
    });

    // Update commodities if provided
    if (commodities && Array.isArray(commodities)) {
      // Delete existing commodities
      await prisma.largeScaleJobCardCommodity.deleteMany({
        where: { jobCardId: id },
      });

      // Create new commodities
      for (const commodityData of commodities) {
        if (commodityData.commodityId) {
          await prisma.largeScaleJobCardCommodity.create({
            data: {
              jobCardId: id,
              commodityId: commodityData.commodityId,
              grossWeight: commodityData.grossWeight,
              netWeight: commodityData.netWeight,
              fineness: commodityData.fineness,
              valueGhs: commodityData.valueGhs,
              valueUsd: commodityData.valueUsd,
              pricePerOunce: commodityData.pricePerOunce,
              numberOfOunces: commodityData.numberOfOunces,
            },
          });
        }
      }
    }

    // Fetch the complete updated job card with commodities
    const completeJobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id },
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        commodities: {
          include: {
            commodity: true,
          },
        },
      },
    });

    return NextResponse.json(completeJobCard);
  } catch (error) {
    console.error("Error updating large scale job card:", error);
    return NextResponse.json(
      { error: "Failed to update large scale job card" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a large scale job card
 */
async function deleteLargeScaleJobCard(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user has large-scale job-cards permission
    const validation = await validateAPIPermission(
      req,
      "job-cards/large-scale"
    );
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    const { id } = await params;

    // Check if job card exists
    const existingJobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Large scale job card not found" },
        { status: 404 }
      );
    }

    // Delete the job card (commodities will be deleted automatically due to cascade)
    await prisma.largeScaleJobCard.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Large scale job card deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting large scale job card:", error);
    return NextResponse.json(
      { error: "Failed to delete large scale job card" },
      { status: 500 }
    );
  }
}

// Export the handlers
export const GET = getLargeScaleJobCard;
export const PUT = updateLargeScaleJobCard;
export const DELETE = deleteLargeScaleJobCard;
