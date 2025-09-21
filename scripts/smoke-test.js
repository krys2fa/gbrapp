// Simple smoke test using native fetch (Node 18+).
// Logs in as superadmin and requests protected endpoints using the returned cookie.
const base = 'http://localhost:3000';

async function run() {
  try {
    const login = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@gbrapp.com', password: 'admin123' }),
      redirect: 'manual',
    });
    console.log('POST /api/auth/login ->', login.status);
    const setCookie = login.headers.get('set-cookie');
    if (!setCookie) {
      console.warn('No set-cookie header returned from login; auth cookie may not be set.');
    }
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    const endpoints = [
      '/api/auth/me',
      '/api/auth/validate',
      '/api/dashboard/stats',
      '/api/job-cards',
      '/api/large-scale-job-cards',
      '/api/setup',
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(base + ep, { headers: cookie ? { cookie } : {} });
        console.log(`GET ${ep} ->`, res.status);
        const text = await res.text();
        const out = text.length > 400 ? text.slice(0, 400) + '... (truncated)' : text;
        console.log(`Response (${ep}):`, out || '<empty>');
      } catch (e) {
        console.error(`Error fetching ${ep}:`, e.message);
      }
    }

    console.log('Smoke test finished.');
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(2);
  }
}

run();
