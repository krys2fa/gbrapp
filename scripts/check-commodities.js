import { prisma } from "../app/lib/prisma.ts";

async function updateSilverSymbol() {
  try {
    const silverCommodity = await prisma.commodity.findFirst({
      where: { name: "Silver" }
    });

    if (silverCommodity) {
      await prisma.commodity.update({
        where: { id: silverCommodity.id },
        data: { symbol: "XAG" }
      });
      console.log("Updated Silver commodity symbol to XAG");
    }

    const commodities = await prisma.commodity.findMany();
    console.log("Updated commodities:");
    commodities.forEach(commodity => {
      console.log(`- ${commodity.name} (${commodity.symbol})`);
    });
  } catch (error) {
    console.error("Error updating silver symbol:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSilverSymbol();