// Audio interamente sintetizzato (Web Audio): vento, stanza, carillon, effetti. Più il microfono per il soffio.

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

    // carillon: voce + piccola eco
    this.boxGain = ctx.createGain(); this.boxGain.gain.value = 0.12;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    this.boxIn = ctx.createGain();
    this.boxIn.connect(hp); hp.connect(this.boxGain);
    hp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(this.boxGain);
    this.boxGain.connect(this.master);
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
    this.roomGain.gain.setTargetAtTime(kind === 'ext' ? 0 : 0.5, t, 0.8);
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

  stopMusicBox() {
    this.playing = false;
    clearInterval(this._timer);
  }

  /** 0 = lontano, 1 = orecchio sul carillon */
  setListen(k) {
    if (!this.ctx) return;
    this.boxGain.gain.setTargetAtTime(0.1 + 0.9 * k, this.ctx.currentTime, 0.18);
    this.roomGain.gain.setTargetAtTime(0.5 * (1 - 0.7 * k), this.ctx.currentTime, 0.3);
  }

  /** piccolo rumore percussivo: tasto della macchina da scrivere / candela che si spegne */
  click(kind = 'key') {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 'key') {
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
  off() {
    if (this.track) { this.track.stop(); this.track = null; }
  }
}
