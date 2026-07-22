const axios = require('axios');
const db = require('better-sqlite3')('data/pokedex.sqlite');

async function check() {
  const moves = db.prepare('SELECT id, identifier, type_id, damage_class_id FROM moves LIMIT 50').all();
  let errors = 0;
  
  // Just check a sample to verify
  for (const m of moves) {
     try {
       const res = await axios.get(`https://pokeapi.co/api/v2/move/${m.id}`);
       const apiTypeUrl = res.data.type.url;
       const apiTypeId = apiTypeUrl.split('/').filter(x=>x).pop();
       const apiDamageClassUrl = res.data.damage_class ? res.data.damage_class.url : null;
       const apiDamageClassId = apiDamageClassUrl ? apiDamageClassUrl.split('/').filter(x=>x).pop() : null;
       
       if (m.type_id !== apiTypeId || m.damage_class_id !== apiDamageClassId) {
          console.log(`Mismatch ${m.identifier}: DB Type=${m.type_id} API Type=${apiTypeId} | DB Class=${m.damage_class_id} API Class=${apiDamageClassId}`);
          errors++;
       }
     } catch(e) {
       console.log(`Error checking ${m.identifier}: ${e.message}`);
     }
  }
  console.log(`Checked 50 moves. Errors: ${errors}`);
}
check();
