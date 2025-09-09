/*
  Warnings:

  - A unique constraint covering the columns `[jobCardId]` on the table `Fee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[largeScaleJobCardId]` on the table `Fee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Fee" DROP CONSTRAINT "Fee_jobCardId_fkey";

-- AlterTable
ALTER TABLE "public"."Fee" ADD COLUMN     "largeScaleJobCardId" TEXT,
ALTER COLUMN "jobCardId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Fee_jobCardId_key" ON "public"."Fee"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_largeScaleJobCardId_key" ON "public"."Fee"("largeScaleJobCardId");

-- AddForeignKey
ALTER TABLE "public"."Fee" ADD CONSTRAINT "Fee_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fee" ADD CONSTRAINT "Fee_largeScaleJobCardId_fkey" FOREIGN KEY ("largeScaleJobCardId") REFERENCES "public"."LargeScaleJobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
