import { getDb } from '../db/index.js';

export class DataLayer {
  private db = getDb();

  /**
   * Retrieves type effectiveness matchup using SQL directly from PokeAPI cached data.
   */
  public getTypeMatchupMultiplier(moveTypeName: string, targetTypeNames: string[]): { multiplier: number, weakTypeNames: string[], resistTypeNames: string[], immuneTypeNames: string[] } {
    let multiplier = 1.0;
    const weakTypeNames: string[] = [];
    const resistTypeNames: string[] = [];
    const immuneTypeNames: string[] = [];

    const mTypeName = moveTypeName.replace("poke:type_", "");

    for (const targetName of targetTypeNames) {
      const tTypeName = targetName.replace("poke:type_", "");
      
      const query = this.db.prepare(`
        SELECT te.damage_factor, tn_target.name as target_type_name
        FROM type_efficacy te
        JOIN type_names tn_damage ON te.damage_type_id = tn_damage.type_id
        JOIN type_names tn_target ON te.target_type_id = tn_target.type_id
        WHERE (tn_damage.name = ? OR tn_damage.type_id = ?) 
          AND (tn_target.name = ? OR tn_target.type_id = ?)
          AND tn_damage.local_language_id = '3'
          AND tn_target.local_language_id = '3'
        LIMIT 1
      `).get(mTypeName, mTypeName, tTypeName, tTypeName) as any;

      if (query) {
        const factor = parseInt(query.damage_factor, 10);
        const targetTypeStr = query.target_type_name;
        
        if (factor === 200) {
          multiplier *= 2;
          weakTypeNames.push(targetTypeStr);
        } else if (factor === 50) {
          multiplier *= 0.5;
          resistTypeNames.push(targetTypeStr);
        } else if (factor === 0) {
          multiplier *= 0;
          immuneTypeNames.push(targetTypeStr);
        }
      }
    }
    
    return { multiplier, weakTypeNames, resistTypeNames, immuneTypeNames };
  }

  /**
   * Retrieves evolution requirements for a given pokemon using SQL directly.
   */
  public getEvolutionRequirements(identifier: string) {
    const query = this.db.prepare(`
      SELECT 
        pe.evolved_species_id, 
        pe.minimum_level,
        pe.trigger_item_id,
        pe.minimum_happiness,
        psn.name as evolved_name,
        p.identifier as evolved_identifier
      FROM pokemon_evolution pe
      JOIN pokemon p ON pe.evolved_species_id = p.species_id
      LEFT JOIN pokemon_species_names psn ON psn.pokemon_species_id = p.species_id AND psn.local_language_id = '3'
      WHERE pe.evolved_species_id IN (
        SELECT id FROM pokemon_species WHERE evolves_from_species_id = (
          SELECT species_id FROM pokemon WHERE identifier = ? LIMIT 1
        )
      )
      AND p.is_default = '1'
      GROUP BY pe.evolved_species_id
    `).all(identifier.replace("poke:species_", "")) as any[];
    
    return query;
  }

  /**
   * Retrieves abilities for a given pokemon using SQL directly.
   */
  public getPokemonAbilities(identifier: string) {
    const query = this.db.prepare(`
      SELECT 
        a.identifier, 
        an.name
      FROM pokemon_abilities pa
      JOIN pokemon p ON pa.pokemon_id = p.id
      JOIN abilities a ON pa.ability_id = a.id
      LEFT JOIN ability_names an ON a.id = an.ability_id AND an.local_language_id = '3'
      WHERE p.identifier = ?
    `).all(identifier.replace("poke:species_", "")) as any[];
    
    return query;
  }
}
