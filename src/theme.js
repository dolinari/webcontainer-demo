// Il tema della villa: la musica della schermata del titolo.
// Un pianoforte lento in la minore sopra un tappeto d'archi, con un riverbero ampio,
// tutto sintetizzato dal vivo (nessun file audio). Dura circa 30 secondi e si ripete:
// la melodia suona due giri su tre; al terzo restano accompagnamento e archi.

const BPM = 64;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// accordi: basso, quinta, terza (note MIDI)
const CHORDS = [
  [45, 52, 60], // la minore
  [41, 48, 57], // fa
  [48, 55, 64], // do
  [40, 47, 56], // mi
  [45, 52, 60], // la minore
  [38, 45, 53], // re minore
  [41, 48, 57], // fa
  [40, 47, 56], // mi
];
// melodia: [battito, nota, durata in battiti] per ognuna delle otto battute
const MELODY = [
  [[0, 76, 2], [2, 72, 1], [3, 74, 1]],
  [[0, 72, 3], [3, 69, 1]],
  [[0, 67, 1.5], [1.5, 69, 0.5], [2, 72, 2]],
  [[0, 71, 3], [3, 68, 1]],
  [[0, 69, 2], [2, 76, 1], [3, 77, 1]],
  [[0, 77, 2], [2, 76, 1], [3, 74, 1]],
  [[0, 72, 2], [2, 74, 1], [3, 72, 1]],
  [[0, 71, 2], [2, 68, 2]],
];

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class TitleTheme {
  constructor(audio) {
    this.audio = audio;
    this.on = false;
  }

  _build() {
    const ctx = this.audio.ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0;
    // riverbero: una risposta all'impulso di rumore che si spegne in tre secondi
    const len = Math.floor(ctx.sampleRate * 3.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.bus = ctx.createGain(); this.bus.gain.value = 1;
    // un filo di compressione tiene insieme pianoforte e archi sull'altoparlante del telefono
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.bus.connect(comp); comp.connect(this.out);
    this.bus.connect(verb); verb.connect(wet); wet.connect(this.out);
    this.out.connect(this.audio.master);
  }

  start() {
    const a = this.audio;
    if (!a.ctx || this.on) return;
    if (!this.out) this._build();
    this.on = true;
    const t = a.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(1.05, t + 2.5);
    a.windGain.gain.setTargetAtTime(0.3, t, 1.2); // il vento resta, un passo indietro rispetto alla musica
    this._bar = 0;
    this._loop = 0;
    this._next = t + 0.3;
    clearInterval(this._timer);
    this._timer = setInterval(() => this._schedule(), 120);
    this._schedule();
  }

  stop(fade = 1.6) {
    const a = this.audio;
    if (!a.ctx || !this.on) return;
    this.on = false;
    const t = a.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + fade);
    clearInterval(this._timer);
  }

  _schedule() {
    const ctx = this.audio.ctx;
    while (this.on && this._next < ctx.currentTime + 0.6) {
      const t0 = this._next, i = this._bar % 8;
      const [b, f, th] = CHORDS[i];
      // accordo spezzato della mano sinistra: basso, quinta, terza, quinta
      [b, f, th + 12, f + 12].forEach((n, k) => this._piano(n, t0 + k * BEAT, k === 0 ? 0.55 : 0.32, BEAT * 3));
      // archi: le note dell'accordo un'ottava sopra, piano piano
      this._pad([th, f + 12, b + 24], t0, BAR);
      // la melodia suona per due giri, poi al terzo lascia spazio al solo accompagnamento
      if (this._loop % 3 !== 2) for (const [beat, n, dur] of MELODY[i]) this._piano(n, t0 + beat * BEAT, 0.62, dur * BEAT + 1.2);
      this._next += BAR;
      this._bar++;
      if (this._bar % 8 === 0) this._loop++;
    }
  }

  /** una nota di pianoforte: attacco netto e lunga coda, con un leggero colpo di martelletto */
  _piano(m, t, vel, len) {
    const ctx = this.audio.ctx, f = hz(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 1.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(6000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + 1.2);
    const parts = [[1, 'triangle', 1], [2, 'sine', 0.45], [3, 'sine', 0.16], [4.01, 'sine', 0.07]];
    for (const [mul, type, amp] of parts) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul; o.detune.value = (Math.random() - 0.5) * 6;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + len + 1.6);
    }
    lp.connect(g); g.connect(this.bus);
  }

  /** archi: tre dente di sega leggermente stonati, filtrati e con attacco lento */
  _pad(notes, t, len) {
    const ctx = this.audio.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + len * 0.45);
    g.gain.linearRampToValueAtTime(0.0001, t + len + 0.8);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.4;
    for (const m of notes) for (const d of [-7, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = d;
      o.connect(lp); o.start(t); o.stop(t + len + 0.9);
    }
    lp.connect(g); g.connect(this.bus);
  }
}
