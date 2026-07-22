const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

// Replace combat logs with tags
code = code.replace(/this\.log\(`\$\{playerName\}의 \$\{moveName\}!`\);/g, "this.log(`[P|${playerName}] ${playerName}의 ${moveName}!`);");
code = code.replace(/this\.log\(`\$\{enemyName\}은\(는\) \$\{damage\}의 피해를 입었다\.`\);/g, "this.log(`[E|${enemyName}] ${enemyName}은(는) ${damage}의 피해를 입었다.`);");
code = code.replace(/this\.log\(`\$\{enemyName\}은\(는\) 쓰러졌다! 승리했습니다!`\);/g, "this.log(`[E|${enemyName}] ${enemyName}은(는) 쓰러졌다! 승리했습니다!`);");
code = code.replace(/this\.log\(`\$\{playerName\}은\(는\) \$\{gainedExp\}의 경험치를 얻었다!`\);/g, "this.log(`[P|${playerName}] ${playerName}은(는) ${gainedExp}의 경험치를 얻었다!`);");
code = code.replace(/this\.log\(`\[레벨 업\] \$\{playerName\}은\(는\) 레벨 \$\{newLevel\}\(으\)로 올랐다!`\);/g, "this.log(`[P|${playerName}] [레벨 업] ${playerName}은(는) 레벨 ${newLevel}(으)로 올랐다!`);");
code = code.replace(/this\.log\(`앗! \$\{playerName\}의 상태가...!`\);/g, "this.log(`[P|${playerName}] 앗! ${playerName}의 상태가...!`);");
code = code.replace(/this\.log\(`\$\{playerName\}은\(는\) 진화하려고 한다!`\);/g, "this.log(`[P|${playerName}] ${playerName}은(는) 진화하려고 한다!`);");
code = code.replace(/this\.log\(`적 \$\{enemyName\}의 \$\{moveName\}!`\);/g, "this.log(`[E|${enemyName}] ${enemyName}의 ${moveName}!`);");
code = code.replace(/this\.log\(`\$\{playerName\}은\(는\) \$\{damage\}의 피해를 입었다\.`\);/g, "this.log(`[P|${playerName}] ${playerName}은(는) ${damage}의 피해를 입었다.`);");
code = code.replace(/this\.log\(`\$\{playerName\}은\(는\) 쓰러졌다\.\.\. 눈앞이 깜깜해졌다!`\);/g, "this.log(`[P|${playerName}] ${playerName}은(는) 쓰러졌다... 눈앞이 깜깜해졌다!`);");
code = code.replace(/this\.log\(`축하합니다! \$\{oldName\}은\(는\) \$\{newName\}\(으\)로 진화했습니다!`\);/g, "this.log(`[P|${oldName}] 축하합니다! ${oldName}은(는) ${newName}(으)로 진화했습니다!`);");

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
