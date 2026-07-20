const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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

const prefixIdx = code.indexOf('{showMap && (');
const suffixIdx = code.indexOf('{loading && !isAutoBattling && (');

if (prefixIdx > -1 && suffixIdx > -1) {
  const newMapContent = `{showMap && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 md:p-8 flex items-center justify-center">
          <div className="win98-window w-full max-w-4xl max-h-[90vh] flex flex-col">
             <div className="win98-titlebar">
               <span>타운 맵 (Town Map)</span>
               <button onClick={() => setShowMap(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0] flex-1 flex flex-col min-h-0">
                <div className="win98-inset bg-[#78C850] flex-1 relative overflow-auto flex items-center justify-center">
                  <div className="relative w-[700px] h-[550px] bg-[#90E060] border-4 border-double border-white shadow-lg m-auto shrink-0" 
                       style={{ backgroundImage: 'radial-gradient(#50A020 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {connections.map(([from, to], idx) => {
                        const fromCoord = kantoCoords[from];
                        const toCoord = kantoCoords[to];
                        if (fromCoord && toCoord) {
                          return (
                            <line 
                              key={idx} 
                              x1={\`\${fromCoord.x}%\`} 
                              y1={\`\${fromCoord.y}%\`} 
                              x2={\`\${toCoord.x}%\`} 
                              y2={\`\${toCoord.y}%\`} 
                              stroke="white" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                            />
                          );
                        }
                        return null;
                      })}
                    </svg>
                    {/* Map nodes */}
                    {Object.entries(locations.reduce((acc, loc) => {
                      const name = loc.name || loc.loc || loc.identifier;
                      if (!acc[name]) acc[name] = [];
                      acc[name].push(loc);
                      return acc;
                    }, {} as Record<string, any[]>)).map(([name, areas]: [string, any], index: number) => {
                      const coord = kantoCoords[name];
                      if (!coord) {
                        return null; // hide unknown locations like Sevii islands to keep map clean
                      }
                      
                      const { x, y } = coord;
                      
                      const isCity = name.includes('City') || name.includes('Town') || name.includes('Island') || name.includes('Plateau');
                      const nodeColor = isCity ? 'bg-[#FF4040]' : 'bg-[#4080FF]';
                      const nodeShape = isCity ? 'w-5 h-5 rounded-sm' : 'w-3 h-3 rounded-full';
                      
                      return (
                        <div 
                          key={name}
                          className="absolute group flex flex-col items-center justify-center"
                          style={{ left: \`\${x}%\`, top: \`\${y}%\`, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className={\`\${nodeShape} \${nodeColor} border-2 border-white shadow-md group-hover:scale-125 transition-transform cursor-pointer\`} />
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 border border-black px-1 text-[10px] font-bold whitespace-nowrap z-10 pointer-events-none group-hover:block hidden md:block">
                            {name}
                          </div>
                          <div className="absolute hidden group-hover:flex flex-col top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black p-1 shadow-lg w-max max-h-40 overflow-y-auto">
                            <div className="text-xs font-bold mb-1 border-b border-gray-400 pb-1">{name}</div>
                            {areas.map((area: any) => (
                              <button 
                                key={area.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('TRAVEL', { locationAreaId: area.id });
                                  setShowMap(false);
                                }}
                                className="win98-button text-[10px] my-[1px] text-left hover:bg-[#000080] hover:text-white truncate px-2 py-1"
                              >
                                {area.identifier || '이동하기'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      `;
  
  // also add kantoCoords and connections to top of file
  if (!code.includes('const kantoCoords')) {
     const importIdx = code.indexOf('import');
     const importEnd = code.lastIndexOf('import', code.indexOf('function App')) > -1 ? code.lastIndexOf('import', code.indexOf('function App')) + 50 : 0;
     const actualImportEnd = code.indexOf('\n', code.indexOf('import', code.lastIndexOf('import', code.indexOf('function App'))));
     code = code.substring(0, actualImportEnd) + '\n' + mapData + '\n' + code.substring(actualImportEnd);
  }

  const newPrefixIdx = code.indexOf('{showMap && (');
  const newSuffixIdx = code.indexOf('{loading && !isAutoBattling && (');
  
  code = code.substring(0, newPrefixIdx) + newMapContent + code.substring(newSuffixIdx);
  fs.writeFileSync('src/App.tsx', code);
}
