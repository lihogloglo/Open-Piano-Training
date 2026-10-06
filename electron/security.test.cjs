const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { isAppUrl, resolveAsset } = require('./security.cjs');
test('only the exact application origin can navigate or request permissions', () => {
  assert.equal(isAppUrl('open-piano-training://app/lesson/s0.u1'), true);
  for (const url of [
    'open-piano-training://app.evil/',
    'open-piano-training://app@evil/',
    'open-piano-training://user@app/',
    'open-piano-training://app:123/',
    'https://app/',
    'invalid',
  ])
    assert.equal(isAppUrl(url), false, url);
});
test('asset paths stay inside the distribution directory', () => {
  const root = path.resolve('dist');
  assert.equal(resolveAsset(root, 'open-piano-training://app/assets/app.js'), path.join(root, 'assets', 'app.js'));
  assert.equal(resolveAsset(root, 'open-piano-training://app/lesson/s0.u1'), path.join(root, 'index.html'));
  assert.equal(resolveAsset(root, 'open-piano-training://app/practice'), path.join(root, 'index.html'));
  for (const url of [
    'open-piano-training://app/%2e%2e%5cdist-other%5cprivate.txt',
    'open-piano-training://app/%2e%2e%5cprivate.txt',
    'open-piano-training://app/%ZZ',
  ])
    assert.equal(resolveAsset(root, url), null, url);
});
