const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Find the broken string
const brokenIdx = code.indexOf("{isAutoBattling ? '전송\\nconst kantoCoords:");
if (brokenIdx !== -1) {
    const start = brokenIdx;
    const end = code.indexOf('];\n', start) + 3;
    code = code.substring(0, start) + "{isAutoBattling ? '자동 중지' : '자동 전투'}\\n                </button>" + code.substring(end);
}

const brokenIdx2 = code.indexOf("{isAutoBattling ? '전송\\n\\nconst kantoCoords");
if (brokenIdx2 !== -1) {
    const start = brokenIdx2;
    const end = code.indexOf('];\n', start) + 3;
    code = code.substring(0, start) + "{isAutoBattling ? '자동 중지' : '자동 전투'}\\n                </button>" + code.substring(end);
}

// Ensure the variables are defined at the top
const mapData = `
const kantoCoords: Record<string, {x: number, y: number}> = {
  "Pallet Town": { x: 20, y: 75 },
  "Route 1": { x: 20, y: 65 },
  "Viridian City": { x: 20, y: 55 },
  "Route 22": { x: 10, y: 55 },
  "Route 23": { x: 10, y: 40 },
  "Victory Road": { x: 10, y: 30 },
  "Indigo Plateau": { x: 10, y: 20 },
  "Route 2": { x: 20, y: 45 },
  "Viridian Forest": { x: 20, y: 35 },
  "Pewter City": { x: 20, y: 25 },
  "Route 3": { x: 30, y: 25 },
  "Mt. Moon": { x: 40, y: 25 },
  "Route 4": { x: 50, y: 25 },
  "Cerulean City": { x: 60, y: 25 },
  "Cerulean Cave": { x: 57, y: 20 },
  "Route 24": { x: 60, y: 15 },
  "Route 25": { x: 70, y: 15 },
  "Route 5": { x: 60, y: 35 },
  "Saffron City": { x: 60, y: 45 },
  "Route 6": { x: 60, y: 55 },
  "Vermilion City": { x: 60, y: 65 },
  "S.S. Anne": { x: 60, y: 72 },
  "Route 11": { x: 75, y: 65 },
  "Diglett's Cave": { x: 30, y: 60 },
  "Route 9": { x: 75, y: 25 },
  "Route 10": { x: 85, y: 25 },
  "Rock Tunnel": { x: 85, y: 35 },
  "Kanto Power Plant": { x: 92, y: 30 },
  "Lavender Town": { x: 85, y: 45 },
  "Pokémon Tower": { x: 88, y: 45 },
  "Route 8": { x: 75, y: 45 },
  "Route 7": { x: 50, y: 45 },
  "Celadon City": { x: 40, y: 45 },
  "Route 16": { x: 30, y: 45 },
  "Route 17": { x: 30, y: 65 },
  "Route 18": { x: 40, y: 80 },
  "Fuchsia City": { x: 50, y: 80 },
  "Safari Zone": { x: 50, y: 73 },
  "Route 15": { x: 60, y: 80 },
  "Route 14": { x: 70, y: 75 },
  "Route 13": { x: 80, y: 70 },
  "Route 12": { x: 85, y: 60 },
  "Sea Route 19": { x: 50, y: 90 },
  "Sea Route 20": { x: 35, y: 90 },
  "Seafoam Islands": { x: 28, y: 90 },
  "Cinnabar Island": { x: 20, y: 90 },
  "Pokémon Mansion": { x: 15, y: 90 },
  "Sea Route 21": { x: 20, y: 83 },
};

const connections = [
  ["Pallet Town", "Route 1"],
  ["Route 1", "Viridian City"],
  ["Viridian City", "Route 2"],
  ["Viridian City", "Route 22"],
  ["Route 22", "Route 23"],
  ["Route 23", "Victory Road"],
  ["Victory Road", "Indigo Plateau"],
  ["Route 2", "Viridian Forest"],
  ["Viridian Forest", "Pewter City"],
  ["Pewter City", "Route 3"],
  ["Route 3", "Mt. Moon"],
  ["Mt. Moon", "Route 4"],
  ["Route 4", "Cerulean City"],
  ["Cerulean City", "Route 24"],
  ["Route 24", "Route 25"],
  ["Cerulean City", "Route 5"],
  ["Route 5", "Saffron City"],
  ["Saffron City", "Route 6"],
  ["Saffron City", "Route 7"],
  ["Saffron City", "Route 8"],
  ["Route 6", "Vermilion City"],
  ["Vermilion City", "Route 11"],
  ["Vermilion City", "S.S. Anne"],
  ["Cerulean City", "Route 9"],
  ["Route 9", "Route 10"],
  ["Route 10", "Rock Tunnel"],
  ["Rock Tunnel", "Lavender Town"],
  ["Lavender Town", "Pokémon Tower"],
  ["Lavender Town", "Route 12"],
  ["Route 12", "Route 13"],
  ["Route 13", "Route 14"],
  ["Route 14", "Route 15"],
  ["Route 15", "Fuchsia City"],
  ["Fuchsia City", "Safari Zone"],
  ["Fuchsia City", "Route 18"],
  ["Route 18", "Route 17"],
  ["Route 17", "Route 16"],
  ["Route 16", "Celadon City"],
  ["Route 7", "Celadon City"],
  ["Fuchsia City", "Sea Route 19"],
  ["Sea Route 19", "Sea Route 20"],
  ["Sea Route 20", "Seafoam Islands"],
  ["Seafoam Islands", "Cinnabar Island"],
  ["Cinnabar Island", "Pokémon Mansion"],
  ["Cinnabar Island", "Sea Route 21"],
  ["Sea Route 21", "Pallet Town"],
  ["Diglett's Cave", "Route 2"],
  ["Diglett's Cave", "Route 11"]
];
`;

if (!code.includes('const connections = [')) {
    code = code.replace('export default function App() {', mapData + '\nexport default function App() {');
}

fs.writeFileSync('src/App.tsx', code);
