import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Database from 'better-sqlite3';
import Papa from 'papaparse';
import { csvFiles } from './csvList.js';

const DB_PATH = path.join(process.cwd(), 'data', 'pokedex_full.sqlite');
const POKEAPI_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

export async function downloadAndInitializeFullDB() {
  const db = new Database(DB_PATH);

  console.log(`[DB] Initializing full database with ${csvFiles.length} files...`);

  // We can fetch in batches to avoid rate limits / memory issues
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < csvFiles.length; i += BATCH_SIZE) {
    const batch = csvFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (filename) => {
      const tableName = filename.replace('.csv', '');
      
      // Check if table exists and has data
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
      if (tableCheck) {
        const countCheck = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number };
        if (countCheck.count > 0) {
          console.log(`[DB] Table ${tableName} already initialized with ${countCheck.count} rows.`);
          return;
        }
      }

      console.log(`[DB] Fetching ${filename}...`);
      try {
        const response = await axios.get(`${POKEAPI_BASE_URL}/${filename}`);
        const parsed = Papa.parse(response.data, {
          header: true,
          skipEmptyLines: true
        });

        if (parsed.data.length === 0) {
            console.log(`[DB] Table ${tableName} is empty, skipping.`);
            return;
        }

        const headers = parsed.meta.fields || Object.keys(parsed.data[0]);
        
        // Create table
        const createTableSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${headers.map(h => `"${h}" TEXT`).join(', ')})`;
        db.exec(createTableSql);

        // Insert data
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
    }));
  }
  
  console.log('[DB] Full database initialization complete!');
  return db;
}
