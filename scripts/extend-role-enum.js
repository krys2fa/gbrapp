// Add missing Role enum values to the Postgres 'Role' enum via Prisma.$executeRawUnsafe
// Use with caution. Run: node scripts/extend-role-enum.js
const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

const additions = [
  'EXECUTIVE',
  'SMALL_SCALE_ASSAYER',
  'LARGE_SCALE_ASSAYER'
];

async function addValue(value) {
  try {
    // Attempt to add value. If it exists, Postgres will error — we'll catch and ignore.
    const sql = `ALTER TYPE \"public\".\"Role\" ADD VALUE '${value}';`;
    await prisma.$executeRawUnsafe(sql);
    console.log('Added', value);
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (msg.includes('already exists') || msg.includes('invalid input value for enum')) {
      console.log('Value likely already exists or cannot add:', value, msg.substring(0,120));
    } else {
      console.error('Error adding value', value, msg);
    }
  }
}

async function run() {
  for (const v of additions) {
    await addValue(v);
  }
  await prisma.$disconnect();
}

run().catch(e=>{ console.error(e); process.exit(2); });
