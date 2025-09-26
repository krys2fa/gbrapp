import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { Role } from "@/app/generated/prisma";
import { generateAssayNumber } from "@/lib/assay-number-generator";
import { logger, LogCategory } from "@/lib/logger";

async function postAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobCardId = id;
    const body = await request.json();

    // Validate that the job card exists
    const jobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id: jobCardId },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Check if assay already exists for this job card
    const existingAssay = await prisma.largeScaleAssay.findFirst({
      where: { jobCardId },
    });

    if (existingAssay) {
      return NextResponse.json(
        { error: "Assay already exists for this job card" },
        { status: 400 }
      );
    }

    // Create the assay with measurements
    const assay = await prisma.largeScaleAssay.create({
      data: {
        jobCardId,
        method: body.method,
        pieces: body.pieces,
        signatory: body.signatory,
        comments: body.comments,
        shipmentTypeId: body.shipmentTypeId,
        securitySealNo: body.securitySealNo,
        goldbodSealNo: body.goldbodSealNo,
        customsSealNo: body.customsSealNo,
        shipmentNumber: body.shipmentNumber,
        dateOfAnalysis: new Date(body.dateOfAnalysis),
        dataSheetDates: body.dataSheetDates || null,
        sampleBottleDates: body.sampleBottleDates || null,
        numberOfSamples: body.numberOfSamples,
        numberOfBars: body.numberOfBars,
        sampleType: body.sampleType,
        certificateNumber: body.certificateNumber || undefined,
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
        humanReadableAssayNumber: await generateAssayNumber("LS"),
        measurements: {
          create: body.measurements.map((measurement: any) => ({
            piece: measurement.piece,
            barNumber: measurement.barNumber,
            grossWeight: measurement.grossWeight,
            goldAssay: measurement.goldAssay,
            netGoldWeight: measurement.netGoldWeight,
            silverAssay: measurement.silverAssay,
            netSilverWeight: measurement.netSilverWeight,
          })),
        },
      } as any,
      include: {
        measurements: true,
        shipmentType: true,
      },
    });

    // If the job card does not yet have a certificateNumber, copy the assay-provided one
    try {
      if (body.certificateNumber && !jobCard.certificateNumber) {
        await prisma.largeScaleJobCard.update({
          where: { id: jobCardId },
          data: { certificateNumber: body.certificateNumber },
        });
      }
    } catch (err) {
      // Log but don't fail the assay creation if job card update fails due to uniqueness conflict
      void logger.error(
        LogCategory.ASSAY,
        "Failed to copy certificateNumber to job card",
        {
          error: err instanceof Error ? err.message : String(err),
        }
      );
    }

    return NextResponse.json(assay);
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error creating assay", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create assay" },
      { status: 500 }
    );
  }
}

async function getAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobCardId = id;

    const assay = await prisma.largeScaleAssay.findFirst({
      where: { jobCardId },
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
    void logger.error(LogCategory.ASSAY, "Error fetching assay", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch assay" },
      { status: 500 }
    );
  }
}

async function putAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobCardId = id;
    const body = await request.json();

    // Update the assay
    const existing = await prisma.largeScaleAssay.findFirst({
      where: { jobCardId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assay not found" }, { status: 404 });
    }

    const assay = await prisma.largeScaleAssay.update({
      where: { id: existing.id },
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
        dateOfAnalysis: new Date(body.dateOfAnalysis),
        dataSheetDates: body.dataSheetDates || null,
        sampleBottleDates: body.sampleBottleDates || null,
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
    });

    // Delete existing measurements and create new ones
    await prisma.largeScaleAssayMeasurement.deleteMany({
      where: { assayId: assay.id },
    });

    await prisma.largeScaleAssayMeasurement.createMany({
      data: body.measurements.map((measurement: any) => ({
        assayId: assay.id,
        piece: measurement.piece,
        barNumber: measurement.barNumber,
        grossWeight: measurement.grossWeight,
        goldAssay: measurement.goldAssay,
        netGoldWeight: measurement.netGoldWeight,
        silverAssay: measurement.silverAssay,
        netSilverWeight: measurement.netSilverWeight,
      })),
    });

    // Fetch the updated assay with measurements
    const updatedAssay = await prisma.largeScaleAssay.findUnique({
      where: { id: assay.id },
      include: {
        measurements: {
          orderBy: { piece: "asc" },
        },
        shipmentType: true,
      },
    });

    return NextResponse.json(updatedAssay);
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error updating assay", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update assay" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postAssay, []);
export const GET = withAuth(getAssay, []);
export const PUT = withAuth(putAssay, []);
