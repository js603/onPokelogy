const fs = require('fs');
let code = fs.readFileSync('src/engine/GameEngine.ts', 'utf8');

const target = `    this.store.add(playerUri, "poke:maxHP", "120");
    this.store.add(playerUri, "poke:currentHP", "120");
    this.store.add(playerUri, "poke:attack", "20");
    this.store.add(playerUri, "poke:defense", "20");
    this.store.add(playerUri, "poke:spAtk", "20");
    this.store.add(playerUri, "poke:spDef", "20");
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
    this.store.add("poke:move_punch", "poke:damageClass", "2");
    this.store.add("poke:move_punch", "poke:hasType", "poke:type_human");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_punch");`;

const replacement = `    this.store.add(playerUri, "poke:maxHP", "150");
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

    await this.ontology.loadTypeRelations("격투", "2");
    this.store.add(playerUri, "poke:hasType", "poke:type_격투");

    this.store.add("poke:ability_human", "rdf:type", "poke:Ability");
    this.store.add("poke:ability_human", "poke:name", "종합격투기");
    this.store.add(playerUri, "poke:hasAbility", "poke:ability_human");

    this.store.add("poke:move_punch", "rdf:type", "poke:Move");
    this.store.add("poke:move_punch", "poke:name", "원투 펀치");
    this.store.add("poke:move_punch", "poke:power", "40");
    this.store.add("poke:move_punch", "poke:damageClass", "2");
    this.store.add("poke:move_punch", "poke:hasType", "poke:type_격투");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_punch");

    this.store.add("poke:move_highkick", "rdf:type", "poke:Move");
    this.store.add("poke:move_highkick", "poke:name", "하이킥");
    this.store.add("poke:move_highkick", "poke:power", "65");
    this.store.add("poke:move_highkick", "poke:damageClass", "2");
    this.store.add("poke:move_highkick", "poke:hasType", "poke:type_격투");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_highkick");

    this.store.add("poke:move_takedown", "rdf:type", "poke:Move");
    this.store.add("poke:move_takedown", "poke:name", "테이크다운");
    this.store.add("poke:move_takedown", "poke:power", "50");
    this.store.add("poke:move_takedown", "poke:damageClass", "2");
    this.store.add("poke:move_takedown", "poke:hasType", "poke:type_격투");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_takedown");

    this.store.add("poke:move_rnc", "rdf:type", "poke:Move");
    this.store.add("poke:move_rnc", "poke:name", "리어네이키드초크");
    this.store.add("poke:move_rnc", "poke:power", "80");
    this.store.add("poke:move_rnc", "poke:damageClass", "2");
    this.store.add("poke:move_rnc", "poke:hasType", "poke:type_격투");
    this.store.add(playerUri, "poke:knowsMove", "poke:move_rnc");`;

code = code.replace(target, replacement);

fs.writeFileSync('src/engine/GameEngine.ts', code, 'utf8');
