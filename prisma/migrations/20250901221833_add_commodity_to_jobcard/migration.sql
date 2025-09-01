/*
  Warnings:

  - You are about to drop the column `tin` on the `Exporter` table. All the data in the column will be lost.
  - You are about to drop the column `buyerAddress` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `shipmentNumber` on the `JobCard` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JobCard" DROP CONSTRAINT "JobCard_commodityId_fkey";

-- DropIndex
DROP INDEX "public"."Exporter_tin_key";

-- AlterTable
ALTER TABLE "public"."Exporter" DROP COLUMN "tin";

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "buyerAddress",
DROP COLUMN "shipmentNumber",
ALTER COLUMN "commodityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."Commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
