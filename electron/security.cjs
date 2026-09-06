const path = require('node:path');

function isAppUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'keysense:' && url.hostname === 'app' && !url.port && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

function resolveAsset(dist, value) {
  if (!isAppUrl(value)) return null;
  try {
    const pathname = decodeURIComponent(new URL(value).pathname);
    const file = path.resolve(dist, pathname.replace(/^[\\/]+/, ''));
    const relative = path.relative(dist, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
    const route = pathname.split('/').filter(Boolean)[0];
    if (['lesson', 'drill', 'rating', 'studio', 'songs'].includes(route))
      return path.join(dist, 'index.html');
    return path.extname(file) ? file : path.join(dist, 'index.html');
  } catch {
    return null;
  }
}
module.exports = { isAppUrl, resolveAsset };
