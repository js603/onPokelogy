const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

const calculateDamageSearch = `calculateDamage(attackerUri: string, defenderUri: string, moveUri: string): { damage: number, effectiveness: string } {`;

const calculateDamageReplace = `calculateDamage(attackerUri: string, defenderUri: string, moveUri: string): { damage: number, effectiveness: string } {
    let movePower = parseInt(this.store.getValue(moveUri, "poke:power") || "0", 10);
    const attackerAtk = parseInt(this.store.getValue(attackerUri, "poke:attack") || "10", 10);
    
    // Semantic queries replaced by DataLayer SQL queries
    const moveTypeUri = this.store.getValue(moveUri, "poke:hasType") || "";
    const defenderTypes = this.store.query(defenderUri, "poke:hasType", null).map(t => t[2]);
    
    const { multiplier, weakTypeNames, resistTypeNames, immuneTypeNames } = this.dataLayer.getTypeMatchupMultiplier(moveTypeUri, defenderTypes);
    
    let effectText = "";
    let abilityEffectText = "";
    
    const attackerAbilities = this.store.query(attackerUri, "poke:hasAbility", null).map(t => t[2]);
    for (const abUri of attackerAbilities) {
      const abName = this.store.getValue(abUri, "poke:name");
      if (abName === "맹화" || abName === "심록" || abName === "급류") {
         movePower = Math.floor(movePower * 1.5);
         abilityEffectText = \`[SQL 연동] \${abName} 특성으로 인해 기술의 위력이 상승했다! \`;
      } else if (abName === "적응력") {
         movePower = Math.floor(movePower * 1.5);
         abilityEffectText = \`[SQL 연동] \${abName} 특성으로 자속 보정이 강화되었다! \`;
      }
    }
    
    const defenderAbilities = this.store.query(defenderUri, "poke:hasAbility", null).map(t => t[2]);
    let defMultiplier = 1;
    for (const abUri of defenderAbilities) {
       const abName = this.store.getValue(abUri, "poke:name");
       if (abName === "부유" && moveTypeUri.includes("ground")) {
         defMultiplier = 0;
         abilityEffectText = \`[SQL 연동] \${abName} 특성으로 인해 땅 타입 공격이 통하지 않는다! \`;
       } else if (abName === "두꺼운지방" && (moveTypeUri.includes("fire") || moveTypeUri.includes("ice"))) {
         defMultiplier = 0.5;
         abilityEffectText = \`[SQL 연동] \${abName} 특성으로 인해 불꽃/얼음 타입 데미지가 반감되었다! \`;
       }
    }

    const moveTypeName = this.store.getValue(moveTypeUri, "poke:name") || moveTypeUri.replace("poke:type_", "");
    
    if (multiplier > 1) {
      effectText = \`[SQL 연동] \${moveTypeName} 기술은 \${weakTypeNames.join(', ')} 타입에게 효과가 굉장했다!\`;
    } else if (multiplier < 1 && multiplier > 0) {
      effectText = \`[SQL 연동] \${moveTypeName} 기술은 \${resistTypeNames.join(', ')} 타입에게 효과가 별로인 듯하다...\`;
    } else if (multiplier === 0) {
      effectText = \`[SQL 연동] \${moveTypeName} 기술은 \${immuneTypeNames.join(', ')} 타입에게 효과가 없다...\`;
    }
    
    const finalMultiplier = multiplier * defMultiplier;
    const damage = Math.floor(((2 * 5 / 5 + 2) * movePower * (attackerAtk / 50) / 50 + 2) * finalMultiplier);
    
    return { damage: Math.max(1, damage), effectiveness: abilityEffectText + effectText };
  }
`;

const lines = code.split('\n');
let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('calculateDamage(attackerUri: string, defenderUri: string, moveUri: string)')) {
      skip = true;
      newLines.push(calculateDamageReplace);
   } else if (skip) {
      if (lines[i].includes('applyDamage(defenderUri: string, damage: number)')) {
         skip = false;
         newLines.push(lines[i]);
      }
   } else {
      newLines.push(lines[i]);
   }
}

fs.writeFileSync('src/engine/GameEngine.ts', newLines.join('\n'));
