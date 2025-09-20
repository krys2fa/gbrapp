-- CreateTable
CREATE TABLE "public"."JobCardSequence" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cardType" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCardSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobCardSequence_year_cardType_key" ON "public"."JobCardSequence"("year", "cardType");
