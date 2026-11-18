// Input Lentera Laut: keyboard dan mouse dibaca di sini, diterjemahkan
// menjadi pertanyaan-pertanyaan sederhana untuk loop utama — vektor gerak
// dari tombol yang sedang ditekan, dan tepi tekan (sekali per penekanan)
// untuk aksi sesaat seperti dash, jeda, dan mulai ulang.
// Panah/WASD mengemudi, spasi dash, P/Esc jeda, R ulang, M bisu; mouse
// mengemudi selagi tombolnya ditahan (kapal mengejar kursor).
import { FIELD } from './config.js';

const MOVE_KEYS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
};

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = FIELD.width / 2;
    this.mouseY = FIELD.height - 120;
    this.mouseDown = false;
    this.canvas = canvas;
    this.onKeyDown = (event) => {
      if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this.onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * FIELD.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * FIELD.height;
    };
    this.onMouseDown = (event) => {
      this.onMouseMove(event);
      this.mouseDown = true;
      this.pressed.add('Mouse');
    };
    this.onMouseUp = () => {
      this.mouseDown = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  // Vektor gerak -1..1 per sumbu dari semua tombol arah yang ditekan;
  // diagonal dinormalkan supaya tidak lebih cepat dari lurus.
  moveVector() {
    let x = 0;
    let y = 0;
    for (const code of this.keys) {
      const dir = MOVE_KEYS[code];
      if (dir) {
        x += dir[0];
        y += dir[1];
      }
    }
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  // Apakah `code` baru saja ditekan pada frame ini?
  wasPressed(code) {
    return this.pressed.has(code);
  }

  dashPressed() {
    return this.pressed.has('Space');
  }

  // Dipanggil di akhir frame: tepi tekan hanya hidup satu frame.
  endFrame() {
    this.pressed.clear();
  }
}
