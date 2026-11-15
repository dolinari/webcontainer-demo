// Sguardo: giroscopio (deviceorientation) con fallback a trascinamento touch/mouse.
import * as THREE from 'three';

const ZEE = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° attorno a X
const DEG = Math.PI / 180;

export class LookControls {
  constructor(camera, dom) {
    this.camera = camera;
    this.gyro = false;
    this.yaw = 0;      // senza giroscopio: yaw assoluto; con giroscopio: offset di yaw
    this.pitch = 0;
    this.device = null;
    this.deviceQ = new THREE.Quaternion();
    this.aim = null;
    this.onTap = null;
    this._e = new THREE.Euler();
    this._tq = new THREE.Quaternion();
    this.tiltOnly = false;
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();

    let down = null;
    dom.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: 0 }; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
      down.lx = e.clientX; down.ly = e.clientY;
      down.moved += Math.abs(dx) + Math.abs(dy);
      const k = 0.0042;
      this.yaw += dx * k;
      if (!this.gyro) this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + dy * k));
      if (down.moved > 12) this.aim = null;
    });
    const up = (e) => {
      if (down && down.moved < 12 && performance.now() - down.t < 600 && e.type === 'pointerup') this.onTap?.(e.clientX, e.clientY);
      down = null;
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /** Da chiamare dentro un gesto dell'utente (iOS 13+ richiede il permesso esplicito). */
  async enableGyro() {
    if (typeof DeviceOrientationEvent === 'undefined') return false;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return false;
      }
    } catch { return false; }
    // alcuni Android economici non hanno un giroscopio vero: il browser ricava
    // l'orientamento da accelerometro e bussola, un segnale molto più rumoroso
    const motion = (e) => {
      const r = e.rotationRate;
      this.noGyroscope = !r || (r.alpha == null && r.beta == null && r.gamma == null);
      this.absolute = null;
      window.removeEventListener('devicemotion', motion);
    };
    window.addEventListener('devicemotion', motion);
    return new Promise((resolve) => {
      let done = false;
      const handler = (e) => {
        if (e.alpha == null || e.beta == null || e.gamma == null) return;
        this.device = e;
        this.absoluteEvent = e.absolute;
        const t = e.timeStamp || performance.now();
        const dt = this._lastT ? Math.min(0.1, Math.max(0.002, (t - this._lastT) / 1000)) : 1 / 60;
        this._lastT = t;
        if (this.gyro) this._filter(dt);
        if (!done) { done = true; this._setGyro(true); resolve(true); }
      };
      window.addEventListener('deviceorientation', handler);
      setTimeout(() => { if (!done) { done = true; resolve(false); } }, 1200);
    });
  }

  _setGyro(on) {
    const yaw = this.cameraYaw();
    const f = this._v.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
    this.gyro = on;
    if (on) {
      this._computeDevice();
      this.fYaw = null; this.fTilt = null;
      this._filter(1 / 60);
      this.yaw = yaw - this._deviceYaw();
    }
    else { this.yaw = yaw; this.pitch = pitch; }
  }

  /** Modalità del movimento: 'full' (telefono), 'tilt' (solo inclinazione,
   *  ci si gira col dito o con la voce), 'off' (solo dito). */
  setMotion(mode) {
    if (mode !== 'off' && !this.device) return false;
    if (mode === 'off') { this._setGyro(false); this.mode = 'off'; return true; }
    const camYaw = this.cameraYaw();
    this.tiltOnly = mode === 'tilt';
    this.mode = mode;
    if (!this.gyro) this._setGyro(true);
    else this._filter(1 / 60);
    this.yaw = camYaw - this._deviceYaw(); // la vista non salta cambiando modalità
    return true;
  }

  _computeDevice() {
    const d = this.device;
    const orient = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * DEG;
    this._e.set(d.beta * DEG, d.alpha * DEG, -d.gamma * DEG, 'YXZ');
    this.deviceQ.setFromEuler(this._e).multiply(Q1).multiply(this._q.setFromAxisAngle(ZEE, -orient));
  }

  _deviceYaw() {
    const f = this._v.set(0, 0, -1).applyQuaternion(this.smoothQ || this.deviceQ);
    return Math.atan2(-f.x, -f.z);
  }

  cameraYaw() {
    const f = this._v.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    return Math.atan2(-f.x, -f.z);
  }

  /** Orienta subito lo sguardo verso un punto (usato all'ingresso in una scena). */
  face(target) {
    const p = this.camera.position;
    const yaw = Math.atan2(-(target.x - p.x), -(target.z - p.z));
    const pitch = Math.atan2(target.y - p.y, Math.hypot(target.x - p.x, target.z - p.z));
    if (this.gyro) { this._computeDevice(); this.yaw = yaw - this._deviceYaw(); }
    else { this.yaw = yaw; this.pitch = pitch; }
    this.aim = null;
  }

  /** Gira dolcemente verso un punto per qualche istante. */
  aimAt(target, seconds = 1.6) { this.aim = { target, t: seconds }; }

  recenter(target) { this.face(target); }

  /** Rotazione morbida dello sguardo (comandi "destra" / "sinistra"). */
  turn(delta) { this.turnLeft = (this.turnLeft || 0) + delta; this.aim = null; }

  /** true se il telefono è tenuto come all'orecchio: verticale e inclinato di lato. */
  earPose() {
    if (!this.gyro) return false;
    const q = this.deviceQ;
    const fy = this._v.set(0, 0, -1).applyQuaternion(q).y;
    const ry = this._v.set(1, 0, 0).applyQuaternion(q).y;
    const uy = this._v.set(0, 1, 0).applyQuaternion(q).y;
    const roll = Math.abs(Math.atan2(ry, uy));
    return Math.abs(fy) < 0.62 && roll > 0.5 && roll < 1.5;
  }

  /** Stabilizzazione, applicata a ogni lettura del sensore.
   *  L'orientamento viene diviso in due parti:
   *  - rotazione orizzontale (yaw): sui telefoni senza giroscopio viene dalla
   *    bussola magnetica, che in casa sbanda e salta. Qui si scartano i salti
   *    isolati, si ignorano i micro-movimenti e si filtra di più;
   *  - inclinazione (su/giù e di lato): viene dall'accelerometro, è più
   *    affidabile e resta reattiva.
   *  Entrambe usano un filtro "1 euro": forte a telefono fermo, leggero quando
   *  il telefono si muove davvero. */
  _filter(dt) {
    this._computeDevice();
    const raw = this.deviceQ;
    const f = this._v.set(0, 0, -1).applyQuaternion(raw);
    const vertical = Math.abs(f.y) > 0.92; // guardando quasi in verticale lo yaw non è affidabile
    const yawRaw = Math.atan2(-f.x, -f.z);
    const tiltRaw = this._tq.setFromAxisAngle(Y, -yawRaw).multiply(raw);
    this._measure(yawRaw, tiltRaw, dt);
    const noisy = this.noGyroscope || this.noisy;

    // --- rotazione orizzontale ---
    if (this.fYaw == null) { this.fYaw = yawRaw; this.yawSpd = 0; this.spikes = 0; }
    let d = Math.atan2(Math.sin(yawRaw - this.fYaw), Math.cos(yawRaw - this.fYaw));
    if (vertical) d = 0;
    if (Math.abs(d) > 0.35 && this.spikes < 6) { this.spikes++; d = 0; } // salto isolato della bussola
    else if (Math.abs(d) <= 0.35) this.spikes = 0;
    if (noisy && Math.abs(d) < 0.02) d = 0; // zona morta: sotto ~1° non si muove
    const fcY = (noisy ? 0.3 : 1.2) + (noisy ? 0.02 : 0.05) * this.yawSpd;
    const stepY = Math.abs(d) > 1 ? d : d * (1 - Math.exp(-2 * Math.PI * fcY * dt));
    this.fYaw += stepY;
    this.yawSpd += (Math.abs(stepY) / dt * 57.3 - this.yawSpd) * (1 - Math.exp(-2 * Math.PI * 1.5 * dt));

    // --- inclinazione ---
    if (!this.fTilt) { this.fTilt = tiltRaw.clone(); this.tiltSpd = 0; this._pt = new THREE.Quaternion(); }
    const jump = this.fTilt.angleTo(tiltRaw);
    const fcT = (noisy ? 0.9 : 1.6) + 0.05 * this.tiltSpd;
    const aT = jump > 0.6 ? 1 : 1 - Math.exp(-2 * Math.PI * fcT * dt);
    this._pt.copy(this.fTilt);
    this.fTilt.slerp(tiltRaw, aT);
    this.tiltSpd += (this._pt.angleTo(this.fTilt) / dt * 57.3 - this.tiltSpd) * (1 - Math.exp(-2 * Math.PI * 1.5 * dt));

    // in modalità "solo inclinazione" la rotazione orizzontale del telefono non conta
    if (!this.smoothQ) this.smoothQ = new THREE.Quaternion();
    if (this.tiltOnly) this.smoothQ.copy(this.fTilt);
    else this.smoothQ.setFromAxisAngle(Y, this.fYaw).multiply(this.fTilt);
  }

  // misura il rumore reale del sensore (mediana degli scatti tra una lettura e l'altra)
  _measure(yawRaw, tiltRaw, dt) {
    const st = this.stats || (this.stats = { n: 0, t0: performance.now(), yaw: [], tilt: [], rate: 0 });
    if (st.lastYaw != null) {
      st.yaw.push(Math.abs(Math.atan2(Math.sin(yawRaw - st.lastYaw), Math.cos(yawRaw - st.lastYaw))) * 57.3);
      st.tilt.push(st.lastTilt.angleTo(tiltRaw) * 57.3);
      if (st.yaw.length > 120) { st.yaw.shift(); st.tilt.shift(); }
    }
    st.lastYaw = yawRaw;
    st.lastTilt = (st.lastTilt || new THREE.Quaternion()).copy(tiltRaw);
    st.n++;
    st.rate += (1 / dt - st.rate) * 0.05;
    const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1] || 0; };
    st.yawNoise = med(st.yaw); st.tiltNoise = med(st.tilt);
    // dopo un paio di secondi: se il sensore è rumoroso, filtra come se mancasse il giroscopio
    if (!this.noisy && st.yaw.length >= 100 && st.yawNoise > 0.3) { this.noisy = true; this.onNoisy?.(); }
  }

  update(dt) {
    if (this.aim) {
      const p = this.camera.position, tg = this.aim.target;
      const wantYaw = Math.atan2(-(tg.x - p.x), -(tg.z - p.z));
      const cur = this.gyro ? this.yaw + this._deviceYaw() : this.yaw;
      let d = wantYaw - cur;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const k = Math.min(1, dt * 3.5);
      this.yaw += d * k;
      if (!this.gyro) {
        const wantPitch = Math.atan2(tg.y - p.y, Math.hypot(tg.x - p.x, tg.z - p.z));
        this.pitch += (wantPitch - this.pitch) * k;
      }
      this.aim.t -= dt;
      if (this.aim.t <= 0) this.aim = null;
    }
    if (this.turnLeft) {
      const step = Math.sign(this.turnLeft) * Math.min(Math.abs(this.turnLeft), dt * 2.4);
      this.yaw += step;
      this.turnLeft -= step;
      if (Math.abs(this.turnLeft) < 1e-4) this.turnLeft = 0;
    }
    if (this.gyro && this.device) {
      this.camera.quaternion.setFromAxisAngle(Y, this.yaw).multiply(this.smoothQ || this.deviceQ);
    } else {
      this._e.set(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this._e);
    }
  }
}
