/*
  Warnings:

  - You are about to drop the column `consigneeAddress` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `consigneeEmail` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `consigneeMobile` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `consigneeTelephone` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLocation` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterEmail` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterLicenseNumber` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterTelephone` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `exporterWebsite` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyAddress` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyContactPerson` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyEmail` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyMobile` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyName` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `notifiedPartyTelephone` on the `LargeScaleJobCard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Exporter" ADD COLUMN     "consigneeAddress" TEXT,
ADD COLUMN     "consigneeEmail" TEXT,
ADD COLUMN     "consigneeMobile" TEXT,
ADD COLUMN     "consigneeTelephone" TEXT,
ADD COLUMN     "deliveryLocation" TEXT,
ADD COLUMN     "exporterEmail" TEXT,
ADD COLUMN     "exporterLicenseNumber" TEXT,
ADD COLUMN     "exporterTelephone" TEXT,
ADD COLUMN     "exporterWebsite" TEXT,
ADD COLUMN     "notifiedPartyAddress" TEXT,
ADD COLUMN     "notifiedPartyContactPerson" TEXT,
ADD COLUMN     "notifiedPartyEmail" TEXT,
ADD COLUMN     "notifiedPartyMobile" TEXT,
ADD COLUMN     "notifiedPartyName" TEXT,
ADD COLUMN     "notifiedPartyTelephone" TEXT;

-- AlterTable
ALTER TABLE "public"."LargeScaleJobCard" DROP COLUMN "consigneeAddress",
DROP COLUMN "consigneeEmail",
DROP COLUMN "consigneeMobile",
DROP COLUMN "consigneeTelephone",
DROP COLUMN "deliveryLocation",
DROP COLUMN "exporterEmail",
DROP COLUMN "exporterLicenseNumber",
DROP COLUMN "exporterTelephone",
DROP COLUMN "exporterWebsite",
DROP COLUMN "notifiedPartyAddress",
DROP COLUMN "notifiedPartyContactPerson",
DROP COLUMN "notifiedPartyEmail",
DROP COLUMN "notifiedPartyMobile",
DROP COLUMN "notifiedPartyName",
DROP COLUMN "notifiedPartyTelephone";
