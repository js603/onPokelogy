import { getDb } from './index.js';

export function verifyIntegrity() {
  const db = getDb();
  console.log('Verifying SQLite database integrity...');

  let errors = 0;

  // 1. Check pokemon-to-ability mappings
  const pka = db.prepare(`
    SELECT count(*) as cnt 
    FROM pokemon_abilities pa
    LEFT JOIN pokemon p ON pa.pokemon_id = p.id
    LEFT JOIN abilities a ON pa.ability_id = a.id
    WHERE p.id IS NULL OR a.id IS NULL
  `).get() as any;

  if (pka.cnt > 0) {
    console.error(`❌ Found ${pka.cnt} orphaned pokemon-ability mappings.`);
    errors++;
  } else {
    console.log('✅ Pokemon-to-Ability mappings are intact.');
  }

  // 2. Check type-effectiveness chains
  const te = db.prepare(`
    SELECT count(*) as cnt 
    FROM type_efficacy te
    LEFT JOIN type_names tn1 ON te.damage_type_id = tn1.type_id
    LEFT JOIN type_names tn2 ON te.target_type_id = tn2.type_id
    WHERE tn1.type_id IS NULL OR tn2.type_id IS NULL
  `).get() as any;

  if (te.cnt > 0) {
    console.error(`❌ Found ${te.cnt} orphaned type-effectiveness chains.`);
    errors++;
  } else {
    console.log('✅ Type-Effectiveness chains are intact.');
  }

  // 3. Check locations
  const locs = db.prepare(`
    SELECT count(*) as cnt
    FROM location_areas la
    LEFT JOIN locations l ON la.location_id = l.id
    WHERE l.id IS NULL
  `).get() as any;

  if (locs.cnt > 0) {
    console.error(`❌ Found ${locs.cnt} orphaned location areas.`);
    errors++;
  } else {
    console.log('✅ Locations and areas are intact.');
  }

  if (errors === 0) {
    console.log('🎉 Database integrity verification passed.');
  } else {
    console.error('⚠️ Database integrity verification failed.');
  }
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyIntegrity();
}
