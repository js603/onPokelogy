const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace(
  "this.store.add(playerUri, \"poke:hasEncountered\", starterId.toString());",
  ""
);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
