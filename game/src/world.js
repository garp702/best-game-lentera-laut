// Dunia Lentera Laut S2: satu-satunya tempat state pelayaran hidup —
// kapal, mutiara, mutiara raja, karang, pusaran, skor, nyawa, jarak.
// Simulasi maju dalam langkah tetap dan hanya membaca RNG ber-seed, jadi
// (seed, rangkaian input) yang sama selalu menghasilkan pelayaran yang
// sama. S2 mengubah dua hal dari S1: jadwal bahaya lebih rapat (karang
// bertambah per level, pusaran sejak level 1, celah aman menyempit) dan
// ada mutiara raja — mutiara besar bernilai 100 yang selalu lahir
// menempel pada pusaran, memaksa pemain memilih: ambil atau lewati.
import {
  BOAT, COMBO_MAX_MULTIPLIER, COMBO_PER_STEP, COMBO_WINDOW_SECONDS,
  DISTANCE_POINTS_EVERY_METERS, FIELD, GRAND_PEARL, LEVEL_EVERY_METERS,
  LIVES_START, MAX_LEVEL, PEARL_POINTS, ROCK_COUNT_BY_LEVEL, SCROLL, SPAWN,
  STEP, VOYAGE_METERS, WIN_BONUS_POINTS,
} from './config.js';
import { clamp, mulberry32, range, rangeInt } from './random.js';

export const EVENT_PEARL = 1;
export const EVENT_HIT = 2;
export const EVENT_LEVEL = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_DASH = 32;
export const EVENT_GRAND = 64;

export class World {
  constructor(seed) {
    this.reset(seed);
  }

