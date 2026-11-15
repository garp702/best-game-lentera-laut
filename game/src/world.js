// Dunia Lentera Laut: kapal, mutiara, karang, pusaran, jarak pelayaran.
// Satu-satunya sumber acak adalah RNG ber-seed, jadi dunia yang sama selalu
// memainkan langkah yang sama — penting untuk staging screenshot.
import {
  BOAT, COMBO_MAX_MULTIPLIER, COMBO_PER_STEP, COMBO_WINDOW_SECONDS,
  DISTANCE_POINTS_EVERY_METERS, FIELD, LEVEL_EVERY_METERS, LIVES_START,
  MAX_LEVEL, PEARL_POINTS, SCROLL, SPAWN, STEP, VOYAGE_METERS, WIN_BONUS_POINTS,
} from './config.js';
import { clamp, mulberry32, range, rangeInt } from './random.js';

export const EVENT_PEARL = 1;
export const EVENT_HIT = 2;
export const EVENT_LEVEL = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_DASH = 32;

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
    this.whirlpoolTimer = 6;
    this.boat = {
      x: FIELD.width / 2,
      y: FIELD.height - 110,
      dashTimer: 0,
      dashCooldown: 0,
      invulnerable: 0,
      tilt: 0,
    };
    this.pearls = [];
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

  spawnPearlPattern() {
    const kind = this.rng();
    const cx = range(this.rng, 90, FIELD.width - 90);
    if (kind < 0.45) {
      // Busur 5 mutiara: mudah dibaca, enak dikejar.
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
      // Baris vertikal 4 mutiara.
      const x = clamp(cx, 70, FIELD.width - 70);
      for (let i = 0; i < 4; i += 1) {
        this.pearls.push({ x, y: -30 - i * 46, r: 12, phase: this.rng() * Math.PI * 2, taken: false });
      }
    } else {
      // Pasangan menyilang.
      this.pearls.push({ x: cx - 40, y: -30, r: 12, phase: 0, taken: false });
      this.pearls.push({ x: cx + 40, y: -76, r: 12, phase: 1, taken: false });
    }
  }

  spawnRockRow() {
    // Selalu sisakan koridor kosong selebar minGapPixels supaya adil.
    const gap = SPAWN.minGapPixels;
    const gapCenter = range(this.rng, 140, FIELD.width - 140);
    const count = this.level >= 3 ? rangeInt(this.rng, 2, 3) : rangeInt(this.rng, 1, 2);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 12) {
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

  addScore(points) {
    this.score += points;
  }

  // Satu langkah simulasi. `move` = {x, y} dari keyboard (-1..1) atau null
  // bila mouse yang mengemudi; `mouse` = {x, y, down}; `dash` = tepi tekan spasi.
  step(dt, move, mouse, dash, sound) {
    if (this.won || this.over) return 0;
    let events = 0;
    this.time += dt;
    this.wavePhase += dt;
    const speed = this.scrollSpeed();

    // --- kapal ---
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
    // Pusaran menarik kapal ke pusatnya.
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

    // --- jarak & level ---
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

    // --- kombo ---
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
      }
    }

    // --- spawn ---
    this.pearlTimer -= dt;
    if (this.pearlTimer <= 0) {
      this.spawnPearlPattern();
      this.pearlTimer = SPAWN.pearlEverySeconds * range(this.rng, 0.85, 1.2);
    }
    this.rockTimer -= dt;
    if (this.rockTimer <= 0) {
      this.spawnRockRow();
      const base = Math.max(SPAWN.rockEveryMinSeconds, SPAWN.rockEverySeconds - (this.level - 1) * 0.12);
      this.rockTimer = base * range(this.rng, 0.85, 1.2);
    }
    if (this.level >= SPAWN.whirlpoolFromLevel) {
      this.whirlpoolTimer -= dt;
      if (this.whirlpoolTimer <= 0) {
        this.spawnWhirlpool();
        this.whirlpoolTimer = SPAWN.whirlpoolEverySeconds * range(this.rng, 0.8, 1.3);
      }
    }

    // --- gerak entitas ke bawah ---
    for (const p of this.pearls) {
      p.y += speed * dt;
      p.phase += dt * 3;
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
    this.rocks = this.rocks.filter((r) => r.y < FIELD.height + 90);
    this.whirlpools = this.whirlpools.filter((w) => w.y < FIELD.height + 120);

    // --- tabrakan mutiara ---
    for (const p of this.pearls) {
      const dx = p.x - boat.x;
      const dy = p.y - boat.y;
      const rr = BOAT.radius + p.r + 6;
      if (dx * dx + dy * dy < rr * rr) {
        p.taken = true;
        this.pearlsCollected += 1;
        this.combo += 1;
        this.comboTimer = COMBO_WINDOW_SECONDS;
        this.multiplier = Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor(this.combo / COMBO_PER_STEP) * 0.5);
        this.score += Math.round(PEARL_POINTS * this.multiplier);
        events |= EVENT_PEARL;
        if (sound) sound.pearl(this.combo);
        this.burst(p.x, p.y, '#ffd166', 10, 160);
      }
    }
    this.pearls = this.pearls.filter((p) => !p.taken);

    // --- tabrakan karang & pusaran (demo: latar judul, tanpa kerusakan) ---
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

    // --- partikel ---
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
