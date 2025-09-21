// Create users for each Role using SUPERADMIN credentials
// Uses the /api/auth/login endpoint to get a cookie, then POST /api/users
// Node 18+ required (global fetch)

const base = 'http://localhost:3000';
const superadmin = { email: 'superadmin@gbrapp.com', password: 'admin123' };

// Roles from prisma schema
const roles = [
  'SUPERADMIN', 'ADMIN', 'USER', 'TELLER', 'CEO', 'DEPUTY_CEO', 'FINANCE', 'EXECUTIVE', 'SMALL_SCALE_ASSAYER', 'LARGE_SCALE_ASSAYER'
];

async function login() {
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(superadmin),
    redirect: 'manual',
  });
  if (res.status !== 200) throw new Error('Superadmin login failed: ' + res.status);
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  return cookie;
}

async function createUser(cookie, role) {
  const email = `smoke_${role.toLowerCase()}@example.com`;
  const password = 'Test1234!';
  const name = `Smoke ${role}`;
  const res = await fetch(base + '/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ email, password, name, role }),
  });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (e) {}
  return { status: res.status, body, email, password };
}

async function run() {
  try {
    console.log('Logging in as SUPERADMIN...');
    const cookie = await login();
    console.log('Cookie:', !!cookie);
    const results = [];
    for (const r of roles) {
      try {
        console.log('Creating user for role', r);
        const res = await createUser(cookie, r);
        console.log(' ->', res.status);
        results.push(res);
      } catch (e) {
        console.error('Error creating user for', r, e.message || e);
      }
    }
    console.log('\nResults:');
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('Script failed:', e);
    process.exit(2);
  }
}

run();
