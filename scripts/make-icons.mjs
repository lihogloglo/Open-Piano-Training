/**
 * Rasterizes the Keysense mark (public/favicon.svg) into the PWA icon PNGs.
 * Hand-rolled so icon generation needs no image toolchain: the mark is only
 * rounded rectangles, so a scanline fill plus zlib is the whole renderer.
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** The mark, in the favicon's 32x32 coordinate space. */
const BG = [0x0f, 0x11, 0x15];
const RECTS = [
  { x: 6, y: 8, w: 4.4, h: 16, r: 1, fill: [0xfa, 0xfa, 0xf8] },
  { x: 11.4, y: 8, w: 4.4, h: 16, r: 1, fill: [0xfa, 0xfa, 0xf8] },
  { x: 16.8, y: 8, w: 4.4, h: 16, r: 1, fill: [0xfa, 0xfa, 0xf8] },
  { x: 22.2, y: 8, w: 4.4, h: 16, r: 1, fill: [0x3e, 0x63, 0xdd] },
  { x: 9, y: 8, w: 3.2, h: 9.5, r: 1, fill: [0x17, 0x18, 0x1b] },
  { x: 14.4, y: 8, w: 3.2, h: 9.5, r: 1, fill: [0x17, 0x18, 0x1b] },
  { x: 19.8, y: 8, w: 3.2, h: 9.5, r: 1, fill: [0x17, 0x18, 0x1b] },
];

/** Coverage of a rounded rect at a point, sampled 3x3 for cheap antialiasing. */
function coverage(px, py, s, { x, y, w, h, r }) {
  let hits = 0;
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const u = (px + (sx + 0.5) / 3) / s;
      const v = (py + (sy + 0.5) / 3) / s;
      if (u < x || u > x + w || v < y || v > y + h) continue;
      // Corner rounding: reject points outside the corner radius.
      const cx = Math.min(Math.max(u, x + r), x + w - r);
      const cy = Math.min(Math.max(v, y + r), y + h - r);
      if ((u - cx) ** 2 + (v - cy) ** 2 <= r * r) hits++;
    }
  }
  return hits / 9;
}

function render(size, { maskable = false } = {}) {
  const s = size / 32;
  // Maskable icons must survive a circular crop: shrink the mark into the
  // safe zone (inner 80%) and let the background bleed to the edges.
  const inset = maskable ? size * 0.1 : 0;
  const scale = maskable ? 0.8 : 1;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let [r, g, b] = BG;
      // Outer rounded corner (non-maskable only; maskable stays a full square).
      let alpha = 255;
      if (!maskable) {
        const cov = coverage(px, py, s, { x: 0, y: 0, w: 32, h: 32, r: 7 });
        alpha = Math.round(cov * 255);
      }
      for (const rect of RECTS) {
        const scaled = {
          x: rect.x * scale + inset / s,
          y: rect.y * scale + inset / s,
          w: rect.w * scale,
          h: rect.h * scale,
          r: rect.r * scale,
        };
        const cov = coverage(px, py, s, scaled);
        if (cov > 0) {
          r = Math.round(r * (1 - cov) + rect.fill[0] * cov);
          g = Math.round(g * (1 - cov) + rect.fill[1] * cov);
          b = Math.round(b * (1 - cov) + rect.fill[2] * cov);
        }
      }
      const i = (py * size + px) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = alpha;
    }
  }
  return rgba;
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  // Each scanline is prefixed with filter type 0 (none).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size, opts] of [
  ['pwa-192.png', 192, {}],
  ['pwa-512.png', 512, {}],
  ['pwa-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
]) {
  const file = join(OUT, name);
  writeFileSync(file, png(size, render(size, opts)));
  console.log('wrote', file);
}
