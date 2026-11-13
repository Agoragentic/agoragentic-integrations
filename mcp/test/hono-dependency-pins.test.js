'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// GHSA-rmxm-3fg6-px4f affects @hono/node-server >=1.19.10 <2.1.3.
// Check every lock entry, not only the top-level copy. These are development
// dependencies; this does not qualify a hosted server or enable the relay.
for (const directory of ['mcp', 'claude-agent-sdk']) {
    test(`${directory} pins the reviewed patched Hono Node server`, () => {
        const load = name => JSON.parse(readFileSync(
            path.resolve(__dirname, '..', '..', directory, name), 'utf8',
        ));
        const manifest = load('package.json');
        const lock = load('package-lock.json');
        assert.equal(manifest.private, true);
        assert.equal(manifest.overrides['@hono/node-server'], '2.1.8');
        const copies = Object.entries(lock.packages).filter(([entryPath]) =>
            entryPath.endsWith('node_modules/@hono/node-server'));
        assert.ok(copies.length > 0, 'the audited dependency must be present');
        for (const [entryPath, entry] of copies) {
            assert.equal(entry.version, '2.1.8', `${directory}/${entryPath}`);
            assert.equal(entry.dev, true, 'no new runtime dependency');
        }
    });
}
