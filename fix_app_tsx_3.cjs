const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              <div className="w-20 ml-2 flex flex-col">
                <button onClick={() => toggleAutoBattle()} className={\`win98-button w-full h-full font-bold text-sm \${isAutoBattling ? 'text-red-700' : 'text-black'}\`}>
                    {isAutoBattling ? '자동 중지' : '자동 전투'}
                  </button>
\\nn중지' : '전송(S)'}
                </button>
              </div>`;

const fixedStr = `              <div className="w-20 ml-2 flex flex-col">
                <button onClick={() => toggleAutoBattle()} className={\`win98-button w-full h-full font-bold text-sm \${isAutoBattling ? 'text-red-700' : 'text-black'}\`}>
                  {isAutoBattling ? '자동 중지' : '자동 전투'}
                </button>
              </div>`;

code = code.replace(targetStr, fixedStr);

const endTarget = `      )}
  
      {/* JSON-LD Overlay */}`;
const endFixed = `      )}
      
      {/* JSON-LD Overlay */}`;

code = code.replace(endTarget, endFixed); // I saw a parenthesis issue around 532, let me check that too

fs.writeFileSync('src/App.tsx', code);
