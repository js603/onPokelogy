const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace(
  "this.store.add(\"poke:move_punch\", \"poke:power\", \"20\");",
  "this.store.add(\"poke:move_punch\", \"poke:power\", \"20\");\n    this.store.add(\"poke:move_punch\", \"poke:damageClass\", \"2\");"
);
fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
