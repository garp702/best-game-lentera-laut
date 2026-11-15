// Adegan untuk ?shot=start|play|action|win: setiap adegan memainkan dunia
// nyata maju dari kondisi segar dengan autopilot, sejumlah langkah tetap,
// lalu mengembalikan layar yang harus digambar. Seed yang sama selalu
// menghasilkan frame yang sama.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { autopilot } from './autopilot.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const ACTION_SECONDS = 34;
const WIN_LIMIT_SECONDS = 400;

function runFor(world, seconds, aggressive, sound) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.won || world.over) break;
    const pilot = autopilot(world, aggressive);
    world.step(STEP, { x: pilot.x, y: pilot.y }, null, pilot.dash, sound);
  }
}

export function stageShot(name, world, sound) {
  world.reset(world.seed);
  if (name === 'start') {
    // Latar hidup 6 detik di balik layar judul (mode demo: tanpa kerusakan).
    world.demo = true;
    runFor(world, START_SECONDS, false, null);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, false, sound);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  if (name === 'action') {
    // Pilot agresif 34 detik: dash dipakai tiap ada kesempatan, jadi frame
    // menangkap kapal di tengah dash melewati karang.
    runFor(world, ACTION_SECONDS, true, sound);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  // win: main sampai jarak 1.200 m tercapai (atau batas langkah).
  runFor(world, WIN_LIMIT_SECONDS, false, sound);
  return { screen: world.won ? SCREEN_WIN : SCREEN_PLAY, best: world.score };
}
