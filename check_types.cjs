const axios = require('axios');
const db = require('better-sqlite3')('data/pokedex.sqlite');

async function check() {
  const moves = db.prepare('SELECT id, identifier, type_id FROM moves').all();
  console.log(`Total moves in DB: ${moves.length}`);
  
  // Just check a few to see if they match
  const toCheck = [1, 2, 3, 10, 100, 200, 300];
  for (const id of toCheck) {
     const m = moves.find(x => parseInt(x.id) === id);
     if (!m) continue;
     const res = await axios.get(`https://pokeapi.co/api/v2/move/${id}`);
     const apiTypeUrl = res.data.type.url;
     const apiTypeId = apiTypeUrl.split('/').filter(x=>x).pop();
     console.log(`Move ${m.identifier}: DB_Type=${m.type_id}, API_Type=${apiTypeId}`);
  }
}
check();
