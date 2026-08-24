'use strict';

const {once} = require('node:events');
const defineGroup = require('./support/group.js');
const {
    assert,
    cmd,
    shellCommand
} = require('./support/process.js');

module.exports = defineGroup('Behavioral', (test) => {
    test('runPromise completes a shell command chain', async () => {
        const command = shellCommand("process.stdout.write('prepare ')")
            + ' && '
            + shellCommand("process.stdout.write('complete')");
        const result = await cmd.runPromise(command);

        assert.deepEqual(result, {stdout: 'prepare complete', stderr: ''});
    });

    test('run callback preserves partial output on a nonzero exit', async () => {
        const result = await new Promise((resolve) => {
            const child = cmd.run(
                shellCommand(
                    "process.stdout.write('partial'); process.stderr.write('failed'); process.exitCode = 7;"
                ),
                (error, stdout, stderr) => resolve({child, error, stdout, stderr})
            );

            assert.ok(child.pid > 0);
        });

        assert.equal(result.error.code, 7);
        assert.equal(result.stdout, 'partial');
        assert.equal(result.stderr, 'failed');
        assert.ok(result.child.pid > 0);
    });

    test('runPromise rejects when output exceeds maxBuffer', async () => {
        await assert.rejects(
            cmd.runPromise(
                shellCommand("process.stdout.write('x'.repeat(1_024));"),
                {maxBuffer: 32}
            ),
            (error) => {
                assert.equal(error.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
                assert.equal(error.stdout, 'x'.repeat(32));
                assert.equal(error.stderr, '');
                return true;
            }
        );
    });

    test('runFilePromise terminates a direct process after its timeout', async () => {
        const promise = cmd.runFilePromise(
            process.execPath,
            ['-e', 'setInterval(() => {}, 1_000);'],
            {timeout: 100}
        );

        assert.ok(promise.child.pid > 0);
        await assert.rejects(promise, (error) => {
            assert.equal(error.killed, true);
            assert.equal(error.stdout, '');
            assert.equal(error.stderr, '');
            return true;
        });
        assert.equal(promise.child.killed, true);
    });

    test('runStream exposes worker output before the process exits', async () => {
        const source = [
            "const readline = require('node:readline');",
            'const lines = readline.createInterface({input: process.stdin});',
            "process.stdout.write('ready\\n');",
            "lines.once('line', value => {",
            '    process.stdout.write(value.toUpperCase());',
            '    lines.close();',
            '});'
        ].join('\n');
        const child = cmd.runStream(process.execPath, ['-e', source]);
        const output = [];

        child.stdout.on('data', (chunk) => output.push(Buffer.from(chunk)));

        const [ready] = await once(child.stdout, 'data');
        assert.equal(ready.toString(), 'ready\n');
        assert.equal(child.exitCode, null);

        const completed = once(child, 'close');
        child.stdin.end('done\n');

        const [code, signal] = await completed;
        assert.equal(code, 0);
        assert.equal(signal, null);
        assert.equal(Buffer.concat(output).toString(), 'ready\nDONE');
    });
});
