const fs = require('fs');
let code = fs.readFileSync('src/db/migrateEncounters.ts', 'utf8');
code = code.replace(
  "1: [1, 2, 3, 10, 11, 31, 32, 44, 45, 46], // Kanto",
  "1: [1, 2, 3, 10, 11], // Kanto"
);
fs.writeFileSync('src/db/migrateEncounters.ts', code, 'utf8');
