import Database from 'better-sqlite3';
import path from 'path';

export function migrateEncounters(db: Database.Database) {
  console.log('Running encounters migration...');

  // Define valid versions for each region
  const validVersionsByRegion: Record<number, number[]> = {
    1: [1, 2, 3, 10, 11], // Kanto (Removed Let's Go and later gens to prevent legendary bird swarms)
    2: [4, 5, 6, 15, 16], // Johto
    3: [7, 8, 9, 25, 26], // Hoenn
    4: [12, 13, 14, 37, 38], // Sinnoh
    5: [17, 18, 21, 22], // Unova
    6: [23, 24], // Kalos
    7: [27, 28, 29, 30], // Alola
    8: [33, 34, 35, 36, 50, 51], // Galar
    10: [40, 41] // Paldea (Though may not exist in this dump)
  };

  db.exec(`
    CREATE TABLE IF NOT EXISTS valid_encounters (
      location_area_id INTEGER,
      location_id INTEGER,
      region_id INTEGER,
      pokemon_id INTEGER,
      min_level INTEGER,
      max_level INTEGER,
      PRIMARY KEY (location_area_id, pokemon_id)
    );
  `);

  // Clear existing
  db.exec('DELETE FROM valid_encounters;');

  const insertStmt = db.prepare(`
    INSERT INTO valid_encounters (location_area_id, location_id, region_id, pokemon_id, min_level, max_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const areas = db.prepare(`
    SELECT a.id as area_id, l.id as loc_id, l.region_id 
    FROM location_areas a
    JOIN locations l ON a.location_id = l.id
  `).all() as any[];

  let insertedCount = 0;

  db.transaction(() => {
    for (const area of areas) {
      const regionId = parseInt(area.region_id, 10);
      const validVersions = validVersionsByRegion[regionId] || [];
      
      if (validVersions.length === 0) continue;

      const placeholders = validVersions.map(() => '?').join(',');
      
      // Get highest version match for encounters in this area
      const encounters = db.prepare(`
        SELECT pokemon_id, MIN(CAST(min_level AS INTEGER)) as min_level, MAX(CAST(max_level AS INTEGER)) as max_level
        FROM encounters
        WHERE location_area_id = ? AND CAST(version_id AS INTEGER) IN (${placeholders})
        GROUP BY pokemon_id
      `).all(area.area_id, ...validVersions) as any[];

      for (const enc of encounters) {
        insertStmt.run(area.area_id, area.loc_id, regionId, enc.pokemon_id, enc.min_level, enc.max_level);
        insertedCount++;
      }
    }
  })();

  console.log(`Migration complete. Inserted ${insertedCount} valid encounters.`);
  
  verifyDataIntegrity(db);
}

export function verifyDataIntegrity(db: Database.Database) {
  console.log('Verifying data integrity...');
  let isValid = true;
  
  // 1. Check for min_level > max_level
  const levelErrors = db.prepare(`SELECT * FROM valid_encounters WHERE min_level > max_level`).all();
  if (levelErrors.length > 0) {
    console.error(`Found ${levelErrors.length} encounters with min_level > max_level!`);
    isValid = false;
  }
  
  // 2. Check for missing location_ids
  const missingLocs = db.prepare(`SELECT * FROM valid_encounters WHERE location_id IS NULL OR location_area_id IS NULL`).all();
  if (missingLocs.length > 0) {
    console.error(`Found ${missingLocs.length} encounters with missing location references!`);
    isValid = false;
  }
  
  // 3. Verify counts
  const totalEncounters = db.prepare('SELECT COUNT(*) as cnt FROM valid_encounters').get() as any;
  console.log(`Total valid encounters in DB: ${totalEncounters.cnt}`);
  
  if (totalEncounters.cnt === 0) {
    console.error("Data integrity failed: No encounters were inserted!");
    isValid = false;
  }
  
  if (isValid) {
    console.log("Data integrity verification passed successfully!");
  } else {
    console.log("Data integrity verification failed!");
  }
}

if (process.argv[1] && process.argv[1].includes("migrateEncounters")) {
  const dbPath = path.join(process.cwd(), "data", "pokedex.sqlite"); const db = new Database(dbPath); migrateEncounters(db);
}
