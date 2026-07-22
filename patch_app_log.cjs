const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newLogMessage = `const LogMessage = ({ log, gameState, isTyping, onTypingComplete }: { key?: any, log: string, gameState: any, isTyping?: boolean, onTypingComplete?: () => void }) => {
  let rawMessage = log;
  let speaker = '';
  let speakerColor = '';

  const matchP = rawMessage.match(/^\\[P\\|(.*?)\\]\\s*(.*)/);
  const matchE = rawMessage.match(/^\\[E\\|(.*?)\\]\\s*(.*)/);

  if (matchP) {
    speaker = matchP[1];
    speakerColor = 'text-blue-600';
    rawMessage = matchP[2];
  } else if (matchE) {
    speaker = matchE[1];
    speakerColor = 'text-red-600';
    rawMessage = matchE[2];
  }

  const isImportant = rawMessage.includes('레벨 업') || rawMessage.includes('진화');
  const isSystem = rawMessage.includes('시스템') || isImportant || rawMessage.includes('승리') || rawMessage.includes('잡았다') || rawMessage.includes('도망') || rawMessage.includes('나타났다') || rawMessage.includes('발견') || rawMessage.includes('휴식');

  if (speaker && !isSystem) {
     rawMessage = rawMessage.replace(new RegExp(\`^\${speaker}(이\\\\(가\\\\)|은\\\\(는\\\\)|은|는|의|이|가)?\\\\s*\`), '');
  } else if (isSystem) {
     speaker = '';
  }

  // legacy logic for old logs
  if (!speaker && !isSystem) {
    if (rawMessage.includes('주인공')) {
      speaker = gameState.player?.name || '나';
      speakerColor = 'text-blue-600';
      rawMessage = rawMessage.replace(/주인공\\(.*?\\)(이\\(가\\)|은\\(는\\)|은|는|의|이|가)?\\s*/, '');
    } else if (rawMessage.startsWith('적 ')) {
      const match = rawMessage.match(/^적\\s+([^\\s]+?)(?:이\\(가\\)|은\\(는\\)|은|는|의|이|가)?\\s+(.*)/);
      if (match) {
         speaker = match[1];
         speakerColor = 'text-red-600';
         rawMessage = match[2];
      } else {
         speaker = gameState.enemy?.name || '상대';
         speakerColor = 'text-red-600';
         rawMessage = rawMessage.replace(/^적\\s+[^\\s]+(?:이\\(가\\)|은\\(는\\)|은|는|의|이|가)?\\s*/, '');
      }
    } else if (gameState.player && rawMessage.startsWith(gameState.player.name)) {
      speaker = gameState.player.name;
      speakerColor = 'text-blue-600';
      rawMessage = rawMessage.replace(new RegExp(\`^\${gameState.player.name}(이\\\\(가\\\\)|은\\\\(는\\\\)|은|는|의|이|가)?\\\\s*\`), '');
    } else if (gameState.enemy && rawMessage.startsWith(gameState.enemy.name)) {
      speaker = gameState.enemy.name;
      speakerColor = 'text-red-600';
      rawMessage = rawMessage.replace(new RegExp(\`^\${gameState.enemy.name}(이\\\\(가\\\\)|은\\\\(는\\\\)|은|는|의|이|가)?\\\\s*\`), '');
    }
  }

  let message = rawMessage;
`;

// we need to replace from `const LogMessage = ` to the line before `return (`
code = code.replace(/const LogMessage = \(\{ log, gameState, isTyping, onTypingComplete \}: \{ key\?\: any, log\: string, gameState\: any, isTyping\?\: boolean, onTypingComplete\?\: \(\) => void \}\) => \{[\s\S]*?(?=  return \()/g, newLogMessage);

fs.writeFileSync('src/App.tsx', code, 'utf8');
