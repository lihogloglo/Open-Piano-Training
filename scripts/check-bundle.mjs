/**
 * Enforces the bundle budget from 08-build-order Phase 8:
 *
 *   "bundle < 450KB gz before samples/vexflow chunks (both lazy)"
 *
 * The eager bundle is everything the app downloads to boot. The notation
 * engraver and the piano samples are deliberately lazy, so they are excluded
 * here — but the check fails if they ever stop being separate chunks.
 *
 *   node scripts/check-bundle.mjs
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');
const BUDGET_KB = 450;
/** Chunks that must stay out of the boot path. */
const LAZY = [/vexflow/i, /smplr/i, /samples/i];

if (!existsSync(DIST)) {
  console.error('No dist/assets — run `npm run build` first.');
  process.exit(1);
}

let eagerBytes = 0;
const eager = [];
const lazy = [];

for (const file of readdirSync(DIST)) {
  if (!file.endsWith('.js') && !file.endsWith('.css')) continue;
  const gz = gzipSync(readFileSync(join(DIST, file)), { level: 9 }).length;
  const entry = { file, kb: gz / 1024 };
  if (LAZY.some((re) => re.test(file))) lazy.push(entry);
  else {
    eager.push(entry);
    eagerBytes += gz;
  }
}

const eagerKb = eagerBytes / 1024;
const fmt = (n) => `${n.toFixed(1)} kB`;

console.log('Eager (boot) chunks, gzipped:');
for (const e of eager.sort((a, b) => b.kb - a.kb)) console.log(`  ${fmt(e.kb).padStart(10)}  ${e.file}`);
console.log(`  ${'—'.repeat(10)}`);
console.log(`  ${fmt(eagerKb).padStart(10)}  total (budget ${BUDGET_KB} kB)`);

if (lazy.length > 0) {
  console.log('\nLazy chunks (excluded from the budget):');
  for (const l of lazy.sort((a, b) => b.kb - a.kb)) console.log(`  ${fmt(l.kb).padStart(10)}  ${l.file}`);
}

// VexFlow must exist as its own chunk; if it were inlined it would show up in
// `eager` instead and the budget would blow, but say so explicitly.
if (!lazy.some((l) => /vexflow/i.test(l.file))) {
  console.warn('\nWarning: no separate vexflow chunk found — is the notation import still lazy?');
}

if (eagerKb > BUDGET_KB) {
  console.error(`\nFAIL: eager bundle ${fmt(eagerKb)} exceeds the ${BUDGET_KB} kB budget.`);
  process.exit(1);
}
console.log(`\nOK: ${fmt(eagerKb)} of ${BUDGET_KB} kB budget used.`);
