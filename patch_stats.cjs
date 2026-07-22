const fs = require('fs');

// Patch PokeOntology.ts
let code = fs.readFileSync('src/engine/PokeOntology.ts', 'utf8');

code = code.replace(
  "this.store.add(pkmnUri, `${POKE_PREFIX}attack`, stats['2'] || \"10\");",
  "this.store.add(pkmnUri, `${POKE_PREFIX}attack`, stats['2'] || \"10\");\n    this.store.add(pkmnUri, `${POKE_PREFIX}defense`, stats['3'] || \"10\");\n    this.store.add(pkmnUri, `${POKE_PREFIX}spAtk`, stats['4'] || \"10\");\n    this.store.add(pkmnUri, `${POKE_PREFIX}spDef`, stats['5'] || \"10\");"
);

code = code.replace(
  "SELECT m.id, m.identifier, mn.name, m.type_id, m.power",
  "SELECT m.id, m.identifier, mn.name, m.type_id, m.power, m.damage_class_id"
);

code = code.replace(
  "this.store.add(moveUri, `${POKE_PREFIX}power`, (move.power || 40).toString());",
  "this.store.add(moveUri, `${POKE_PREFIX}power`, (move.power || 40).toString());\n      this.store.add(moveUri, `${POKE_PREFIX}damageClass`, (move.damage_class_id || 2).toString());" // default to physical
);

code = code.replace(
  "this.store.add(moveUri, `${POKE_PREFIX}power`, \"40\");",
  "this.store.add(moveUri, `${POKE_PREFIX}power`, \"40\");\n      this.store.add(moveUri, `${POKE_PREFIX}damageClass`, \"2\");"
);

fs.writeFileSync('src/engine/PokeOntology.ts', code, 'utf8');
