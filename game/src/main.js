// Lentera Laut — titik masuk browser: menyiapkan kanvas, menjalankan
// loop berlangkah tetap 1/60 detik, dan menggerakkan mesin layar
// (judul → main → jeda → menang/kalah). Mode ?shot= memotong loop:
// satu adegan dipentaskan deterministik, digambar sekali, lalu ditandai
// siap untuk difoto.
import { FIELD, STEP } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { World } from './world.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, draw } from './render.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'lentera-laut-best';

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Penyimpanan tidak tersedia (mis. file://) — skor terbaik sesi saja.
  }
}

function seedFromUrl(params) {
  const raw = Number(params.get('seed'));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

function randomSeed() {
  return Math.floor(Math.random() * 2147483646) + 1;
}

const canvas = document.getElementById('game');
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = new Input(canvas);
const sound = new SoundBank();
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const world = new World(shotName ? seedFromUrl(params) : randomSeed());

let screen = SCREEN_TITLE;
let best = loadBest();
let lastTime = 0;
let accumulator = 0;

// Diekspos untuk uji otomatis dan debugging: state permainan saat ini.
window.__game = { world, get screen() { return screen; }, input };
window.__shotReady = false;

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startRun() {
  world.reset(randomSeed());
  screen = SCREEN_PLAY;
  sound.unlock();
  sound.click();
  announce('Pelayaran dimulai. Kumpulkan mutiara, hindari karang dan pusaran.');
}

function endRunIfNeeded() {
  if (world.won && screen === SCREEN_PLAY) {
    screen = SCREEN_WIN;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(`Pelayaran selesai! Skor ${world.score}.`);
  } else if (world.over && screen === SCREEN_PLAY) {
    screen = SCREEN_OVER;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(`Lentera padam. Skor ${world.score}.`);
  }
}

function frame(time) {
  requestAnimationFrame(frame);
  if (lastTime === 0) lastTime = time;
  let dt = (time - lastTime) / 1000;
  lastTime = time;
  if (dt > 0.25) dt = 0.25;

  // M membisukan di layar mana pun.
  if (input.wasPressed('KeyM')) {
    const muted = sound.toggleMuted();
    announce(muted ? 'Suara dimatikan.' : 'Suara dinyalakan.');
  }

  if (screen === SCREEN_TITLE) {
    // Judul hidup di atas demo tanpa kerusakan.
    world.demo = true;
    world.step(STEP, { x: 0, y: 0 }, null, false, null);
    if (input.dashPressed() || input.wasPressed('Enter') || input.wasPressed('Mouse')) {
      startRun();
    }
  } else if (screen === SCREEN_PLAY) {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= STEP && guard < 8) {
        const move = input.moveVector();
        const mouse = { x: input.mouseX, y: input.mouseY, down: input.mouseDown };
        world.step(STEP, move, mouse, input.dashPressed(), sound);
        accumulator -= STEP;
        guard += 1;
        if (world.won || world.over) {
          accumulator = 0;
          break;
        }
      }
      endRunIfNeeded();
    }
  } else if (screen === SCREEN_PAUSED) {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      screen = SCREEN_PLAY;
      announce('Lanjut berlayar.');
    } else if (input.wasPressed('KeyR')) {
      startRun();
    }
  } else if (screen === SCREEN_WIN || screen === SCREEN_OVER) {
    // Guncangan sisa tabrakan terakhir meluruh di layar akhir — tanpa
    // ini layar menang/kalah bergetar selamanya karena dunia berhenti.
    world.shake = Math.max(0, world.shake - dt);
    if (input.wasPressed('KeyR') || input.dashPressed()) {
      startRun();
    }
  }

  draw(ctx, world, screen, { best, muted: sound.muted });
  input.endFrame();
  window.__shotReady = true;
}

// Mode staging: pentaskan satu adegan, gambar satu frame, selesai.
if (shotName) {
  const staged = stageShot(shotName, world, null);
  screen = staged.screen;
  best = Math.max(best, staged.best);
  draw(ctx, world, screen, { best, muted: false });
  window.__shotReady = true;
  window.__shotInfo = {
    shot: shotName,
    screen,
    score: world.score,
    pearls: world.pearlsCollected,
    grand: world.grandCollected,
    lives: world.lives,
    distance: Math.floor(world.distance),
    level: world.level,
  };
} else {
  requestAnimationFrame(frame);
}
