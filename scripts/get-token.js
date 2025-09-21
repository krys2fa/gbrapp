const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
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
        resolve({ res, body: Buffer.concat(chunks).toString() });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const { res } = await post('/api/auth/login', { email: 'smoke_small_scale_assayer@example.com', password: 'Test1234!' });
  const set = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
  const cookie = set ? set.split(';')[0] : '';
  const token = cookie.split('=')[1];
  console.log(token);
})();
