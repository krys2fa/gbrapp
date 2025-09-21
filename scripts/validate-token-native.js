const { PrismaClient } = require('../app/generated/prisma');
const jose = require('jose');
const fs = require('fs');

(async () => {
  try {
    const token = (fs.readFileSync('token.txt','utf8')||'').trim();
    if (!token) { console.error('token.txt missing'); process.exit(2); }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only');
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      console.log('payload:', payload);
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      console.log('user:', user ? {id:user.id, role:user.role, isActive:user.isActive} : null);
      await prisma.$disconnect();
    } catch (err) {
      console.error('token verify error', err);
    }
  } catch (e) { console.error(e); process.exit(1); }
})();
