const fs = require('fs');
let code = fs.readFileSync('src/components/DataViewer.tsx', 'utf8');
code = code.replace("const JsonTree = ({ data, name = 'root', isLast = true }: { data: any, name?: string, isLast?: boolean }) => {", "const JsonTree = ({ data, name = 'root', isLast = true }: { data: any, name?: string, isLast?: boolean, key?: React.Key }) => {");
fs.writeFileSync('src/components/DataViewer.tsx', code, 'utf8');
