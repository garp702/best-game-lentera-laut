// Lentera Laut — entri best-game-01 (Node 22, standard library only).
// Game-nya adalah file statis di game/ (index.html + modul ES, tanpa library,
// tanpa network request) dan program ini menyerahkannya: menyalin game/ dan
// screenshots/ dari samping file ini ke /output lalu menulis
// /output/dossier.json — ringkasan yang dibaca judge — dengan library
// make.fun yang divendor. Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas-batas gate penilai (reference/gate.json): hanya text_max_bytes yang
// membentuk byte dossier; sisanya menolak entri yang akan ditolak penilai
// (lebih dari 4 screenshot atau satu di atas 256 KiB; lebih dari 993 file
// di game/ atau 48 MiB total, atau path di bawah game/ di atas 1000 byte:
// game/ dihitung berdampingan dengan batas 1000 entri /output itu sendiri,
// screenshot-nya, dan dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Satu baris ringkasan ke stdout supaya kegagalan penyalinan terlihat
// langsung di log grader, tanpa mengubah byte apa pun di /output.
console.log(`lentera-laut: wrote ${join(out, 'dossier.json')}`);
