/*
  Warnings:

  - A unique constraint covering the columns `[certificateNumber]` on the table `JobCard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[certificateNumber]` on the table `LargeScaleJobCard` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."JobCard" ADD COLUMN     "certificateNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."LargeScaleJobCard" ADD COLUMN     "certificateNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_certificateNumber_key" ON "public"."JobCard"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleJobCard_certificateNumber_key" ON "public"."LargeScaleJobCard"("certificateNumber");
