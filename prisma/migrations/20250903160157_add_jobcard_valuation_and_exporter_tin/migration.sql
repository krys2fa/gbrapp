-- AlterTable
ALTER TABLE "public"."Exporter" ADD COLUMN     "tin" INTEGER;

-- AlterTable
ALTER TABLE "public"."JobCard" ADD COLUMN     "numberOfOunces" DOUBLE PRECISION,
ADD COLUMN     "pricePerOunce" DOUBLE PRECISION,
ADD COLUMN     "valueUsd" DOUBLE PRECISION;
