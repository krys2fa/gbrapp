/*
  Warnings:

  - You are about to drop the column `buyerIdNumber` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `buyerPhone` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `graDeclarationNumber` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `idType` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfPersons` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `remittanceType` on the `JobCard` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WeeklyPriceType" AS ENUM ('COMMODITY', 'EXCHANGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'TELLER';
ALTER TYPE "public"."Role" ADD VALUE 'CEO';
ALTER TYPE "public"."Role" ADD VALUE 'DEPUTY_CEO';
ALTER TYPE "public"."Role" ADD VALUE 'FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SealType" ADD VALUE 'SECURITY_SEAL';
ALTER TYPE "public"."SealType" ADD VALUE 'GOLDBOD_SEAL';

-- AlterTable
ALTER TABLE "public"."Assay" ADD COLUMN     "commodityPrice" DOUBLE PRECISION,
ADD COLUMN     "customsSealNo" TEXT,
ADD COLUMN     "exporterSignatory" TEXT,
ADD COLUMN     "fineness" DOUBLE PRECISION,
ADD COLUMN     "goldbodSealNo" TEXT,
ADD COLUMN     "goldbodSignatory" TEXT,
ADD COLUMN     "grossWeight" DOUBLE PRECISION,
ADD COLUMN     "jbFineness" DOUBLE PRECISION,
ADD COLUMN     "jbGrossWeight" DOUBLE PRECISION,
ADD COLUMN     "jbNetWeight" DOUBLE PRECISION,
ADD COLUMN     "jbPricePerOz" DOUBLE PRECISION,
ADD COLUMN     "jbTotalGhsValue" DOUBLE PRECISION,
ADD COLUMN     "jbTotalUsdValue" DOUBLE PRECISION,
ADD COLUMN     "jbWeightInOz" DOUBLE PRECISION,
ADD COLUMN     "netWeight" DOUBLE PRECISION,
ADD COLUMN     "pricePerOz" DOUBLE PRECISION,
ADD COLUMN     "securitySealNo" TEXT,
ADD COLUMN     "totalGhsValue" DOUBLE PRECISION,
ADD COLUMN     "totalUsdValue" DOUBLE PRECISION,
ADD COLUMN     "weightInOz" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "covid" DOUBLE PRECISION,
ADD COLUMN     "getfund" DOUBLE PRECISION,
ADD COLUMN     "grandTotal" DOUBLE PRECISION,
ADD COLUMN     "nhil" DOUBLE PRECISION,
ADD COLUMN     "rateCharge" DOUBLE PRECISION,
ADD COLUMN     "subTotal" DOUBLE PRECISION,
ADD COLUMN     "totalExclusive" DOUBLE PRECISION,
ADD COLUMN     "totalInclusive" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "buyerIdNumber",
DROP COLUMN "buyerPhone",
DROP COLUMN "graDeclarationNumber",
DROP COLUMN "idType",
DROP COLUMN "numberOfPersons",
DROP COLUMN "remittanceType",
ADD COLUMN     "buyerAddress" TEXT;

-- CreateTable
CREATE TABLE "public"."WeeklyPrice" (
    "id" TEXT NOT NULL,
    "type" "public"."WeeklyPriceType" NOT NULL,
    "commodityId" TEXT,
    "exchangeId" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPrice_type_commodityId_weekStartDate_key" ON "public"."WeeklyPrice"("type", "commodityId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPrice_type_exchangeId_weekStartDate_key" ON "public"."WeeklyPrice"("type", "exchangeId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "public"."WeeklyPrice" ADD CONSTRAINT "WeeklyPrice_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."Commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyPrice" ADD CONSTRAINT "WeeklyPrice_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "public"."Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
