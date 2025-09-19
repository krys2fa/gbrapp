/*
  Warnings:

  - A unique constraint covering the columns `[exporterCode]` on the table `Exporter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exporterCode` to the `Exporter` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the column as nullable first
ALTER TABLE "public"."Exporter" ADD COLUMN "exporterCode" TEXT;

-- Step 2: Populate existing records with generated codes
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM "public"."Exporter" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "public"."Exporter" 
        SET "exporterCode" = 'EXP-' || LPAD(counter::TEXT, 3, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Make the column NOT NULL now that all records have values
ALTER TABLE "public"."Exporter" ALTER COLUMN "exporterCode" SET NOT NULL;

-- Step 4: Create the unique index
CREATE UNIQUE INDEX "Exporter_exporterCode_key" ON "public"."Exporter"("exporterCode");
