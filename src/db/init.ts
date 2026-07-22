import { migrateEncounters } from "./migrateEncounters";
import path from 'path';
import axios from 'axios';
import Database from 'better-sqlite3';
import Papa from 'papaparse';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'pokedex.sqlite');
const POKEAPI_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

const filesToLoad = [
  'pokemon.csv',
  'pokemon_species_names.csv',
  'pokemon_stats.csv',
  'pokemon_types.csv',
  'type_names.csv',
  'pokemon_species.csv',
  'pokemon_evolution.csv',
  'moves.csv',
  'move_names.csv',
  'pokemon_moves.csv',
  'type_efficacy.csv',
  'locations.csv',
  'location_names.csv',
  'location_areas.csv',
  'encounters.csv'
];

export async function initializeDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  
  for (const filename of filesToLoad) {
    const tableName = filename.replace('.csv', '');
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    if (tableCheck) {
      const countCheck = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number };
      if (countCheck.count > 0) {
        continue;
      }
    }
    
    console.log(`[DB] Fetching ${filename}...`);
    try {
      const response = await axios.get(`${POKEAPI_BASE_URL}/${filename}`);
      const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true });
      if (parsed.data.length === 0) continue;
      
      const headers = parsed.meta.fields || Object.keys(parsed.data[0]);
      const createTableSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${headers.map(h => `"${h}" TEXT`).join(', ')})`;
      db.exec(createTableSql);
      
      const placeholders = headers.map(() => '?').join(', ');
      const insertStmt = db.prepare(`INSERT INTO "${tableName}" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${placeholders})`);
      
      const insertMany = db.transaction((rows: any[]) => {
        for (const row of rows) {
           const values = headers.map(h => row[h] === undefined ? null : String(row[h]));
           insertStmt.run(values);
        }
      });
      insertMany(parsed.data);
      console.log(`[DB] Saved ${tableName} with ${parsed.data.length} rows.`);
    } catch (err) {
      console.error(`[DB] Failed to process ${filename}:`, err);
    }
  }
  try {
    migrateEncounters(db);
  } catch (err) {
    console.error("[DB] Migration failed:", err);
  }

  return db;
}
