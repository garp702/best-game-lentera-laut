// Lentera Laut S2 — seluruh angka tuning dan palet warna dikumpulkan di
// sini: kecepatan arus, jadwal spawn bahaya per level, nilai mutiara raja.
// S2 mengencangkan kurva kesulitan S1: karang lebih rapat sejak level 2,
// pusaran hadir dari level 1, dan celah aman menyempit pelan-pelan — tapi
// selalu ada. Logika permainan tidak memuat angka liar; semuanya dari sini.
export const FIELD = { width: 1280, height: 720 };

export const VOYAGE_METERS = 1200;
export const LEVEL_EVERY_METERS = 300;
export const MAX_LEVEL = 4;

export const BOAT = {
  radius: 20,
  speed: 380,
  minX: 50,
  maxX: 1230,
  minY: 400,
  maxY: 660,
  dashMultiplier: 2.2,
  dashSeconds: 0.35,
  dashCooldownSeconds: 2.0,
  invulnerableSeconds: 1.2,
};

export const LIVES_START = 3;
export const PEARL_POINTS = 10;
export const COMBO_WINDOW_SECONDS = 2.5;
export const COMBO_PER_STEP = 3;
export const COMBO_MAX_MULTIPLIER = 5;
export const WIN_BONUS_POINTS = 500;
export const DISTANCE_POINTS_EVERY_METERS = 10;

// Mutiara raja: mutiara besar langka yang selalu muncul menempel pada
// bahaya (di tepi pusaran atau di mulut celah karang). Nilainya sepuluh
// kali mutiara biasa sebelum pengali kombo — risiko dan hadiah seimbang.
export const GRAND_PEARL = {
  points: 100,
  radius: 19,
  firstSeconds: 13,
  everyMinSeconds: 15,
  everyMaxSeconds: 22,
  whirlpoolOffsetPixels: 62,
};

export const SCROLL = {
  baseSpeed: 138,
  perLevel: 24,
  maxSpeed: 336,
  metersPerPixel: 0.12,
};

export const SPAWN = {
  pearlEverySeconds: 0.55,
  rockEverySeconds: 0.92,
  rockEveryMinSeconds: 0.52,
  rockDropPerLevel: 0.14,
  // Celah kosong yang dijamin pada tiap baris karang; menyempit 12 piksel
  // per level (185 → 149) sehingga akhir pelayaran terasa menekan, tapi
  // tidak pernah tertutup.
  minGapPixels: 185,
  gapShrinkPerLevel: 12,
  // Pusaran muncul sejak level 1; jeda antar-pusaran memendek per level.
  whirlpoolFirstSeconds: 9,
  whirlpoolSecondsByLevel: [12, 8.5, 7, 5.5],
};

// Jumlah karang per baris untuk level 1..4: [min, max].
export const ROCK_COUNT_BY_LEVEL = [
  { min: 1, max: 2 },
  { min: 2, max: 2 },
  { min: 2, max: 3 },
  { min: 3, max: 3 },
];

// Satu palet per level: laut menggelap lalu menyongsong fajar di akhir.
export const PALETTES = [
  { skyTop: '#0b1030', skyBottom: '#123a5c', seaTop: '#0e2a4a', seaBottom: '#071527', moon: '#ffe9a8', accent: '#ffd166' },
  { skyTop: '#0a1233', skyBottom: '#0f4a5e', seaTop: '#0d3348', seaBottom: '#061524', moon: '#ffe9a8', accent: '#7fe3c0' },
  { skyTop: '#120b33', skyBottom: '#1d3a6e', seaTop: '#10294e', seaBottom: '#070f24', moon: '#ffdf9e', accent: '#c792ff' },
  { skyTop: '#2b1440', skyBottom: '#7a4a5e', seaTop: '#1d2f55', seaBottom: '#0a1226', moon: '#ffd9b0', accent: '#ffb36b' },
];

export const STEP = 1 / 60;
