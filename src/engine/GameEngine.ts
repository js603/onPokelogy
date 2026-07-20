import { TripleStore } from './TripleStore';
import { DataLayer } from './DataLayer';
import { PokeOntology } from './PokeOntology';

export class GameEngine {
  public store: TripleStore;
  public ontology: PokeOntology;
  public dataLayer: DataLayer;
  public tickCount: number = 0;
  public logs: string[] = [];
  public evolutionEvent: any = null;
  
  public currentLocationAreaId: number = 393; // Default: hoenn-route-101

  constructor() {
    this.store = new TripleStore();
    this.ontology = new PokeOntology(this.store);
    this.dataLayer = new DataLayer();
  }
  
  log(msg: string) {
    this.logs.push(msg);
  }

  async startGame(starterId: number) {
    this.store.triples = []; // reset graph
    this.tickCount = 0;
    this.logs = [];
    
    this.log("시스템 초기화: 지식 그래프를 구성하고 있습니다...");
    
    const playerUri = "poke:player_pokemon";
    
    this.store.add(playerUri, "rdf:type", "poke:Pokemon"); 
    this.store.add(playerUri, "poke:species", "poke:species_human");
    this.store.add(playerUri, "poke:name", "주인공(인간)");
    this.store.add(playerUri, "poke:maxHP", "120");
    this.store.add(playerUri, "poke:currentHP", "120");
    this.store.add(playerUri, "poke:attack", "20");
    this.store.add(playerUri, "poke:level", "1");
    this.store.add(playerUri, "poke:experience", "0");
    this.store.add(playerUri, "poke:weight", "65");
    this.store.add(playerUri, "poke:height", "1.75");
    this.store.add(playerUri, "poke:baseExperience", "0");

    this.store.add("poke:type_human", "rdf:type", "poke:Type");
    this.store.add("poke:type_human", "poke:name", "인간");
    this.store.add(playerUri, "poke:hasType", "poke:type_human");

    this.store.add("poke:ability_human", "rdf:type", "poke:Ability");
    this.store.add("poke:ability_human", "poke:name", "도구 사용");
    this.store.add(playerUri, "poke:hasAbility", "poke:ability_human");

    this.store.add("poke:move_punch", "rdf:type", "poke:Move");
    this.store.add("poke:move_punch", "poke:name", "맨손 공격");
    this.store.add("poke:move_punch", "poke:power", "20");
    this.store.add("poke:move_punch", "poke:hasType", "poke:type_human");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_punch");

    // 인간 스프라이트
    this.store.add(playerUri, "poke:spriteBack", "https://play.pokemonshowdown.com/sprites/trainers/oak.png"); 

    // 지역 이름 조회
    const { getDb } = await import('../db/index');
    const db = getDb();
    const loc = db.prepare(`
      SELECT ln.name, l.identifier 
      FROM location_areas a 
      JOIN locations l ON a.location_id = l.id 
      LEFT JOIN location_names ln ON l.id = ln.location_id AND ln.local_language_id = 9
      WHERE a.id = ?
    `).get(String(this.currentLocationAreaId)) as any;
    
    const locName = loc ? (loc.name || loc.identifier) : '알 수 없는 장소';

    this.log(`인간형 주인공이 생성되었습니다. (온톨로지 타입: 인간)`);
    this.log(`현재 위치: ${locName}`);
    this.log(`전투를 통해 야생의 첫 포켓몬을 포획하세요!`);
    
    await this.spawnWildPokemon();
    
    // Run inferences (type relations)
    this.store.infer();
    this.log("온톨로지 추론 완료. 지식 그래프 준비됨.");
  }
  
