const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

code = code.replace("import { TripleStore } from './TripleStore';", "import { TripleStore } from './TripleStore';\nimport { DataLayer } from './DataLayer';");

code = code.replace("public ontology: PokeOntology;", "public ontology: PokeOntology;\n  public dataLayer: DataLayer;");

code = code.replace("this.ontology = new PokeOntology(this.store);", "this.ontology = new PokeOntology(this.store);\n    this.dataLayer = new DataLayer();");

// Replace calculateDamage logic
code = code.replace(/calculateDamage\(attackerUri: string, defenderUri: string, moveUri: string\): \{ damage: number, effectiveness: string \} \{[\s\S]*?return \{ damage, effectiveness: effectText \};\n  \}/, `calculateDamage(attackerUri: string, defenderUri: string, moveUri: string): { damage: number, effectiveness: string } {
    const movePower = parseInt(this.store.getValue(moveUri, "poke:power") || "0", 10);
    const attackerAtk = parseInt(this.store.getValue(attackerUri, "poke:attack") || "10", 10);
    
    // Semantic queries replaced by DataLayer SQL queries
    const moveTypeUri = this.store.getValue(moveUri, "poke:hasType") || "";
    const defenderTypes = this.store.query(defenderUri, "poke:hasType", null).map(t => t[2]);
    
    const { multiplier, weakTypeNames, resistTypeNames, immuneTypeNames } = this.dataLayer.getTypeMatchupMultiplier(moveTypeUri, defenderTypes);
    
    let effectText = "";
    const moveTypeName = this.store.getValue(moveTypeUri, "poke:name") || moveTypeUri.replace("poke:type_", "");
    
    if (multiplier > 1) {
      effectText = \`[SQL 추론] \${moveTypeName} 기술은 \${weakTypeNames.join(', ')} 타입에게 효과가 굉장했다!\`;
    } else if (multiplier < 1 && multiplier > 0) {
      effectText = \`[SQL 추론] \${moveTypeName} 기술은 \${resistTypeNames.join(', ')} 타입에게 효과가 별로인 듯하다...\`;
    } else if (multiplier === 0) {
      effectText = \`[SQL 추론] \${moveTypeName} 기술은 \${immuneTypeNames.join(', ')} 타입에게 효과가 없다...\`;
    }

    const damage = Math.floor(((2 * 5 / 5 + 2) * movePower * (attackerAtk / 50) / 50 + 2) * multiplier);
    return { damage, effectiveness: effectText };
  }`);

// Replace evolution check
code = code.replace(/this\.store\.infer\(\);\n\s*const readyToEvolve = this\.store\.getValue\(playerUri, "poke:readyToEvolveTo"\);[\s\S]*?return;/m, `// Check Evolution via SQL
        const currentLevel = parseInt(this.store.getValue(playerUri, "poke:level") || "0", 10);
        const speciesUri = this.store.getValue(playerUri, "poke:species") || "";
        
        const evos = this.dataLayer.getEvolutionRequirements(speciesUri);
        
        let readyToEvolveTo = null;
        for (const evo of evos) {
           const minLevel = parseInt(evo.minimum_level, 10);
           if (!isNaN(minLevel) && currentLevel >= minLevel) {
               readyToEvolveTo = evo.evolved_identifier;
               break;
           }
        }
        
        if (readyToEvolveTo) {
          this.log(\`앗! \${playerName}의 상태가...!\`);
          this.log(\`\${playerName}은(는) 진화하려고 한다!\`);
          await this.evolvePokemon(playerUri, readyToEvolveTo);
        }
        
        return;`);

fs.writeFileSync('src/engine/GameEngine.ts', code);
