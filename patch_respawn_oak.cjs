const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

const target = `  respawnOak() {
    const playerUri = "poke:player_pokemon";
    this.store.remove(playerUri, null, null);
    
    this.store.add(playerUri, "rdf:type", "poke:Pokemon"); 
    this.store.add(playerUri, "poke:species", "poke:species_human");
    this.store.add(playerUri, "poke:name", "오박사");
    this.store.add(playerUri, "poke:maxHP", "120");
    this.store.add(playerUri, "poke:currentHP", "120");
    this.store.add(playerUri, "poke:attack", "20");
    this.store.add(playerUri, "poke:level", "1");
    this.store.add(playerUri, "poke:experience", "0");
    this.store.add(playerUri, "poke:weight", "65");
    this.store.add(playerUri, "poke:height", "1.75");
    this.store.add(playerUri, "poke:baseExperience", "0");
    this.store.add(playerUri, "poke:hasType", "poke:type_human");
    this.store.add(playerUri, "poke:hasAbility", "poke:ability_human");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_punch");
    this.store.add(playerUri, "poke:spriteBack", "https://play.pokemonshowdown.com/sprites/trainers/oak.png"); 
    
    this.store.infer();
  }`;

const replacement = `  respawnOak() {
    const playerUri = "poke:player_pokemon";
    this.store.remove(playerUri, null, null);
    
    this.store.add(playerUri, "rdf:type", "poke:Pokemon"); 
    this.store.add(playerUri, "poke:species", "poke:species_human");
    this.store.add(playerUri, "poke:name", "오박사");
    this.store.add(playerUri, "poke:maxHP", "150");
    this.store.add(playerUri, "poke:currentHP", "150");
    this.store.add(playerUri, "poke:attack", "45");
    this.store.add(playerUri, "poke:defense", "40");
    this.store.add(playerUri, "poke:spAtk", "30");
    this.store.add(playerUri, "poke:spDef", "40");
    this.store.add(playerUri, "poke:level", "1");
    this.store.add(playerUri, "poke:experience", "0");
    this.store.add(playerUri, "poke:weight", "65");
    this.store.add(playerUri, "poke:height", "1.75");
    this.store.add(playerUri, "poke:baseExperience", "0");
    this.store.add(playerUri, "poke:hasType", "poke:type_격투");
    this.store.add(playerUri, "poke:hasAbility", "poke:ability_human");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_punch");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_highkick");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_takedown");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_rnc");
    this.store.add(playerUri, "poke:spriteBack", "https://play.pokemonshowdown.com/sprites/trainers/oak.png"); 
    
    this.store.infer();
  }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
