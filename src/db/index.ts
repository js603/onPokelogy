import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = path.join(process.cwd(), 'data', 'pokedex.sqlite');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
  }
  return dbInstance;
}
