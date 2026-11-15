// Pilot otomatis untuk staging screenshot: memainkan aturan yang sama seperti
// pemain, dari dunia ber-seed yang sama — jadi tiap frame ?shot= adalah
// momen nyata permainan, bukan gambar yang disusun manual.
//
// Cara kerjanya: untuk tiap arah yang bisa ditempuh (diam, kiri, kanan,
// atas, bawah), pilot memperkirakan kapan kapal akan tertabrak bila terus
// ke arah itu, lalu memilih arah yang paling lama aman; di antara yang
// aman, dipilih yang paling dekat ke mutiara terdekat.
import { BOAT, FIELD } from './config.js';
import { clamp } from './random.js';

const SAMPLE = 1 / 30;
const HORIZON = 0.7;
const HORIZON_AGGRESSIVE = 0.9;
const DIRECTIONS = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

// Cari mutiara terdekat yang masih di depan kapal.
function nearestPearl(world) {
  let best = null;
  let bestScore = Infinity;
  for (const p of world.pearls) {
    if (p.y < world.boat.y - 340 || p.y > world.boat.y + 40) continue;
    const score = Math.abs(p.y - world.boat.y) + Math.abs(p.x - world.boat.x) * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

// Detik sampai kapal tertabrak bila bergerak ke `dir` selama `horizon`;
// Infinity bila tidak pernah tertabrak dalam jendela itu.
function timeToHit(world, dir, horizon) {
  const boat = world.boat;
  const speed = world.scrollSpeed();
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = clamp(boat.x + dir.x * BOAT.speed * t, BOAT.minX, BOAT.maxX);
    const y = clamp(boat.y + dir.y * BOAT.speed * t, BOAT.minY, BOAT.maxY);
    for (const r of world.rocks) {
      const ry = r.y + speed * t;
      const dx = r.x - x;
      const dy = ry - y;
      const rr = BOAT.radius + r.r - 8;
      if (dx * dx + dy * dy < rr * rr) return t;
    }
    for (const w of world.whirlpools) {
      const wy = w.y + speed * 0.9 * t;
      const dx = w.x - x;
      const dy = wy - y;
      const rr = w.r * 0.75;
      if (dx * dx + dy * dy < rr * rr) return t;
    }
  }
  return Infinity;
}

// Kembalikan {x, y, dash}: arah gerak -1..1 dan apakah dash ditekan.
export function autopilot(world, aggressive) {
  const boat = world.boat;
  const horizon = aggressive ? HORIZON_AGGRESSIVE : HORIZON;
  const pearl = nearestPearl(world);
  let bestDir = DIRECTIONS[0];
  let bestTime = -1;
  let bestPearlDist = Infinity;
  for (const dir of DIRECTIONS) {
    const t = timeToHit(world, dir, horizon);
    const nx = clamp(boat.x + dir.x * BOAT.speed * horizon, BOAT.minX, BOAT.maxX);
    const ny = clamp(boat.y + dir.y * BOAT.speed * horizon, BOAT.minY, BOAT.maxY);
    const pearlDist = pearl ? Math.hypot(pearl.x - nx, pearl.y - ny) : 0;
    // Arah yang tertabrak duluan kalah; seri diputus oleh jarak ke mutiara.
    if (t > bestTime || (t === bestTime && pearlDist < bestPearlDist)) {
      bestTime = t;
      bestPearlDist = pearlDist;
      bestDir = dir;
    }
  }
  // Dash hanya saat semua arah berbahaya dalam waktu dekat: jalan keluar
  // darurat, bukan kebiasaan.
  const dash = bestTime < 0.28 && boat.dashCooldown <= 0;
  return { x: bestDir.x, y: bestDir.y, dash };
}
