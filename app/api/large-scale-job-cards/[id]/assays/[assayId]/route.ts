import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function getAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assayId: string }> }
) {
  try {
    const { id: jobCardId, assayId } = await params;

    const assay = await prisma.largeScaleAssay.findFirst({
      where: {
        id: assayId,
        jobCardId: jobCardId,
      },
      include: {
        measurements: {
          orderBy: { piece: "asc" },
        },
        shipmentType: true,
      },
    });

    if (!assay) {
      return NextResponse.json({ error: "Assay not found" }, { status: 404 });
    }

    return NextResponse.json(assay);
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error fetching assay detail", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch assay" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAssay, []);

async function updateAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assayId: string }> }
) {
  try {
    const { id: jobCardId, assayId } = await params;
    const body = await request.json();

    // Verify the assay exists and belongs to the job card
    const existingAssay = await prisma.largeScaleAssay.findFirst({
      where: {
        id: assayId,
        jobCardId: jobCardId,
      },
    });

    if (!existingAssay) {
      return NextResponse.json({ error: "Assay not found" }, { status: 404 });
    }

    // Update the assay
    const updatedAssay = await prisma.largeScaleAssay.update({
      where: { id: assayId },
      data: {
        method: body.method,
        pieces: body.pieces,
        signatory: body.signatory,
        comments: body.comments,
        shipmentTypeId: body.shipmentTypeId,
        securitySealNo: body.securitySealNo,
        goldbodSealNo: body.goldbodSealNo,
        customsSealNo: body.customsSealNo,
        shipmentNumber: body.shipmentNumber,
        dateOfAnalysis: body.dateOfAnalysis,
        dataSheetDates: body.dataSheetDates,
        sampleBottleDates: body.sampleBottleDates,
        numberOfSamples: body.numberOfSamples,
        numberOfBars: body.numberOfBars,
        sampleType: body.sampleType,
        exchangeRate: body.exchangeRate,
        commodityPrice: body.commodityPrice,
        pricePerOz: body.pricePerOz,
        totalNetGoldWeight: body.totalNetGoldWeight,
        totalNetSilverWeight: body.totalNetSilverWeight,
        totalNetGoldWeightOz: body.totalNetGoldWeightOz,
        totalNetSilverWeightOz: body.totalNetSilverWeightOz,
        totalGoldValue: body.totalGoldValue,
        totalSilverValue: body.totalSilverValue,
        totalCombinedValue: body.totalCombinedValue,
        totalValueGhs: body.totalValueGhs,
      },
      include: {
        measurements: {
          orderBy: { piece: "asc" },
        },
        shipmentType: true,
      },
    });

    void logger.info(LogCategory.ASSAY, "Assay updated successfully", {
      assayId,
      jobCardId,
    });

    return NextResponse.json(updatedAssay);
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error updating assay", {
      error: error instanceof Error ? error.message : String(error),
      assayId,
    });
    return NextResponse.json(
      { error: "Failed to update assay" },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateAssay, ["ASSAYER", "ADMIN", "SUPERADMIN"]);
