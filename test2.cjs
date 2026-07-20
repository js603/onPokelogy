const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
console.log(code.includes('export default function App() {'));
