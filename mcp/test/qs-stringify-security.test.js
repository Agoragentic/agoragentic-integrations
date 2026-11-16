'use strict';

const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const test = require('node:test');

// Exercise the copy actually resolved by Express, not a separately imported copy.
const expressRequire = createRequire(require.resolve('express/package.json'));
const qs = expressRequire('qs');

test('Express qs safely serializes adversarial comma arrays', () => {
    const input = JSON.parse('{"a":[{"toString":"x"}]}');
    for (const encodeValuesOnly of [false, true]) {
        const result = qs.stringify(input, { arrayFormat: 'comma', encodeValuesOnly });
        assert.equal(result, 'a=%5Bobject%20Object%5D');
    }
});

test('Express qs preserves normal comma-array serialization', () => {
    assert.equal(qs.stringify({ a: ['one', 'two'] }, { arrayFormat: 'comma' }), 'a=one%2Ctwo');
});
