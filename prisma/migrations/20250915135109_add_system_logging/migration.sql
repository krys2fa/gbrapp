/*
  Warnings:

  - You are about to drop the column `buyerAddress` on the `JobCard` table. All the data in the column will be lost.
  - You are about to drop the column `buyerName` on the `JobCard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Exporter" ADD COLUMN     "buyerAddress" TEXT,
ADD COLUMN     "buyerName" TEXT;

-- AlterTable
ALTER TABLE "public"."JobCard" DROP COLUMN "buyerAddress",
DROP COLUMN "buyerName";

-- CreateTable
CREATE TABLE "public"."SystemLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_timestamp_idx" ON "public"."SystemLog"("timestamp");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "public"."SystemLog"("level");

-- CreateIndex
CREATE INDEX "SystemLog_category_idx" ON "public"."SystemLog"("category");

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "public"."SystemLog"("userId");

-- CreateIndex
CREATE INDEX "SystemLog_entityType_entityId_idx" ON "public"."SystemLog"("entityType", "entityId");
