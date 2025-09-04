/*
  Warnings:

  - You are about to drop the column `shipmentTypeId` on the `JobCard` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JobCard" DROP CONSTRAINT "JobCard_shipmentTypeId_fkey";

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "shipmentTypeId";
