const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { Pokedex } from './components/Pokedex';")) {
  code = code.replace(
    "import { DataViewer } from './components/DataViewer';",
    "import { DataViewer } from './components/DataViewer';\nimport { Pokedex } from './components/Pokedex';"
  );
}
fs.writeFileSync('src/App.tsx', code, 'utf8');
