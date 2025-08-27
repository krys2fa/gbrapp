import { PrismaClient, Role, SealType, FeeType } from '../app/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users with different roles
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@gbrapp.com',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@gbrapp.com',
      password: adminPassword,
      role: Role.SUPERADMIN,
      isActive: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@gbrapp.com',
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });

  console.log('Created users');

  // Create currencies
  const usd = await prisma.currency.create({
    data: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
    },
  });

  const ghs = await prisma.currency.create({
    data: {
      code: 'GHS',
      name: 'Ghana Cedi',
      symbol: '₵',
    },
  });

  console.log('Created currencies');

  // Create price types
  const goldPriceType = await prisma.priceType.create({
    data: {
      name: 'Gold',
      description: 'Gold price per troy ounce',
    },
  });

  const silverPriceType = await prisma.priceType.create({
    data: {
      name: 'Silver',
      description: 'Silver price per troy ounce',
    },
  });

  console.log('Created price types');

  // Create prices
  await prisma.price.create({
    data: {
      value: 2250.50,
      priceTypeId: goldPriceType.id,
      currencyId: usd.id,
      effectiveDate: new Date(),
    },
  });

  await prisma.price.create({
    data: {
      value: 28.75,
      priceTypeId: silverPriceType.id,
      currencyId: usd.id,
      effectiveDate: new Date(),
    },
  });

  console.log('Created prices');

  // Create levy types
  const exportLevy = await prisma.levyType.create({
    data: {
      name: 'Export Levy',
      description: 'Levy on export of precious minerals',
    },
  });

  const pmmc = await prisma.levyType.create({
    data: {
      name: 'PMMC Levy',
      description: 'Levy for Precious Minerals Marketing Company',
    },
  });

  console.log('Created levy types');

  // Create exporter types
  const miningCompany = await prisma.exporterType.create({
    data: {
      name: 'Mining Company',
      description: 'Large scale mining company',
    },
  });

  const smallScale = await prisma.exporterType.create({
    data: {
      name: 'Small Scale Miner',
      description: 'Small scale mining operation',
    },
  });

  console.log('Created exporter types');

  // Create exporters
  const exporter1 = await prisma.exporter.create({
    data: {
      name: 'Gold Fields Ghana',
      code: 'GFG001',
      exporterTypeId: miningCompany.id,
      contactPerson: 'John Smith',
      email: 'jsmith@goldfields.com',
      phone: '+233201234567',
      address: 'Accra, Ghana',
      licenseNumber: 'LIC-12345',
    },
  });

  const exporter2 = await prisma.exporter.create({
    data: {
      name: 'Small Scale Mining Cooperative',
      code: 'SSMC002',
      exporterTypeId: smallScale.id,
      contactPerson: 'Mary Johnson',
      email: 'mjohnson@ssmcoop.com',
      phone: '+233207654321',
      address: 'Tarkwa, Ghana',
      licenseNumber: 'LIC-67890',
    },
  });

  console.log('Created exporters');

  // Create shipment types
  const doré = await prisma.shipmentType.create({
    data: {
      name: 'Doré Bars',
      description: 'Semi-pure alloy of gold and silver',
    },
  });

  const dust = await prisma.shipmentType.create({
    data: {
      name: 'Gold Dust',
      description: 'Refined gold in dust form',
    },
  });

  console.log('Created shipment types');

  // Create officers
  const customsOfficer = await prisma.customsOfficer.create({
    data: {
      name: 'James Wilson',
      badgeNumber: 'CUS-001',
      email: 'jwilson@customs.gov.gh',
      phone: '+233241234567',
      userId: admin.id,
    },
  });

  const nacobOfficer = await prisma.nACOBOfficer.create({
    data: {
      name: 'Elizabeth Brown',
      badgeNumber: 'NAC-001',
      email: 'ebrown@nacob.gov.gh',
      phone: '+233257654321',
    },
  });

  const securityOfficer = await prisma.nationalSecurityOfficer.create({
    data: {
      name: 'Robert Davis',
      badgeNumber: 'SEC-001',
      email: 'rdavis@security.gov.gh',
      phone: '+233269876543',
    },
  });

  const assayOfficer = await prisma.assayOfficer.create({
    data: {
      name: 'Patricia Miller',
      badgeNumber: 'ASY-001',
      email: 'pmiller@pmmc.gov.gh',
      phone: '+233231234567',
      userId: regularUser.id,
    },
  });

  const technicalDirector = await prisma.technicalDirector.create({
    data: {
      name: 'Daniel Johnson',
      badgeNumber: 'TEC-001',
      email: 'djohnson@pmmc.gov.gh',
      phone: '+233267654321',
    },
  });

  console.log('Created officers');

  // Create invoice types
  const assayInvoice = await prisma.invoiceType.create({
    data: {
      name: 'Assay Invoice',
      description: 'Invoice for assay services',
    },
  });

  const exportInvoice = await prisma.invoiceType.create({
    data: {
      name: 'Export Invoice',
      description: 'Invoice for export fees',
    },
  });

  console.log('Created invoice types');

  // Create a job card
  const jobCard = await prisma.jobCard.create({
    data: {
      referenceNumber: 'JC-2025-001',
      receivedDate: new Date(),
      exporterId: exporter1.id,
      shipmentTypeId: doré.id,
      customsOfficerId: customsOfficer.id,
      nacobOfficerId: nacobOfficer.id,
      securityOfficerId: securityOfficer.id,
      assayOfficerId: assayOfficer.id,
      technicalDirectorId: technicalDirector.id,
      status: 'pending',
      notes: 'Initial job card for testing',
    },
  });

  console.log('Created job card');

  // Create a seal
  await prisma.seal.create({
    data: {
      sealNumber: 'SEAL-001',
      jobCardId: jobCard.id,
      sealType: SealType.CUSTOMS_SEAL,
      status: 'active',
      notes: 'Applied by customs officer',
    },
  });

  await prisma.seal.create({
    data: {
      sealNumber: 'SEAL-002',
      jobCardId: jobCard.id,
      sealType: SealType.PMMC_SEAL,
      status: 'active',
      notes: 'Applied by PMMC officer',
    },
  });

  console.log('Created seals');

  // Create an assay
  const assay = await prisma.assay.create({
    data: {
      jobCardId: jobCard.id,
      assayOfficerId: assayOfficer.id,
      technicalDirectorId: technicalDirector.id,
      goldContent: 85.7,
      silverContent: 12.3,
      comments: 'Standard assay procedure',
      assayDate: new Date(),
      certificateNumber: 'CERT-2025-001',
      remarks: 'Good quality gold content',
    },
  });

  console.log('Created assay');

  // Create an invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      jobCardId: jobCard.id,
      invoiceTypeId: assayInvoice.id,
      amount: 1500.00,
      currencyId: usd.id,
      assayUsdValue: 85000.00,
      assayGhsValue: 1105000.00,
      rate: 13.0,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: 'pending',
      notes: 'Invoice for assay services',
    },
  });

  console.log('Created invoice');

  // Link assay to invoice
  await prisma.assay.update({
    where: { id: assay.id },
    data: { invoiceId: invoice.id },
  });

  // Create fees
  await prisma.fee.create({
    data: {
      jobCardId: jobCard.id,
      feeType: FeeType.ASSAY_FEE,
      amountPaid: 1500.00,
      currencyId: usd.id,
      paymentDate: new Date(),
      status: 'paid',
      receiptNumber: 'REC-2025-001',
      balance: '0',
      whtTotal: 150.00,
      notes: 'Full payment received',
    },
  });

  await prisma.fee.create({
    data: {
      jobCardId: jobCard.id,
      feeType: FeeType.WHT_FEE,
      amountPaid: 150.00,
      currencyId: usd.id,
      paymentDate: new Date(),
      status: 'paid',
      receiptNumber: 'REC-2025-002',
      balance: '0',
      whtTotal: 0.00,
      notes: 'Withholding tax payment',
    },
  });

  console.log('Created fees');

  // Create levies
  await prisma.levy.create({
    data: {
      name: 'Export Levy 3%',
      code: 'EXP-3PCT',
      description: '3% export levy on gold value',
      rate: 3.0,
      isPercentage: true,
      levyTypeId: exportLevy.id,
      jobCardId: jobCard.id,
      invoiceId: invoice.id,
      currencyId: usd.id,
      amount: 85000.00, // Based on gold value
      calculatedAmount: 2550.00, // 3% of value
      effectiveDate: new Date(),
      status: 'active',
      notes: 'Standard export levy',
    },
  });

  await prisma.levy.create({
    data: {
      name: 'PMMC Fee 0.5%',
      code: 'PMMC-0.5PCT',
      description: '0.5% PMMC fee on gold value',
      rate: 0.5,
      isPercentage: true,
      levyTypeId: pmmc.id,
      jobCardId: jobCard.id,
      invoiceId: invoice.id,
      currencyId: usd.id,
      amount: 85000.00, // Based on gold value
      calculatedAmount: 425.00, // 0.5% of value
      effectiveDate: new Date(),
      status: 'active',
      notes: 'Standard PMMC fee',
    },
  });

  console.log('Created levies');

  // Create audit trail entries
  await prisma.auditTrail.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityType: 'JobCard',
      entityId: jobCard.id,
      details: JSON.stringify({
        referenceNumber: jobCard.referenceNumber,
        exporter: exporter1.name,
        shipmentType: doré.name,
      }),
      ipAddress: '192.168.1.1',
      userAgent: 'Seed Script',
      metadata: JSON.stringify({
        source: 'Database Seeding',
        environment: 'Development',
      }),
    },
  });

  await prisma.auditTrail.create({
    data: {
      userId: regularUser.id,
      action: 'CREATE',
      entityType: 'Assay',
      entityId: assay.id,
      details: JSON.stringify({
        jobCardId: jobCard.id,
        goldContent: assay.goldContent,
        silverContent: assay.silverContent,
      }),
      ipAddress: '192.168.1.2',
      userAgent: 'Seed Script',
      metadata: JSON.stringify({
        source: 'Database Seeding',
        environment: 'Development',
      }),
    },
  });

  console.log('Created audit trail entries');

  console.log('Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
