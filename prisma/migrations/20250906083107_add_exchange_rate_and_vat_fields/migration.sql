-- AlterTable
ALTER TABLE "public"."Assay" ADD COLUMN     "exchangeRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "vat" DOUBLE PRECISION;
