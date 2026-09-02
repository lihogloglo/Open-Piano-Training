/**
 * WCAG AA contrast gate for the design tokens (08 accept: axe-core scan, no
 * serious violations). The browser scan catches this too, but only for pages a
 * test happens to visit — checking the palette at source catches it everywhere
 * in milliseconds.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles', 'tokens.css'),
  'utf8',
);

function block(selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`No such block: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const out = {};
  for (const line of css.slice(open + 1, close).split('\n')) {
    const m = /^\s*(--[\w-]+):\s*([^;]+);/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const light = block(':root');
const dark = { ...light, ...block("[data-theme='dark']") };

const channel = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Body-text tokens must clear 4.5:1 on every surface they sit on. */
const TEXT_ON_SURFACES = [
  ['--text', ['--bg', '--surface', '--surface-2']],
  ['--text-2', ['--bg', '--surface', '--surface-2']],
  ['--text-3', ['--bg', '--surface', '--surface-2']],
  // The accent is used for links and eyebrow labels, i.e. as text.
  ['--accent-text', ['--bg', '--surface', '--surface-2']],
];

/** Large/bold feedback colours only need the 3:1 large-text bar. */
const LARGE_TEXT = ['--ok', '--err', '--warn', '--judge-perfect', '--judge-wrong'];

const failures = [];
const checks = [];

for (const [name, tokens] of [
  ['light', light],
  ['dark', dark],
]) {
  const check = (fg, bg, min, label) => {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!a || !b) {
      failures.push(`${name}: missing token ${!a ? fg : bg}`);
      return;
    }
    const ratio = contrast(a, b);
    checks.push(`${name.padEnd(5)} ${label.padEnd(34)} ${ratio.toFixed(2).padStart(6)} (min ${min})`);
    if (ratio < min) {
      failures.push(`${name}: ${fg} (${a}) on ${bg} (${b}) = ${ratio.toFixed(2)}, need ${min}`);
    }
  };

  for (const [text, surfaces] of TEXT_ON_SURFACES) {
    for (const surface of surfaces) check(text, surface, 4.5, `${text} on ${surface}`);
  }
  check('--accent-contrast', '--accent', 4.5, 'button label on accent');
  for (const token of LARGE_TEXT) check(token, '--surface', 3, `${token} on --surface`);
}

for (const line of checks) console.log(line);

if (failures.length > 0) {
  console.error('\nFAIL: contrast below WCAG AA');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`\nOK: ${checks.length} contrast pairs pass WCAG AA.`);
