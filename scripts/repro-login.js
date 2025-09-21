const http = require('http');

const baseHost = 'localhost';
const basePort = 3000;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: baseHost,
      port: basePort,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({ res, body });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseHost,
      port: basePort,
      path,
      method: 'GET',
      headers: {},
    };

    if (cookie) options.headers.Cookie = cookie;

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks).toString() }));
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const { res, body } = await post('/api/auth/login', { email: 'smoke_small_scale_assayer@example.com', password: 'Test1234!' });
    console.log('login status', res.statusCode);
    console.log('set-cookie header:', res.headers['set-cookie']);

    const setCookie = (res.headers['set-cookie'] && res.headers['set-cookie'][0]) || '';
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    const meRes = await get('/api/auth/me', cookie);
    console.log('/api/auth/me status', meRes.res.statusCode);
    try {
      console.log('/api/auth/me body', JSON.parse(meRes.body));
    } catch (e) {
      console.log('/api/auth/me raw body', meRes.body);
    }
  } catch (e) {
    console.error('error', e);
  }
})();
