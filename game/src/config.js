// Lentera Laut — semua angka penyeimbang dan palet dalam satu tempat, supaya
// tuning (kecepatan arus, jarak pelayaran, nyawa) tidak tersebar di logika.
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

export const SCROLL = {
  baseSpeed: 130,
  perLevel: 22,
  maxSpeed: 320,
  metersPerPixel: 0.12,
};

export const SPAWN = {
  pearlEverySeconds: 0.55,
  rockEverySeconds: 1.05,
  rockEveryMinSeconds: 0.6,
  whirlpoolEverySeconds: 7,
  whirlpoolFromLevel: 2,
  minGapPixels: 170,
};

// Satu palet per level: laut makin gelap lalu fajar di level akhir.
export const PALETTES = [
  { skyTop: '#0b1030', skyBottom: '#123a5c', seaTop: '#0e2a4a', seaBottom: '#071527', moon: '#ffe9a8', accent: '#ffd166' },
  { skyTop: '#0a1233', skyBottom: '#0f4a5e', seaTop: '#0d3348', seaBottom: '#061524', moon: '#ffe9a8', accent: '#7fe3c0' },
  { skyTop: '#120b33', skyBottom: '#1d3a6e', seaTop: '#10294e', seaBottom: '#070f24', moon: '#ffdf9e', accent: '#c792ff' },
  { skyTop: '#2b1440', skyBottom: '#7a4a5e', seaTop: '#1d2f55', seaBottom: '#0a1226', moon: '#ffd9b0', accent: '#ffb36b' },
];

export const STEP = 1 / 60;
