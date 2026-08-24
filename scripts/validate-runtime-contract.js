'use strict';

const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');

const repositoryRoot = resolve(__dirname, '..');
const packageMetadata = readJson('package.json');
const testConfig = readJson('vanilla-test.config.json');
const cmdSource = read('cmd.js');
const esmSource = read('cmd.mjs');
const boundary = 'node-cmd is Node.js-only. It does not run in browsers, with or without a bundler.';

function read(filename) {
    return readFileSync(resolve(repositoryRoot, filename), 'utf8');
}

function readJson(filename) {
    return JSON.parse(read(filename));
}

function requireSpecifiers(source) {
    return [...source.matchAll(/\brequire\(\s*(['"])([^'"]+)\1\s*\)/g)]
        .map((match) => match[2]);
}

function importSpecifiers(source) {
    return [
        ...source.matchAll(/\b(?:import|export)\s+[^'";]*?\s+from\s+(['"])([^'"]+)\1/g),
        ...source.matchAll(/\bimport\s+(['"])([^'"]+)\1/g),
        ...source.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)
    ]
        .sort((left, right) => left.index - right.index)
        .map((match) => match[2]);
}

assert.deepEqual(importSpecifiers([
    "import '../side-effect.js';",
    "const lazy = import('../dynamic.js');",
    "export {value} from '../re-export.js';"
].join('\n')), [
    '../side-effect.js',
    '../dynamic.js',
    '../re-export.js'
]);

assert.match(packageMetadata.description, /^Node\.js-only\b/);
assert.deepEqual(packageMetadata.engines, {node: '>=22.12.0'});
assert.equal(packageMetadata.browser, undefined);
assert.equal(packageMetadata.dependencies, undefined);
assert.equal(packageMetadata.optionalDependencies, undefined);
assert.equal(packageMetadata.peerDependencies, undefined);
assert.equal(packageMetadata.bundledDependencies, undefined);
assert.equal(packageMetadata.main, './cmd.js');
assert.equal(packageMetadata.module, './cmd.mjs');
assert.deepEqual(packageMetadata.exports, {
    '.': {
        import: './cmd.mjs',
        require: './cmd.js',
        default: './cmd.js'
    },
    './cmd': './cmd.js',
    './cmd.js': './cmd.js',
    './cmd.mjs': './cmd.mjs',
    './package.json': './package.json'
});

const runtimeSpecifiers = [
    ...requireSpecifiers(cmdSource),
    ...importSpecifiers(esmSource)
];

assert.deepEqual(runtimeSpecifiers, [
    'node:child_process',
    'node:util',
    './cmd.js'
]);
assert.equal(runtimeSpecifiers.some((specifier) => specifier.startsWith('../')), false);

assert.equal(testConfig.chrome, undefined);
assert.deepEqual(testConfig.node.include, ['cmd.js', 'cmd.mjs']);
assert.equal(packageMetadata.scripts.coverage, 'vanilla-test coverage node');
assert.equal(
    packageMetadata.scripts['test:behavioral'],
    'node ./test/node.mjs behavioral'
);

const groups = require(resolve(repositoryRoot, 'test/api.test.js')).groups;
const groupInventory = Object.fromEntries(
    groups.map((group) => [group.name, group.cases.length])
);

assert.deepEqual(groupInventory, {
    Unit: 5,
    Functional: 17,
    Behavioral: 5,
    Integration: 8,
    Regression: 18
});
assert.equal(groups.reduce((total, group) => total + group.cases.length, 0), 53);

for (const filename of ['README.md', 'MIGRATION.md', 'SECURITY.md', 'CHANGELOG.md']) {
    assert.ok(read(filename).includes(boundary), `${filename} needs the Node-only boundary`);
}

for (const filename of [
    'example/basic-unix.js',
    'example/basic-windows.js',
    'example/direct-file.js',
    'example/getPID.js',
    'example/nodePythonTerminal.js',
    'example/promise.js'
]) {
    const source = read(filename);
    assert.match(source, /^\/\/ Node\.js-only example:/, `${filename} needs a boundary header`);
    assert.match(source, /does not run in browsers\./, `${filename} needs the browser boundary`);
}

process.stdout.write(
    'Validated the Node.js-only runtime contract, 53-case behavioral inventory, '
    + 'four packed documents, and six Node-only examples. Native-browser and '
    + 'runtime-dependency conflict conformance are not applicable.\n'
);
