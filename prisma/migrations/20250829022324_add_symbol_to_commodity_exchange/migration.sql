/*
  Warnings:

  - Added the required column `symbol` to the `Commodity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `Exchange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Commodity" ADD COLUMN     "symbol" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Exchange" ADD COLUMN     "symbol" TEXT NOT NULL;
