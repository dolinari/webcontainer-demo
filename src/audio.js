// Audio interamente sintetizzato (Web Audio): vento, stanza, carillon, effetti. Più il microfono per il soffio.

const BOX_FAR = 0.035; // volume del carillon a telefono lontano dall'orecchio

function softClip(k) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}

// valzer in re minore: [nota MIDI, durata in battiti] per battuta da 3/4
const WALTZ_MELODY = [
  [[69, 2], [74, 1]], [[74, 2], [70, 1]], [[72, 1.5], [70, 0.5], [69, 1]], [[69, 3]],
  [[70, 2], [74, 1]], [[79, 2], [77, 1]], [[76, 1], [73, 1], [76, 1]], [[74, 3]],
  [[77, 2], [76, 1]], [[74, 2], [70, 1]], [[72, 1], [76, 1], [79, 1]], [[77, 3]],
  [[74, 1.5], [72, 0.5], [70, 1]], [[70, 1], [69, 1], [67, 1]], [[69, 1], [73, 1], [76, 1]], [[74, 3]],
];
const CH = { Dm: [38, [62, 65, 69]], Gm: [43, [62, 67, 70]], C: [36, [60, 64, 67]], F: [41, [60, 65, 69]], Bb: [34, [62, 65, 70]], A7: [33, [61, 64, 67]] };
const WALTZ_CHORDS = ['Dm', 'Gm', 'C', 'F', 'Bb', 'Gm', 'A7', 'Dm', 'Dm', 'Gm', 'C', 'F', 'Bb', 'Gm', 'A7', 'Dm'];
function waltzEvents() {
  const ev = [];
  WALTZ_MELODY.forEach((bar, i) => {
    let t = i * 3;
    for (const [m, d] of bar) { ev.push({ t, kind: 'v', m, d }); t += d; }
    const [bass, chord] = CH[WALTZ_CHORDS[i]];
    ev.push({ t: i * 3, kind: 'b', m: bass });
    for (const beat of [1, 2]) for (const m of chord) ev.push({ t: i * 3 + beat, kind: 'p', m: m - 12 });
  });
  ev.sort((a, b) => a.t - b.t);
  ev.loopBeats = WALTZ_MELODY.length * 3 + 3; // una battuta di pausa prima di ricominciare
  return ev;
}

