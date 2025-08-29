-- CreateEnum
CREATE TYPE "public"."DailyPriceType" AS ENUM ('COMMODITY', 'EXCHANGE');

-- CreateTable
CREATE TABLE "public"."Commodity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exchange" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyPrice" (
    "id" TEXT NOT NULL,
    "type" "public"."DailyPriceType" NOT NULL,
    "commodityId" TEXT,
    "exchangeId" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commodity_name_key" ON "public"."Commodity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_name_key" ON "public"."Exchange"("name");

-- AddForeignKey
ALTER TABLE "public"."DailyPrice" ADD CONSTRAINT "DailyPrice_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."Commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPrice" ADD CONSTRAINT "DailyPrice_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "public"."Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
