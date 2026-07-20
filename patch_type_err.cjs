const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace('return acc;\n                    }, {} as Record<string, any[]>)).map(([name, areas]) => {', 'return acc;\n                    }, {} as Record<string, any[]>)).map(([name, areas]: [string, any]) => {');
fs.writeFileSync('src/App.tsx', appCode);