  async spawnWildPokemon() {
    const { getDb } = await import('../db/index');
    const db = getDb();
    
    // 현재 지역의 출현 포켓몬 조회
    const encounters = db.prepare(`
      SELECT e.pokemon_id, e.min_level, e.max_level
      FROM encounters e
      WHERE e.location_area_id = ?
    `).all(String(this.currentLocationAreaId)) as any[];

    let targetId = Math.floor(Math.random() * 151) + 1; // Default
    let targetLevel = 5;

    if (encounters && encounters.length > 0) {
      const randomEncounter = encounters[Math.floor(Math.random() * encounters.length)];
      targetId = parseInt(randomEncounter.pokemon_id, 10);
      const minLvl = parseInt(randomEncounter.min_level, 10);
      const maxLvl = parseInt(randomEncounter.max_level, 10);
      targetLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;
    }

    const enemyUri = await this.ontology.loadPokemon(targetId, 'enemy');
    
    // 레벨 적용
    this.store.update(enemyUri, "poke:level", targetLevel.toString());
    const baseHp = parseInt(this.store.getValue(enemyUri, "poke:maxHP") || "10", 10);
    const scaledHp = baseHp + (targetLevel - 5) * 5;
    this.store.update(enemyUri, "poke:maxHP", scaledHp.toString());
    this.store.update(enemyUri, "poke:currentHP", scaledHp.toString());

    const enemyName = this.store.getValue(enemyUri, "poke:name");
    
    this.log(`앗! 야생의 ${enemyName} (Lv.${targetLevel})이(가) 나타났다!`);
  }

  async evolvePokemon(playerUri: string, nextSpeciesName: string) {
    const currentExp = this.store.getValue(playerUri, "poke:experience");
    const currentLevel = this.store.getValue(playerUri, "poke:level");
    
    const oldName = this.store.getValue(playerUri, "poke:name") || "";
    const oldSprite = this.store.getValue(playerUri, "poke:spriteFront") || "";

    await this.ontology.loadPokemon(nextSpeciesName, 'player');
    
    const rawName = this.store.getValue(playerUri, "poke:name") || "";
    const newName = `주인공(${rawName})`;
    this.store.update(playerUri, "poke:name", newName);
    
    const newSprite = this.store.getValue(playerUri, "poke:spriteFront") || "";

    this.log(`축하합니다! ${oldName}은(는) ${newName}(으)로 진화했습니다!`);
    
    if (currentExp) this.store.update(playerUri, "poke:experience", currentExp);
    if (currentLevel) {
        this.store.update(playerUri, "poke:level", currentLevel);
        const level = parseInt(currentLevel, 10);
        const baseHp = parseInt(this.store.getValue(playerUri, "poke:maxHP") || "10", 10);
        const newMaxHp = baseHp + (level - 5) * 5; 
        this.store.update(playerUri, "poke:maxHP", newMaxHp.toString());
        this.store.update(playerUri, "poke:currentHP", newMaxHp.toString());
    }
    
    this.store.infer();
    
    this.evolutionEvent = { oldName, newName, oldSprite, newSprite };
  }

calculateDamage(attackerUri: string, defenderUri: string, moveUri: string): { damage: number, effectiveness: string } {
    let movePower = parseInt(this.store.getValue(moveUri, "poke:power") || "0", 10);
    const attackerAtk = parseInt(this.store.getValue(attackerUri, "poke:attack") || "10", 10);
    
    // Semantic queries replaced by DataLayer SQL queries
    const moveTypeUri = this.store.getValue(moveUri, "poke:hasType") || "";
    const defenderTypes = this.store.query(defenderUri, "poke:hasType", null).map(t => t[2]);
    
    const { multiplier, weakTypeNames, resistTypeNames, immuneTypeNames } = this.dataLayer.getTypeMatchupMultiplier(moveTypeUri, defenderTypes);
    
    let effectText = "";
    let abilityEffectText = "";
    
    const attackerAbilities = this.store.query(attackerUri, "poke:hasAbility", null).map(t => t[2]);
    for (const abUri of attackerAbilities) {
      const abName = this.store.getValue(abUri, "poke:name");
      if (abName === "맹화" || abName === "심록" || abName === "급류") {
         movePower = Math.floor(movePower * 1.5);
         abilityEffectText = `[SQL 연동] ${abName} 특성으로 인해 기술의 위력이 상승했다! `;
      } else if (abName === "적응력") {
         movePower = Math.floor(movePower * 1.5);
         abilityEffectText = `[SQL 연동] ${abName} 특성으로 자속 보정이 강화되었다! `;
      }
    }
    
    const defenderAbilities = this.store.query(defenderUri, "poke:hasAbility", null).map(t => t[2]);
    let defMultiplier = 1;
    for (const abUri of defenderAbilities) {
       const abName = this.store.getValue(abUri, "poke:name");
       if (abName === "부유" && moveTypeUri.includes("땅")) {
         defMultiplier = 0;
         abilityEffectText = `[SQL 연동] ${abName} 특성으로 인해 땅 타입 공격이 통하지 않는다! `;
       } else if (abName === "두꺼운지방" && (moveTypeUri.includes("불꽃") || moveTypeUri.includes("얼음"))) {
         defMultiplier = 0.5;
         abilityEffectText = `[SQL 연동] ${abName} 특성으로 인해 불꽃/얼음 타입 데미지가 반감되었다! `;
       }
    }

    const moveTypeName = this.store.getValue(moveTypeUri, "poke:name") || moveTypeUri.replace("poke:type_", "");
    
    if (multiplier > 1) {
      effectText = `[SQL 연동] ${moveTypeName} 기술은 ${weakTypeNames.join(', ')} 타입에게 효과가 굉장했다!`;
    } else if (multiplier < 1 && multiplier > 0) {
      effectText = `[SQL 연동] ${moveTypeName} 기술은 ${resistTypeNames.join(', ')} 타입에게 효과가 별로인 듯하다...`;
    } else if (multiplier === 0) {
      effectText = `[SQL 연동] ${moveTypeName} 기술은 ${immuneTypeNames.join(', ')} 타입에게 효과가 없다...`;
    }
    
    const finalMultiplier = multiplier * defMultiplier;
    const damage = Math.floor(((2 * 5 / 5 + 2) * movePower * (attackerAtk / 50) / 50 + 2) * finalMultiplier);
    
    return { damage: Math.max(1, damage), effectiveness: abilityEffectText + effectText };
  }

