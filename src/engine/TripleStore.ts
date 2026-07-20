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
      
      // Note: Type effectiveness and evolution are now handled via DataLayer (SQL)
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
