/**
 * Downloads the SplendidGrandPiano sample set into `public/samples/` so the app
 * has sound with no network at all. The desktop build needs this: an installed
 * app must not depend on a GitHub Pages host being reachable.
 *
 *   node scripts/fetch-samples.mjs
 *
 * The sample list is read out of the installed `smplr` bundle, so it stays in
 * step with whatever version the app actually plays. Files already on disk are
 * kept, which makes a re-run cheap.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SMPLR = join(ROOT, 'node_modules', 'smplr', 'dist', 'index.js');
const OUT = join(ROOT, 'public', 'samples', 'splendid-grand-piano');
const FORMAT = 'ogg';
const CONCURRENCY = 8;

/**
 * Pulls the sample names out of the `LAYERS` table in the smplr bundle.
 * The table is plain data, so a bounded scan for `[<midi>, "<name>"]` pairs
 * reads it without running any of smplr's code.
 */
function sampleNames() {
  const src = readFileSync(SMPLR, 'utf8');
  const start = src.indexOf('var LAYERS = [');
  if (start < 0) throw new Error('smplr changed: no LAYERS table found');
  const end = src.indexOf('\n];', start);
  const table = src.slice(start, end);
  const names = new Set();
  for (const m of table.matchAll(/\[\s*\d+\s*,\s*"([^"]+)"\s*\]/g)) names.add(m[1]);
  if (names.size === 0) throw new Error('smplr changed: LAYERS table held no samples');
  return [...names];
}

function baseUrl() {
  const src = readFileSync(SMPLR, 'utf8');
  const m = src.match(/var BASE_URL = "([^"]+splendid-grand-piano[^"]*)"/);
  if (!m) throw new Error('smplr changed: no splendid grand piano base URL');
  return m[1];
}

async function exists(path) {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

/** smplr encodes `#` and spaces itself, so the fetch here must match it. */
function encode(name) {
  return name.replace(/#/g, '%23').replace(/ /g, '%20');
}

async function main() {
  const base = baseUrl();
  const names = sampleNames();
  await mkdir(OUT, { recursive: true });
  console.log(`${names.length} samples from ${base}`);

  let done = 0;
  let fetched = 0;
  const queue = [...names];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (let name = queue.pop(); name !== undefined; name = queue.pop()) {
      const file = join(OUT, `${name}.${FORMAT}`);
      if (!(await exists(file))) {
        const url = `${base}/${encode(name)}.${FORMAT}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} on ${url}`);
        await writeFile(file, Buffer.from(await res.arrayBuffer()));
        fetched++;
      }
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${names.length}`);
    }
  });
  await Promise.all(workers);
  console.log(`done: ${fetched} downloaded, ${names.length - fetched} already on disk`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
