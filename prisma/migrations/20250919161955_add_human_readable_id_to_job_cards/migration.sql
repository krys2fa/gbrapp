/*
  Add humanReadableId to JobCard and LargeScaleJobCard tables
  Handle existing data by generating IDs based on created date
*/

-- Add columns as nullable first
ALTER TABLE "public"."JobCard" ADD COLUMN "humanReadableId" TEXT;
ALTER TABLE "public"."LargeScaleJobCard" ADD COLUMN "humanReadableId" TEXT;

-- Update existing JobCard records with SS-YYYY-XXXX format
WITH numbered_jobs AS (
  SELECT "id", 'SS-' || EXTRACT(YEAR FROM "createdAt") || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::TEXT, 4, '0') as new_id
  FROM "public"."JobCard"
  WHERE "humanReadableId" IS NULL
)
UPDATE "public"."JobCard" 
SET "humanReadableId" = numbered_jobs.new_id
FROM numbered_jobs
WHERE "public"."JobCard"."id" = numbered_jobs."id";

-- Update existing LargeScaleJobCard records with LS-YYYY-XXXX format
WITH numbered_large_jobs AS (
  SELECT "id", 'LS-' || EXTRACT(YEAR FROM "createdAt") || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::TEXT, 4, '0') as new_id
  FROM "public"."LargeScaleJobCard"
  WHERE "humanReadableId" IS NULL
)
UPDATE "public"."LargeScaleJobCard" 
SET "humanReadableId" = numbered_large_jobs.new_id
FROM numbered_large_jobs
WHERE "public"."LargeScaleJobCard"."id" = numbered_large_jobs."id";

-- Make columns NOT NULL after populating data
ALTER TABLE "public"."JobCard" ALTER COLUMN "humanReadableId" SET NOT NULL;
ALTER TABLE "public"."LargeScaleJobCard" ALTER COLUMN "humanReadableId" SET NOT NULL;

-- Create unique indexes
CREATE UNIQUE INDEX "JobCard_humanReadableId_key" ON "public"."JobCard"("humanReadableId");
CREATE UNIQUE INDEX "LargeScaleJobCard_humanReadableId_key" ON "public"."LargeScaleJobCard"("humanReadableId");
