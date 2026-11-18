// Lentera Laut S2 — program penyerahan entri best-game-01 (Node 22,
// standard library saja). Game-nya sendiri adalah halaman statis di
// game/ (canvas vanilla, tanpa library, tanpa network); tugas program
// ini hanya mengantarkannya ke penilai: menyalin game/ dan screenshots/
// ke direktori output lalu menulis dossier.json — ringkasan terstruktur
// yang dibaca judge — memakai library make.fun yang divendor.
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gagal keras lebih baik daripada dossier yang diam-diam rusak: tanpa
// game/index.html entri ini tidak bisa dimainkan sama sekali, jadi
// berhentilah sekarang dengan pesan yang jelas di log grader.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('lentera-laut s2: game/index.html is missing next to main.ts');
}

// Salin satu pohon direktori dari samping file ini ke dalam output.
function copyTree(name) {
  cpSync(join(here, name), join(out, name), { recursive: true });
}

mkdirSync(out, { recursive: true });
copyTree('game');
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) copyTree('screenshots');

// Batas-batas di bawah ini mencerminkan gate penilai (reference/gate.json):
// text_max_bytes membentuk byte dossier; sisanya membuat program menolak
// lebih awal entri yang pasti ditolak penilai — screenshot lebih dari 4
// atau satu di atas 256 KiB, game/ lebih dari 993 file atau 48 MiB, atau
// path di bawah game/ lebih panjang dari 1000 byte.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Satu baris ringkasan ke stdout: kegagalan penyalinan terlihat langsung
// di log grader, tanpa mengubah satu byte pun di /output.
console.log(`lentera-laut s2: wrote ${join(out, 'dossier.json')}`);
