/** Preserve dependency licenses in browser and desktop distributions. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const lock = JSON.parse(read('package-lock.json'));
const shipped = new Set();
function includeDependency(path) {
  if (shipped.has(path)) return;
  shipped.add(path);
  for (const name of Object.keys(lock.packages[path].dependencies ?? {})) {
    let parent = path;
    let dependency;
    while (parent) {
      const candidate = `${parent}/node_modules/${name}`;
      if (lock.packages[candidate]) {
        dependency = candidate;
        break;
      }
      const index = parent.lastIndexOf('/node_modules/');
      parent = index < 0 ? '' : parent.slice(0, index);
    }
    dependency ??= `node_modules/${name}`;
    if (!lock.packages[dependency]) throw new Error(`Cannot resolve ${name} for ${path}`);
    includeDependency(dependency);
  }
}
for (const [path, entry] of Object.entries(lock.packages)) {
  if (path && !entry.dev) shipped.add(path);
  // Workbox runtime modules and their dependencies (including idb) ship in the service worker.
  if (/^node_modules\/workbox-[^/]+$/.test(path) && path !== 'node_modules/workbox-build') {
    includeDependency(path);
  }
}
const mitTerms = read('LICENSE').slice(read('LICENSE').indexOf('Permission is hereby granted'));
const sections = [
  ['Open Piano Training / Keysense', read('LICENSE')],
  [
    'Splendid Grand Piano samples',
    'Public domain, according to the upstream distributors. Samples by AKAI.\n' +
      'Sample fixes and SFZ mapping by kinwie. Web audio conversion by smpldsnds.\n' +
      'Users download the Ogg files directly from the provider. Keysense packages contain no piano samples.\n' +
      'https://github.com/sfzinstruments/SplendidGrandPiano\n' +
      'https://github.com/smpldsnds/sfzinstruments-splendid-grand-piano\n' +
      'These samples are separate from the MIT-licensed smplr playback code.',
  ],
];

for (const [path, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!shipped.has(path)) continue;
  const pkg = JSON.parse(read(`${path}/package.json`));
  if (pkg.version !== entry.version) throw new Error(`Run npm ci: ${path} differs from the lockfile`);
  const title = `${pkg.name} ${pkg.version} (${entry.license})`;
  const files = readdirSync(join(root, path)).filter((name) =>
    /^(licen[sc]e|copying|notice|ofl)(?:[.\-_]|$)/i.test(name),
  );
  if (files.length) {
    for (const file of files.sort()) sections.push([`${title} / ${file}`, read(`${path}/${file}`)]);
  } else if (['@tonaljs/progression', '@tonaljs/rhythm-pattern'].includes(pkg.name)) {
    sections.push([title, 'Tonal monorepo license:\n' + read('node_modules/tonal/LICENSE')]);
  } else if (['smplr', 'jazz-midi'].includes(pkg.name) && entry.license === 'MIT') {
    // These packages declare MIT but omit a standalone license/copyright notice.
    // Preserve their attribution and provide the standard terms without inventing a copyright date.
    sections.push([
      title,
      `Author: ${pkg.author}\nSource: ${pkg.repository.url}\n` +
        'License declared in the distributed package.json: MIT.\n' +
        'Upstream supplies no standalone license file. Standard MIT permission and disclaimer follow.\n\n' +
        mitTerms,
    ]);
  } else {
    throw new Error(`Missing license text for ${title}. Review it before distributing the app.`);
  }
}

// VexFlow embeds font data. Its MIT code license does not replace these licenses.
for (const file of readdirSync(join(root, 'third-party')).filter((name) => name.endsWith('-LICENSE.txt'))) {
  sections.push([`VexFlow embedded font: ${file}`, read(`third-party/${file}`)]);
}
sections.push(['Electron desktop shell', read('node_modules/electron/LICENSE')]);
sections.push([
  'Chromium and other Electron components',
  'Desktop packages also include LICENSES.chromium.html beside the executable. Preserve that file when redistributing Electron.',
]);

const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Keysense licenses and notices</title>
<style>body{max-width:72rem;margin:2rem auto;padding:0 1rem;font:16px/1.5 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere}h2{margin-top:2rem}</style>
<body><a href="/licenses">Back to credits / Retour aux crédits</a>
<h1>Licenses and notices / Licences et mentions</h1>
<p>Third-party components retain their own licenses. Legal texts appear as supplied by their authors.</p>
${sections.map(([title, text]) => `<section><h2>${escape(title)}</h2><pre>${escape(text)}</pre></section>`).join('\n')}
</body></html>
`;
writeFileSync(join(root, 'public/THIRD-PARTY-NOTICES.html'), html);
console.log(`Wrote ${sections.length} license and notice sections.`);
