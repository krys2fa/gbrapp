// Smoke test suite: logs in as multiple roles, verifies endpoint access, and creates a large-scale job card with certificateNumber.
// Requires Node 18+ (global fetch) and the dev server running at http://localhost:3000

const base = 'http://localhost:3000';
const creds = require('./smoke-credentials.json');
const expectations = require('./smoke-expectations.json');

async function login(email, password) {
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  return { status: res.status, cookie };
}

async function checkEndpoint(cookie, endpoint) {
  const res = await fetch(base + endpoint, { headers: cookie ? { cookie } : {} });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (e) {}
  return { status: res.status, body };
}

async function createLargeScaleJobCard(cookie) {
  const payload = {
    receivedDate: new Date().toISOString(),
    exporterId: '', // will try to use an existing exporter by fetching one below
    unitOfMeasure: 'kg',
    notes: 'Smoke test job card',
    destinationCountry: 'Ghana',
    sourceOfGold: 'Ghana',
    numberOfBars: 2,
    certificateNumber: 'SMOKE-CRT-' + Date.now(),
    // Minimal assay payload
    assayersData: [
      { barNo: '1', grossWeight: 1.23, goldFineness: 750.0, goldNetWeight: 0.92 }
    ]
  };

  // Try to find an exporter to use
  const exportersRes = await fetch(base + '/api/exporters', { headers: cookie ? { cookie } : {} });
  if (exportersRes.status === 200) {
    const list = await exportersRes.json();
    if (Array.isArray(list) && list.length > 0) {
      payload.exporterId = list[0].id;
    } else if (list && Array.isArray(list.exporters) && list.exporters.length > 0) {
      payload.exporterId = list.exporters[0].id;
    }
  }

  if (!payload.exporterId) {
    // fallback: try to create a new exporter (if API allows anonymous creation this might fail)
    console.warn('No exporter found; cannot create job card without exporterId');
    return { status: 400, error: 'no exporterId' };
  }

  const res = await fetch(base + '/api/large-scale-job-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  let parsed = body;
  try { parsed = JSON.parse(body); } catch(e){}
  return { status: res.status, body: parsed };
}

async function run() {
  console.log('Starting smoke suite');
  const roles = Object.keys(creds);
  for (const role of roles) {
    const { email, password } = creds[role];
    console.log('\n--- Testing role:', role, email);
    const loginRes = await login(email, password);
    console.log('login ->', loginRes.status, loginRes.cookie ? '(cookie set)' : '(no cookie)');
    if (loginRes.status !== 200) {
      console.warn('Login failed for', role, '- skipping this role');
      continue;
    }

    const endpoints = Object.keys(expectations.endpoints);
    for (const ep of endpoints) {
      const allowedRoles = expectations.endpoints[ep];
      const expectedAllowed = allowedRoles.includes(role);
      const res = await checkEndpoint(loginRes.cookie, ep);
      const allowed = res.status === 200;
      const ok = allowed === expectedAllowed;
      console.log(`${ep} -> ${res.status} | expectedAllowed=${expectedAllowed} | result=${ok ? 'OK' : 'MISMATCH'}`);
    }

    // If role is allowed to create large-scale job cards, attempt create
    const canCreateLS = expectations.endpoints['/api/large-scale-job-cards'].includes(role);
    if (canCreateLS) {
      console.log('Attempting to create large-scale job card with certificateNumber');
      const createRes = await createLargeScaleJobCard(loginRes.cookie);
      console.log('create ->', createRes.status);
      if (createRes.status === 201) {
        const created = createRes.body;
        const cert = created.certificateNumber || created?.certificateNumber || (created?.certificateNumber === undefined ? undefined : undefined);
        console.log('created id:', created.id, 'certificateNumber:', cert);
      } else {
        console.log('create body:', createRes.body);
      }
    }
  }
  console.log('\nSmoke suite finished');
}

run().catch(e => { console.error('Smoke suite error', e); process.exit(2); });
