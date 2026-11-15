// Il binocolo: la fotocamera del telefono dentro due oculari d'epoca.
// All'inizio la luce non c'è: bisogna alzarsi e camminare davvero (contapassi
// dall'accelerometro), qualche passo avanti e poi a destra, nella stanza accanto.
// Lì la luce appare nel mondo reale, "agganciata" a una direzione; tenuta al
// centro va a fuoco e la fotocamera lascia il posto a una strada di campagna
// dove Livia arriva da lontano con la lanterna.
import * as THREE from 'three';

const HALF_FOV = THREE.MathUtils.degToRad(19); // metà del campo visivo dell'oculare
const HOLD = 2.6;                               // secondi da tenere la luce al centro
const STEPS_AHEAD = 4, STEPS_RIGHT = 3;         // il percorso a L
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** Contapassi: picchi dell'accelerazione mentre si cammina. */
class StepCounter {
  constructor() { this.steps = 0; this.events = 0; this._h = (e) => this._motion(e); }
  start() { this.steps = 0; this.events = 0; this.g = null; this.s = 0; this.up = false; this.last = 0; window.addEventListener('devicemotion', this._h); }
  stop() { window.removeEventListener('devicemotion', this._h); }
  _motion(e) {
    let lin;
    const a = e.acceleration;
    if (a && a.x != null) lin = Math.hypot(a.x, a.y, a.z);
    else {
      const ag = e.accelerationIncludingGravity;
      if (!ag || ag.x == null) return;
      const m = Math.hypot(ag.x, ag.y, ag.z);
      this.g = this.g == null ? m : this.g * 0.92 + m * 0.08; // stima della gravità
      lin = Math.abs(m - this.g);
    }
    this.events++;
    this.s = this.s * 0.6 + lin * 0.4;
    const now = performance.now();
    if (!this.up && this.s > 1.1 && now - this.last > 330) this.up = true;
    else if (this.up && this.s < 0.45) { this.up = false; this.last = now; this.steps++; this.onStep?.(this.steps); }
  }
}

