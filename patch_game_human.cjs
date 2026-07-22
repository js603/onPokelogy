const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace(
  "this.store.add(playerUri, \"poke:attack\", \"20\");",
  "this.store.add(playerUri, \"poke:attack\", \"20\");\n    this.store.add(playerUri, \"poke:defense\", \"20\");\n    this.store.add(playerUri, \"poke:spAtk\", \"20\");\n    this.store.add(playerUri, \"poke:spDef\", \"20\");"
);
fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
