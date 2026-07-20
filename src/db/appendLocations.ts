import path from 'path';
import axios from 'axios';
import Database from 'better-sqlite3';
import Papa from 'papaparse';

const DB_PATH = path.join(process.cwd(), 'data', 'pokedex.sqlite');
const POKEAPI_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

const files = ['locations.csv', 'location_names.csv', 'location_areas.csv', 'encounters.csv'];

export async function appendLocations() {
  const db = new Database(DB_PATH);
  
  for (const filename of files) {
    const tableName = filename.replace('.csv', '');
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    if (tableCheck) {
      const countCheck = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number };
      if (countCheck.count > 0) {
        console.log(`[DB] Table ${tableName} already exists with ${countCheck.count} rows.`);
        continue;
      }
    }
    
    console.log(`[DB] Fetching ${filename}...`);
    try {
      const response = await axios.get(`${POKEAPI_BASE_URL}/${filename}`);
      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true
      });
      
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
}
appendLocations();
