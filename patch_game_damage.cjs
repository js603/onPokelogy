const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

const newDamageLogic = `calculateDamage(attackerUri: string, defenderUri: string, moveUri: string): { damage: number, effectiveness: string } {
    const movePower = parseInt(this.store.getValue(moveUri, "poke:power") || "0", 10);
    const damageClass = parseInt(this.store.getValue(moveUri, "poke:damageClass") || "2", 10);
    
    const isSpecial = damageClass === 3;
    const attackerAtk = parseInt(this.store.getValue(attackerUri, isSpecial ? "poke:spAtk" : "poke:attack") || "10", 10);
    const defenderDef = parseInt(this.store.getValue(defenderUri, isSpecial ? "poke:spDef" : "poke:defense") || "10", 10);
    
    const moveTypeUri = this.store.getValue(moveUri, "poke:hasType") || "";
    const moveTypeName = this.store.getValue(moveTypeUri, "poke:name") || moveTypeUri.replace("poke:type_", "");
    const defenderTypes = this.store.query(defenderUri, "poke:hasType", null).map(t => t[2]);
    
    let multiplier = 1;
    let effectText = "";

    if (moveTypeUri && moveTypeUri !== "poke:type_human") {
      let weakTypes: string[] = [];
      let resistTypes: string[] = [];
      let immuneTypes: string[] = [];

      for (const dType of defenderTypes) {
        if (this.store.query(moveTypeUri, "poke:doubleDamageTo", dType).length > 0) {
          multiplier *= 2;
          weakTypes.push(this.store.getValue(dType, "poke:name") || dType.replace("poke:type_", ""));
        } else if (this.store.query(moveTypeUri, "poke:halfDamageTo", dType).length > 0) {
          multiplier *= 0.5;
          resistTypes.push(this.store.getValue(dType, "poke:name") || dType.replace("poke:type_", ""));
        } else if (this.store.query(moveTypeUri, "poke:noDamageTo", dType).length > 0) {
          multiplier *= 0;
          immuneTypes.push(this.store.getValue(dType, "poke:name") || dType.replace("poke:type_", ""));
        }
      }

      if (multiplier > 1) {
         effectText = \`\${moveTypeName} 기술은 효과가 굉장했다!\`;
      } else if (multiplier < 1 && multiplier > 0) {
         effectText = \`\${moveTypeName} 기술은 효과가 별로인 것 같다...\`;
      } else if (multiplier === 0) {
         effectText = \`상대의 타입에 의해 기술의 효과가 완벽히 상쇄되었다.\`;
      }
    }

    const attackerLevel = parseInt(this.store.getValue(attackerUri, "poke:level") || "5", 10);
    
    // Status moves deal 0 direct damage
    if (damageClass === 1 || movePower === 0) {
      return { damage: 0, effectiveness: effectText || "아무 일도 일어나지 않았다!" };
    }

    const damage = Math.floor((((2 * attackerLevel / 5 + 2) * movePower * (attackerAtk / defenderDef)) / 50 + 2) * multiplier);
    
    return { damage: Math.max(1, damage), effectiveness: effectText };
  }`;

// Replace the old calculateDamage
code = code.replace(/calculateDamage\(attackerUri: string, defenderUri: string, moveUri: string\): \{ damage: number, effectiveness: string \} \{[\s\S]*?return \{ damage: Math\.max\(1, damage\), effectiveness: effectText \};\n  \}/, newDamageLogic);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
