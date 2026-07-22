const axios = require('axios');
const db = require('better-sqlite3')('data/pokedex.sqlite');

async function check() {
  const moves = db.prepare('SELECT m.id, m.identifier, m.type_id FROM moves m LIMIT 10').all();
  for (const m of moves) {
    const res = await axios.get(`https://pokeapi.co/api/v2/move/${m.id}`);
    const apiType = res.data.type.name;
    const dbTypeRes = db.prepare('SELECT identifier FROM types WHERE id = ?').get(m.type_id);
    const dbType = dbTypeRes ? dbTypeRes.identifier : 'unknown';
    console.log(`Move ${m.identifier}: DB=${dbType}, API=${apiType}`);
  }
}
check();
