/*
  Warnings:

  - You are about to drop the column `exporterPricePerOz` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterValueGhs` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterValueUsd` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `totalNetWeightOz` on the `JobCard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tin]` on the table `Exporter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commodityId` to the `JobCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Exporter" ADD COLUMN     "tin" TEXT;

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "exporterPricePerOz",
DROP COLUMN "exporterValueGhs",
DROP COLUMN "exporterValueUsd",
DROP COLUMN "totalNetWeightOz",
ADD COLUMN     "buyerAddress" TEXT,
ADD COLUMN     "commodityId" TEXT NOT NULL,
ADD COLUMN     "shipmentNumber" INTEGER;

-- CreateTable
CREATE TABLE "public"."AssayMeasurement" (
    "id" TEXT NOT NULL,
    "assayId" TEXT NOT NULL,
    "pieceNumber" INTEGER NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "waterWeight" DOUBLE PRECISION,
    "fineness" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssayMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exporter_tin_key" ON "public"."Exporter"("tin");

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssayMeasurement" ADD CONSTRAINT "AssayMeasurement_assayId_fkey" FOREIGN KEY ("assayId") REFERENCES "public"."Assay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
