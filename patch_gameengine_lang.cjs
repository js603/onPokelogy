const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace('moveTypeUri.includes("ground")', 'moveTypeUri.includes("땅")');
code = code.replace('moveTypeUri.includes("fire") || moveTypeUri.includes("ice")', 'moveTypeUri.includes("불꽃") || moveTypeUri.includes("얼음")');

fs.writeFileSync('src/engine/GameEngine.ts', code);
