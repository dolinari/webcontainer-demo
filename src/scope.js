// Il cannocchiale: la fotocamera del telefono dentro un oculare d'epoca.
// Nel mondo reale c'è una piccola luce "agganciata" a una direzione: va cercata
// muovendo il telefono e tenuta ferma al centro del reticolo finché va a fuoco.
import * as THREE from 'three';

const HALF_FOV = THREE.MathUtils.degToRad(19); // metà del campo visivo dell'oculare
const HOLD = 2.6;                               // secondi da tenere la luce al centro

export class Scope {
  constructor(controls, camera) {
    this.controls = controls;
    this.camera = camera;
    this.el = document.getElementById('scope');
    this.video = document.getElementById('scope-video');
    this.canvas = document.getElementById('scope-canvas');
    this.g = this.canvas.getContext('2d');
    this.msg = document.getElementById('scope-msg');
    this.isOpen = false;
    this.onReveal = null;
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
    window.addEventListener('resize', () => this.isOpen && this._layout());
  }

  async open() {
    this.isOpen = true;
    this.el.hidden = false;
    this.hold = 0;
    this.revealed = false;
    this.revealT = 0;
    this._layout();
    // la luce sta un po' a destra e appena sopra l'orizzonte rispetto a dove guardi ora
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const yaw = Math.atan2(-f.x, -f.z) - THREE.MathUtils.degToRad(38);
    const pitch = THREE.MathUtils.degToRad(3);
    this.target = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    this.msg.textContent = 'Muovi il telefono per guardare nella valle. Cerca una luce.';
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
    cancelAnimationFrame(this.raf);
    this._stopCamera();
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
    this.R = Math.min(w, h * 0.8) * 0.45;
    this.cx = w / 2; this.cy = h * 0.46;
    // il video riempie il cerchio dell'oculare
    const d = this.R * 2;
    Object.assign(this.video.style, { width: d + 'px', height: d + 'px', left: this.cx - this.R + 'px', top: this.cy - this.R + 'px' });
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
    g.clearRect(0, 0, w, h);
    if (!this.hasCamera) this._drawValley();
    const p = this._project();
    const near = !p.behind && p.ang < THREE.MathUtils.degToRad(2.6);
    if (!this.revealed) {
      this.hold = near ? this.hold + dt : Math.max(0, this.hold - dt * 1.5);
      if (this.hold >= HOLD) this._reveal();
    } else this.revealT += dt;
    const focus = this.revealed ? 1 : Math.min(1, this.hold / HOLD);
    // fuori fuoco finché la luce non resta al centro
    this.video.style.filter = `sepia(0.55) saturate(0.8) contrast(1.08) brightness(0.82) blur(${(2.2 * (1 - focus)).toFixed(2)}px)`;

    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    // la luce (e, rivelata, la lanterna che cammina sul sentiero)
    if (!p.behind) {
      const bob = this.revealed ? Math.sin(t * 5) * 2 : 0;
      const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7);
      const size = (this.revealed ? 16 + Math.min(10, this.revealT * 4) : 6 + focus * 6) * flick;
      const blur = (1 - focus) * 10;
      const gr = g.createRadialGradient(p.x, p.y + bob, 0, p.x, p.y + bob, size * 4 + blur);
      gr.addColorStop(0, 'rgba(255,240,200,1)');
      gr.addColorStop(0.15, 'rgba(255,190,90,0.9)');
      gr.addColorStop(0.45, 'rgba(255,120,40,0.25)');
      gr.addColorStop(1, 'rgba(255,100,30,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(p.x, p.y + bob, size * 4 + blur, 0, Math.PI * 2); g.fill();
      if (this.revealed && this.revealT > 0.6) {
        // una figura scura accanto alla lanterna
        const a = Math.min(1, (this.revealT - 0.6) / 1.5) * 0.85;
        g.fillStyle = `rgba(20,10,6,${a})`;
        const fx = p.x - size * 1.6, fy = p.y + bob - size * 0.6;
        g.beginPath(); g.arc(fx, fy - size * 1.5, size * 0.42, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(fx - size * 0.6, fy + size * 2.4); g.lineTo(fx - size * 0.35, fy - size * 1.0); g.lineTo(fx + size * 0.35, fy - size * 1.0); g.lineTo(fx + size * 0.6, fy + size * 2.4); g.fill();
      }
    }
    // vignetta dell'oculare
    const v = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    v.addColorStop(0, 'rgba(20,10,4,0)'); v.addColorStop(1, 'rgba(20,10,4,0.75)');
    g.fillStyle = v; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    // reticolo
    g.strokeStyle = 'rgba(30,18,8,0.75)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - R * 0.08, cy); g.moveTo(cx + R * 0.08, cy); g.lineTo(cx + R, cy);
    g.moveTo(cx, cy - R); g.lineTo(cx, cy - R * 0.08); g.moveTo(cx, cy + R * 0.08); g.lineTo(cx, cy + R); g.stroke();
    for (let i = -8; i <= 8; i++) {
      if (!i) continue;
      const l = i % 4 ? 4 : 9;
      g.beginPath(); g.moveTo(cx + i * R * 0.1, cy - l); g.lineTo(cx + i * R * 0.1, cy + l); g.stroke();
      g.beginPath(); g.moveTo(cx - l, cy + i * R * 0.1); g.lineTo(cx + l, cy + i * R * 0.1); g.stroke();
    }
    g.beginPath(); g.arc(cx, cy, R * 0.08, 0, Math.PI * 2); g.stroke();
    // messa a fuoco: arco che si riempie al centro
    if (!this.revealed && this.hold > 0.05) {
      g.strokeStyle = 'rgba(255,214,140,0.9)'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, R * 0.14, -Math.PI / 2, -Math.PI / 2 + (this.hold / HOLD) * Math.PI * 2); g.stroke();
    }
    g.restore();

    // tutto il resto è il buio del tubo
    g.save();
    g.fillStyle = '#060302';
    g.beginPath(); g.rect(0, 0, w, h); g.arc(cx, cy, R, 0, Math.PI * 2, true); g.fill('evenodd');
    // anello d'ottone
    g.lineWidth = 14; g.strokeStyle = '#7a5418';
    g.beginPath(); g.arc(cx, cy, R + 7, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#e8c070';
    g.beginPath(); g.arc(cx, cy, R + 1, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(232,192,112,0.4)';
    g.beginPath(); g.arc(cx, cy, R + 14, 0, Math.PI * 2); g.stroke();
    // freccia luminosa sul bordo verso la luce, se è fuori dall'oculare
    if (!this.revealed) {
      let dx, dy, show = false;
      if (p.behind) { dx = p.x; dy = p.y; show = true; } else if (Math.hypot(p.x - cx, p.y - cy) > R * 0.95) { dx = p.x - cx; dy = -(p.y - cy); show = true; }
      if (show) {
        const a = Math.atan2(-dy, dx), ex = cx + Math.cos(a) * (R - 18), ey = cy + Math.sin(a) * (R - 18);
        const eg = g.createRadialGradient(ex, ey, 0, ex, ey, 34);
        eg.addColorStop(0, `rgba(255,190,90,${0.35 + 0.2 * Math.sin(t * 4)})`); eg.addColorStop(1, 'rgba(255,150,60,0)');
        g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, 34, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
  }

  // senza fotocamera: una valle dipinta che si sposta con lo sguardo
  _drawValley() {
    const { g, cx, cy, R } = this;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const yaw = Math.atan2(-f.x, -f.z), pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
    const k = R / Math.tan(HALF_FOV);
    const horizon = cy + Math.tan(pitch) * k;
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    const sky = g.createLinearGradient(0, horizon - R * 2, 0, horizon);
    sky.addColorStop(0, '#2a1626'); sky.addColorStop(0.7, '#8a3a22'); sky.addColorStop(1, '#d8762a');
    g.fillStyle = sky; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.fillStyle = '#1a0e10';
    g.beginPath(); g.moveTo(cx - R, cy + R);
    for (let x = -R; x <= R; x += 6) {
      const a = yaw + (x / k);
      g.lineTo(cx + x, horizon - 18 - Math.sin(a * 5) * 14 - Math.sin(a * 13 + 1) * 6);
    }
    g.lineTo(cx + R, cy + R); g.fill();
    g.fillStyle = '#0c0608';
    g.beginPath(); g.moveTo(cx - R, cy + R);
    for (let x = -R; x <= R; x += 6) {
      const a = yaw + (x / k);
      g.lineTo(cx + x, horizon + 10 - Math.sin(a * 3 + 2) * 10);
    }
    g.lineTo(cx + R, cy + R); g.fill();
    g.restore();
  }

  _reveal() {
    this.revealed = true;
    if (navigator.vibrate) navigator.vibrate([30, 80, 30]);
    this.msg.textContent = 'Laggiù, sul sentiero, una lanterna. Qualcuno sta tornando a casa.';
    setTimeout(() => { if (this.isOpen) this.msg.textContent = 'È così ogni sera, al tramonto. Adesso lo sai anche tu.'; }, 5000);
    this.onReveal?.();
  }
}
