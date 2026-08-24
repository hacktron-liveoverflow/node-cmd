// Node.js-only example: node-cmd uses node:child_process and does not run in browsers.
const cmd = require('../cmd.js');

const syncDir = cmd.runSync('cd');

console.log(`

cmd.runSync('cd')


err:     ${syncDir.err}

stderr:  ${syncDir.stderr}

data:    ${syncDir.data}

        `);

cmd.run('dir', (error, data, stderr) => {
        console.log(`

cmd.run('dir',func);  

err:     ${error}

stderr:  ${stderr}

data:    ${data}

        `);
    });
