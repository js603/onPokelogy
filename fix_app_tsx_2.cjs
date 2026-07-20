const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The issue is around line 462-466
// We will replace anything between toggleAutoBattle() and "Pallet Town": { x: 20, y: 75 }

const startToken = "toggleAutoBattle()} className={`win98-button w-full h-full font-bold text-sm ${isAutoBattling ? 'text-red-700' : 'text-black'}`}>";
const endToken = "const kantoCoords: Record<string, {x: number, y: number}> = {";

const idx1 = code.indexOf(startToken);
const idx2 = code.indexOf(endToken, idx1);

if (idx1 !== -1 && idx2 !== -1) {
    code = code.substring(0, idx1 + startToken.length) + "\n                    {isAutoBattling ? '자동 중지' : '자동 전투'}\n                  </button>\n" + code.substring(code.indexOf('];\n', idx2) + 3);
}

// now we might have deleted something? Wait, what was between startToken and endToken?
// it was the broken string AND the injected kantoCoords!
// so we replace it up to the END of connections array `];\n`!

fs.writeFileSync('src/App.tsx', code);
