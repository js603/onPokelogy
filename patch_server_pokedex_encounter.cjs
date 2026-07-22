const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const list = db.prepare(\`
      SELECT p.id, p.identifier, psn.name 
      FROM pokemon p
      LEFT JOIN pokemon_species_names psn ON p.species_id = psn.pokemon_species_id AND psn.local_language_id = 3
      WHERE p.is_default = 1
      ORDER BY CAST(p.id AS INTEGER) ASC
    \`).all();
    res.json(list);`;

const replacement = `    const list = db.prepare(\`
      SELECT p.id, p.identifier, psn.name 
      FROM pokemon p
      LEFT JOIN pokemon_species_names psn ON p.species_id = psn.pokemon_species_id AND psn.local_language_id = 3
      WHERE p.is_default = 1
      ORDER BY CAST(p.id AS INTEGER) ASC
    \`).all();
    
    const encountered = new Set(
       game.store.query("poke:player_pokemon", "poke:hasEncountered", null).map(t => t[2])
    );
    
    const result = list.map((p) => ({
      ...p,
      encountered: encountered.has(p.id.toString())
    }));
    
    res.json(result);`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code, 'utf8');
