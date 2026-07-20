import axios from 'axios';
import { TripleStore } from './TripleStore';

const POKE_PREFIX = "poke:";

export class PokeOntology {
  private store: TripleStore;
  private fetchedTypes = new Set<string>();

  constructor(store: TripleStore) {
    this.store = store;
  }

  async loadPokemon(idOrName: string | number, role: 'player' | 'enemy'): Promise<string> {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    const data = res.data;
    const pkmnUri = `${POKE_PREFIX}${role}_pokemon`; // Single active entity for simplicity

    // Clear previous for role
    this.store.remove(pkmnUri, null, null);
    
    this.store.add(pkmnUri, "rdf:type", `${POKE_PREFIX}Pokemon`);
    this.store.add(pkmnUri, `${POKE_PREFIX}species`, `${POKE_PREFIX}species_${data.species.name}`);
    this.store.add(pkmnUri, `${POKE_PREFIX}level`, role === 'player' ? "5" : "5");
    this.store.add(pkmnUri, `${POKE_PREFIX}experience`, "0");
    
    try {
      const speciesRes = await axios.get(data.species.url);
      const koNameObj = speciesRes.data.names.find((n: any) => n.language.name === 'ko');
      this.store.add(pkmnUri, `${POKE_PREFIX}name`, koNameObj ? koNameObj.name : data.name);
      
      if (role === 'player') {
         const evoRes = await axios.get(speciesRes.data.evolution_chain.url);
         this.parseEvolutionChain(evoRes.data.chain);
      }
    } catch (e) {
      this.store.add(pkmnUri, `${POKE_PREFIX}name`, data.name);
    }
    
    const hpStat = data.stats.find((s: any) => s.stat.name === 'hp').base_stat;
    const speedStat = data.stats.find((s: any) => s.stat.name === 'speed').base_stat;
    const atkStat = data.stats.find((s: any) => s.stat.name === 'attack').base_stat;
    
    this.store.add(pkmnUri, `${POKE_PREFIX}maxHP`, hpStat.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}currentHP`, hpStat.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}speed`, speedStat.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}attack`, atkStat.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}weight`, data.weight.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}height`, data.height.toString());
    this.store.add(pkmnUri, `${POKE_PREFIX}baseExperience`, data.base_experience.toString());
    if (data.sprites?.front_default) {
      this.store.add(pkmnUri, `${POKE_PREFIX}spriteFront`, data.sprites.front_default);
    }
    if (data.sprites?.back_default) {
      this.store.add(pkmnUri, `${POKE_PREFIX}spriteBack`, data.sprites.back_default);
    }

    // Abilities
    for (const a of data.abilities) {
      const abilityName = a.ability.name;
      const abilityUri = `${POKE_PREFIX}ability_${abilityName}`;
      this.store.add(pkmnUri, `${POKE_PREFIX}hasAbility`, abilityUri);
      
      try {
        const abilityRes = await axios.get(a.ability.url);
        const koNameObj = abilityRes.data.names.find((n: any) => n.language.name === 'ko');
        this.store.add(abilityUri, "rdf:type", `${POKE_PREFIX}Ability`);
        this.store.add(abilityUri, `${POKE_PREFIX}name`, koNameObj ? koNameObj.name : abilityName);
      } catch (e) {
        this.store.add(abilityUri, "rdf:type", `${POKE_PREFIX}Ability`);
        this.store.add(abilityUri, `${POKE_PREFIX}name`, abilityName);
      }
    }

    // Types
    for (const t of data.types) {
      const typeName = t.type.name;
      const typeUri = `${POKE_PREFIX}type_${typeName}`;
      this.store.add(pkmnUri, `${POKE_PREFIX}hasType`, typeUri);
      await this.loadTypeRelations(typeName);
    }

    // Load first 4 moves
    for (let i = 0; i < Math.min(4, data.moves.length); i++) {
      const moveUrl = data.moves[i].move.url;
      await this.loadMove(moveUrl, pkmnUri);
    }
    
    return pkmnUri;
  }

  async loadMove(url: string, ownerUri: string) {
    const res = await axios.get(url);
    const data = res.data;
    
    // Only care about damaging moves for this simple sim, fallback to tackle if needed
    if (data.power === null && data.damage_class.name === 'status') {
        return; // skip purely status moves for now to keep the engine simple
    }

    const moveUri = `${POKE_PREFIX}move_${data.name.replace(/-/g, '_')}`;
    this.store.add(moveUri, "rdf:type", `${POKE_PREFIX}Move`);
    
    const koNameObj = data.names.find((n: any) => n.language.name === 'ko');
    this.store.add(moveUri, `${POKE_PREFIX}name`, koNameObj ? koNameObj.name : data.name);
    
    this.store.add(moveUri, `${POKE_PREFIX}power`, (data.power || 40).toString());
    this.store.add(moveUri, `${POKE_PREFIX}hasType`, `${POKE_PREFIX}type_${data.type.name}`);
    
    await this.loadTypeRelations(data.type.name);
    
    // Assign move to pokemon
    this.store.add(ownerUri, `${POKE_PREFIX}knowsMove`, moveUri);
  }

  parseEvolutionChain(chainNode: any) {
    const speciesName = chainNode.species.name;
    const speciesUri = `${POKE_PREFIX}species_${speciesName}`;
    this.store.add(speciesUri, "rdf:type", `${POKE_PREFIX}Species`);
    
    for (const evolvesTo of chainNode.evolves_to) {
      const nextSpeciesName = evolvesTo.species.name;
      const nextSpeciesUri = `${POKE_PREFIX}species_${nextSpeciesName}`;
      
      this.store.add(speciesUri, `${POKE_PREFIX}evolvesTo`, nextSpeciesUri);
      
      const details = evolvesTo.evolution_details[0];
      if (details && details.min_level) {
        this.store.add(speciesUri, `${POKE_PREFIX}minLevel`, details.min_level.toString());
      } else {
        this.store.add(speciesUri, `${POKE_PREFIX}minLevel`, "16");
      }
      
      this.parseEvolutionChain(evolvesTo);
    }
  }

  async loadTypeRelations(typeName: string) {
    if (this.fetchedTypes.has(typeName)) return;
    this.fetchedTypes.add(typeName);
    
    const res = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
    const data = res.data;
    const typeUri = `${POKE_PREFIX}type_${typeName}`;
    
    this.store.add(typeUri, "rdf:type", `${POKE_PREFIX}Type`);
    
    const koNameObj = data.names.find((n: any) => n.language.name === 'ko');
    this.store.add(typeUri, `${POKE_PREFIX}name`, koNameObj ? koNameObj.name : data.name);
    
    const relations = data.damage_relations;
    for (const t of relations.double_damage_to) {
      this.store.add(typeUri, `${POKE_PREFIX}doubleDamageTo`, `${POKE_PREFIX}type_${t.name}`);
    }
    for (const t of relations.half_damage_to) {
      this.store.add(typeUri, `${POKE_PREFIX}halfDamageTo`, `${POKE_PREFIX}type_${t.name}`);
    }
    for (const t of relations.no_damage_to) {
      this.store.add(typeUri, `${POKE_PREFIX}noDamageTo`, `${POKE_PREFIX}type_${t.name}`);
    }
  }
}
