-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."SealType" AS ENUM ('CUSTOMS_SEAL', 'PMMC_SEAL', 'OTHER_SEAL');

-- CreateEnum
CREATE TYPE "public"."FeeType" AS ENUM ('ASSAY_FEE', 'WHT_FEE');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'OTHER');

-- CreateTable
CREATE TABLE "public"."JobCard" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "exporterId" TEXT NOT NULL,
    "shipmentTypeId" TEXT NOT NULL,
    "customsOfficerId" TEXT,
    "nacobOfficerId" TEXT,
    "securityOfficerId" TEXT,
    "assayOfficerId" TEXT,
    "technicalDirectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomsOfficer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NACOBOfficer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NACOBOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NationalSecurityOfficer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalSecurityOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Seal" (
    "id" TEXT NOT NULL,
    "sealNumber" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "sealType" "public"."SealType" NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "invoiceTypeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currencyId" TEXT NOT NULL,
    "assayUsdValue" DOUBLE PRECISION NOT NULL,
    "assayGhsValue" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fee" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "feeType" "public"."FeeType" NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currencyId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "receiptNumber" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "whtTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assay" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "assayOfficerId" TEXT,
    "technicalDirectorId" TEXT,
    "goldContent" DOUBLE PRECISION NOT NULL,
    "silverContent" DOUBLE PRECISION,
    "comments" TEXT NOT NULL,
    "assayDate" TIMESTAMP(3) NOT NULL,
    "certificateNumber" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exporter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "exporterTypeId" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "licenseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExporterType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExporterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Price" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "priceTypeId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Levy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "levyTypeId" TEXT NOT NULL,
    "jobCardId" TEXT,
    "invoiceId" TEXT,
    "currencyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "calculatedAmount" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Levy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LevyType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssayOfficer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssayOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TechnicalDirector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalDirector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditTrail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_referenceNumber_key" ON "public"."JobCard"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomsOfficer_badgeNumber_key" ON "public"."CustomsOfficer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomsOfficer_email_key" ON "public"."CustomsOfficer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomsOfficer_userId_key" ON "public"."CustomsOfficer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NACOBOfficer_badgeNumber_key" ON "public"."NACOBOfficer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NACOBOfficer_email_key" ON "public"."NACOBOfficer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NACOBOfficer_userId_key" ON "public"."NACOBOfficer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NationalSecurityOfficer_badgeNumber_key" ON "public"."NationalSecurityOfficer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NationalSecurityOfficer_email_key" ON "public"."NationalSecurityOfficer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NationalSecurityOfficer_userId_key" ON "public"."NationalSecurityOfficer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Seal_sealNumber_key" ON "public"."Seal"("sealNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceType_name_key" ON "public"."InvoiceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Assay_certificateNumber_key" ON "public"."Assay"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentType_name_key" ON "public"."ShipmentType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exporter_code_key" ON "public"."Exporter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExporterType_name_key" ON "public"."ExporterType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "public"."Currency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PriceType_name_key" ON "public"."PriceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Levy_code_key" ON "public"."Levy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LevyType_name_key" ON "public"."LevyType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssayOfficer_badgeNumber_key" ON "public"."AssayOfficer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AssayOfficer_email_key" ON "public"."AssayOfficer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssayOfficer_userId_key" ON "public"."AssayOfficer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalDirector_badgeNumber_key" ON "public"."TechnicalDirector"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalDirector_email_key" ON "public"."TechnicalDirector"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalDirector_userId_key" ON "public"."TechnicalDirector"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "public"."Exporter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_shipmentTypeId_fkey" FOREIGN KEY ("shipmentTypeId") REFERENCES "public"."ShipmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_customsOfficerId_fkey" FOREIGN KEY ("customsOfficerId") REFERENCES "public"."CustomsOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_nacobOfficerId_fkey" FOREIGN KEY ("nacobOfficerId") REFERENCES "public"."NACOBOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_securityOfficerId_fkey" FOREIGN KEY ("securityOfficerId") REFERENCES "public"."NationalSecurityOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_assayOfficerId_fkey" FOREIGN KEY ("assayOfficerId") REFERENCES "public"."AssayOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCard" ADD CONSTRAINT "JobCard_technicalDirectorId_fkey" FOREIGN KEY ("technicalDirectorId") REFERENCES "public"."TechnicalDirector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomsOfficer" ADD CONSTRAINT "CustomsOfficer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NACOBOfficer" ADD CONSTRAINT "NACOBOfficer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NationalSecurityOfficer" ADD CONSTRAINT "NationalSecurityOfficer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Seal" ADD CONSTRAINT "Seal_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_invoiceTypeId_fkey" FOREIGN KEY ("invoiceTypeId") REFERENCES "public"."InvoiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fee" ADD CONSTRAINT "Fee_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fee" ADD CONSTRAINT "Fee_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assay" ADD CONSTRAINT "Assay_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assay" ADD CONSTRAINT "Assay_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assay" ADD CONSTRAINT "Assay_assayOfficerId_fkey" FOREIGN KEY ("assayOfficerId") REFERENCES "public"."AssayOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assay" ADD CONSTRAINT "Assay_technicalDirectorId_fkey" FOREIGN KEY ("technicalDirectorId") REFERENCES "public"."TechnicalDirector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exporter" ADD CONSTRAINT "Exporter_exporterTypeId_fkey" FOREIGN KEY ("exporterTypeId") REFERENCES "public"."ExporterType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_priceTypeId_fkey" FOREIGN KEY ("priceTypeId") REFERENCES "public"."PriceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Levy" ADD CONSTRAINT "Levy_levyTypeId_fkey" FOREIGN KEY ("levyTypeId") REFERENCES "public"."LevyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Levy" ADD CONSTRAINT "Levy_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "public"."JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Levy" ADD CONSTRAINT "Levy_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Levy" ADD CONSTRAINT "Levy_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssayOfficer" ADD CONSTRAINT "AssayOfficer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TechnicalDirector" ADD CONSTRAINT "TechnicalDirector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditTrail" ADD CONSTRAINT "AuditTrail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
