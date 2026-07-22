const sqlite3 = require('better-sqlite3');
const fs = require('fs');

const db = sqlite3('data/pokedex.sqlite');
const locs = db.prepare(`
  SELECT ln.name, l.identifier, l.region_id
  FROM locations l 
  LEFT JOIN location_names ln ON l.id = ln.location_id AND ln.local_language_id = 9
`).all();

const transCode = fs.readFileSync('src/translations.ts', 'utf8');
const extractRegex = /export const translateMap: Record<string, string> = {([\s\S]+?)};\n/m;
const match = extractRegex.exec(transCode);
let mapStr = match ? match[1] : '';

let untranslated = [];

for (const loc of locs) {
  let name = loc.name || loc.identifier;
  if (!name) continue;
  
  if (name.startsWith('Route ') || name.startsWith('Sea Route ') || name.match(/^[0-9]+$/)) continue;
  
  if (!mapStr.includes("'" + name + "'") && !mapStr.includes('"' + name + '"')) {
    if ([5, 6, 7, 8].includes(loc.region_id)) {
      untranslated.push(name + ' (Region ' + loc.region_id + ')');
    }
  }
}

console.log(untranslated.join('\n'));
