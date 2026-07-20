export type Triple = [string, string, string];

export class TripleStore {
  public triples: Triple[] = [];

  // Add a triple if it doesn't exist
  add(subject: string, predicate: string, object: string) {
    if (!this.triples.some(t => t[0] === subject && t[1] === predicate && t[2] === object)) {
      this.triples.push([subject, predicate, object]);
    }
  }

  // Remove matching triples
  remove(subject?: string | null, predicate?: string | null, object?: string | null) {
    this.triples = this.triples.filter(t => {
      const matchS = subject ? t[0] === subject : true;
      const matchP = predicate ? t[1] === predicate : true;
      const matchO = object ? t[2] === object : true;
      return !(matchS && matchP && matchO); // remove if all specified match
    });
  }

  // Update a functional property (like HP)
  update(subject: string, predicate: string, object: string) {
    this.remove(subject, predicate, null);
    this.add(subject, predicate, object);
  }

  // Query triples
  query(subject?: string | null, predicate?: string | null, object?: string | null): Triple[] {
    return this.triples.filter(t => {
      const matchS = subject ? t[0] === subject : true;
      const matchP = predicate ? t[1] === predicate : true;
      const matchO = object ? t[2] === object : true;
      return matchS && matchP && matchO;
    });
  }

  // Get single object value
  getValue(subject: string, predicate: string): string | null {
    const res = this.query(subject, predicate, null);
    return res.length > 0 ? res[0][2] : null;
  }

  // Basic reasoning/inference engine
  // This will apply rules based on existing data
  infer() {
    let added = false;
    do {
      added = false;
      
      // Rule 1: Type effectiveness transitivity (if needed)
      // We will handle effectiveness dynamically in battle logic for simplicity,
      // but we could infer explicit "moveX dealsDoubleDamageTo pokemonY"
      const allMoves = this.query(null, "rdf:type", "poke:Move");
      const allPokemon = this.query(null, "rdf:type", "poke:Pokemon");
      
      for (const move of allMoves) {
        const moveS = move[0];
        const moveType = this.getValue(moveS, "poke:hasType");
        
        for (const pkmn of allPokemon) {
          const pkmnS = pkmn[0];
          const pkmnTypes = this.query(pkmnS, "poke:hasType", null).map(t => t[2]);
          
          if (moveType) {
            let multiplier = 1;
            for (const pType of pkmnTypes) {
               const dDouble = this.query(moveType, "poke:doubleDamageTo", pType).length > 0;
               const dHalf = this.query(moveType, "poke:halfDamageTo", pType).length > 0;
               const dNo = this.query(moveType, "poke:noDamageTo", pType).length > 0;
               if (dDouble) multiplier *= 2;
               if (dHalf) multiplier *= 0.5;
               if (dNo) multiplier *= 0;
            }
            
            // Infer explicit relationships
            if (multiplier > 1) {
              const current = this.query(moveS, "poke:isSuperEffectiveAgainst", pkmnS);
              if (current.length === 0) {
                this.add(moveS, "poke:isSuperEffectiveAgainst", pkmnS);
                added = true;
              }
            } else if (multiplier < 1 && multiplier > 0) {
              const current = this.query(moveS, "poke:isNotVeryEffectiveAgainst", pkmnS);
              if (current.length === 0) {
                this.add(moveS, "poke:isNotVeryEffectiveAgainst", pkmnS);
                added = true;
              }
            } else if (multiplier === 0) {
              const current = this.query(moveS, "poke:hasNoEffectOn", pkmnS);
              if (current.length === 0) {
                this.add(moveS, "poke:hasNoEffectOn", pkmnS);
                added = true;
              }
            }
          }
        }
      }
      
      // Rule 2: Evolution readiness
      for (const pkmn of allPokemon) {
        const pkmnS = pkmn[0];
        const species = this.getValue(pkmnS, "poke:species");
        const levelStr = this.getValue(pkmnS, "poke:level");
        
        if (species && levelStr) {
          const level = parseInt(levelStr, 10);
          const evolvesTo = this.getValue(species, "poke:evolvesTo");
          const minLevelStr = this.getValue(species, "poke:minLevel");
          
          if (evolvesTo && minLevelStr) {
            const minLevel = parseInt(minLevelStr, 10);
            if (level >= minLevel) {
               const current = this.query(pkmnS, "poke:readyToEvolveTo", evolvesTo);
               if (current.length === 0) {
                 this.add(pkmnS, "poke:readyToEvolveTo", evolvesTo);
                 added = true;
               }
            }
          }
        }
      }
    } while (added); // Run until no new facts are inferred
  }

  toJSONLD() {
    // A simplified JSON-LD export of our graph
    const nodes: Record<string, any> = {};
    for (const [s, p, o] of this.triples) {
      if (!nodes[s]) nodes[s] = { "@id": s };
      
      const prop = p === "rdf:type" ? "@type" : p;
      
      if (!nodes[s][prop]) {
        nodes[s][prop] = o;
      } else {
        if (Array.isArray(nodes[s][prop])) {
          if (!nodes[s][prop].includes(o)) nodes[s][prop].push(o);
        } else {
          if (nodes[s][prop] !== o) nodes[s][prop] = [nodes[s][prop], o];
        }
      }
    }
    
    return {
      "@context": {
        "poke": "http://pokeapi.co/ontology#",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
      },
      "@graph": Object.values(nodes)
    };
  }
}
