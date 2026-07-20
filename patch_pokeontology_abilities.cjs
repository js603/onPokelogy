const fs = require('fs');
let code = fs.readFileSync('src/engine/PokeOntology.ts', 'utf8');

const abilitiesQuery = `
    // Abilities
    const abilitiesQuery = db.prepare(\`
      SELECT a.identifier, an.name 
      FROM pokemon_abilities pa 
      JOIN abilities a ON pa.ability_id = a.id 
      LEFT JOIN ability_names an ON a.id = an.ability_id AND an.local_language_id = 3
      WHERE pa.pokemon_id = ?
    \`).all(pkmnId) as any[];
    
    for (const ab of abilitiesQuery) {
      const abUri = \`\${POKE_PREFIX}ability_\${ab.identifier}\`;
      this.store.add(abUri, "rdf:type", \`\${POKE_PREFIX}Ability\`);
      this.store.add(abUri, \`\${POKE_PREFIX}name\`, ab.name || ab.identifier);
      this.store.add(pkmnUri, \`\${POKE_PREFIX}hasAbility\`, abUri);
    }
`;

// Insert it right after types loading
code = code.replace("    // Evolution", abilitiesQuery + "\n    // Evolution");

fs.writeFileSync('src/engine/PokeOntology.ts', code);
