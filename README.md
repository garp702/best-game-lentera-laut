[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/garp702/best-game-lentera-laut/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/garp702/best-game-lentera-laut/reward.svg)](https://make.fun/bounty/best-game-01)

# Lentera Laut — pelayaran malam 1.200 meter

Game arcade 2D orisinal (canvas vanilla, tanpa library): kemudikan kapal
lentera di laut malam, kumpulkan mutiara bercahaya, hindari karang dan
pusaran yang menarik kapalmu, dan sampai di 1.200 meter sebelum ketiga
lenteramu padam.

## Cara main

Sajikan `game/` dengan server statis apa pun lalu buka `index.html` di
desktop Chrome, misalnya dengan server bawaan repo ini:

```sh
node serve.ts   # lalu buka http://localhost:8080
```

Tanpa build step, tanpa network request. Semua suara disintesis dengan
WebAudio — tanpa file audio.

## Kontrol

- **← → ↑ ↓ / WASD** gerak · **Mouse** (tahan klik) kapal mengikuti kursor
- **Spasi** dash (kebal sesaat, cooldown 2 detik)
- **P / Esc** jeda · **R** mulai ulang · **M** bisu

## Gamenya

- **Pelayaran:** jarak bertambah mengikuti arus; sampai **1.200 m** untuk
  menang (+500 poin). Tiap 300 m naik level: arus makin cepat, karang
  makin rapat, celah aman di tiap baris karang menyempit, palet laut
  berubah sampai fajar.
- **Mutiara:** 10 poin tiap satu; kombo beruntun (dalam 2,5 detik)
  melipatgandakan sampai **×5**.
- **Mutiara raja:** mutiara emas besar yang langka dan selalu muncul
  menempel di pusaran. Nilainya **100 poin** sebelum pengali kombo —
  mengambilnya berarti menyelam ke tepi pusaran yang sedang menarik
  kapalmu. Ambil, atau lewati: itu pilihanmu, empat kali semenjak
  berlayar.
- **Bahaya:** karang (tabrakan = −1 nyawa), pusaran (menarik kapal sejak
  level 1, intinya mematikan), tiga nyawa berbentuk lentera.
- **Dash:** ledakan kecepatan untuk lolos dari celah sempit atau lepas
  dari pusaran — pilihan yang berarti karena ada cooldown.
- **HUD:** skor, mutiara, bilah jarak, nyawa, level, meter dash, kombo.
- **Layar:** judul (dengan cara main + skor terbaik), jeda, menang, kalah —
  semuanya dengan tombol mulai ulang.

## Screenshot

`?shot=start|play|action|win|lose&seed=N` mementaskan frame deterministik
dari kode game itu sendiri untuk pengambilan gambar (autopilot memainkan
aturan yang sama seperti pemain, termasuk mati sungguhan pada adegan
`lose`).
