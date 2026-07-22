const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "{isTyping ? <TypewriterText text={log} onComplete={onTypingComplete} speed={15} /> : <span>{log}</span>}",
  "{isTyping ? <TypewriterText text={message} onComplete={onTypingComplete} speed={15} /> : <span>{message}</span>}"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
