const { validateTokenAndLoadUser } = require('../app/lib/auth-utils');

(async () => {
  try {
    let token = process.argv[2];
    if (!token) {
      // Try reading from token.txt
      const fs = require('fs');
      if (fs.existsSync('token.txt')) token = fs.readFileSync('token.txt', 'utf8').trim();
    }

    if (!token) {
      console.error('Usage: node validate-token.js <token> or create token.txt');
      process.exit(2);
    }

    const res = await validateTokenAndLoadUser(token);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
