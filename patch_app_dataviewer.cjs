const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { DataViewer }")) {
  code = code.replace("import React,", "import { DataViewer } from './components/DataViewer';\nimport React,");
}

code = code.replace(
  /<div className="win98-inset p-2 h-\[60vh\] overflow-auto bg-white">[\s\S]*?<\/div>/,
  '<DataViewer data={graphData} />'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