  applyDamage(defenderUri: string, damage: number) {
    let hp = parseInt(this.store.getValue(defenderUri, "poke:currentHP") || "0", 10);
    hp -= damage;
    if (hp < 0) hp = 0;
    this.store.update(defenderUri, "poke:currentHP", hp.toString());
    return hp;
  }

  getGameState() {
    const getPkmn = (uri: string) => {
      if (this.store.query(uri, "rdf:type", "poke:Pokemon").length === 0) return null;
      
      const name = this.store.getValue(uri, "poke:name");
      const hp = this.store.getValue(uri, "poke:currentHP");
      const maxHP = this.store.getValue(uri, "poke:maxHP");
      const level = this.store.getValue(uri, "poke:level");
      const experience = this.store.getValue(uri, "poke:experience");
      const weight = this.store.getValue(uri, "poke:weight");
      const height = this.store.getValue(uri, "poke:height");
      const baseExp = this.store.getValue(uri, "poke:baseExperience");
      const spriteFront = this.store.getValue(uri, "poke:spriteFront");
      const spriteBack = this.store.getValue(uri, "poke:spriteBack");
      const types = this.store.query(uri, "poke:hasType", null).map(t => {
        return this.store.getValue(t[2], "poke:name") || t[2].replace("poke:type_", "");
      });
      const abilities = this.store.query(uri, "poke:hasAbility", null).map(t => {
        return this.store.getValue(t[2], "poke:name") || t[2].replace("poke:ability_", "");
      });
      const moves = this.store.query(uri, "poke:knowsMove", null).map(t => {
        const typeUri = this.store.getValue(t[2], "poke:hasType") || "";
        return {
          uri: t[2],
          name: this.store.getValue(t[2], "poke:name"),
          type: this.store.getValue(typeUri, "poke:name") || typeUri.replace("poke:type_", ""),
          power: this.store.getValue(t[2], "poke:power")
        };
      });
      
      return { uri, name, hp, maxHP, level, experience, weight, height, baseExp, spriteFront, spriteBack, types, abilities, moves };
    };

    const state = {
      player: getPkmn("poke:player_pokemon"),
      enemy: getPkmn("poke:enemy_pokemon"),
      tick: this.tickCount,
      logs: this.logs,
      evolutionEvent: this.evolutionEvent
    };
    this.evolutionEvent = null;
    return state;
  }

