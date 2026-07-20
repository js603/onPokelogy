import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Database from 'better-sqlite3';
import Papa from 'papaparse';

const DB_PATH = path.join(process.cwd(), 'data', 'pokedex.sqlite');
const POKEAPI_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

export async function initializeDatabase() {
  const db = new Database(DB_PATH);

  // Check if already initialized
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pokemon'").get();
  if (tableCheck) {
    const countCheck = db.prepare("SELECT COUNT(*) as count FROM pokemon").get() as { count: number };
    if (countCheck.count > 0) {
      console.log(`[DB] Database already initialized with ${countCheck.count} pokemon.`);
      return db;
    }
  }

  console.log('[DB] Initializing database from PokeAPI CSVs...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id INTEGER PRIMARY KEY,
      identifier TEXT,
      species_id INTEGER,
      name TEXT,
      height INTEGER,
      weight INTEGER,
      base_experience INTEGER,
      hp INTEGER,
      attack INTEGER,
      defense INTEGER,
      special_attack INTEGER,
      special_defense INTEGER,
      speed INTEGER,
      type1 TEXT,
      type2 TEXT
    );
    CREATE TABLE IF NOT EXISTS evolutions (
      evolved_species_id INTEGER,
      evolves_from_species_id INTEGER,
      minimum_level INTEGER
    );
    CREATE TABLE IF NOT EXISTS moves (
      id INTEGER PRIMARY KEY,
      identifier TEXT,
      name TEXT,
      type TEXT,
      power INTEGER,
      damage_class_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS pokemon_moves (
      pokemon_id INTEGER,
      move_id INTEGER,
      level INTEGER
    );
    CREATE TABLE IF NOT EXISTS type_efficacy (
      damage_type TEXT,
      target_type TEXT,
      damage_factor INTEGER
    );
  `);

  const fetchCsv = async (filename: string) => {
    console.log(`[DB] Fetching ${filename}...`);
    const response = await axios.get(`${POKEAPI_BASE_URL}/${filename}`);
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error: any) => reject(error),
      });
    });
  };

  try {
    const [
      pokemonData, pokemonSpeciesNamesData, pokemonStatsData, pokemonTypesData, typeNamesData,
      pokemonSpeciesData, pokemonEvolutionData, movesData, moveNamesData, pokemonMovesData, typeEfficacyData
    ] = await Promise.all([
      fetchCsv('pokemon.csv'),
      fetchCsv('pokemon_species_names.csv'),
      fetchCsv('pokemon_stats.csv'),
      fetchCsv('pokemon_types.csv'),
      fetchCsv('type_names.csv'),
      fetchCsv('pokemon_species.csv'),
      fetchCsv('pokemon_evolution.csv'),
      fetchCsv('moves.csv'),
      fetchCsv('move_names.csv'),
      fetchCsv('pokemon_moves.csv'),
      fetchCsv('type_efficacy.csv')
    ]);

    console.log('[DB] CSVs downloaded and parsed. Processing data...');

    const dbTx = db.transaction(() => {
      // 1. Process Types
      const typeNames: Record<string, string> = {};
      for (const row of typeNamesData) {
        if (row.local_language_id === '3') { // Korean
          typeNames[row.type_id] = row.name;
        }
      }

      // 2. Process Species Names
      const speciesNames: Record<string, string> = {};
      for (const row of pokemonSpeciesNamesData) {
        if (row.local_language_id === '3') {
          speciesNames[row.pokemon_species_id] = row.name;
        }
      }

      // 3. Process Pokemon Types and Stats
      const pokemonTypes: Record<string, { type1: string, type2: string | null }> = {};
      for (const row of pokemonTypesData) {
        if (!pokemonTypes[row.pokemon_id]) pokemonTypes[row.pokemon_id] = { type1: '', type2: null };
        const typeName = typeNames[row.type_id] || row.type_id;
        if (row.slot === '1') pokemonTypes[row.pokemon_id].type1 = typeName;
        else if (row.slot === '2') pokemonTypes[row.pokemon_id].type2 = typeName;
      }

      const pokemonStats: Record<string, Record<string, number>> = {};
      for (const row of pokemonStatsData) {
        if (!pokemonStats[row.pokemon_id]) pokemonStats[row.pokemon_id] = {};
        pokemonStats[row.pokemon_id][row.stat_id] = parseInt(row.base_stat, 10);
      }

      // 4. Insert Pokemon
      const insertPoke = db.prepare(`INSERT INTO pokemon (id, identifier, species_id, name, height, weight, base_experience, hp, attack, defense, special_attack, special_defense, speed, type1, type2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const p of pokemonData) {
        if (p.is_default !== '1') continue;
        const sInfo = speciesNames[p.species_id] || p.identifier;
        const stats = pokemonStats[p.id] || {};
        const types = pokemonTypes[p.id] || { type1: '', type2: null };
        
        insertPoke.run(
          parseInt(p.id, 10), p.identifier, parseInt(p.species_id, 10), sInfo,
          parseInt(p.height, 10) || 0, parseInt(p.weight, 10) || 0, parseInt(p.base_experience, 10) || 0,
          stats['1'] || 0, stats['2'] || 0, stats['3'] || 0, stats['4'] || 0, stats['5'] || 0, stats['6'] || 0,
          types.type1, types.type2
        );
      }

      // 5. Insert Evolutions
      const speciesToEvolvesFrom: Record<string, string> = {};
      for (const row of pokemonSpeciesData) {
        if (row.evolves_from_species_id) {
          speciesToEvolvesFrom[row.id] = row.evolves_from_species_id;
        }
      }
      const insertEvo = db.prepare(`INSERT INTO evolutions (evolved_species_id, evolves_from_species_id, minimum_level) VALUES (?, ?, ?)`);
      for (const evo of pokemonEvolutionData) {
        const fromSpecies = speciesToEvolvesFrom[evo.evolved_species_id];
        if (fromSpecies) {
          insertEvo.run(parseInt(evo.evolved_species_id, 10), parseInt(fromSpecies, 10), parseInt(evo.minimum_level, 10) || 16);
        }
      }

      // 6. Process & Insert Moves
      const moveNames: Record<string, string> = {};
      for (const row of moveNamesData) {
        if (row.local_language_id === '3') {
          moveNames[row.move_id] = row.name;
        }
      }
      const insertMove = db.prepare(`INSERT INTO moves (id, identifier, name, type, power, damage_class_id) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const m of movesData) {
        const typeName = typeNames[m.type_id] || m.type_id;
        const name = moveNames[m.id] || m.identifier;
        insertMove.run(parseInt(m.id, 10), m.identifier, name, typeName, parseInt(m.power, 10) || 0, parseInt(m.damage_class_id, 10) || 0);
      }

      // 7. Process & Insert Pokemon Moves
      const insertPokeMove = db.prepare(`INSERT INTO pokemon_moves (pokemon_id, move_id, level) VALUES (?, ?, ?)`);
      for (const pm of pokemonMovesData) {
        if (pm.pokemon_move_method_id === '1') { // 1 = level-up
          insertPokeMove.run(parseInt(pm.pokemon_id, 10), parseInt(pm.move_id, 10), parseInt(pm.level, 10) || 1);
        }
      }

      // 8. Process & Insert Type Efficacy
      const insertEfficacy = db.prepare(`INSERT INTO type_efficacy (damage_type, target_type, damage_factor) VALUES (?, ?, ?)`);
      for (const eff of typeEfficacyData) {
        const dType = typeNames[eff.damage_type_id] || eff.damage_type_id;
        const tType = typeNames[eff.target_type_id] || eff.target_type_id;
        insertEfficacy.run(dType, tType, parseInt(eff.damage_factor, 10) || 100);
      }
    });

    dbTx();
    console.log('[DB] Successfully initialized complete database.');
  } catch (error) {
    console.error('[DB] Error initializing database:', error);
  }

  return db;
}
