const fs = require('fs');

const coords = {
  "Pallet Town": { x: 15, y: 80 },
  "Viridian City": { x: 15, y: 65 },
  "Pewter City": { x: 15, y: 30 },
  "Cerulean City": { x: 60, y: 20 },
  "Vermilion City": { x: 60, y: 65 },
  "Lavender Town": { x: 85, y: 40 },
  "Celadon City": { x: 45, y: 40 },
  "Saffron City": { x: 60, y: 40 },
  "Fuchsia City": { x: 50, y: 85 },
  "Cinnabar Island": { x: 15, y: 95 },
  "Indigo Plateau": { x: 5, y: 30 },
  "Mt. Moon": { x: 35, y: 20 },
  "Rock Tunnel": { x: 85, y: 25 },
  "Seafoam Islands": { x: 30, y: 95 },
  "Victory Road": { x: 5, y: 45 },
  "Viridian Forest": { x: 15, y: 50 },
  "Diglett's Cave": { x: 30, y: 65 },
  "Route 1": { x: 15, y: 73 },
  "Route 2": { x: 15, y: 57 },
  "Route 3": { x: 25, y: 30 },
  "Route 4": { x: 50, y: 20 },
  "Route 5": { x: 60, y: 30 },
  "Route 6": { x: 60, y: 52 },
  "Route 7": { x: 53, y: 40 },
  "Route 8": { x: 73, y: 40 },
  "Route 9": { x: 73, y: 20 },
  "Route 10": { x: 85, y: 33 },
  "Route 11": { x: 73, y: 65 },
  "Route 12": { x: 85, y: 55 },
  "Route 13": { x: 75, y: 70 },
  "Route 14": { x: 65, y: 75 },
  "Route 15": { x: 55, y: 85 },
  "Route 16": { x: 35, y: 40 },
  "Route 17": { x: 35, y: 65 },
  "Route 18": { x: 43, y: 85 },
  "Sea Route 19": { x: 50, y: 95 },
  "Sea Route 20": { x: 40, y: 95 },
  "Sea Route 21": { x: 15, y: 87 },
  "Route 22": { x: 10, y: 65 },
  "Route 23": { x: 5, y: 55 },
  "Route 24": { x: 60, y: 10 },
  "Route 25": { x: 70, y: 10 }
};

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// replace map logic
const mapContentRegex = /\{showMap && \([\s\S]*?\}\)/;

const newMapContent = `{showMap && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 md:p-8 flex items-center justify-center">
          <div className="win98-window w-full max-w-4xl max-h-[90vh] flex flex-col">
             <div className="win98-titlebar">
               <span>타운 맵 (Town Map)</span>
               <button onClick={() => setShowMap(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-t-white border-l-white border-b-black border-r-black font-bold">X</button>
             </div>
             <div className="p-2 bg-[#c0c0c0] flex-1 flex flex-col min-h-0">
                <div className="win98-inset bg-[#78C850] flex-1 relative overflow-auto flex items-center justify-center">
                  <div className="relative w-[600px] h-[600px] bg-[#90E060] border-4 border-double border-white shadow-lg m-auto shrink-0" 
                       style={{ backgroundImage: 'radial-gradient(#50A020 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    {/* Draw connecting routes / paths implicitly via background or just nodes */}
                    {Object.entries(locations.reduce((acc, loc) => {
                      const name = loc.name || loc.loc || loc.identifier;
                      if (!acc[name]) acc[name] = [];
                      acc[name].push(loc);
                      return acc;
                    }, {} as Record<string, any[]>)).map(([name, areas]) => {
                      // fallback random coords if not in list
                      const coords = ${JSON.stringify(coords)}[name] || { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
                      const isCity = name.includes('City') || name.includes('Town') || name.includes('Island');
                      const nodeColor = isCity ? 'bg-[#FF4040]' : 'bg-[#4080FF]';
                      
                      return (
                        <div 
                          key={name}
                          className="absolute group flex flex-col items-center justify-center"
                          style={{ left: \`\${coords.x}%\`, top: \`\${coords.y}%\`, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className={\`w-4 h-4 \${nodeColor} border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform cursor-pointer\`} />
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 border border-black px-1 text-[10px] font-bold whitespace-nowrap z-10 pointer-events-none">
                            {name}
                          </div>
                          <div className="absolute hidden group-hover:flex flex-col top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black p-1 shadow-lg w-max max-h-40 overflow-y-auto">
                            <div className="text-xs font-bold mb-1 border-b border-gray-400 pb-1">{name} 지역</div>
                            {areas.map(area => (
                              <button 
                                key={area.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('TRAVEL', { locationAreaId: area.id });
                                  setShowMap(false);
                                }}
                                className="win98-button text-[10px] my-[1px] text-left hover:bg-[#000080] hover:text-white truncate"
                              >
                                {area.identifier || '전체'}
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
      )}`;

appCode = appCode.replace(mapContentRegex, newMapContent);
fs.writeFileSync('src/App.tsx', appCode);
