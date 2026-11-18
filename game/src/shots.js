// Pementasan screenshot ?shot=start|play|action|win|lose&seed=N: setiap
// adegan menjalankan dunia sungguhan dari kondisi segar dengan autopilot
// selama sejumlah detik tetap, lalu mengembalikan layar yang harus
// digambar. Tidak ada frame yang disusun manual — seed sama, frame sama.
//
// S2 menambah adegan `lose`: pilot dimainkan sampai lenteranya padam,
// supaya layar kalah (dan ajakan mulai ulang) ikut terdokumentasi —
// di S2 kekalahan adalah hasil yang nyata, bukan teori.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { autopilot } from './autopilot.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const ACTION_SECONDS = 34;
const RUN_LIMIT_SECONDS = 400;

function runFor(world, seconds, aggressive, sound) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.won || world.over) break;
    const pilot = autopilot(world, aggressive);
    world.step(STEP, { x: pilot.x, y: pilot.y }, null, pilot.dash, sound);
  }
}

function runUntilEnd(world, sound) {
  const maxSteps = Math.floor(RUN_LIMIT_SECONDS / STEP);
  let steps = 0;
  while (!world.won && !world.over && steps < maxSteps) {
    const pilot = autopilot(world, false);
    world.step(STEP, { x: pilot.x, y: pilot.y }, null, pilot.dash, sound);
    steps += 1;
  }
}

export function stageShot(name, world, sound) {
  world.reset(world.seed);
  if (name === 'start') {
    // Latar hidup di balik layar judul (mode demo: tanpa kerusakan).
    world.demo = true;
    runFor(world, START_SECONDS, false, null);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, false, sound);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  if (name === 'action') {
    // Pilot agresif: horizon lebih panjang dan berani mengejar mutiara
    // raja — frame menangkap puncak ketegangan di sekitar pusaran.
    runFor(world, ACTION_SECONDS, true, sound);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  if (name === 'lose') {
    // Main sampai kalah (seed untuk adegan ini dipilih yang memang mati).
    // Guncangan tabrakan terakhir dibersihkan: foto diambil pada layar
    // akhir yang sudah tenang, jadi seed yang sama = frame yang sama.
    runUntilEnd(world, sound);
    world.shake = 0;
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  // win: main sampai jarak 1.200 m tercapai (atau batas langkah).
  runUntilEnd(world, sound);
  world.shake = 0;
  return { screen: world.won ? SCREEN_WIN : SCREEN_PLAY, best: world.score };
}
