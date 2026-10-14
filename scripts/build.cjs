const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

function buildSite(repositoryRoot = path.resolve(__dirname, '..')) {
    const root = path.resolve(repositoryRoot);
    const source = path.join(root, '男娘测试');
    const output = path.resolve(root, 'dist');
    const lockPath = path.join(root, '.build.lock');
    if (output !== path.join(root, 'dist') || !output.startsWith(root + path.sep)) {
        throw new Error('Build output must stay inside this repository.');
    }
    let lock;
    try {
        lock = fs.openSync(lockPath, 'wx');
    } catch (error) {
        if (error.code === 'EEXIST') throw new Error('Another build is already running (.build.lock exists).');
        throw error;
    }
    let staging, previous, published = false;
    try {
        staging = fs.mkdtempSync(path.join(root, '.build-'));
        fs.cpSync(source, staging, {
            recursive: true,
            filter: file => !['tests', 'functions', 'debug.js', 'package.json'].includes(path.basename(file))
        });
        const entry = path.join(staging, 'js/main.js');
        let code = fs.readFileSync(entry, 'utf8');
        const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
        const startup = ast.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'startApp');
        const development = (startup?.body.body || []).filter(node =>
            (node.type === 'VariableDeclaration' && node.declarations.some(decl => decl.id.name === 'local')) ||
            (node.type === 'IfStatement' && code.slice(node.start, node.end).includes("import('./debug.js')"))
        );
        if (development.length !== 2) throw new Error('Cannot identify the development-only bootstrap.');
        for (const node of development.sort((a, b) => b.start - a.start)) {
            code = code.slice(0, node.start) + code.slice(node.end);
        }
        code = code.replace('    // Development tools are loaded only for an explicit local debugging session.\n', '');
        fs.writeFileSync(entry, code);

        // Publish only a complete build. The lock serializes publishers; directory
        // renames avoid exposing partially copied files and allow rollback.
        if (fs.existsSync(output)) {
            previous = fs.mkdtempSync(path.join(root, '.previous-build-'));
            fs.rmdirSync(previous);
            fs.renameSync(output, previous);
        }
        try {
            fs.renameSync(staging, output);
            staging = null;
            published = true;
        } catch (error) {
            if (previous) {
                fs.renameSync(previous, output);
                previous = null;
            }
            throw error;
        }
        return output;
    } finally {
        // All cleanup targets were allocated directly inside the verified root.
        try {
            for (const directory of [staging, published ? previous : null]) {
                if (!directory) continue;
                if (!path.resolve(directory).startsWith(root + path.sep)) throw new Error('Invalid cleanup target.');
                fs.rmSync(directory, { recursive: true, force: true });
            }
        } finally {
            try { fs.closeSync(lock); }
            finally { fs.unlinkSync(lockPath); }
        }
    }
}

if (require.main === module) {
    buildSite();
    console.log('Production site built in dist/; debug module and bootstrap excluded.');
}
module.exports = { buildSite };
