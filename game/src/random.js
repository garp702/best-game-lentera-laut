// Acak ber-seed untuk Lentera Laut. Semua keberuntungan di dunia permainan
// mengalir dari satu generator mulberry32, jadi seed yang sama selalu
// memainkan pelayaran yang sama — dasar staging screenshot dan uji tuning
// yang bisa diulang persis.
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Angka acak dalam [min, max) dari generator yang diberikan.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Bilangan bulat acak dalam [min, max] (kedua ujung termasuk).
export function rangeInt(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
