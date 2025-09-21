// Create users directly using the generated Prisma client. Run with `node scripts/create-users-directly.js`
const { PrismaClient, Role } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser(email, name, role) {
  try {
    const salt = await bcrypt.genSalt(10);
    const password = 'Test1234!';
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({ data: { email, name, password: hashedPassword, role } });
    console.log('created', email, 'id', user.id);
    return { email, password };
  } catch (e) {
    console.error('failed to create', email, e.message || e);
    return null;
  }
}

async function run() {
  const targets = ['EXECUTIVE','SMALL_SCALE_ASSAYER','LARGE_SCALE_ASSAYER'];
  const results = [];
  for (const r of targets) {
    const email = `smoke_${r.toLowerCase()}@example.com`;
    const name = `Smoke ${r}`;
    const res = await createUser(email, name, r);
    results.push({ role: r, res });
  }
  console.log('done', results);
  await prisma.$disconnect();
}

run().catch(e=>{ console.error(e); process.exit(2); });
