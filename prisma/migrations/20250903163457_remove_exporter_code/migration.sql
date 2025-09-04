/*
  Warnings:

  - You are about to drop the column `code` on the `Exporter` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Exporter_code_key";

-- AlterTable
ALTER TABLE "public"."Exporter" DROP COLUMN "code";
