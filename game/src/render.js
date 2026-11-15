// Semua gambar di canvas 2D: laut malam, kapal lentera, mutiara, karang,
// pusaran, HUD, dan layar judul/jeda/menang/kalah. Render tidak mengubah
// dunia — hanya membaca state — jadi aman dipanggil kapan saja.
import { BOAT, FIELD, PALETTES, VOYAGE_METERS } from './config.js';
import { clamp } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const FONT = 'system-ui, "Segoe UI", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLanternIcon(ctx, x, y, lit) {
  ctx.save();
  ctx.translate(x, y);
  if (lit) {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    glow.addColorStop(0, 'rgba(255, 209, 102, 0.9)');
    glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-16, -16, 32, 32);
  }
  ctx.fillStyle = lit ? '#ffd166' : '#3a4a63';
  roundRect(ctx, -6, -8, 12, 16, 3);
  ctx.fill();
  ctx.fillStyle = lit ? '#7a4a12' : '#22304a';
  ctx.fillRect(-7, -11, 14, 4);
  ctx.fillRect(-7, 8, 14, 3);
  ctx.restore();
}

function drawBoat(ctx, world) {
  const boat = world.boat;
  const blink = boat.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
  ctx.save();
  ctx.translate(boat.x, boat.y);
  if (blink) ctx.globalAlpha = 0.35;
  ctx.rotate(boat.tilt);
  // Cahaya lentera di haluan.
  const glow = ctx.createRadialGradient(0, -6, 4, 0, -6, 70);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -6, 70, 0, Math.PI * 2);
  ctx.fill();
  // Lambung kapal.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.moveTo(-26, 4);
  ctx.lineTo(26, 4);
  ctx.lineTo(18, 16);
  ctx.lineTo(-18, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a9743c';
  ctx.fillRect(-26, 2, 52, 4);
  // Tiang + layar.
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -34);
  ctx.stroke();
  ctx.fillStyle = '#f5e9c9';
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, -4);
  ctx.lineTo(20, -4);
  ctx.closePath();
  ctx.fill();
  // Lentera di haluan.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(16, -8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(16, -8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPearl(ctx, pearl) {
  const bob = Math.sin(pearl.phase) * 2;
  const y = pearl.y + bob;
  const glow = ctx.createRadialGradient(pearl.x, y, 2, pearl.x, y, 26);
  glow.addColorStop(0, 'rgba(255, 240, 180, 0.85)');
  glow.addColorStop(1, 'rgba(255, 240, 180, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(pearl.x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(pearl.x, y, pearl.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(pearl.x - 3, y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx, rock) {
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.rot);
  const r = rock.r;
  ctx.fillStyle = '#2c3a52';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, -r * 0.3);
  ctx.lineTo(r * 0.6, r * 0.8);
  ctx.lineTo(-r * 0.5, r * 0.9);
  ctx.lineTo(-r * 0.9, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#46586e';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, -r * 0.3);
  ctx.lineTo(r * 0.2, -r * 0.1);
  ctx.lineTo(-r * 0.9, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWhirlpool(ctx, whirl) {
  const spin = whirl.age * 2.4;
  ctx.save();
  ctx.translate(whirl.x, whirl.y);
  for (let ring = 0; ring < 3; ring += 1) {
    const rr = whirl.r * (1 - ring * 0.24);
    ctx.strokeStyle = `rgba(180, 220, 255, ${0.75 - ring * 0.2})`;
    ctx.lineWidth = 5 - ring;
    ctx.beginPath();
    ctx.arc(0, 0, rr, spin + ring * 1.1, spin + ring * 1.1 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.fillStyle = '#04101f';
  ctx.beginPath();
  ctx.arc(0, 0, whirl.r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSea(ctx, world, palette) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, palette.skyTop);
  grad.addColorStop(0.42, palette.skyBottom);
  grad.addColorStop(0.43, palette.seaTop);
  grad.addColorStop(1, palette.seaBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Bintang berkelip di langit.
  for (const star of world.stars) {
    const alpha = 0.35 + 0.65 * Math.abs(Math.sin(world.time * star.twinkle + star.phase));
    ctx.fillStyle = `rgba(255, 255, 240, ${alpha.toFixed(2)})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  // Bulan.
  ctx.fillStyle = palette.moon;
  ctx.beginPath();
  ctx.arc(1120, 92, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.25)';
  ctx.beginPath();
  ctx.arc(1120, 92, 58, 0, Math.PI * 2);
  ctx.fill();
  // Garis ombak bergerak.
  ctx.strokeStyle = 'rgba(140, 200, 255, 0.16)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 5; row += 1) {
    const yBase = 330 + row * 78;
    ctx.beginPath();
    for (let x = 0; x <= FIELD.width; x += 32) {
      const y = yBase + Math.sin(x * 0.012 + world.wavePhase * 1.4 + row * 1.7) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawHud(ctx, world, ui) {
  const palette = PALETTES[world.level - 1];
  ctx.save();
  // Bilah atas.
  ctx.fillStyle = 'rgba(4, 12, 26, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 66);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 66, FIELD.width, 3);
  // Skor.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#9fb4d8';
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('SKOR', 24, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(String(world.score), 24, 56);
  // Mutiara terkumpul.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(196, 44, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(`× ${world.pearlsCollected}`, 210, 52);
  // Jarak pelayaran di tengah.
  const barX = 430;
  const barW = 420;
  const progress = clamp(world.distance / VOYAGE_METERS, 0, 1);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = `600 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`JARAK  ${Math.floor(world.distance)} / ${VOYAGE_METERS} m`, barX + barW / 2, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, barX, 34, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  roundRect(ctx, barX, 34, Math.max(16, barW * progress), 16, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText(`LV ${world.level}`, barX + barW / 2, 46);
  // Nyawa (lentera) + dash di kanan.
  for (let i = 0; i < 3; i += 1) {
    drawLanternIcon(ctx, 940 + i * 34, 34, i < world.lives);
  }
  ctx.fillStyle = '#9fb4d8';
  ctx.font = `600 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('NYAWA', 1050, 24);
  const dashReady = world.boat.dashCooldown <= 0;
  ctx.fillStyle = dashReady ? '#7fe3c0' : 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1050, 32, 110, 12, 6);
  ctx.fill();
  if (!dashReady) {
    ctx.fillStyle = '#7fe3c0';
    roundRect(ctx, 1050, 32, 110 * (1 - world.boat.dashCooldown / 2), 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText(dashReady ? 'DASH SIAP' : 'DASH…', 1170, 43);
  if (ui.muted) {
    ctx.fillStyle = '#ff8fa3';
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText('BISU (M)', 1050, 62);
  }
  // Kombo di atas kapal.
  if (world.multiplier > 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = `800 26px ${FONT}`;
    ctx.fillText(`KOMBO ×${world.multiplier}`, world.boat.x, world.boat.y - 52);
  }
  // Petunjuk bawah, samar.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = `500 14px ${FONT}`;
  ctx.fillText('← → ↑ ↓ / WASD gerak   ·   SPASI dash   ·   P jeda   ·   M suara', FIELD.width / 2, FIELD.height - 12);
  ctx.restore();
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 8, 20, 0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = `800 64px ${FONT}`;
  ctx.fillText(title, FIELD.width / 2, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 22px ${FONT}`;
  lines.forEach((line, i) => {
    ctx.fillText(line, FIELD.width / 2, 310 + i * 36);
  });
  ctx.restore();
}

function drawTitle(ctx, world, ui) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 8, 20, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = `800 84px ${FONT}`;
  ctx.fillText('LENTERA LAUT', FIELD.width / 2, 210);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText('Pelayaran malam sejauh 1.200 meter — kumpulkan mutiara, hindari karang.', FIELD.width / 2, 262);
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = '#cfe0f5';
  ctx.fillText('Gerak: ← → ↑ ↓ atau WASD / mouse  ·  SPASI: dash  ·  P: jeda  ·  M: suara', FIELD.width / 2, 320);
  ctx.fillText('Tiga lentera = tiga nyawa. Pusaran menarik kapalmu. Sampai di 1.200 m untuk menang.', FIELD.width / 2, 352);
  if (ui.best > 0) {
    ctx.fillStyle = '#7fe3c0';
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(`Skor terbaik: ${ui.best}`, FIELD.width / 2, 402);
  }
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `800 30px ${FONT}`;
    ctx.fillText('TEKAN SPASI / KLIK UNTUK BERLAYAR', FIELD.width / 2, 480);
  }
  ctx.restore();
}

function drawEndStats(ctx, world) {
  // Subjudul panel overlay ada di y=310; statistik dan ajakan restart
  // diletakkan di bawahnya supaya tidak bertumpuk.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(`Skor ${world.score}   ·   Mutiara ${world.pearlsCollected}   ·   Jarak ${Math.floor(world.distance)} m   ·   Waktu ${Math.floor(world.time)} dtk`, FIELD.width / 2, 362);
  ctx.fillStyle = '#ffd166';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('Tekan R untuk berlayar lagi', FIELD.width / 2, 418);
}

export function draw(ctx, world, screen, ui) {
  const palette = PALETTES[world.level - 1];
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 22;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawSea(ctx, world, palette);
  for (const pearl of world.pearls) drawPearl(ctx, pearl);
  for (const whirl of world.whirlpools) drawWhirlpool(ctx, whirl);
  for (const rock of world.rocks) drawRock(ctx, rock);
  for (const pt of world.particles) {
    ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  drawBoat(ctx, world);
  ctx.restore();

  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, world, ui);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, ui);
  if (screen === SCREEN_PAUSED) {
    overlayPanel(ctx, 'JEDA', ['P — lanjutkan', 'R — mulai dari awal'], '#7fe3c0');
  }
  if (screen === SCREEN_WIN) {
    overlayPanel(ctx, 'PELAYARAN SELESAI!', ['Kamu sampai di ujung laut — lentera tetap menyala.'], '#ffd166');
    drawEndStats(ctx, world);
  }
  if (screen === SCREEN_OVER) {
    overlayPanel(ctx, 'LENTERA PADAM', ['Kapalmu kandas di karang malam ini.'], '#ff8fa3');
    drawEndStats(ctx, world);
  }
}
