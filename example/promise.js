// Node.js-only example: node-cmd uses node:child_process and does not run in browsers.
'use strict';

const cmd = require('../cmd.js');

async function main() {
    const {stdout, stderr} = await cmd.runPromise('node --version');

    if (stderr) {
        process.stderr.write(stderr);
    }

    process.stdout.write(stdout);
}

main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
});
