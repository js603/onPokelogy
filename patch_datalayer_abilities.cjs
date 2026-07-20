const fs = require('fs');
let code = fs.readFileSync('src/engine/DataLayer.ts', 'utf8');

const getAbilitiesMethod = `
  /**
   * Retrieves abilities for a given pokemon using SQL directly.
   */
  public getPokemonAbilities(identifier: string) {
    const query = this.db.prepare(\`
      SELECT 
        a.identifier, 
        an.name
      FROM pokemon_abilities pa
      JOIN pokemon p ON pa.pokemon_id = p.id
      JOIN abilities a ON pa.ability_id = a.id
      LEFT JOIN ability_names an ON a.id = an.ability_id AND an.local_language_id = '3'
      WHERE p.identifier = ?
    \`).all(identifier.replace("poke:species_", "")) as any[];
    
    return query;
  }
`;

code = code.replace("  }", "  }\n" + getAbilitiesMethod);
fs.writeFileSync('src/engine/DataLayer.ts', code);
