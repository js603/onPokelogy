const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /className="relative w-\[700px\] h-\[550px\] bg-\[#90E060\] border-4 border-double border-white shadow-lg m-auto shrink-0"\s*style={{ backgroundImage: 'radial-gradient\(#50A020 1px, transparent 1px\)', backgroundSize: '20px 20px' }}/,
  'className="relative w-[800px] max-w-full aspect-[494/308] bg-blue-300 border-4 border-double border-white shadow-lg m-auto shrink-0 overflow-hidden"\n                        style={{ backgroundImage: \'url("https://raw.githubusercontent.com/lowlighter/gracidea/main/copyrighted/textures/all/regions/hoenn.png")\', backgroundSize: \'100% 100%\', imageRendering: \'pixelated\' }}'
);
fs.writeFileSync('src/App.tsx', code);
