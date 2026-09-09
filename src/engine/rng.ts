import { tr } from '@/i18n';
/** Small deterministic PRNG (mulberry32). */
export interface Rng {
  /** [0, 1) */
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(arr: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    pick: (arr) => {
      if (arr.length === 0) throw new Error(tr('pick from empty array'));
      return arr[Math.floor(next() * arr.length)] as never;
    },
  };
}

/** Seed derivation per policy: fixed=42, daily=YYYYMMDD, random=entropy. */
export function resolveSeed(policy: 'fixed' | 'daily' | 'random', now = new Date()): number {
  if (policy === 'fixed') return 42;
  if (policy === 'daily') {
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }
  return Math.floor(Math.random() * 2 ** 31);
}