  getBestMove(attackerUri: string, defenderUri: string) {
    const moves = this.store.query(attackerUri, "poke:knowsMove", null);
    if (moves.length === 0) return null;
    
    let bestMove = moves[0][2];
    let maxExpectedDamage = -1;

    for (const m of moves) {
      const moveUri = m[2];
      const { damage } = this.calculateDamage(attackerUri, defenderUri, moveUri);
      if (damage > maxExpectedDamage) {
        maxExpectedDamage = damage;
        bestMove = moveUri;
      }
    }
    return bestMove;
  }

  async runAction(actionType: string, payload?: any) {
    this.tickCount++;
    const playerUri = "poke:player_pokemon";
    const enemyUri = "poke:enemy_pokemon";
    
    const playerName = this.store.getValue(playerUri, "poke:name");
    const enemyName = this.store.getValue(enemyUri, "poke:name");

    if (actionType === 'AUTO_TICK') {
        if (this.store.query(enemyUri, "rdf:type", null).length === 0) return;
        const bestMove = this.getBestMove(playerUri, enemyUri);
        if (bestMove) {
            const moveName = this.store.getValue(bestMove, "poke:name");
            this.log(`[자동 전투] 시맨틱 추론 결과, 가장 효율적인 기술은 '${moveName}'입니다.`);
            await this.runAction('ATTACK', { moveUri: bestMove });
        }
        return;
    }

    if (actionType === 'CATCH') {
        if (this.store.query(enemyUri, "rdf:type", null).length === 0) {
            this.log("포획할 대상이 없습니다!");
            return;
        }
        const eHp = parseInt(this.store.getValue(enemyUri, "poke:currentHP") || "0", 10);
        const eMaxHp = parseInt(this.store.getValue(enemyUri, "poke:maxHP") || "10", 10);
        
        if (eHp < eMaxHp * 0.5 || Math.random() > 0.7) {
            this.log(`신난다! ${enemyName}을(를) 잡았다!`);
            const species = this.store.getValue(enemyUri, "poke:species");
            const speciesName = species?.replace("poke:species_", "");
            
            if (speciesName) {
                this.store.remove(playerUri, null, null); 
                await this.ontology.loadPokemon(speciesName, 'player'); 
                const rawName = this.store.getValue(playerUri, "poke:name");
                const newName = `주인공(${rawName})`;
                this.store.update(playerUri, "poke:name", newName);
                
                this.log(`[온톨로지 업데이트] 주인공 엔티티가 ${newName}(으)로 전환되었습니다.`);
                this.log(`이제부터 ${newName}와(과) 함께 모험을 떠난다!`);
                this.store.remove(enemyUri, null, null); 
                this.store.infer();
                return;
            }
        } else {
            this.log(`아깝다! 포켓몬이 볼에서 빠져나왔다!`);
            this.enemyTurn(enemyUri, playerUri);
            return;
        }
    }
    
    if (actionType === 'ATTACK') {
      const moveUri = payload.moveUri;
      const moveName = this.store.getValue(moveUri, "poke:name");
      this.log(`${playerName}의 ${moveName}!`);
      
      const { damage, effectiveness } = this.calculateDamage(playerUri, enemyUri, moveUri);
      if (effectiveness) this.log(effectiveness);
      
      const eHp = this.applyDamage(enemyUri, damage);
      this.log(`${enemyName}은(는) ${damage}의 피해를 입었다.`);
      
      if (eHp <= 0) {
        this.log(`${enemyName}은(는) 쓰러졌다! 승리했습니다!`);
        
        // Exp calculation
        const baseExpStr = this.store.getValue(enemyUri, "poke:baseExperience") || "50";
        const baseExp = parseInt(baseExpStr, 10);
        const enemyLevelStr = this.store.getValue(enemyUri, "poke:level") || "5";
        const enemyLevel = parseInt(enemyLevelStr, 10);
        
        const gainedExp = Math.floor((baseExp * enemyLevel) / 7);
        this.log(`${playerName}은(는) ${gainedExp}의 경험치를 얻었다!`);
        
        let currentExp = parseInt(this.store.getValue(playerUri, "poke:experience") || "0", 10);
        let currentLevel = parseInt(this.store.getValue(playerUri, "poke:level") || "5", 10);
        
        currentExp += gainedExp;
        this.store.update(playerUri, "poke:experience", currentExp.toString());
        
        const newLevel = 5 + Math.floor(currentExp / 50);
        if (newLevel > currentLevel) {
           this.store.update(playerUri, "poke:level", newLevel.toString());
           this.log(`[레벨 업] ${playerName}은(는) 레벨 ${newLevel}(으)로 올랐다!`);
           
           const hp = parseInt(this.store.getValue(playerUri, "poke:maxHP") || "20", 10) + 5;
           this.store.update(playerUri, "poke:maxHP", hp.toString());
           this.store.update(playerUri, "poke:currentHP", hp.toString());
        }
        
        this.store.remove(enemyUri, null, null); // Enemy defeated
        
        // Check Evolution
        // Check Evolution via SQL
        currentLevel = parseInt(this.store.getValue(playerUri, "poke:level") || "0", 10);
        const speciesUri = this.store.getValue(playerUri, "poke:species") || "";
        
        const evos = this.dataLayer.getEvolutionRequirements(speciesUri);
        
        let readyToEvolveTo = null;
        for (const evo of evos) {
           const minLevel = parseInt(evo.minimum_level, 10);
           if (!isNaN(minLevel) && currentLevel >= minLevel) {
               readyToEvolveTo = evo.evolved_identifier;
               break;
           }
        }
        
        if (readyToEvolveTo) {
          this.log(`앗! ${playerName}의 상태가...!`);
          this.log(`${playerName}은(는) 진화하려고 한다!`);
          await this.evolvePokemon(playerUri, readyToEvolveTo);
        }
        
        return;
      }
      
      // Enemy turn
      this.enemyTurn(enemyUri, playerUri);
    } else if (actionType === 'REST') {
       const backupTriples = this.store.query("poke:backup_pokemon", null, null);
       if (backupTriples.length > 0) {
           this.log(`오박사: 치료 기계로 포켓몬을 회복시켰다!`);
           this.log(`다시 포켓몬으로 게임을 진행합니다.`);
           this.restorePokemon("poke:backup_pokemon", playerUri);
           const maxHp = this.store.getValue(playerUri, "poke:maxHP") || "100";
           this.store.update(playerUri, "poke:currentHP", maxHp);
       } else {
           const maxHp = this.store.getValue(playerUri, "poke:maxHP") || "100";
           this.store.update(playerUri, "poke:currentHP", maxHp);
           this.log(`${playerName}은(는) 휴식을 취해 체력을 모두 회복했다.`);
       }
       
       if (this.store.query(enemyUri, "rdf:type", null).length > 0) {
           this.enemyTurn(enemyUri, playerUri);
       }
    } else if (actionType === 'EXPLORE') {
       if (this.store.query(enemyUri, "rdf:type", null).length > 0) {
         this.log(`전투 중에는 탐색할 수 없습니다!`);
       } else {
         this.log(`풀숲을 탐색하는 중...`);
         await this.spawnWildPokemon();
         this.store.infer(); // Run reasoner for new enemy
       }
    } else if (actionType === 'RUN') {
       if (this.store.query(enemyUri, "rdf:type", null).length > 0) {
         this.log(`성공적으로 도망쳤다!`);
         this.store.remove(enemyUri, null, null);
       } else {
         this.log(`도망칠 대상이 없다!`);
       }
    } else if (actionType === 'TRAVEL') {
       if (this.store.query(enemyUri, "rdf:type", null).length > 0) {
         this.log(`전투 중에는 이동할 수 없습니다!`);
       } else {
         const targetLocationAreaId = payload?.locationAreaId;
         if (targetLocationAreaId) {
             this.currentLocationAreaId = parseInt(targetLocationAreaId, 10);
             const { getDb } = await import('../db/index');
             const db = getDb();
             const loc = db.prepare(`
                SELECT ln.name, l.identifier 
                FROM location_areas a 
                JOIN locations l ON a.location_id = l.id 
                LEFT JOIN location_names ln ON l.id = ln.location_id AND ln.local_language_id = 9
                WHERE a.id = ?
              `).get(String(this.currentLocationAreaId)) as any;
              
             const locName = loc ? (loc.name || loc.identifier) : '알 수 없는 장소';
             this.log(`${locName}(으)로 이동했습니다.`);
         }
       }
    }
  }
  
