const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace(
  "this.log(`앗! 야생의 ${enemyName} (Lv.${targetLevel})이(가) 나타났다!`);",
  "this.log(`앗! 야생의 ${enemyName} (Lv.${targetLevel})이(가) 나타났다!`);\n    this.store.add(\"poke:player_pokemon\", \"poke:hasEncountered\", targetId.toString());"
);

// Also add starting pokemon to encountered
code = code.replace(
  "this.store.add(playerUri, \"poke:experience\", \"0\");",
  "this.store.add(playerUri, \"poke:experience\", \"0\");\n    this.store.add(playerUri, \"poke:hasEncountered\", starterId.toString());"
);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