  reset(seed) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.time = 0;
    this.distance = 0;
    this.distanceScore = 0;
    this.score = 0;
    this.pearlsCollected = 0;
    this.grandCollected = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplier = 1;
    this.level = 1;
    this.lives = LIVES_START;
    this.won = false;
    this.over = false;
    this.demo = false;
    this.shake = 0;
    this.pearlTimer = 0.4;
    this.rockTimer = 1.2;
    this.whirlpoolTimer = SPAWN.whirlpoolFirstSeconds;
    this.grandTimer = GRAND_PEARL.firstSeconds;
    this.boat = {
      x: FIELD.width / 2,
      y: FIELD.height - 110,
      dashTimer: 0,
      dashCooldown: 0,
      invulnerable: 0,
      tilt: 0,
    };
    this.pearls = [];
    this.grandPearls = [];
    this.rocks = [];
    this.whirlpools = [];
    this.particles = [];
    this.stars = [];
    for (let i = 0; i < 90; i += 1) {
      this.stars.push({
        x: this.rng() * FIELD.width,
        y: this.rng() * FIELD.height * 0.55,
        size: range(this.rng, 0.8, 2.4),
        twinkle: range(this.rng, 0.5, 2.5),
        phase: range(this.rng, 0, Math.PI * 2),
      });
    }
    this.wavePhase = 0;
  }

  scrollSpeed() {
    return Math.min(SCROLL.maxSpeed, SCROLL.baseSpeed + (this.level - 1) * SCROLL.perLevel);
  }

  gapPixels() {
    return SPAWN.minGapPixels - (this.level - 1) * SPAWN.gapShrinkPerLevel;
  }

  spawnPearlPattern() {
    const kind = this.rng();
    const cx = range(this.rng, 90, FIELD.width - 90);
    if (kind < 0.45) {
      // Busur lima mutiara: pola paling ramah, enak dibaca dari jauh.
      for (let i = 0; i < 5; i += 1) {
        const t = i / 4;
        this.pearls.push({
          x: cx + (t - 0.5) * 220,
          y: -30 - Math.sin(t * Math.PI) * 70,
          r: 12,
          phase: this.rng() * Math.PI * 2,
          taken: false,
        });
      }
    } else if (kind < 0.8) {
      // Kolom empat mutiara: menghargai gerak lurus yang berani.
      const x = clamp(cx, 70, FIELD.width - 70);
      for (let i = 0; i < 4; i += 1) {
        this.pearls.push({ x, y: -30 - i * 46, r: 12, phase: this.rng() * Math.PI * 2, taken: false });
      }
    } else {
      // Pasangan menyilang: dua mutiara, satu keputusan kecil.
      this.pearls.push({ x: cx - 40, y: -30, r: 12, phase: 0, taken: false });
      this.pearls.push({ x: cx + 40, y: -76, r: 12, phase: 1, taken: false });
    }
  }

  spawnRockRow() {
    // Keadilan dijaga oleh konstruksi: setiap baris selalu menyisakan
    // satu koridor kosong selebar gapPixels() yang bisa dilewati kapal.
    const gap = this.gapPixels();
    const gapCenter = range(this.rng, 140, FIELD.width - 140);
    const band = ROCK_COUNT_BY_LEVEL[this.level - 1];
    const count = rangeInt(this.rng, band.min, band.max);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 16) {
      guard += 1;
      const x = range(this.rng, 60, FIELD.width - 60);
      if (Math.abs(x - gapCenter) < gap / 2 + 30) continue;
      const r = range(this.rng, 22, 38);
      this.rocks.push({ x, y: -50 - this.rng() * 60, r, rot: this.rng() * Math.PI * 2, spin: range(this.rng, -0.4, 0.4) });
      placed += 1;
    }
  }

  spawnWhirlpool() {
    this.whirlpools.push({
      x: range(this.rng, 120, FIELD.width - 120),
      y: -70,
      r: range(this.rng, 34, 46),
      age: 0,
    });
  }

  // Mutiara raja lahir menempel pada pusaran yang sedang aktif bila ada:
  // tepat di luar jari-jari tarik kuatnya, sedikit di atas pusat pusaran
  // supaya keduanya berjalan beriringan sebentar. Tanpa pusaran aktif,
  // ia muncul sendirian dari atas layar — tetap langka, tetap berharga.
  spawnGrandPearl() {
    let x;
    let y;
    const host = this.whirlpools.find((w) => w.y > -60 && w.y < FIELD.height - 160);
    if (host) {
      const side = this.rng() < 0.5 ? -1 : 1;
      x = clamp(host.x + side * (host.r + GRAND_PEARL.whirlpoolOffsetPixels), 70, FIELD.width - 70);
      y = host.y - 26;
    } else {
      x = range(this.rng, 110, FIELD.width - 110);
      y = -46;
    }
    this.grandPearls.push({ x, y, r: GRAND_PEARL.radius, phase: this.rng() * Math.PI * 2, taken: false });
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng() * Math.PI * 2;
      const v = range(this.rng, speed * 0.3, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 40,
        life: range(this.rng, 0.4, 0.9),
        maxLife: 0.9,
        color,
        size: range(this.rng, 2, 5),
      });
    }
  }

  // Satu pengambilan mutiara (biasa atau raja): kombo naik satu langkah,
  // jendela kombo disegarkan, poin dikali pengali kombo saat ini.
  collectPearl(points, x, y, sound, isGrand) {
    this.pearlsCollected += 1;
    this.combo += 1;
    this.comboTimer = COMBO_WINDOW_SECONDS;
    this.multiplier = Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor(this.combo / COMBO_PER_STEP) * 0.5);
    this.score += Math.round(points * this.multiplier);
    if (isGrand) {
      this.grandCollected += 1;
      if (sound) sound.grand();
      this.burst(x, y, '#ffb36b', 24, 260);
    } else {
      if (sound) sound.pearl(this.combo);
      this.burst(x, y, '#ffd166', 10, 160);
    }
  }

  // Satu langkah simulasi. `move` = {x, y} keyboard (-1..1) atau null bila
  // mouse mengemudi; `mouse` = {x, y, down}; `dash` = tepi tekan spasi;
  // `sound` boleh null (staging/uji). Mengembalikan bitmask EVENT_*.
  step(dt, move, mouse, dash, sound) {
    if (this.won || this.over) return 0;
    let events = 0;
    this.time += dt;
    this.wavePhase += dt;
    const speed = this.scrollSpeed();

    // --- kapal: dash, kemudi, tarikan pusaran ---
    const boat = this.boat;
    boat.invulnerable = Math.max(0, boat.invulnerable - dt);
    boat.dashCooldown = Math.max(0, boat.dashCooldown - dt);
    if (dash && boat.dashCooldown <= 0 && boat.dashTimer <= 0) {
      boat.dashTimer = BOAT.dashSeconds;
      boat.dashCooldown = BOAT.dashCooldownSeconds;
      events |= EVENT_DASH;
      if (sound) sound.dash();
    }
    const dashing = boat.dashTimer > 0;
    if (dashing) boat.dashTimer -= dt;
    const thrust = BOAT.speed * (dashing ? BOAT.dashMultiplier : 1);
    let vx = 0;
    let vy = 0;
    if (move && (move.x !== 0 || move.y !== 0)) {
      vx = move.x * thrust;
      vy = move.y * thrust;
    } else if (mouse && mouse.down) {
      const dx = mouse.x - boat.x;
      const dy = mouse.y - boat.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 12) {
        vx = (dx / dist) * Math.min(thrust, dist * 6);
        vy = (dy / dist) * Math.min(thrust, dist * 6);
      }
    }
    // Pusaran menarik kapal ke pusatnya; makin dekat, makin kuat.
    for (const w of this.whirlpools) {
      const dx = w.x - boat.x;
      const dy = w.y - boat.y;
      const dist = Math.hypot(dx, dy);
      const pullRadius = w.r * 2.4;
      if (dist > 1 && dist < pullRadius) {
        const strength = 320 * (1 - dist / pullRadius) + 40;
        vx += (dx / dist) * strength;
        vy += (dy / dist) * strength;
      }
    }
    boat.x = clamp(boat.x + vx * dt, BOAT.minX, BOAT.maxX);
    boat.y = clamp(boat.y + vy * dt, BOAT.minY, BOAT.maxY);
    boat.tilt = clamp(vx / thrust, -1, 1) * 0.18;

    // --- jarak, skor jarak, level, kemenangan ---
    const gained = speed * dt * SCROLL.metersPerPixel;
    this.distance += gained;
    const newDistanceScore = Math.floor(this.distance / DISTANCE_POINTS_EVERY_METERS);
    if (newDistanceScore > this.distanceScore) {
      this.score += newDistanceScore - this.distanceScore;
      this.distanceScore = newDistanceScore;
    }
    const newLevel = Math.min(MAX_LEVEL, Math.floor(this.distance / LEVEL_EVERY_METERS) + 1);
    if (newLevel > this.level) {
      this.level = newLevel;
      events |= EVENT_LEVEL;
      if (sound) sound.levelUp();
    }
    if (this.distance >= VOYAGE_METERS && !this.demo) {
      this.won = true;
      this.score += WIN_BONUS_POINTS;
      events |= EVENT_WIN;
      if (sound) sound.win();
      for (let i = 0; i < 60; i += 1) {
        this.burst(boat.x + range(this.rng, -120, 120), boat.y + range(this.rng, -80, 40),
          ['#ffd166', '#7fe3c0', '#ff8fa3', '#c792ff'][i % 4], 1, 260);
      }
      return events;
    }

    // --- kombo meluruh ---
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
      }
    }

    // --- jadwal spawn ---
    this.pearlTimer -= dt;
    if (this.pearlTimer <= 0) {
      this.spawnPearlPattern();
      this.pearlTimer = SPAWN.pearlEverySeconds * range(this.rng, 0.85, 1.2);
    }
    this.rockTimer -= dt;
    if (this.rockTimer <= 0) {
      this.spawnRockRow();
      const base = Math.max(SPAWN.rockEveryMinSeconds, SPAWN.rockEverySeconds - (this.level - 1) * SPAWN.rockDropPerLevel);
      this.rockTimer = base * range(this.rng, 0.85, 1.2);
    }
    this.whirlpoolTimer -= dt;
    if (this.whirlpoolTimer <= 0) {
      this.spawnWhirlpool();
      const base = SPAWN.whirlpoolSecondsByLevel[this.level - 1];
      this.whirlpoolTimer = base * range(this.rng, 0.85, 1.25);
    }
    this.grandTimer -= dt;
    if (this.grandTimer <= 0) {
      this.spawnGrandPearl();
      this.grandTimer = range(this.rng, GRAND_PEARL.everyMinSeconds, GRAND_PEARL.everyMaxSeconds);
    }

    // --- semua entitas hanyut ke bawah mengikuti arus ---
    for (const p of this.pearls) {
      p.y += speed * dt;
      p.phase += dt * 3;
    }
    for (const g of this.grandPearls) {
      g.y += speed * dt;
      g.phase += dt * 3;
    }
    for (const r of this.rocks) {
      r.y += speed * dt;
      r.rot += r.spin * dt;
    }
    for (const w of this.whirlpools) {
      w.y += speed * 0.9 * dt;
      w.age += dt;
    }
    this.pearls = this.pearls.filter((p) => p.y < FIELD.height + 60 && !p.taken);
    this.grandPearls = this.grandPearls.filter((g) => g.y < FIELD.height + 60 && !g.taken);
    this.rocks = this.rocks.filter((r) => r.y < FIELD.height + 90);
    this.whirlpools = this.whirlpools.filter((w) => w.y < FIELD.height + 120);

    // --- pengambilan mutiara & mutiara raja ---
    for (const p of this.pearls) {
      const dx = p.x - boat.x;
      const dy = p.y - boat.y;
      const rr = BOAT.radius + p.r + 6;
      if (dx * dx + dy * dy < rr * rr) {
        p.taken = true;
        this.collectPearl(PEARL_POINTS, p.x, p.y, sound, false);
        events |= EVENT_PEARL;
      }
    }
    this.pearls = this.pearls.filter((p) => !p.taken);
    for (const g of this.grandPearls) {
      const dx = g.x - boat.x;
      const dy = g.y - boat.y;
      const rr = BOAT.radius + g.r + 6;
      if (dx * dx + dy * dy < rr * rr) {
        g.taken = true;
        this.collectPearl(GRAND_PEARL.points, g.x, g.y, sound, true);
        events |= EVENT_GRAND;
      }
    }
    this.grandPearls = this.grandPearls.filter((g) => !g.taken);

    // --- tabrakan karang & inti pusaran (mode demo: tanpa kerusakan) ---
    if (boat.invulnerable <= 0 && !dashing && !this.demo) {
      let hit = false;
      for (const r of this.rocks) {
        const dx = r.x - boat.x;
        const dy = r.y - boat.y;
        const rr = BOAT.radius + r.r - 8;
        if (dx * dx + dy * dy < rr * rr) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const w of this.whirlpools) {
          const dx = w.x - boat.x;
          const dy = w.y - boat.y;
          if (dx * dx + dy * dy < w.r * w.r * 0.6) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        this.lives -= 1;
        boat.invulnerable = BOAT.invulnerableSeconds;
        this.shake = 0.35;
        this.combo = 0;
        this.multiplier = 1;
        events |= EVENT_HIT;
        if (sound) sound.thud();
        this.burst(boat.x, boat.y, '#ff6b6b', 18, 240);
        if (this.lives <= 0) {
          this.over = true;
          events |= EVENT_OVER;
          if (sound) sound.over();
        }
      }
    }

    // --- partikel & guncangan ---
    if (dashing) {
      this.particles.push({
        x: boat.x + range(this.rng, -8, 8), y: boat.y + 16,
        vx: range(this.rng, -20, 20), vy: range(this.rng, 60, 140),
        life: 0.4, maxLife: 0.4, color: '#7fe3c0', size: 3,
      });
    }
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);

    return events;
  }
}

export { STEP };