  enemyTurn(enemyUri: string, playerUri: string) {
    const enemyName = this.store.getValue(enemyUri, "poke:name");
    const playerName = this.store.getValue(playerUri, "poke:name");
    
    // Pick random move
    const moves = this.store.query(enemyUri, "poke:knowsMove", null);
    if (moves.length === 0) return;
    
    const moveUri = moves[Math.floor(Math.random() * moves.length)][2];
    const moveName = this.store.getValue(moveUri, "poke:name");
    
    this.log(`적 ${enemyName}의 ${moveName}!`);
    const { damage, effectiveness } = this.calculateDamage(enemyUri, playerUri, moveUri);
    if (effectiveness) this.log(effectiveness);
    
    const pHp = this.applyDamage(playerUri, damage);
    this.log(`${playerName}은(는) ${damage}의 피해를 입었다.`);
    
    if (pHp <= 0) {
      this.log(`${playerName}은(는) 쓰러졌다... 눈앞이 깜깜해졌다!`);
      const isHuman = this.store.query(playerUri, "poke:species", "poke:species_human").length > 0;
      
      if (isHuman) {
        this.log(`오박사마저 쓰러졌다! 전투가 종료되었습니다.`);
        this.log(`모든 포켓몬의 체력이 완전히 회복되었습니다.`);
        this.store.remove(enemyUri, null, null);
        const maxHp = this.store.getValue(playerUri, "poke:maxHP") || "120";
        this.store.update(playerUri, "poke:currentHP", maxHp);
      } else {
        this.log(`오박사: 이런, 포켓몬을 잃고 말았구나. 내가 직접 나서마!`);
        this.backupPokemon(playerUri, "poke:backup_pokemon");
        this.respawnOak();
      }
    }
  }

  backupPokemon(fromUri: string, toUri: string) {
    this.store.remove(toUri, null, null);
    const triples = this.store.query(fromUri, null, null);
    for (const t of triples) {
      this.store.add(toUri, t[1], t[2]);
    }
  }

  restorePokemon(fromUri: string, toUri: string) {
    this.store.remove(toUri, null, null);
    const triples = this.store.query(fromUri, null, null);
    for (const t of triples) {
      this.store.add(toUri, t[1], t[2]);
    }
    this.store.remove(fromUri, null, null);
  }

  respawnOak() {
    const playerUri = "poke:player_pokemon";
    this.store.remove(playerUri, null, null);
    
    this.store.add(playerUri, "rdf:type", "poke:Pokemon"); 
    this.store.add(playerUri, "poke:species", "poke:species_human");
    this.store.add(playerUri, "poke:name", "주인공(인간)");
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
  }
}
