/*
  Warnings:

  - A unique constraint covering the columns `[jobCardId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[largeScaleJobCardId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_jobCardId_fkey";

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "largeScaleJobCardId" TEXT,
ALTER COLUMN "jobCardId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_jobCardId_key" ON "public"."Invoice"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_largeScaleJobCardId_key" ON "public"."Invoice"("largeScaleJobCardId");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_largeScaleJobCardId_fkey" FOREIGN KEY ("largeScaleJobCardId") REFERENCES "public"."LargeScaleJobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