export class Scope {
  constructor(controls, camera) {
    this.controls = controls;
    this.camera = camera;
    this.el = document.getElementById('scope');
    this.video = document.getElementById('scope-video');
    this.canvas = document.getElementById('scope-canvas');
    this.g = this.canvas.getContext('2d');
    this.msg = document.getElementById('scope-msg');
    this.skipBtn = document.getElementById('scope-skip');
    this.isOpen = false;
    this.onReveal = null;
    this.walker = new StepCounter();
    this._q = new THREE.Quaternion();
    this._d = new THREE.Vector3();

    // senza giroscopio si guarda intorno trascinando il dito
    let last = null;
    this.canvas.addEventListener('pointerdown', (e) => { last = { x: e.clientX, y: e.clientY }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!last || this.controls.gyro) return;
      this.controls.yaw += (e.clientX - last.x) * 0.0035;
      this.controls.pitch = Math.max(-1.2, Math.min(1.2, this.controls.pitch + (e.clientY - last.y) * 0.0035));
      last = { x: e.clientX, y: e.clientY };
    });
    const up = () => { last = null; };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    this.skipBtn.addEventListener('click', () => this._found(true));
    window.addEventListener('resize', () => this.isOpen && this._layout());
  }

  /** direzione orizzontale reale del telefono (anche in modalità «Inclina») */
  _heading() {
    const q = this.controls.gyro ? this.controls.deviceQ : this.camera.quaternion;
    const f = this._d.set(0, 0, -1).applyQuaternion(q);
    return Math.atan2(-f.x, -f.z);
  }

  async open() {
    this.isOpen = true;
    this.el.hidden = false;
    this.hold = 0;
    this.revealed = false;
    this.revealT = 0;
    this.target = null;
    this.vis = 0;
    this.phase = 'ahead';
    this.skipBtn.hidden = true;
    this.video.style.opacity = '1';
    this._layout();
    this.heading0 = this._heading();
    this._say('La luce non è qui. Alzati in piedi, tieni il telefono davanti agli occhi come un binocolo e cammina in avanti per qualche passo.');
    this.walker.onStep = (n) => this._onStep(n);
    this.walker.start();
    // chi non può alzarsi (o un telefono senza contapassi) ha comunque un modo di proseguire
    this._skipT = setTimeout(() => { if (this.isOpen && !this.target) this.skipBtn.hidden = false; }, 9000);
    this.hasCamera = await this._startCamera();
    if (!this.isOpen) { this._stopCamera(); return; }
    this.video.hidden = !this.hasCamera;
    const loop = (t) => {
      if (!this.isOpen) return;
      const dt = Math.min(0.1, (t - (this._t || t)) / 1000);
      this._t = t;
      this._frame(dt, t / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this._t = 0;
    this.raf = requestAnimationFrame(loop);
  }

  close() {
    this.isOpen = false;
    this.el.hidden = true;
    clearTimeout(this._skipT);
    cancelAnimationFrame(this.raf);
    this.walker.stop();
    this._stopCamera();
  }

  _say(t) { this.msg.textContent = t; }

  _onStep(n) {
    if (this.phase === 'ahead') {
      if (n >= STEPS_AHEAD) {
        this.phase = 'turn';
        if (navigator.vibrate) navigator.vibrate(30);
        this._say('Ora girati verso destra: c’è una stanza accanto. Entra.');
      } else this._say(`Avanti… ${'● '.repeat(n)}${'○ '.repeat(STEPS_AHEAD - n)}`);
    } else if (this.phase === 'right') {
      const k = n - this.stepsAtTurn;
      if (k >= STEPS_RIGHT) this._found(false);
      else this._say(`Entra nella stanza… ${'● '.repeat(k)}${'○ '.repeat(STEPS_RIGHT - k)}`);
    }
  }

  /** controlla la svolta a destra rispetto alla direzione di partenza */
  _checkTurn() {
    const rel = wrap(this.heading0 - this._heading()) * 57.3; // positivo = verso destra
    if (this.phase === 'turn') {
      if (rel > 50 && rel < 160) {
        this.phase = 'right';
        this.stepsAtTurn = this.walker.steps;
        if (navigator.vibrate) navigator.vibrate(20);
        this._say('Così. Adesso entra, ancora qualche passo.');
      } else if (rel < -40) this._say('Dall’altra parte: verso destra.');
    } else if (this.phase === 'right' && rel < 25) {
      this.phase = 'turn';
      this._say('Torna a girarti verso destra.');
    }
  }

  /** la luce compare: un po' a destra di dove guardi, appena sopra l'orizzonte */
  _found(skipped) {
    if (this.target) return;
    this.phase = 'found';
    this.skipBtn.hidden = true;
    clearTimeout(this._skipT);
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const yaw = Math.atan2(-f.x, -f.z) - THREE.MathUtils.degToRad(skipped ? 38 : 18);
    const pitch = THREE.MathUtils.degToRad(2);
    this.target = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
    this._say(skipped ? 'Cerca una luce, un po’ più a destra. Tienila al centro.' : 'C’è qualcosa, laggiù… una luce. Tienila al centro, ferma.');
  }

  async _startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch {
      return false;
    }
  }

  _stopCamera() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  _layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    // due oculari affiancati che si sovrappongono un poco
    this.R = Math.min((w - 28) / 3.24 - 6, h * 0.3); // i due oculari, anelli compresi, stanno nello schermo
    this.cx = w / 2; this.cy = h * 0.44;
    this.off = this.R * 0.62;
    // il video copre entrambi gli oculari; il resto lo nasconde la maschera
    const vw = (this.off + this.R) * 2, vh = this.R * 2;
    Object.assign(this.video.style, { width: vw + 'px', height: vh + 'px', left: this.cx - vw / 2 + 'px', top: this.cy - this.R + 'px', borderRadius: '0' });
    // maschera: tutto nero tranne i due cerchi
    this.mask = document.createElement('canvas');
    this.mask.width = this.canvas.width; this.mask.height = this.canvas.height;
    const m = this.mask.getContext('2d');
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.fillStyle = '#060302'; m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = 'destination-out';
    for (const s of [-1, 1]) { m.beginPath(); m.arc(this.cx + s * this.off, this.cy, this.R, 0, Math.PI * 2); m.fill(); }
    m.globalCompositeOperation = 'source-over';
    // anelli d'ottone solo sul bordo esterno
    for (const s of [-1, 1]) {
      m.save();
      m.beginPath(); m.rect(0, 0, w, h); m.arc(this.cx - s * this.off, this.cy, this.R + 2, 0, Math.PI * 2); m.clip('evenodd');
      m.lineWidth = 12; m.strokeStyle = '#7a5418'; m.beginPath(); m.arc(this.cx + s * this.off, this.cy, this.R + 6, 0, Math.PI * 2); m.stroke();
      m.lineWidth = 2; m.strokeStyle = '#e8c070'; m.beginPath(); m.arc(this.cx + s * this.off, this.cy, this.R + 1, 0, Math.PI * 2); m.stroke();
      m.restore();
    }
  }

  /** posizione della luce sullo schermo; null se è dietro di te */
  _project() {
    this._q.copy(this.camera.quaternion).invert();
    const d = this._d.copy(this.target).applyQuaternion(this._q);
    if (d.z >= -0.05) return { behind: true, x: d.x, y: d.y };
    const k = this.R / Math.tan(HALF_FOV);
    return { x: this.cx + (d.x / -d.z) * k, y: this.cy - (d.y / -d.z) * k, ang: Math.atan2(Math.hypot(d.x, d.y), -d.z) };
  }

  _frame(dt, t) {
    const { g, w, h, cx, cy, R } = this;
    const X = R + this.off;
    g.clearRect(0, 0, w, h);
    if (!this.target) this._checkTurn();
    if (!this.hasCamera && this.revealT < 2) this._drawValley();
    const p = this.target ? this._project() : { behind: true, x: 0, y: 0 };
    if (this.target) this.vis = Math.min(1, this.vis + dt / 3.5); // la luce emerge piano
    const near = this.target && this.vis > 0.5 && !p.behind && p.ang < THREE.MathUtils.degToRad(2.6);
    if (!this.revealed) {
      this.hold = near ? this.hold + dt : Math.max(0, this.hold - dt * 1.5);
      if (this.hold >= HOLD) this._reveal();
    } else this.revealT += dt;
    const focus = this.revealed ? 1 : Math.min(1, this.hold / HOLD);
    // fuori fuoco finché la luce non resta al centro; poi la fotocamera sfuma
    const fade = this.revealed ? Math.min(1, this.revealT / 1.8) : 0;
    this.video.style.filter = `sepia(0.55) saturate(0.8) contrast(1.08) brightness(0.82) blur(${(2.2 * (1 - focus)).toFixed(2)}px)`;
    this.video.style.opacity = String(1 - fade);
    if (fade >= 1 && this.stream) this._stopCamera();

    g.save();
    g.beginPath();
    g.arc(cx - this.off, cy, R, 0, Math.PI * 2); g.moveTo(cx + this.off + R, cy); g.arc(cx + this.off, cy, R, 0, Math.PI * 2);
    g.clip();
    // la luce nel mondo reale
    if (this.target && !p.behind && fade < 1) {
      const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7);
      const size = (6 + focus * 6) * flick * (0.4 + 0.6 * this.vis);
      const blur = (1 - focus) * 10;
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4 + blur);
      const a = this.vis * (1 - fade);
      gr.addColorStop(0, `rgba(255,240,200,${a})`);
      gr.addColorStop(0.15, `rgba(255,190,90,${0.9 * a})`);
      gr.addColorStop(0.45, `rgba(255,120,40,${0.25 * a})`);
      gr.addColorStop(1, 'rgba(255,100,30,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(p.x, p.y, size * 4 + blur, 0, Math.PI * 2); g.fill();
    }
    // rivelata: la strada di campagna con Livia che arriva
    if (this.revealed) {
      g.globalAlpha = fade;
      this._drawRoad(cx, cy, X, R, t);
      g.globalAlpha = 1;
    }
    // vignetta morbida unica, ellittica sui due oculari (due vignette separate
    // si sommerebbero nella zona in comune creando una fascia scura)
    g.save();
    g.translate(cx, cy); g.scale(X / R, 1);
    const v = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.02);
    v.addColorStop(0, 'rgba(10,6,4,0)'); v.addColorStop(1, 'rgba(10,6,4,0.6)');
    g.fillStyle = v; g.fillRect(-R, -R, R * 2, R * 2);
    g.restore();
    // messa a fuoco: arco che si riempie al centro
    if (!this.revealed && this.hold > 0.05) {
      g.strokeStyle = 'rgba(255,214,140,0.9)'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, R * 0.14, -Math.PI / 2, -Math.PI / 2 + (this.hold / HOLD) * Math.PI * 2); g.stroke();
    }
    g.restore();

    // tutto il resto è il buio dei tubi
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.mask, 0, 0);
    g.restore();
    // bagliore sul bordo verso la luce, quando è fuori dagli oculari
    if (this.target && !this.revealed && this.vis > 0.3) {
      let dx, dy, show = false;
      if (p.behind) { dx = p.x; dy = p.y; show = true; } else if (Math.hypot(p.x - cx, p.y - cy) > R * 0.95) { dx = p.x - cx; dy = -(p.y - cy); show = true; }
      if (show) {
        const a = Math.atan2(-dy, dx), ex = cx + Math.cos(a) * (R + this.off * Math.abs(Math.cos(a)) - 18), ey = cy + Math.sin(a) * (R - 18);
        const eg = g.createRadialGradient(ex, ey, 0, ex, ey, 34);
        eg.addColorStop(0, `rgba(255,190,90,${(0.35 + 0.2 * Math.sin(t * 4)) * this.vis})`); eg.addColorStop(1, 'rgba(255,150,60,0)');
        g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, 34, 0, Math.PI * 2); g.fill();
      }
    }
  }

  /** La strada di campagna al crepuscolo, vista da lontano: Livia arriva con la lanterna. */
  _drawRoad(cx, cy, X, R, t) {
    const g = this.g;
    const top = cy - R, bot = cy + R, hz = cy - R * 0.12; // orizzonte
    // cielo
    const sky = g.createLinearGradient(0, top, 0, hz);
    sky.addColorStop(0, '#1a1230'); sky.addColorStop(0.55, '#5a2a44'); sky.addColorStop(1, '#d8763a');
    g.fillStyle = sky; g.fillRect(cx - X, top, X * 2, hz - top + 2);
    g.fillStyle = 'rgba(255,240,220,0.6)';
    for (let i = 0; i < 26; i++) { const sx = cx - X + ((i * 97) % (X * 2)), sy = top + ((i * 53) % (R * 0.5)); g.fillRect(sx, sy, 1.2, 1.2); }
    // colline lontane e vicine
    const hills = (yb, amp, f, col) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(cx - X, bot);
      for (let x = -X; x <= X; x += 4) g.lineTo(cx + x, yb - Math.abs(Math.sin(x * f + 1.3)) * amp - Math.sin(x * f * 2.7) * amp * 0.3);
      g.lineTo(cx + X, bot); g.fill();
    };
    hills(hz + 2, R * 0.16, 0.018, '#3a2438');
    hills(hz + 10, R * 0.08, 0.03, '#241824');
    // campi
    const field = g.createLinearGradient(0, hz, 0, bot);
    field.addColorStop(0, '#2a2418'); field.addColorStop(1, '#100c08');
    g.fillStyle = field; g.fillRect(cx - X, hz + 10, X * 2, bot - hz);
    // la strada bianca che scende dall'orizzonte serpeggiando verso di noi
    const vx = cx + X * 0.12;
    const roadX = (u) => vx + Math.sin(u * 3.2) * X * 0.18 * u - X * 0.12 * u; // u: 0 orizzonte → 1 primo piano
    const roadY = (u) => hz + 12 + (bot - hz - 12) * u * u;
    const roadW = (u) => 2 + X * 0.55 * u * u;
    g.fillStyle = '#7a6650';
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40; g.lineTo(roadX(u) - roadW(u) / 2, roadY(u)); }
    for (let i = 40; i >= 0; i--) { const u = i / 40; g.lineTo(roadX(u) + roadW(u) / 2, roadY(u)); }
    g.fill();
    // cipressi lungo la strada
    for (let i = 0; i < 9; i++) {
      const u = 0.12 + i * 0.1, side = i % 2 ? 1 : -1;
      const x = roadX(u) + side * (roadW(u) / 2 + 8 + u * 30), y = roadY(u), hgt = 10 + u * u * 150;
      g.fillStyle = '#0e140e';
      g.beginPath(); g.moveTo(x, y - hgt); g.quadraticCurveTo(x + hgt * 0.16, y - hgt * 0.4, x, y); g.quadraticCurveTo(x - hgt * 0.16, y - hgt * 0.4, x, y - hgt); g.fill();
    }
    // Livia: parte lontanissima e si avvicina lentamente
    const prog = Math.min(1, this.revealT / 32);
    const u = 0.08 + 0.55 * Math.pow(prog, 0.85);
    const lx = roadX(u), ly = roadY(u);
    const sz = 4 + 30 * u * u * 2.2;
    const bob = Math.sin(t * 5) * sz * 0.03;
    // alone della lanterna sulla strada
    const halo = g.createRadialGradient(lx + sz * 0.35, ly - sz * 0.9, 0, lx + sz * 0.35, ly - sz * 0.9, sz * 3.2);
    halo.addColorStop(0, 'rgba(255,200,110,0.55)'); halo.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(lx + sz * 0.35, ly - sz * 0.9, sz * 3.2, 0, Math.PI * 2); g.fill();
    // la figura: abito lungo, scialle, capelli raccolti
    g.fillStyle = '#120a08';
    g.beginPath(); g.moveTo(lx - sz * 0.32, ly + bob); g.quadraticCurveTo(lx - sz * 0.2, ly - sz * 0.6, lx - sz * 0.12, ly - sz * 1.15 + bob); g.lineTo(lx + sz * 0.12, ly - sz * 1.15 + bob); g.quadraticCurveTo(lx + sz * 0.2, ly - sz * 0.6, lx + sz * 0.32, ly + bob); g.fill();
    g.beginPath(); g.arc(lx, ly - sz * 1.3 + bob, sz * 0.14, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(lx, ly - sz * 1.43 + bob, sz * 0.09, 0, Math.PI * 2); g.fill();
    // il braccio teso e la lanterna
    g.strokeStyle = '#120a08'; g.lineWidth = Math.max(1, sz * 0.07);
    g.beginPath(); g.moveTo(lx + sz * 0.08, ly - sz * 1.0 + bob); g.lineTo(lx + sz * 0.35, ly - sz * 0.8 + bob); g.stroke();
    const fl = 0.85 + 0.15 * Math.sin(t * 11);
    const lg = g.createRadialGradient(lx + sz * 0.38, ly - sz * 0.72 + bob, 0, lx + sz * 0.38, ly - sz * 0.72 + bob, sz * 0.6);
    lg.addColorStop(0, `rgba(255,245,210,${fl})`); lg.addColorStop(0.3, 'rgba(255,190,90,0.8)'); lg.addColorStop(1, 'rgba(255,140,50,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(lx + sz * 0.38, ly - sz * 0.72 + bob, sz * 0.6, 0, Math.PI * 2); g.fill();
  }

  // senza fotocamera: una valle dipinta che si sposta con lo sguardo
  _drawValley() {
    const { g, cx, cy, R } = this;
    const X = R + this.off; // metà larghezza dei due oculari insieme
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const yaw = Math.atan2(-f.x, -f.z), pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
    const k = R / Math.tan(HALF_FOV);
    const horizon = cy + Math.tan(pitch) * k;
    g.save();
    g.beginPath(); g.rect(cx - X, cy - R, X * 2, R * 2); g.clip();
    const sky = g.createLinearGradient(0, horizon - R * 2, 0, horizon);
    sky.addColorStop(0, '#2a1626'); sky.addColorStop(0.7, '#8a3a22'); sky.addColorStop(1, '#d8762a');
    g.fillStyle = sky; g.fillRect(cx - X, cy - R, X * 2, R * 2);
    g.fillStyle = '#1a0e10';
    g.beginPath(); g.moveTo(cx - X, cy + R);
    for (let x = -X; x <= X; x += 6) {
      const a = yaw + (x / k);
      g.lineTo(cx + x, horizon - 18 - Math.sin(a * 5) * 14 - Math.sin(a * 13 + 1) * 6);
    }
    g.lineTo(cx + X, cy + R); g.fill();
    g.fillStyle = '#0c0608';
    g.beginPath(); g.moveTo(cx - X, cy + R);
    for (let x = -X; x <= X; x += 6) {
      const a = yaw + (x / k);
      g.lineTo(cx + x, horizon + 10 - Math.sin(a * 3 + 2) * 10);
    }
    g.lineTo(cx + X, cy + R); g.fill();
    g.restore();
  }

  _reveal() {
    this.revealed = true;
    this.walker.stop();
    if (navigator.vibrate) navigator.vibrate([30, 80, 30]);
    this._say('È lei. Livia, con una lanterna in mano, lungo la strada verso la villa.');
    setTimeout(() => { if (this.isOpen) this._say('Ogni sera, al tramonto, lui accendeva le candele perché lei trovasse la strada di casa. Stasera la luce l’hai vista tu.'); }, 6000);
    this.onReveal?.();
  }
}