const MELODY = [
  81, 88, 84, 88, 93, 88,
  77, 84, 81, 84, 89, 84,
  76, 84, 79, 84, 88, 84,
  76, 83, 80, 83, 88, 83,
  81, 88, 84, 88, 96, 93,
  74, 86, 81, 86, 89, 86,
  76, 83, 80, 86, 83, 80,
  81, 84, 88, 93, null, null,
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.playing = false;
    this.micLevel = 0;
    this.micOn = false;
    this.blowAmount = 0;
  }

  /** Va chiamato dentro un gesto dell'utente (tap), altrimenti il browser lo blocca. */
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    // rumore di base condiviso
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    this.noiseBuf = buf;

    // vento (esterno)
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lg = ctx.createGain(); lg.gain.value = 180; lfo.connect(lg); lg.connect(wf.frequency); lfo.start();
    this._noise().connect(wf); wf.connect(this.windGain); this.windGain.connect(this.master);

    // tono della stanza (interno)
    this.roomGain = ctx.createGain(); this.roomGain.gain.value = 0;
    const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 140;
    this._noise().connect(rf); rf.connect(this.roomGain); this.roomGain.connect(this.master);

    // carillon, due percorsi:
    //  - "lontano": suono pulito con un filo di eco, quasi impercettibile
    //  - "all'orecchio": come una telefonata o un walkie-talkie (banda stretta,
    //    saturazione, compressione, fruscio)
    this.boxIn = ctx.createGain();
    this.boxGain = ctx.createGain(); this.boxGain.gain.value = BOX_FAR;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    this.boxIn.connect(hp); hp.connect(this.boxGain);
    hp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(this.boxGain);
    this.boxGain.connect(this.master);

    const lo = ctx.createBiquadFilter(); lo.type = 'highpass'; lo.frequency.value = 450; lo.Q.value = 0.9;
    const hi = ctx.createBiquadFilter(); hi.type = 'lowpass'; hi.frequency.value = 2800; hi.Q.value = 0.9;
    const nasal = ctx.createBiquadFilter(); nasal.type = 'peaking'; nasal.frequency.value = 1500; nasal.Q.value = 1.2; nasal.gain.value = 9;
    const drive = ctx.createGain(); drive.gain.value = 5;
    const clip = ctx.createWaveShaper(); clip.curve = softClip(2.5); clip.oversample = '2x';
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -30; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.15;
    this.radioGain = ctx.createGain(); this.radioGain.gain.value = 0;
    this.boxIn.connect(lo); lo.connect(hi); hi.connect(nasal); nasal.connect(drive); drive.connect(clip);
    clip.connect(comp); comp.connect(this.radioGain); this.radioGain.connect(this.master);

    // fruscio della linea, con piccole oscillazioni di intensità
    const hiss = ctx.createBiquadFilter(); hiss.type = 'bandpass'; hiss.frequency.value = 2200; hiss.Q.value = 0.6;
    this.staticGain = ctx.createGain(); this.staticGain.gain.value = 0;
    this._noise().connect(hiss); hiss.connect(this.staticGain); this.staticGain.connect(this.master);
    this.listenK = 0;

    // grammofono: tutto passa da un filtro "a tromba" con un po' di saturazione
    this.gramoIn = ctx.createGain();
    const ghp = ctx.createBiquadFilter(); ghp.type = 'highpass'; ghp.frequency.value = 150;
    const glp = ctx.createBiquadFilter(); glp.type = 'lowpass'; glp.frequency.value = 4200;
    const gpk = ctx.createBiquadFilter(); gpk.type = 'peaking'; gpk.frequency.value = 1100; gpk.Q.value = 0.8; gpk.gain.value = 4;
    const gsat = ctx.createWaveShaper(); gsat.curve = softClip(1.6);
    const gdel = ctx.createDelay(1); gdel.delayTime.value = 0.09;
    const gfb = ctx.createGain(); gfb.gain.value = 0.18;
    this.gramoGain = ctx.createGain(); this.gramoGain.gain.value = 0;
    this.gramoIn.connect(ghp); ghp.connect(glp); glp.connect(gpk); gpk.connect(gsat); gsat.connect(this.gramoGain);
    gsat.connect(gdel); gdel.connect(gfb); gfb.connect(gdel); gdel.connect(this.gramoGain);
    this.gramoGain.connect(this.master);
    // fruscio del disco
    const crf = ctx.createBiquadFilter(); crf.type = 'bandpass'; crf.frequency.value = 3500; crf.Q.value = 0.5;
    this.hissGain = ctx.createGain(); this.hissGain.gain.value = 0;
    this._noise().connect(crf); crf.connect(this.hissGain); this.hissGain.connect(this.gramoGain);

    // camino: crepitio
    this.fireGain = ctx.createGain(); this.fireGain.gain.value = 0;
    const fr = ctx.createBiquadFilter(); fr.type = 'lowpass'; fr.frequency.value = 500;
    this._noise().connect(fr); fr.connect(this.fireGain); this.fireGain.connect(this.master);
    this.fireLevel = 0;
  }

  _noise() {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true; s.start();
    return s;
  }

  setMuted(m) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.1);
  }

  setAmbience(kind) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(kind === 'ext' ? 0.5 : 0.05, t, 0.8);
    this.roomGain.gain.setTargetAtTime(kind === 'ext' ? 0 : kind === 'dining' ? 0.22 : 0.5, t, 0.8);
    if (kind !== 'dining') { this.setGramophoneLevel(0); this.tickFire(0); }
  }

  _note(midi, when, vel = 1) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.5 * vel, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, when + 1.6);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 3.01;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.22, when); g2.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.boxIn);
    o1.start(when); o2.start(when); o1.stop(when + 1.7); o2.stop(when + 0.4);
  }

  startMusicBox() {
    if (!this.ctx || this.playing) return;
    this.playing = true;
    this._step = 0;
    this._next = this.ctx.currentTime + 0.15;
    this._timer = setInterval(() => {
      while (this._next < this.ctx.currentTime + 0.35) {
        const n = MELODY[this._step % MELODY.length];
        if (n != null) this._note(n, this._next, this._step % 6 === 0 ? 1 : 0.7);
        this._next += 0.27 + (Math.random() - 0.5) * 0.012;
        this._step++;
      }
    }, 100);
  }

  // ---- grammofono: un valzer lento per violino ----
  startGramophone() {
    if (!this.ctx || this.gramoOn) return;
    this.gramoOn = true;
    this.hissGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.3);
    this._gEvents = waltzEvents();
    this._gLoop = 0;
    this._gIdx = 0;
    this._gT0 = this.ctx.currentTime + 0.3;
    this._gTimer = setInterval(() => this._scheduleWaltz(), 100);
  }

  stopGramophone() {
    if (!this.gramoOn) return;
    this.gramoOn = false;
    clearInterval(this._gTimer);
    if (this.ctx) this.hissGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
  }

  /** volume del grammofono in base alla distanza (0..1) */
  setGramophoneLevel(l) {
    if (!this.ctx) return;
    this.gramoGain.gain.setTargetAtTime(0.9 * l, this.ctx.currentTime, 0.25);
  }

  _scheduleWaltz() {
    const ev = this._gEvents, beat = 0.52, loopLen = ev.length ? ev.loopBeats * beat : 1;
    const horizon = this.ctx.currentTime + 0.5;
    for (;;) {
      const e = ev[this._gIdx];
      const when = this._gT0 + this._gLoop * loopLen + e.t * beat;
      if (when > horizon) break;
      if (e.kind === 'v') this._violin(e.m, when, e.d * beat);
      else if (e.kind === 'b') this._bass(e.m, when);
      else this._pluck(e.m, when);
      if (++this._gIdx >= ev.length) { this._gIdx = 0; this._gLoop++; }
    }
    // scricchiolii casuali del disco
    if (Math.random() < 0.25) this._pop(this.ctx.currentTime + Math.random() * 0.1, 0.06 + Math.random() * 0.08, this.gramoIn);
  }

  _violin(midi, when, dur) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.11, when + 0.09);
    g.gain.linearRampToValueAtTime(0.085, when + Math.min(0.3, dur * 0.5));
    g.gain.setValueAtTime(0.085, when + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.25);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.8;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 2900; body.Q.value = 2; body.gain.value = 5;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.6;
    const vibG = ctx.createGain();
    vibG.gain.setValueAtTime(0, when); vibG.gain.linearRampToValueAtTime(f * 0.007, when + 0.25);
    vib.connect(vibG);
    for (const det of [-5, 5]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      vibG.connect(o.frequency);
      o.connect(lp); o.start(when); o.stop(when + dur + 0.3);
    }
    lp.connect(body); body.connect(g); g.connect(this.gramoIn);
    vib.start(when); vib.stop(when + dur + 0.3);
  }

  _pluck(midi, when) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.045, when + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.7);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o.connect(g); g.connect(this.gramoIn); o.start(when); o.stop(when + 0.75);
  }

  _bass(midi, when) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.16, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.95);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f * 2;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    o.connect(g); o2.connect(g); g.connect(this.gramoIn);
    o.start(when); o2.start(when); o.stop(when + 1); o2.stop(when + 1);
  }

  _pop(when, vol, dest) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = 10;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.015);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(when, Math.random() * 2); s.stop(when + 0.03);
  }

  /** crepitio del camino: livello 0..1 in base alla distanza, da chiamare a ogni frame */
  tickFire(level) {
    if (!this.ctx) return;
    if (Math.abs(level - this.fireLevel) > 0.02) {
      this.fireLevel = level;
      this.fireGain.gain.setTargetAtTime(0.12 * level, this.ctx.currentTime, 0.3);
    }
    if (level > 0.02 && Math.random() < 0.09 * level + 0.01) this._pop(this.ctx.currentTime, (0.2 + Math.random() * 0.5) * level, this.master);
  }

  /** il carillon che suona lontano, per un po', poi tace */
  distantMusicBox(seconds = 22) {
    if (!this.ctx) return;
    this.startMusicBox();
    this.boxGain.gain.setTargetAtTime(0.1, this.ctx.currentTime, 1.5);
    clearTimeout(this._distT);
    this._distT = setTimeout(() => {
      this.boxGain.gain.setTargetAtTime(0, this.ctx.currentTime, 1.5);
      setTimeout(() => { this.stopMusicBox(); this.boxGain.gain.value = BOX_FAR; }, 5000);
    }, seconds * 1000);
  }

  stopMusicBox() {
    this.playing = false;
    clearInterval(this._timer);
  }

  /** 0 = telefono lontano (carillon appena udibile), 1 = telefono all'orecchio (effetto radio) */
  setListen(k) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (k !== this.listenK) this._squelch(k > this.listenK);
    this.listenK = k;
    this.boxGain.gain.setTargetAtTime(BOX_FAR * (1 - k), t, 0.12);
    this.radioGain.gain.setTargetAtTime(1.1 * k, t + (k ? 0.12 : 0), 0.08);
    this.staticGain.gain.setTargetAtTime(0.05 * k, t + (k ? 0.12 : 0), 0.08);
    this.roomGain.gain.setTargetAtTime(0.5 * (1 - 0.85 * k), t, 0.2);
    this.windGain.gain.setTargetAtTime(0.05 * (1 - k), t, 0.2);
  }

  /** scatto di apertura/chiusura del canale, come un walkie-talkie */
  _squelch(open) {
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.playbackRate.value = 8;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.8;
    const g = ctx.createGain();
    const len = open ? 0.16 : 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(open ? 0.5 : 0.35, t + 0.01);
    g.gain.setValueAtTime(open ? 0.5 : 0.35, t + len - 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 2); s.stop(t + len + 0.02);
  }

  /** sfarfallio del fruscio mentre si ascolta: va chiamato a ogni frame */
  tickRadio() {
    if (!this.ctx || !this.listenK) return;
    if (Math.random() < 0.06) this.staticGain.gain.setTargetAtTime(0.03 + Math.random() * 0.05, this.ctx.currentTime, 0.04);
  }

  /** piccolo rumore percussivo: tasto della macchina da scrivere / candela che si spegne */
  click(kind = 'key') {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 'step' || kind === 'run') {
      const run = kind === 'run';
      f.type = 'lowpass'; f.frequency.value = (run ? 380 : 260) + Math.random() * 80;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(run ? 1.9 : 1.4, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + (run ? 0.11 : 0.16));
      s.playbackRate.value = run ? 2 : 1.5;
    } else if (kind === 'key') {
      f.type = 'bandpass'; f.frequency.value = 2200 + Math.random() * 800; f.Q.value = 2;
      g.gain.setValueAtTime(1.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      s.playbackRate.value = 6;
    } else {
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      s.playbackRate.value = 3;
    }
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 2); s.stop(t + 0.5);
  }

  // ---- microfono ----
  async startMic() {
    if (this.micOn) return true;
    if (!navigator.mediaDevices?.getUserMedia || !this.ctx) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch { return false; }
    await this.ctx.resume();
    this.micSrc = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.micSrc.connect(this.analyser); // non collegato agli altoparlanti: nessun feedback
    this.micData = new Float32Array(this.analyser.fftSize);
    this.micOn = true;
    this._floor = 0.02;
    this._above = 0;
    this._cool = 0;
    return true;
  }

  /** Chiede il permesso del microfono e lo richiude subito (resta concesso per la sessione). */
  async askMicPermission() {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      st.getTracks().forEach((t) => t.stop());
      return true;
    } catch { return false; }
  }

  stopMic() {
    if (!this.micOn) return;
    this.micOn = false;
    this.micLevel = 0;
    this.blowAmount = 0;
    try { this.micSrc.disconnect(); } catch { /* già scollegato */ }
    this.stream.getTracks().forEach((t) => t.stop());
  }

  /** Aggiorna il livello e ritorna true quando rileva un soffio (o un rumore forte). */
  pollBlow(dt) {
    if (!this.micOn) return false;
    this.analyser.getFloatTimeDomainData(this.micData);
    let sum = 0;
    for (let i = 0; i < this.micData.length; i++) sum += this.micData[i] * this.micData[i];
    const rms = Math.sqrt(sum / this.micData.length);
    this.micLevel += (rms - this.micLevel) * 0.4;
    if (rms < this._floor * 2) this._floor += (rms - this._floor) * 0.02;
    const threshold = Math.max(0.07, this._floor * 3.5 + 0.035);
    this.blowAmount = Math.min(1, this.micLevel / threshold);
    this._cool -= dt;
    if (rms > threshold) this._above += dt; else this._above = 0;
    if (this._above > 0.07 && this._cool <= 0) { this._cool = 0.75; this._above = 0; return true; }
    return false;
  }
}

/** Torcia fisica (LED) dove il browser lo consente: in pratica Chrome su Android. */
export class PhysicalTorch {
  constructor() { this.track = null; }
  get supportedGuess() { return /Android/i.test(navigator.userAgent) && !!navigator.mediaDevices?.getUserMedia; }
  async on() {
    if (!this.supportedGuess) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (!caps.torch) { track.stop(); return false; }
      await track.applyConstraints({ advanced: [{ torch: true }] });
      this.track = track;
      return true;
    } catch { return false; }
  }
  /** Chiede la fotocamera una volta all'inizio e verifica se il LED è comandabile. */
  async probe() {
    if (!this.supportedGuess) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
      const track = stream.getVideoTracks()[0];
      const ok = !!(track.getCapabilities && track.getCapabilities().torch);
      track.stop();
      return ok;
    } catch { return false; }
  }
  off() {
    if (this.track) { this.track.stop(); this.track = null; }
  }
}
