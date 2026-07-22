import { TripleStore } from './TripleStore';
import { getDb } from '../db/index';

const POKE_PREFIX = "poke:";

export class PokeOntology {
  private store: TripleStore;
  private fetchedTypes = new Set<string>();

  constructor(store: TripleStore) {
    this.store = store;
  }

  async loadPokemon(idOrName: string | number, role: 'player' | 'enemy'): Promise<string> {
    const db = getDb();
    
    // Fetch basic pokemon info
    const query = typeof idOrName === 'number' || !isNaN(Number(idOrName))
      ? db.prepare(`SELECT * FROM pokemon WHERE id = ?`).get(String(idOrName))
      : db.prepare(`SELECT * FROM pokemon WHERE identifier = ?`).get(String(idOrName));

    if (!query) {
      throw new Error(`Pokemon not found: ${idOrName}`);
    }
    const data = query as any;
    const pkmnId = data.id;
    const speciesId = data.species_id;

    // Fetch species name (Korean)
    const speciesNameQuery = db.prepare(`SELECT name FROM pokemon_species_names WHERE pokemon_species_id = ? AND local_language_id = 3`).get(speciesId) as any;
    const koName = speciesNameQuery ? speciesNameQuery.name : data.identifier;

    // Fetch stats
    const statsQuery = db.prepare(`SELECT stat_id, base_stat FROM pokemon_stats WHERE pokemon_id = ?`).all(pkmnId) as any[];
    const stats: Record<string, string> = {};
    for (const st of statsQuery) {
      stats[st.stat_id] = st.base_stat;
    }
    // 1:hp, 2:atk, 3:def, 4:spatk, 5:spdef, 6:speed

    const pkmnUri = `${POKE_PREFIX}${role}_pokemon`;

    // Clear previous for role
    this.store.remove(pkmnUri, null, null);
    
    this.store.add(pkmnUri, "rdf:type", `${POKE_PREFIX}Pokemon`);
    this.store.add(pkmnUri, `${POKE_PREFIX}species`, `${POKE_PREFIX}species_${data.identifier}`);
    this.store.add(pkmnUri, `${POKE_PREFIX}level`, role === 'player' ? "5" : "5");
    this.store.add(pkmnUri, `${POKE_PREFIX}experience`, "0");
    this.store.add(pkmnUri, `${POKE_PREFIX}name`, koName);
    
    this.store.add(pkmnUri, `${POKE_PREFIX}maxHP`, stats['1'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}currentHP`, stats['1'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}speed`, stats['6'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}attack`, stats['2'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}defense`, stats['3'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}spAtk`, stats['4'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}spDef`, stats['5'] || "10");
    this.store.add(pkmnUri, `${POKE_PREFIX}weight`, data.weight?.toString() || "0");
    this.store.add(pkmnUri, `${POKE_PREFIX}height`, data.height?.toString() || "0");
    this.store.add(pkmnUri, `${POKE_PREFIX}baseExperience`, data.base_experience?.toString() || "0");
    
    // Sprites
    this.store.add(pkmnUri, `${POKE_PREFIX}spriteFront`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`);
    this.store.add(pkmnUri, `${POKE_PREFIX}spriteBack`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${data.id}.png`);

    // Types
    const typesQuery = db.prepare(`
      SELECT pt.type_id, tn.name 
      FROM pokemon_types pt 
      LEFT JOIN type_names tn ON pt.type_id = tn.type_id AND tn.local_language_id = 3
      WHERE pt.pokemon_id = ?
    `).all(pkmnId) as any[];

    for (const t of typesQuery) {
      const typeStr = t.name || t.type_id;
      const typeUri = `${POKE_PREFIX}type_${typeStr}`;
      this.store.add(pkmnUri, `${POKE_PREFIX}hasType`, typeUri);
      await this.loadTypeRelations(typeStr, t.type_id);
    }

    // Evolution
    if (role === 'player') {
      const evos = db.prepare(`
        SELECT p.identifier, psn.name, pe.minimum_level
        FROM pokemon_evolution pe
        JOIN pokemon p ON pe.evolved_species_id = p.species_id
        LEFT JOIN pokemon_species_names psn ON psn.pokemon_species_id = p.species_id AND psn.local_language_id = 3
        WHERE pe.evolved_species_id IN (SELECT id FROM pokemon_species WHERE evolves_from_species_id = ?)
        AND p.is_default = '1'
      `).all(speciesId) as any[];

      const speciesUri = `${POKE_PREFIX}species_${data.identifier}`;
      this.store.add(speciesUri, "rdf:type", `${POKE_PREFIX}Species`);

      for (const evo of evos) {
        const nextSpeciesUri = `${POKE_PREFIX}species_${evo.identifier}`;
        this.store.add(speciesUri, `${POKE_PREFIX}evolvesTo`, nextSpeciesUri);
        this.store.add(speciesUri, `${POKE_PREFIX}minLevel`, (evo.minimum_level || 16).toString());
      }
    }

    // Moves (Fetch up to 4 random or initial moves for this pokemon from pokemon_moves)
    const moves = db.prepare(`
      SELECT m.id, m.identifier, mn.name, m.type_id, m.power, m.damage_class_id
      FROM pokemon_moves pm
      JOIN moves m ON pm.move_id = m.id
      LEFT JOIN move_names mn ON m.id = mn.move_id AND mn.local_language_id = 3
      WHERE pm.pokemon_id = ? AND pm.level <= 15 AND m.power > 0 AND pm.pokemon_move_method_id = 1
      GROUP BY m.id
      ORDER BY MAX(pm.level) DESC
      LIMIT 4
    `).all(pkmnId) as any[];

    for (const move of moves) {
      const moveUri = `${POKE_PREFIX}move_${move.identifier.replace(/-/g, '_')}`;
      this.store.add(moveUri, "rdf:type", `${POKE_PREFIX}Move`);
      this.store.add(moveUri, `${POKE_PREFIX}name`, move.name || move.identifier);
      this.store.add(moveUri, `${POKE_PREFIX}power`, (move.power || 40).toString());
      this.store.add(moveUri, `${POKE_PREFIX}damageClass`, (move.damage_class_id || 2).toString());
      
      const moveTypeQuery = db.prepare(`SELECT name FROM type_names WHERE type_id = ? AND local_language_id = 3`).get(move.type_id) as any;
      const moveTypeStr = moveTypeQuery ? moveTypeQuery.name : move.type_id;
      
      this.store.add(moveUri, `${POKE_PREFIX}hasType`, `${POKE_PREFIX}type_${moveTypeStr}`);
      
      await this.loadTypeRelations(moveTypeStr, move.type_id);
      this.store.add(pkmnUri, `${POKE_PREFIX}knowsMove`, moveUri);
    }

    // fallback move if none found
    if (moves.length === 0) {
      const moveUri = `${POKE_PREFIX}move_tackle`;
      this.store.add(moveUri, "rdf:type", `${POKE_PREFIX}Move`);
      this.store.add(moveUri, `${POKE_PREFIX}name`, "몸통박치기");
      this.store.add(moveUri, `${POKE_PREFIX}power`, "40");
      this.store.add(moveUri, `${POKE_PREFIX}damageClass`, "2");
      this.store.add(moveUri, `${POKE_PREFIX}hasType`, `${POKE_PREFIX}type_노말`);
      await this.loadTypeRelations('노말', '1'); // 1 is normal
      this.store.add(pkmnUri, `${POKE_PREFIX}knowsMove`, moveUri);
    }
    
    return pkmnUri;
  }

