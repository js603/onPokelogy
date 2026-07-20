import { DataLayer } from './src/engine/DataLayer.js';
const layer = new DataLayer();
console.log('Evolution Requirements for pidgey (16):');
console.log(layer.getEvolutionRequirements('pidgey'));
console.log('Matchup: Fire (10) vs Grass (12)');
console.log(layer.getTypeMatchupMultiplier('불꽃', ['풀']));
