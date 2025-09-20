/*
  Warnings:

  - A unique constraint covering the columns `[humanReadableAssayNumber]` on the table `Assay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[humanReadableAssayNumber]` on the table `LargeScaleAssay` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Assay_humanReadableAssayNumber_key" ON "public"."Assay"("humanReadableAssayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LargeScaleAssay_humanReadableAssayNumber_key" ON "public"."LargeScaleAssay"("humanReadableAssayNumber");
