const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace(
  "this.log(`[E|${enemyName}] ${enemyName}은(는) ${damage}의 피해를 입었다.`);",
  "if (damage > 0) this.log(`[E|${enemyName}] ${enemyName}은(는) ${damage}의 피해를 입었다.`);"
);

code = code.replace(
  "this.log(`[P|${playerName}] ${playerName}은(는) ${damage}의 피해를 입었다.`);",
  "if (damage > 0) this.log(`[P|${playerName}] ${playerName}은(는) ${damage}의 피해를 입었다.`);"
);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
