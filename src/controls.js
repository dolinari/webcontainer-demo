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
    return new Promise((resolve) => {
      let done = false;
      const handler = (e) => {
        if (e.alpha == null || e.beta == null || e.gamma == null) return;
        this.device = e;
        if (!done) { done = true; this._setGyro(true); resolve(true); }
      };
      window.addEventListener('deviceorientation', handler);
      setTimeout(() => { if (!done) { done = true; resolve(false); } }, 1200);
    });
  }

  _setGyro(on) {
    const yaw = this.cameraYaw();
    this.gyro = on;
    if (on) { this._computeDevice(); this.yaw = yaw - this._deviceYaw(); }
  }

  _computeDevice() {
    const d = this.device;
    const orient = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * DEG;
    this._e.set(d.beta * DEG, d.alpha * DEG, -d.gamma * DEG, 'YXZ');
    this.deviceQ.setFromEuler(this._e).multiply(Q1).multiply(this._q.setFromAxisAngle(ZEE, -orient));
  }

  _deviceYaw() {
    const f = this._v.set(0, 0, -1).applyQuaternion(this.deviceQ);
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

  update(dt) {
    if (this.gyro && this.device) this._computeDevice();
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
    if (this.gyro && this.device) {
      this.camera.quaternion.setFromAxisAngle(Y, this.yaw).multiply(this.deviceQ);
    } else {
      this._e.set(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this._e);
    }
  }
}
