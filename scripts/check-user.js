const { PrismaClient } = require('../app/generated/prisma');
(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'smoke_small_scale_assayer@example.com' } });
    console.log(JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
