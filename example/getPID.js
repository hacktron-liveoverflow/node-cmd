// Node.js-only example: node-cmd uses node:child_process and does not run in browsers.
const cmd = require('../cmd.js');

const processRef = cmd.runStream(process.execPath, ['--version']);

console.log(`child PID: ${processRef.pid}`);
processRef.stdout.pipe(process.stdout);
processRef.stderr.pipe(process.stderr);
