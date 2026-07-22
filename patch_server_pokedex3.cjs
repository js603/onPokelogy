const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import { initializeDatabase } from './src/db/init';",
  "import { initializeDatabase } from './src/db/init';\nimport { getDb } from './src/db/index';"
);

code = code.replace(
  "const db = require('better-sqlite3')('data/pokedex.sqlite');",
  "const db = getDb();"
);

fs.writeFileSync('server.ts', code, 'utf8');
