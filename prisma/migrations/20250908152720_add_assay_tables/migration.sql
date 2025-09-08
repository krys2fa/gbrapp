-- CreateTable
CREATE TABLE "public"."LargeScaleAssay" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "signatory" TEXT,
    "comments" TEXT,
    "shipmentTypeId" TEXT,
    "securitySealNo" TEXT,
    "goldbodSealNo" TEXT,
    "customsSealNo" TEXT,
    "shipmentNumber" TEXT,
    "dateOfAnalysis" TIMESTAMP(3) NOT NULL,
    "dataSheetDates" TIMESTAMP(3),
    "sampleBottleDates" TIMESTAMP(3),
    "numberOfSamples" INTEGER NOT NULL DEFAULT 1,
    "numberOfBars" INTEGER NOT NULL DEFAULT 1,
    "sampleType" TEXT NOT NULL DEFAULT 'capillary',
    "exchangeRate" DOUBLE PRECISION,
    "commodityPrice" DOUBLE PRECISION,
    "pricePerOz" DOUBLE PRECISION,
    "totalNetGoldWeight" DOUBLE PRECISION,
    "totalNetSilverWeight" DOUBLE PRECISION,
    "totalNetGoldWeightOz" DOUBLE PRECISION,
    "totalNetSilverWeightOz" DOUBLE PRECISION,
    "totalGoldValue" DOUBLE PRECISION,
    "totalSilverValue" DOUBLE PRECISION,
    "totalCombinedValue" DOUBLE PRECISION,
    "totalValueGhs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LargeScaleAssay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LargeScaleAssayMeasurement" (
    "id" TEXT NOT NULL,
    "assayId" TEXT NOT NULL,
    "piece" INTEGER NOT NULL,
    "barNumber" TEXT,
    "grossWeight" DOUBLE PRECISION,
    "goldAssay" DOUBLE PRECISION,
    "netGoldWeight" DOUBLE PRECISION,
    "silverAssay" DOUBLE PRECISION,
    "netSilverWeight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LargeScaleAssayMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleAssay_jobCardId_key" ON "public"."LargeScaleAssay"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleAssayMeasurement_assayId_piece_key" ON "public"."LargeScaleAssayMeasurement"("assayId", "piece");

-- AddForeignKey
ALTER TABLE "public"."LargeScaleAssay" ADD CONSTRAINT "LargeScaleAssay_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."LargeScaleJobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleAssay" ADD CONSTRAINT "LargeScaleAssay_shipmentTypeId_fkey" FOREIGN KEY ("shipmentTypeId") REFERENCES "public"."ShipmentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleAssayMeasurement" ADD CONSTRAINT "LargeScaleAssayMeasurement_assayId_fkey" FOREIGN KEY ("assayId") REFERENCES "public"."LargeScaleAssay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
