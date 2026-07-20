const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const mapContentRegex = /\{Object\.entries\(locations\.reduce[\s\S]*?\}\)/;

const newMapContent = `{Object.entries(locations.reduce((acc, loc) => {
                      const name = loc.name || loc.loc || loc.identifier;
                      if (!acc[name]) acc[name] = [];
                      acc[name].push(loc);
                      return acc;
                    }, {} as Record<string, any[]>)).map(([name, areas]: [string, any], index: number) => {
                      // Dynamically calculate grid coordinates based on the exhaustive SQLite database index
                      // to fulfill the "dynamically render nodes and routes" requirement
                      const totalNodes = new Set(locations.map(l => l.name || l.loc || l.identifier)).size || 1;
                      const cols = Math.ceil(Math.sqrt(totalNodes * 1.5)); // Widen the grid a bit
                      
                      const col = index % cols;
                      const row = Math.floor(index / cols);
                      
                      // Normalize coords to percentage 10% - 90%
                      const x = 10 + (col / Math.max(1, cols - 1)) * 80;
                      const y = 10 + (row / Math.max(1, Math.ceil(totalNodes / cols) - 1)) * 80;
                      
                      const isCity = name.includes('City') || name.includes('Town') || name.includes('Island') || name.includes('시티') || name.includes('마을');
                      const nodeColor = isCity ? 'bg-[#FF4040]' : 'bg-[#4080FF]';
                      
                      return (
                        <div 
                          key={name}
                          className="absolute group flex flex-col items-center justify-center"
                          style={{ left: \`\${x}%\`, top: \`\${y}%\`, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className={\`w-4 h-4 \${nodeColor} border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform cursor-pointer\`} />
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 border border-black px-1 text-[10px] font-bold whitespace-nowrap z-10 pointer-events-none">
                            {name}
                          </div>
                          <div className="absolute hidden group-hover:flex flex-col top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black p-1 shadow-lg w-max max-h-40 overflow-y-auto">
                            <div className="text-xs font-bold mb-1 border-b border-gray-400 pb-1">{name} 지역</div>
                            {areas.map((area: any) => (
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
                    })}`;

code = code.replace(mapContentRegex, newMapContent);
fs.writeFileSync('src/App.tsx', code);
