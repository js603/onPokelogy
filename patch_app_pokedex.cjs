const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { Menu, Settings, Monitor, MessageSquare, Database, Share2, Play, Save, Code } from 'lucide-react';",
  "import { Menu, Settings, Monitor, MessageSquare, Database, Share2, Play, Save, Code, BookOpen } from 'lucide-react';\nimport { Pokedex } from './components/Pokedex';"
);

code = code.replace(
  "const [showSysInfo, setShowSysInfo] = useState(false);",
  "const [showSysInfo, setShowSysInfo] = useState(false);\n  const [showPokedex, setShowPokedex] = useState(false);"
);

code = code.replace(
  "<div className=\"win98-dropdown-item\" onClick={(e) => {\n                  e.stopPropagation();\n                  setShowGraph(!showGraph);\n                  if(!showGraph) fetchGraph();\n                  setActiveMenu(null);\n                }}>\n                  데이터\n                </div>",
  `<div className="win98-dropdown-item" onClick={(e) => {
                  e.stopPropagation();
                  setShowPokedex(true);
                  setActiveMenu(null);
                }}>
                  포켓몬 도감(P)
                </div>
                <div className="win98-dropdown-item" onClick={(e) => {
                  e.stopPropagation();
                  setShowGraph(!showGraph);
                  if(!showGraph) fetchGraph();
                  setActiveMenu(null);
                }}>
                  데이터(D)
                </div>`
);

code = code.replace(
  "{showSysInfo && (",
  "{showPokedex && <Pokedex onClose={() => setShowPokedex(false)} />}\n      {showSysInfo && ("
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
