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
      ? db.prepare(`SELECT * FROM pokemon WHERE id = ?`).get(idOrName)
      : db.prepare(`SELECT * FROM pokemon WHERE identifier = ? OR name = ?`).get(idOrName, idOrName);

    if (!query) {
      throw new Error(`Pokemon not found: ${idOrName}`);
    }
    const data = query as any;

    const pkmnUri = `${POKE_PREFIX}${role}_pokemon`;

    // Clear previous for role
    this.store.remove(pkmnUri, null, null);
    
    this.store.add(pkmnUri, "rdf:type", `${POKE_PREFIX}Pokemon`);
    this.store.add(pkmnUri, `${POKE_PREFIX}species`, `${POKE_PREFIX}species_${data.identifier}`);
    this.store.add(pkmnUri, `${POKE_PREFIX}level`, role === 'player' ? "5" : "5");
    this.store.add(pkmnUri, `${POKE_PREFIX}experience`, "0");
    this.store.add(pkmnUri, `${POKE_PREFIX}name`, data.name || data.identifier);
    
    this.store.add(pkmnUri, `${POKE_PREFIX}maxHP`, data.hp.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}currentHP`, data.hp.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}speed`, data.speed.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}attack`, data.attack.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}weight`, data.weight.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}height`, data.height.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}baseExperience`, data.base_experience.toString());
    
    // Sprites
    this.store.add(pkmnUri, `${POKE_PREFIX}spriteFront`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`);
    this.store.add(pkmnUri, `${POKE_PREFIX}spriteBack`, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${data.id}.png`);

    // Types
    if (data.type1) {
      const typeUri = `${POKE_PREFIX}type_${data.type1}`;
      this.store.add(pkmnUri, `${POKE_PREFIX}hasType`, typeUri);
      await this.loadTypeRelations(data.type1);
    }
    if (data.type2) {
      const typeUri = `${POKE_PREFIX}type_${data.type2}`;
      this.store.add(pkmnUri, `${POKE_PREFIX}hasType`, typeUri);
      await this.loadTypeRelations(data.type2);
    }

    // Evolution
    if (role === 'player') {
      const evos = db.prepare(`
        SELECT p.identifier, p.name, e.minimum_level
        FROM evolutions e
        JOIN pokemon p ON e.evolved_species_id = p.species_id
        WHERE e.evolves_from_species_id = ?
      `).all(data.species_id) as any[];

      const speciesUri = `${POKE_PREFIX}species_${data.identifier}`;
      this.store.add(speciesUri, "rdf:type", `${POKE_PREFIX}Species`);

      for (const evo of evos) {
        const nextSpeciesUri = `${POKE_PREFIX}species_${evo.identifier}`;
        this.store.add(speciesUri, `${POKE_PREFIX}evolvesTo`, nextSpeciesUri);
        this.store.add(speciesUri, `${POKE_PREFIX}minLevel`, (evo.minimum_level || 16).toString());
      }
    }

    // Moves (Fetch up to 4 random or initial moves for this pokemon from pokemon_moves)
    // Here we'll get 4 level-up moves for simplicity
    const moves = db.prepare(`
      SELECT m.*
      FROM pokemon_moves pm
      JOIN moves m ON pm.move_id = m.id
      WHERE pm.pokemon_id = ? AND pm.level <= 15 AND m.power > 0
      ORDER BY pm.level DESC
      LIMIT 4
    `).all(data.id) as any[];

    for (const move of moves) {
      const moveUri = `${POKE_PREFIX}move_${move.identifier.replace(/-/g, '_')}`;
      this.store.add(moveUri, "rdf:type", `${POKE_PREFIX}Move`);
      this.store.add(moveUri, `${POKE_PREFIX}name`, move.name || move.identifier);
      this.store.add(moveUri, `${POKE_PREFIX}power`, (move.power || 40).toString());
      this.store.add(moveUri, `${POKE_PREFIX}hasType`, `${POKE_PREFIX}type_${move.type}`);
      
      await this.loadTypeRelations(move.type);
      this.store.add(pkmnUri, `${POKE_PREFIX}knowsMove`, moveUri);
    }

    // fallback move if none found
    if (moves.length === 0) {
      const moveUri = `${POKE_PREFIX}move_tackle`;
      this.store.add(moveUri, "rdf:type", `${POKE_PREFIX}Move`);
      this.store.add(moveUri, `${POKE_PREFIX}name`, "몸통박치기");
      this.store.add(moveUri, `${POKE_PREFIX}power`, "40");
      this.store.add(moveUri, `${POKE_PREFIX}hasType`, `${POKE_PREFIX}type_노말`);
      await this.loadTypeRelations('노말');
      this.store.add(pkmnUri, `${POKE_PREFIX}knowsMove`, moveUri);
    }
    
    return pkmnUri;
  }

  async loadTypeRelations(typeName: string) {
    if (this.fetchedTypes.has(typeName)) return;
    this.fetchedTypes.add(typeName);
    
    const db = getDb();
    const typeUri = `${POKE_PREFIX}type_${typeName}`;
    
    this.store.add(typeUri, "rdf:type", `${POKE_PREFIX}Type`);
    this.store.add(typeUri, `${POKE_PREFIX}name`, typeName);
    
    const relations = db.prepare(`SELECT target_type, damage_factor FROM type_efficacy WHERE damage_type = ?`).all(typeName) as any[];
    
    for (const rel of relations) {
      if (rel.damage_factor === 200) {
        this.store.add(typeUri, `${POKE_PREFIX}doubleDamageTo`, `${POKE_PREFIX}type_${rel.target_type}`);
      } else if (rel.damage_factor === 50) {
        this.store.add(typeUri, `${POKE_PREFIX}halfDamageTo`, `${POKE_PREFIX}type_${rel.target_type}`);
      } else if (rel.damage_factor === 0) {
        this.store.add(typeUri, `${POKE_PREFIX}noDamageTo`, `${POKE_PREFIX}type_${rel.target_type}`);
      }
    }
  }
}

