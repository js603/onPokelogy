const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');
code = code.replace(/const newName = \`주인공\(\$\{rawName\}\)\`;/g, 'const newName = rawName;');
fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
