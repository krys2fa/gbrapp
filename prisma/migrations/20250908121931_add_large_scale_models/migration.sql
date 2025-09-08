/*
  Warnings:

  - The values [PMMC_SEAL] on the enum `SealType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `date` to the `DailyPrice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SealType_new" AS ENUM ('CUSTOMS_SEAL', 'OTHER_SEAL', 'SECURITY_SEAL', 'GOLDBOD_SEAL');
ALTER TABLE "public"."Seal" ALTER COLUMN "sealType" TYPE "public"."SealType_new" USING ("sealType"::text::"public"."SealType_new");
ALTER TYPE "public"."SealType" RENAME TO "SealType_old";
ALTER TYPE "public"."SealType_new" RENAME TO "SealType";
DROP TYPE "public"."SealType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."DailyPrice" ADD COLUMN     "date" TIMESTAMP(3);

-- Update existing rows to set date to createdAt if date is null
UPDATE "public"."DailyPrice" SET "date" = "createdAt" WHERE "date" IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE "public"."DailyPrice" ALTER COLUMN "date" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."LargeScaleJobCard" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "exporterId" TEXT NOT NULL,
    "unitOfMeasure" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "destinationCountry" TEXT,
    "sourceOfGold" TEXT DEFAULT 'Ghana',
    "numberOfBoxes" INTEGER,
    "customsOfficerId" TEXT,
    "assayOfficerId" TEXT,
    "technicalDirectorId" TEXT,
    "nacobOfficerId" TEXT,
    "nationalSecurityOfficerId" TEXT,
    "consigneeAddress" TEXT,
    "consigneeTelephone" TEXT,
    "consigneeMobile" TEXT,
    "consigneeEmail" TEXT,
    "deliveryLocation" TEXT,
    "exporterTelephone" TEXT,
    "exporterEmail" TEXT,
    "exporterWebsite" TEXT,
    "exporterLicenseNumber" TEXT,
    "notifiedPartyName" TEXT,
    "notifiedPartyAddress" TEXT,
    "notifiedPartyEmail" TEXT,
    "notifiedPartyContactPerson" TEXT,
    "notifiedPartyTelephone" TEXT,
    "notifiedPartyMobile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LargeScaleJobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LargeScaleJobCardCommodity" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION,
    "fineness" DOUBLE PRECISION,
    "valueGhs" DOUBLE PRECISION,
    "valueUsd" DOUBLE PRECISION,
    "pricePerOunce" DOUBLE PRECISION,
    "numberOfOunces" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LargeScaleJobCardCommodity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleJobCard_referenceNumber_key" ON "public"."LargeScaleJobCard"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleJobCardCommodity_jobCardId_commodityId_key" ON "public"."LargeScaleJobCardCommodity"("jobCardId", "commodityId");

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "public"."Exporter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_customsOfficerId_fkey" FOREIGN KEY ("customsOfficerId") REFERENCES "public"."CustomsOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_assayOfficerId_fkey" FOREIGN KEY ("assayOfficerId") REFERENCES "public"."AssayOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_technicalDirectorId_fkey" FOREIGN KEY ("technicalDirectorId") REFERENCES "public"."TechnicalDirector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_nacobOfficerId_fkey" FOREIGN KEY ("nacobOfficerId") REFERENCES "public"."NACOBOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCard" ADD CONSTRAINT "LargeScaleJobCard_nationalSecurityOfficerId_fkey" FOREIGN KEY ("nationalSecurityOfficerId") REFERENCES "public"."NationalSecurityOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCardCommodity" ADD CONSTRAINT "LargeScaleJobCardCommodity_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."LargeScaleJobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LargeScaleJobCardCommodity" ADD CONSTRAINT "LargeScaleJobCardCommodity_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
