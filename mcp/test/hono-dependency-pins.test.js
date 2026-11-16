'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// The Node adapter and core pins cover path/middleware and WebSocket
// fixes, including GHSA-rmxm-3fg6-px4f and GHSA-4m76-xfj5-7975.
// Check every lock entry, not only the top-level copy. These are development
// dependencies; this does not qualify a hosted server or enable the relay.
for (const directory of ['mcp', 'claude-agent-sdk', 'risk-fork-hosted-mcp']) {
    test(`${directory} pins the patched Hono Node server and core`, () => {
        const load = name => JSON.parse(readFileSync(
            path.resolve(__dirname, '..', '..', directory, name), 'utf8',
        ));
        const manifest = load('package.json');
        const lock = load('package-lock.json');
        assert.equal(manifest.private, true);
        for (const [name, version] of [['@hono/node-server', '2.1.8'], ['hono', '4.13.18']]) {
            assert.equal(manifest.overrides[name], version);
            const copies = Object.entries(lock.packages).filter(([entryPath]) =>
                entryPath.endsWith(`node_modules/${name}`));
            assert.ok(copies.length > 0, 'the audited dependency must be present');
            for (const [entryPath, entry] of copies) {
                assert.equal(entry.version, version, `${directory}/${entryPath}`);
                assert.equal(entry.dev, true, 'no new runtime dependency');
            }
        }
    });
}
