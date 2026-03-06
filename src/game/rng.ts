export interface RngResult<T> {
  value: T;
  state: number;
}

export function seedFromString(str: string): number {
  // FNV-1a 32-bit hash
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function nextFloat(state: number): RngResult<number> {
  // xorshift32
  let x = state >>> 0;
  if (x === 0) x = 0x6d2b79f5; // avoid stuck zero state
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const nextState = x >>> 0;
  return { value: nextState / 0x100000000, state: nextState };
}

export function nextInt(state: number, maxExclusive: number): RngResult<number> {
  if (maxExclusive <= 0) return { value: 0, state };
  const n = nextFloat(state);
  return { value: Math.floor(n.value * maxExclusive), state: n.state };
}

export function nextBool(state: number, chance = 0.5): RngResult<boolean> {
  const n = nextFloat(state);
  return { value: n.value < chance, state: n.state };
}

export function pickOne<T>(state: number, list: T[]): RngResult<T> {
  if (list.length === 0) throw new Error('pickOne called with empty list');
  const n = nextInt(state, list.length);
  return { value: list[n.value], state: n.state };
}

export function shuffleWithRng<T>(state: number, list: T[]): RngResult<T[]> {
  const out = [...list];
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(s, i + 1);
    s = j.state;
    [out[i], out[j.value]] = [out[j.value], out[i]];
  }
  return { value: out, state: s };
}

export function weightedPick<T>(state: number, entries: { key: T; weight: number }[]): RngResult<T> {
  const valid = entries.filter(e => e.weight > 0);
  if (valid.length === 0) throw new Error('weightedPick called with no positive weights');
  const total = valid.reduce((sum, e) => sum + e.weight, 0);
  const n = nextFloat(state);
  let r = n.value * total;
  for (const entry of valid) {
    r -= entry.weight;
    if (r <= 0) return { value: entry.key, state: n.state };
  }
  return { value: valid[0].key, state: n.state };
}

let seedCounter = 0;

export function makeRandomSeed(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const now = Date.now();
  const extra = (typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) : 0) + (seedCounter++);
  let s = seedFromString(`${now}-${extra}`);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    const n = nextInt(s, alphabet.length);
    s = n.state;
    suffix += alphabet[n.value];
  }
  return `${now.toString(36).toUpperCase()}-${suffix}`;
}

export function dailySeed(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
