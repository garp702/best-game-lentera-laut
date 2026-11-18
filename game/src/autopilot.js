// Pilot otomatis untuk staging screenshot dan uji tuning: ia memainkan
// aturan yang sama persis seperti pemain manusia — membaca dunia yang
// sama, memilih dari lima arah gerak yang sama, dash dengan cooldown yang
// sama — jadi frame ?shot= adalah momen permainan sungguhan dan hasil
// bangku uji pilot adalah proksi kasar keterampilan pemain.
//
// Cara memilih arah: untuk tiap arah, perkirakan detik sampai tertabrak
// bila terus ke sana (lookahead lurus); arah yang paling lama aman menang,
// seri diputus oleh kedekatan ke target mutiara. Mutiara raja dihitung
// dengan diskon jarak besar — pilot berani menyelam mendekati pusaran
// demi 100 poin, persis godaan yang dirasakan pemain.
import { BOAT, FIELD } from './config.js';
import { clamp } from './random.js';

const SAMPLE = 1 / 30;
const HORIZON = 0.7;
const HORIZON_AGGRESSIVE = 0.9;
const GRAND_DISTANCE_DISCOUNT = 0.45;
const DIRECTIONS = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

// Target terbaik: mutiara biasa berbobot penuh, mutiara raja berbobot
// diskon (terasa jauh lebih dekat daripada jarak sebenarnya).
function bestTarget(world) {
  let best = null;
  let bestScore = Infinity;
  const consider = (x, y, weight) => {
    if (y < world.boat.y - 340 || y > world.boat.y + 40) return;
    const score = (Math.abs(y - world.boat.y) + Math.abs(x - world.boat.x) * 0.6) * weight;
    if (score < bestScore) {
      bestScore = score;
      best = { x, y };
    }
  };
  for (const p of world.pearls) consider(p.x, p.y, 1);
  for (const g of world.grandPearls) consider(g.x, g.y, GRAND_DISTANCE_DISCOUNT);
  return best;
}

// Detik sampai kapal tertabrak bila bergerak lurus ke `dir` selama
// `horizon`; Infinity bila jalur itu bersih sepanjang jendela.
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
  const target = bestTarget(world);
  let bestDir = DIRECTIONS[0];
  let bestTime = -1;
  let bestTargetDist = Infinity;
  for (const dir of DIRECTIONS) {
    const t = timeToHit(world, dir, horizon);
    const nx = clamp(boat.x + dir.x * BOAT.speed * horizon, BOAT.minX, BOAT.maxX);
    const ny = clamp(boat.y + dir.y * BOAT.speed * horizon, BOAT.minY, BOAT.maxY);
    const targetDist = target ? Math.hypot(target.x - nx, target.y - ny) : 0;
    // Arah yang tertabrak duluan kalah; seri diputus oleh jarak ke target.
    if (t > bestTime || (t === bestTime && targetDist < bestTargetDist)) {
      bestTime = t;
      bestTargetDist = targetDist;
      bestDir = dir;
    }
  }
  // Dash adalah jalan keluar darurat saat semua arah segera berbahaya,
  // bukan kebiasaan — sama seperti pemain yang menahan dash-nya.
  const dash = bestTime < 0.28 && boat.dashCooldown <= 0;
  return { x: bestDir.x, y: bestDir.y, dash };
}
