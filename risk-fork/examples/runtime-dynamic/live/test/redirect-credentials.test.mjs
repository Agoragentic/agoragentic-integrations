// Synthetic loopback traffic only. No wallet SDK, credentials or provider action.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const local = createRequire(new URL('../package.json', import.meta.url));
const lock = local('./package-lock.json');

test('Dynamic SDK Axios resolution and every locked redirect copy use the patched package', () => {
  const dynamic = createRequire(local.resolve('@dynamic-labs-wallet/node-evm'));
  const axios = createRequire(dynamic.resolve('axios'));
  assert.equal(axios('axios/package.json').version, '1.20.0');
  assert.equal(axios('follow-redirects/package.json').version, '1.16.2');
  assert.equal(axios.resolve('follow-redirects'), local.resolve('follow-redirects'));
  const copies = Object.entries(lock.packages).filter(([name]) => name.endsWith('node_modules/follow-redirects'));
  assert.ok(copies.length > 0);
  for (const [name, metadata] of copies) assert.equal(metadata.version, '1.16.2', name);
});

test('cross-origin redirects strip cross-realm sensitive headers and preserve same-origin behavior', {timeout: 10000}, async () => {
  const follow = local('follow-redirects');
  const target = http.createServer((req, res) => { req.resume(); res.end(JSON.stringify(req.headers)); });
  let targetUrl;
  const source = http.createServer((req, res) => {
    req.resume();
    if (req.url === '/same-target') return res.end(JSON.stringify(req.headers));
    res.writeHead(302, {Location: req.url === '/same' ? '/same-target' : targetUrl}); res.end();
  });
  try {
    target.listen(0, '127.0.0.1'); await once(target, 'listening');
    targetUrl = `http://127.0.0.1:${target.address().port}/target`;
    source.listen(0, '127.0.0.1'); await once(source, 'listening');
    const request = (headers, sensitiveHeaders, same = false) => new Promise((resolve, reject) => {
      const req = follow.http.get({hostname: '127.0.0.1', port: source.address().port,
        path: same ? '/same' : '/cross', headers, sensitiveHeaders, maxRedirects: 2, timeout: 2000}, res => {
        let body = ''; res.setEncoding('utf8'); res.on('data', data => { body += data; });
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
        res.on('error', reject);
      });
      req.on('error', reject); req.on('timeout', () => req.destroy(Error('loopback fixture timeout')));
    });
    const headers = {Authorization: 'Bearer synthetic', Cookie: 'synthetic=1', 'Proxy-Authorization': 'synthetic',
      'X-API-Key': 'synthetic', 'X-Api^Key': 'synthetic', 'X-Token|Secret': 'synthetic',
      'X-Harmless': 'preserve', 'X-Token': 'preserve-token', Secret: 'preserve-secret'};
    const declared = ['X-API-Key', 'X-Api^Key', 'X-Token|Secret'];
    for (const asArray of [false, true]) for (const crossRealm of [false, true]) {
      const sensitive = crossRealm ? vm.runInNewContext(JSON.stringify(declared)) : [...declared];
      if (crossRealm) { assert.equal(Array.isArray(sensitive), true); assert.equal(sensitive instanceof Array, false); }
      const result = await request(asArray ? Object.entries(headers).flat() : {...headers}, sensitive);
      for (const name of ['authorization', 'cookie', 'proxy-authorization', ...declared.map(x => x.toLowerCase())])
        assert.equal(result[name], undefined, `${asArray}/${crossRealm}: ${name}`);
      assert.equal(result['x-harmless'], 'preserve');
      assert.equal(result['x-token'], 'preserve-token'); assert.equal(result.secret, 'preserve-secret');
      assert.equal(result.host, `127.0.0.1:${target.address().port}`);
    }
    const same = await request({...headers}, vm.runInNewContext(JSON.stringify(declared)), true);
    assert.equal(same.authorization, 'Bearer synthetic'); assert.equal(same['x-api-key'], 'synthetic');
  } finally {
    for (const server of [source, target]) server.closeAllConnections();
    await Promise.all([source, target].map(server => new Promise(resolve => server.close(resolve))));
  }
});
