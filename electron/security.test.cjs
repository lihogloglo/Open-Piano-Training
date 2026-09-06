const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { isAppUrl, resolveAsset } = require('./security.cjs');
test('only the exact application origin can navigate or request permissions', () => {
  assert.equal(isAppUrl('keysense://app/lesson/s0.u1'), true);
  for (const url of [
    'keysense://app.evil/',
    'keysense://app@evil/',
    'keysense://user@app/',
    'keysense://app:123/',
    'https://app/',
    'invalid',
  ])
    assert.equal(isAppUrl(url), false, url);
});
test('asset paths stay inside the distribution directory', () => {
  const root = path.resolve('dist');
  assert.equal(resolveAsset(root, 'keysense://app/assets/app.js'), path.join(root, 'assets', 'app.js'));
  assert.equal(resolveAsset(root, 'keysense://app/lesson/s0.u1'), path.join(root, 'index.html'));
  assert.equal(resolveAsset(root, 'keysense://app/practice'), path.join(root, 'index.html'));
  for (const url of [
    'keysense://app/%2e%2e%5cdist-other%5cprivate.txt',
    'keysense://app/%2e%2e%5cprivate.txt',
    'keysense://app/%ZZ',
  ])
    assert.equal(resolveAsset(root, url), null, url);
});
