-- AlterTable
ALTER TABLE "public"."Assay" ADD COLUMN     "shipmentTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Assay" ADD CONSTRAINT "Assay_shipmentTypeId_fkey" FOREIGN KEY ("shipmentTypeId") REFERENCES "public"."ShipmentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
