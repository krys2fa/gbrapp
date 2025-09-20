-- AlterTable
ALTER TABLE "public"."Assay" ADD COLUMN     "humanReadableAssayNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."LargeScaleAssay" ADD COLUMN     "humanReadableAssayNumber" TEXT;

-- CreateTable
CREATE TABLE "public"."AssaySequence" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "assayType" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssaySequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssaySequence_year_assayType_key" ON "public"."AssaySequence"("year", "assayType");
