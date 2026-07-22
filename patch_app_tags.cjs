const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "let message = rawMessage;",
  "let message = rawMessage.replace(/^\\[.*?\\]\\s*/, '');"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
