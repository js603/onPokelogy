const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "let message = rawMessage;\n  return (",
  "let message = rawMessage;\n  const isMyMessage = speakerColor === 'text-blue-600';\n  return ("
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
