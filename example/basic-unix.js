// Node.js-only example: node-cmd uses node:child_process and does not run in browsers.
const cmd = require('../cmd.js');

const syncDir = cmd.runSync('pwd');

console.log(`

cmd.runSync('pwd')


err:     ${syncDir.err}

stderr:  ${syncDir.stderr}

data:    ${syncDir.data}

        `);

cmd.run('ls', (error, data, stderr) => {
        console.log(`

cmd.run('ls',func);  

err:     ${error}

stderr:  ${stderr}

data:    ${data}

        `);
    });
