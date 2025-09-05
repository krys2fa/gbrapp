const { PrismaClient } = require('./app/generated/prisma');

async function debugInvoices() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DEBUG: Invoice Status Analysis ===');
    
    // Check all invoices with their status
    const allInvoices = await prisma.invoice.findMany({
      include: {
        jobCard: {
          include: {
            exporter: true
          }
        }
      },
      take: 20
    });
    
    console.log(`Total invoices found: ${allInvoices.length}`);
    
    if (allInvoices.length > 0) {
      console.log('\nInvoice details:');
      allInvoices.forEach((invoice, index) => {
        console.log(`${index + 1}. Invoice ${invoice.invoiceNumber}:`);
        console.log(`   - Amount: ${invoice.amount}`);
        console.log(`   - Status: "${invoice.status}"`);
        console.log(`   - Issue Date: ${invoice.issueDate}`);
        console.log(`   - Exporter: ${invoice.jobCard.exporter.name}`);
        console.log('');
      });
      
      // Count by status
      const statusCounts = allInvoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} invoices`);
      });
      
      // Check specifically for paid invoices this year
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      
      const paidInvoicesThisYear = await prisma.invoice.findMany({
        where: {
          status: 'paid',
          issueDate: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        include: {
          jobCard: {
            include: {
              exporter: true
            }
          }
        }
      });
      
      console.log(`\nPaid invoices in ${currentYear}: ${paidInvoicesThisYear.length}`);
      paidInvoicesThisYear.forEach((invoice, index) => {
        console.log(`${index + 1}. ${invoice.jobCard.exporter.name} - ₵${invoice.amount} (${invoice.issueDate.toLocaleDateString()})`);
      });
      
    } else {
      console.log('No invoices found in the database.');
      
      // Check if there are any job cards
      const jobCardCount = await prisma.jobCard.count();
      const exporterCount = await prisma.exporter.count();
      
      console.log(`Job cards: ${jobCardCount}`);
      console.log(`Exporters: ${exporterCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugInvoices();