  async loadTypeRelations(typeName: string, typeId: string) {
    if (this.fetchedTypes.has(typeName)) return;
    this.fetchedTypes.add(typeName);
    
    const db = getDb();
    const typeUri = `${POKE_PREFIX}type_${typeName}`;
    
    this.store.add(typeUri, "rdf:type", `${POKE_PREFIX}Type`);
    this.store.add(typeUri, `${POKE_PREFIX}name`, typeName);
    
    const relations = db.prepare(`
      SELECT te.target_type_id, tn.name, te.damage_factor 
      FROM type_efficacy te
      LEFT JOIN type_names tn ON tn.type_id = te.target_type_id AND tn.local_language_id = 3
      WHERE te.damage_type_id = ?
    `).all(typeId) as any[];
    
    for (const rel of relations) {
      const targetTypeStr = rel.name || rel.target_type_id;
      if (rel.damage_factor === '200') {
        this.store.add(typeUri, `${POKE_PREFIX}doubleDamageTo`, `${POKE_PREFIX}type_${targetTypeStr}`);
      } else if (rel.damage_factor === '50') {
        this.store.add(typeUri, `${POKE_PREFIX}halfDamageTo`, `${POKE_PREFIX}type_${targetTypeStr}`);
      } else if (rel.damage_factor === '0') {
        this.store.add(typeUri, `${POKE_PREFIX}noDamageTo`, `${POKE_PREFIX}type_${targetTypeStr}`);
      }
    }
  }
}

