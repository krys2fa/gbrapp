-- CreateEnum
CREATE TYPE "public"."IdType" AS ENUM ('PASSPORT', 'GHANA_CARD', 'DRIVERS_LICENSE', 'TIN');

-- AlterTable
ALTER TABLE "public"."JobCard" ADD COLUMN     "buyerIdNumber" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "buyerPhone" TEXT,
ADD COLUMN     "destinationCountry" TEXT,
ADD COLUMN     "exporterPricePerOz" DOUBLE PRECISION,
ADD COLUMN     "exporterValueGhs" DOUBLE PRECISION,
ADD COLUMN     "exporterValueUsd" DOUBLE PRECISION,
ADD COLUMN     "fineness" DOUBLE PRECISION,
ADD COLUMN     "graDeclarationNumber" TEXT,
ADD COLUMN     "idType" "public"."IdType" DEFAULT 'TIN',
ADD COLUMN     "numberOfBoxes" INTEGER,
ADD COLUMN     "numberOfPersons" INTEGER,
ADD COLUMN     "remittanceType" TEXT,
ADD COLUMN     "sourceOfGold" TEXT DEFAULT 'Ghana',
ADD COLUMN     "teamLeader" TEXT,
ADD COLUMN     "totalGrossWeight" DOUBLE PRECISION,
ADD COLUMN     "totalNetWeight" DOUBLE PRECISION,
ADD COLUMN     "totalNetWeightOz" DOUBLE PRECISION,
ADD COLUMN     "unitOfMeasure" TEXT;
