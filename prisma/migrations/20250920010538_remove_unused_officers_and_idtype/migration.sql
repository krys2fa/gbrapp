/*
  Warnings:

  - You are about to drop the column `nacobOfficerId` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `securityOfficerId` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `nacobOfficerId` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the column `nationalSecurityOfficerId` on the `LargeScaleJobCard` table. All the data in the column will be lost.
  - You are about to drop the `NACOBOfficer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NationalSecurityOfficer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JobCard" DROP CONSTRAINT "JobCard_nacobOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."JobCard" DROP CONSTRAINT "JobCard_securityOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LargeScaleJobCard" DROP CONSTRAINT "LargeScaleJobCard_nacobOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LargeScaleJobCard" DROP CONSTRAINT "LargeScaleJobCard_nationalSecurityOfficerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NACOBOfficer" DROP CONSTRAINT "NACOBOfficer_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NationalSecurityOfficer" DROP CONSTRAINT "NationalSecurityOfficer_userId_fkey";

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "nacobOfficerId",
DROP COLUMN "securityOfficerId";

-- AlterTable
ALTER TABLE "public"."LargeScaleJobCard" DROP COLUMN "nacobOfficerId",
DROP COLUMN "nationalSecurityOfficerId";

-- DropTable
DROP TABLE "public"."NACOBOfficer";

-- DropTable
DROP TABLE "public"."NationalSecurityOfficer";

-- DropEnum
DROP TYPE "public"."IdType";
