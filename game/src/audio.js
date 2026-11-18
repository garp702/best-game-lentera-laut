// Seluruh suara Lentera Laut disintesis WebAudio saat itu juga — tidak ada
// satu pun file audio. Konteks audio baru lahir pada gestur pertama
// pemain (kebijakan autoplay browser), jadi staging screenshot dan uji
// headless berjalan diam tanpa error.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Satu nada berbalut amplop: naik cepat, meluruh halus; slideTo > 0
  // membuat nada meluncur ke frekuensi tujuan.
  tone(freq, seconds, type, volume, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  // Semburan derau berfilter untuk dentuman dan desis dash.
  noise(seconds, volume, filterFreq, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t0);
  }

  // Mutiara biasa: denting yang nadanya naik mengikuti kombo.
  pearl(combo) {
    const base = 660 * Math.pow(1.059463, Math.min(combo, 12));
    this.tone(base, 0.18, 'sine', 0.5);
    this.tone(base * 1.5, 0.22, 'sine', 0.3, 0.05);
  }

  // Mutiara raja: kaskade tiga nada cerah di atas nada dasar yang hangat —
  // terdengar jelas berbeda dari denting mutiara biasa.
  grand() {
    this.tone(440, 0.35, 'triangle', 0.35);
    this.tone(880, 0.2, 'sine', 0.5, 0.02);
    this.tone(1174, 0.24, 'sine', 0.45, 0.09);
    this.tone(1568, 0.34, 'sine', 0.4, 0.16);
  }

  // Karang: dentuman rendah plus derau tumbukan.
  thud() {
    this.tone(110, 0.25, 'triangle', 0.7, 0, 55);
    this.noise(0.2, 0.4, 400);
  }

  // Dash: desis naik dan sahutan nada cepat.
  dash() {
    this.noise(0.3, 0.35, 2400);
    this.tone(300, 0.25, 'sawtooth', 0.12, 0, 900);
  }

  // Naik level: arpeggio tiga nada.
  levelUp() {
    this.tone(523, 0.14, 'square', 0.22);
    this.tone(659, 0.14, 'square', 0.22, 0.1);
    this.tone(784, 0.22, 'square', 0.25, 0.2);
  }

  // Menang: fanfare empat nada ditutup nada tinggi.
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.3, 'triangle', 0.4, i * 0.13));
    this.tone(1319, 0.5, 'sine', 0.3, 0.52);
  }

  // Kalah: dua nada turun, pelayaran selesai.
  over() {
    this.tone(392, 0.3, 'sine', 0.4, 0, 196);
    this.tone(294, 0.45, 'sine', 0.4, 0.25, 147);
  }

  click() {
    this.tone(880, 0.07, 'sine', 0.3);
  }
}
