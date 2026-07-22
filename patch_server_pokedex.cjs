const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `// 4. View Knowledge Graph (JSON-LD)
app.get('/api/pokedex', (req, res) => {
  try {
    const db = require('better-sqlite3')('data/pokedex.sqlite');
    const list = db.prepare(\`
      SELECT p.id, p.identifier, psn.name 
      FROM pokemon p
      LEFT JOIN pokemon_species_names psn ON p.species_id = psn.pokemon_species_id AND psn.local_language_id = 3
      WHERE p.is_default = 1
      ORDER BY p.id ASC
    \`).all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/graph',`;

code = code.replace("// 4. View Knowledge Graph (JSON-LD)\napp.get('/api/graph',", newRoute);

fs.writeFileSync('server.ts', code, 'utf8');
