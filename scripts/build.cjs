const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const root = path.resolve(__dirname, '..');
const source = path.join(root, '男娘测试');
const output = path.resolve(root, 'dist');
if (output !== path.join(root, 'dist') || !output.startsWith(root + path.sep)) {
    throw new Error('Build output must stay inside this repository.');
}
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, {
    recursive: true,
    filter: file => !['tests', 'debug.js', 'package.json'].includes(path.basename(file))
});
const entry = path.join(output, 'js/main.js');
let code = fs.readFileSync(entry, 'utf8');
const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
const startup = ast.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'startApp');
const development = startup.body.body.filter(node =>
    (node.type === 'VariableDeclaration' && node.declarations.some(decl => decl.id.name === 'local')) ||
    (node.type === 'IfStatement' && code.slice(node.start, node.end).includes("import('./debug.js')"))
);
if (development.length !== 2) throw new Error('Cannot identify the development-only bootstrap.');
for (const node of development.sort((a, b) => b.start - a.start)) {
    code = code.slice(0, node.start) + code.slice(node.end);
}
code = code.replace('    // Development tools are loaded only for an explicit local debugging session.\n', '');
fs.writeFileSync(entry, code);
console.log('Production site built in dist/; debug module and bootstrap excluded.');
