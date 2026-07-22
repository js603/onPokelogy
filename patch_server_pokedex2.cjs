const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "ORDER BY p.id ASC",
  "ORDER BY CAST(p.id AS INTEGER) ASC"
);

fs.writeFileSync('server.ts', code, 'utf8');
