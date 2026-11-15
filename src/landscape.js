// Il cannocchiale del belvedere: una valle di montagna dipinta a 360°, con la
// bussola. Tre "coordinate" sono nascoste come illusioni ottiche: a Nord le
// pietre di un altare, a Est il corso di un ruscello, a Ovest un rudere
// controluce disegnano ciascuno una cifra. Le cifre cambiano a ogni partita.
// Si registrano tenendo il reticolo fermo su ciascuna.
import * as THREE from 'three';

const W = 4096, H = 1100, HORIZON = 560;
const PPR = W / (Math.PI * 2);                  // pixel del panorama per radiante
const HALF_FOV = THREE.MathUtils.degToRad(17);  // metà del campo dell'oculare
const HOLD = 1.8;
const TAU = Math.PI * 2;

// le tre coordinate, in ordine di lettura (da Nord, in senso orario)
export const CODE = [7, 2, 4];
const TARGETS = [
  { digit: 7, dir: 'N', bearing: 0, y: HORIZON + 28 },
  { digit: 2, dir: 'E', bearing: 90, y: HORIZON + 92 },
  { digit: 4, dir: 'O', bearing: 270, y: HORIZON - 52 },
];
/** Imposta il codice della partita (tre cifre) e ridisegna il paesaggio. */
export function setCode(code) {
  code.forEach((d, i) => { CODE[i] = d; TARGETS[i].digit = d; });
  panoCache = null;
}
export function randomCode() { return [0, 1, 2].map(() => Math.floor(Math.random() * 10)); }
let panoCache = null;

// scheletro di ogni cifra: tratti spezzati in un riquadro 0..1 (y verso il basso)
const DIGITS = {
  0: [[[0.18, 0.02], [0.82, 0.02], [0.86, 0.98], [0.16, 0.98], [0.18, 0.02]]],
  1: [[[0.3, 0.2], [0.6, 0.0], [0.6, 1.0]]],
  2: [[[0.1, 0.14], [0.5, 0.0], [0.9, 0.16], [0.88, 0.45], [0.1, 1.0], [0.95, 1.0]]],
  3: [[[0.1, 0.02], [0.88, 0.02], [0.86, 0.5], [0.3, 0.5]], [[0.86, 0.5], [0.9, 0.98], [0.1, 0.98]]],
  4: [[[0.72, 1.0], [0.72, 0.0], [0.05, 0.66], [0.95, 0.66]]],
  5: [[[0.9, 0.02], [0.16, 0.02], [0.12, 0.46], [0.84, 0.5], [0.88, 0.98], [0.1, 0.98]]],
  6: [[[0.86, 0.02], [0.16, 0.08], [0.12, 0.98], [0.88, 0.98], [0.88, 0.52], [0.12, 0.52]]],
  7: [[[0.05, 0.02], [0.95, 0.02], [0.4, 1.0]]],
  8: [[[0.16, 0.02], [0.84, 0.02], [0.88, 0.98], [0.12, 0.98], [0.16, 0.02]], [[0.14, 0.5], [0.86, 0.5]]],
  9: [[[0.88, 0.5], [0.12, 0.5], [0.14, 0.02], [0.86, 0.02], [0.88, 0.98], [0.14, 0.98]]],
};
// per il ruscello l'8 sono due anse una sopra l'altra (con i tratti dritti sembrerebbe una θ)
const loop = (cx, cy, rx, ry) => Array.from({ length: 19 }, (_, i) => { const a = (i / 18) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const STREAM_DIGITS = { 8: [loop(0.5, 0.26, 0.3, 0.24), loop(0.5, 0.74, 0.36, 0.26)] };
const DW = 96, DH = 128; // dimensione di una cifra nel panorama
const strokesAt = (digit, cx, cy, set = DIGITS) => (set[digit] || DIGITS[digit]).map((st) => st.map(([x, y]) => [cx + (x - 0.5) * DW, cy + (y - 0.5) * DH]));
// un segmento spesso, come rettangolo orientato (con un po' di sovrapposizione ai giunti)
function slab([ax, ay], [bx2, by], t) {
  const dx = bx2 - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy * t / 2, py = ux * t / 2, e = t * 0.35;
  return [[ax - ux * e + px, ay - uy * e + py], [bx2 + ux * e + px, by + uy * e + py], [bx2 + ux * e - px, by + uy * e - py], [ax - ux * e - px, ay - uy * e - py]];
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const bx = (deg) => (deg / 360) * W;

// contorno irregolare: suddivide i lati e sposta un po' i punti, come pietra spaccata
function rough(g, pts, jit, r) {
  g.beginPath();
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length];
    for (let k = 0; k < 4; k++) {
      const t = k / 4;
      const px = x + (nx - x) * t + (r() - 0.5) * jit, py = y + (ny - y) * t + (r() - 0.5) * jit;
      if (i === 0 && k === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
  });
  g.closePath();
}
// pietra con luce dall'alto, macchie di muschio e crepe
function stone(g, pts, r, base, light) {
  rough(g, pts, 5, r);
  const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, light); gr.addColorStop(1, base);
  g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  const xs = pts.map((p) => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${40 + r() * 30},${60 + r() * 30},${40},${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 3 + r() * 7, 2 + r() * 4, r() * 3, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(20,16,18,0.5)'; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) { g.beginPath(); let cx = x0 + r() * (x1 - x0), cy = y0 + r() * (y1 - y0); g.moveTo(cx, cy); for (let k = 0; k < 3; k++) { cx += (r() - 0.5) * 14; cy += r() * 9; g.lineTo(cx, cy); } g.stroke(); }
  g.restore();
}

// crinale periodico (si richiude su se stesso a 360°)
function ridge(x, seed, amp, base) {
  const u = (x / W) * TAU;
  let y = 0;
  [[3, 1], [7, 0.55], [13, 0.3], [29, 0.14], [53, 0.07]].forEach(([k, a], i) => { y += Math.sin(u * k + seed * (i + 1.7)) * a; });
  return base - Math.abs(y) * amp;
}

function paintPanorama() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = rng(77);
  // cielo al crepuscolo
  const sky = g.createLinearGradient(0, 0, 0, HORIZON + 40);
  sky.addColorStop(0, '#120c22'); sky.addColorStop(0.45, '#2e2244'); sky.addColorStop(0.8, '#6a3a4a'); sky.addColorStop(1, '#9a5a48');
  g.fillStyle = sky; g.fillRect(0, 0, W, HORIZON + 40);
  // bagliore del tramonto a Ovest (dietro il rudere)
  for (const dx of [-W, 0, W]) {
    const gl = g.createRadialGradient(bx(270) + dx, HORIZON, 10, bx(270) + dx, HORIZON, 560);
    gl.addColorStop(0, 'rgba(255,170,80,0.95)'); gl.addColorStop(0.3, 'rgba(240,110,50,0.5)'); gl.addColorStop(1, 'rgba(200,80,40,0)');
    g.fillStyle = gl; g.fillRect(bx(270) + dx - 560, 0, 1120, HORIZON + 60);
  }
  // stelle a Est e a Nord
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * HORIZON * 0.6;
    const west = Math.abs(((x - bx(270) + W * 1.5) % W) - W / 2) < 600;
    if (west) continue;
    g.fillStyle = `rgba(255,245,220,${0.25 + r() * 0.6})`;
    g.fillRect(x, y, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1);
  }
  // luna sopra l'altare, a Nord
  for (const dx of [0, W]) {
    const mx = bx(20) + dx - W * (dx ? 1 : 0), my = 180;
    const mg = g.createRadialGradient(mx, my, 4, mx, my, 120);
    mg.addColorStop(0, 'rgba(240,235,220,0.5)'); mg.addColorStop(1, 'rgba(200,200,220,0)');
    g.fillStyle = mg; g.fillRect(mx - 120, my - 120, 240, 240);
    g.fillStyle = '#ece6d4'; g.beginPath(); g.arc(mx, my, 22, 0, TAU); g.fill();
    g.fillStyle = '#2e2244'; g.beginPath(); g.arc(mx + 9, my - 4, 20, 0, TAU); g.fill();
  }
  // montagne lontane, con neve sulle cime
  const fill = (fn, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, fn(x)); g.lineTo(W, H); g.fill(); };
  fill((x) => ridge(x, 1.3, 230, HORIZON - 40), '#3a3452');
  g.save();
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge(x, 1.3, 230, HORIZON - 40)); g.lineTo(W, H); g.clip();
  for (let x = 0; x <= W; x += 4) {
    const y = ridge(x, 1.3, 230, HORIZON - 40);
    if (y < HORIZON - 190) { g.fillStyle = 'rgba(220,215,230,0.55)'; g.fillRect(x, y, 4, (HORIZON - 190 - y) * 0.6 + 4); }
  }
  g.restore();
  fill((x) => ridge(x, 4.1, 110, HORIZON + 10), '#2a2238');
  // fondovalle
  const vg = g.createLinearGradient(0, HORIZON, 0, H);
  vg.addColorStop(0, '#20202a'); vg.addColorStop(0.3, '#1a1e18'); vg.addColorStop(1, '#0a0a08');
  g.fillStyle = vg;
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge(x, 8.7, 40, HORIZON + 40)); g.lineTo(W, H); g.fill();
  // boschi sulle colline
  for (let i = 0; i < 1400; i++) {
    const x = r() * W, ground = ridge(x, 8.7, 40, HORIZON + 40);
    const y = ground + r() * (H - ground) * 0.85;
    if (nearTarget(x, y, 78)) continue;
    const s = 4 + r() * 7 * (y / H);
    g.fillStyle = `rgba(${10 + r() * 14},${18 + r() * 18},${12 + r() * 10},0.95)`;
    g.beginPath(); g.moveTo(x, y - s * 2.2); g.lineTo(x + s, y); g.lineTo(x - s, y); g.fill();
  }

  // --- villaggio a Sud ---
  const vx = bx(180), vy = HORIZON + 70;
  g.fillStyle = '#2a2420';
  g.beginPath(); g.ellipse(vx, vy + 30, 260, 40, 0, Math.PI, 0); g.fill();
  for (let i = 0; i < 22; i++) {
    const hx = vx - 200 + r() * 400, hy = vy + 6 + Math.abs(hx - vx) * 0.08 + r() * 18;
    const w = 16 + r() * 18, h = 12 + r() * 12;
    g.fillStyle = `hsl(28,${15 + r() * 15}%,${30 + r() * 15}%)`; g.fillRect(hx, hy - h, w, h);
    g.fillStyle = `hsl(10,${35 + r() * 15}%,${22 + r() * 10}%)`;
    g.beginPath(); g.moveTo(hx - 3, hy - h); g.lineTo(hx + w / 2, hy - h - 8 - r() * 5); g.lineTo(hx + w + 3, hy - h); g.fill();
    if (r() < 0.6) { g.fillStyle = 'rgba(255,200,110,0.95)'; g.fillRect(hx + w * 0.3, hy - h * 0.6, 3, 4); }
    if (r() < 0.3) { g.strokeStyle = 'rgba(200,190,200,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + 4, hy - h - 6); g.bezierCurveTo(hx, hy - h - 30, hx + 14, hy - h - 40, hx + 6, hy - h - 70); g.stroke(); }
  }
  // campanile
  g.fillStyle = '#4a3c32'; g.fillRect(vx + 10, vy - 78, 18, 80);
  g.fillStyle = '#3a2420'; g.beginPath(); g.moveTo(vx + 6, vy - 78); g.lineTo(vx + 19, vy - 104); g.lineTo(vx + 32, vy - 78); g.fill();
  g.fillStyle = 'rgba(255,200,110,0.9)'; g.fillRect(vx + 16, vy - 66, 6, 8);

  // --- il ruscello a Est: visto dall'alto, il suo corso disegna la cifra ---
  {
    const st = strokesAt(TARGETS[1].digit, bx(90), TARGETS[1].y, STREAM_DIGITS);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const course = () => {
      g.beginPath();
      for (const pts of st) {
        g.moveTo(pts[0][0], pts[0][1]);
        // curve morbide tra i punti, come un corso d'acqua
        for (let k = 1; k < pts.length - 1; k++) g.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2);
        const last = pts[pts.length - 1];
        g.lineTo(last[0], last[1]);
      }
    };
    g.strokeStyle = '#1a2216'; g.lineWidth = 24; course(); g.stroke();   // argini d'erba
    g.strokeStyle = '#3a5060'; g.lineWidth = 13; course(); g.stroke();   // acqua
    g.setLineDash([9, 7, 3, 9]);
    g.strokeStyle = 'rgba(200,215,225,0.6)'; g.lineWidth = 3; course(); g.stroke(); // riflessi spezzati
    g.setLineDash([]);
    for (let i = 0; i < 90; i++) {
      const px = bx(90) + (r() - 0.5) * 140, py = TARGETS[1].y + (r() - 0.5) * 170;
      g.fillStyle = r() < 0.7 ? `rgba(${20 + r() * 20},${34 + r() * 20},${20},0.9)` : 'rgba(90,86,80,0.8)';
      g.beginPath(); g.ellipse(px, py, 2 + r() * 3, 1.5 + r() * 2, r() * 3, 0, TAU); g.fill();
    }
    // la sorgente che scende dal monte e lo stagno dove finisce
    const [s0x, s0y] = st[0][0];
    g.strokeStyle = 'rgba(140,165,180,0.45)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(s0x, s0y); g.bezierCurveTo(s0x - 18, s0y - 30, s0x - 8, s0y - 70, s0x - 32, s0y - 120); g.stroke();
    const lastSt = st[st.length - 1], [ex, ey] = lastSt[lastSt.length - 1];
    g.fillStyle = '#3a5060'; g.beginPath(); g.ellipse(ex + 12, ey + 6, 20, 7, 0, 0, TAU); g.fill();
  }

  // --- il rudere a Ovest, controluce: torre e muri disegnano la cifra ---
  {
    const rx = bx(270), ry = TARGETS[2].y;
    const st = strokesAt(TARGETS[2].digit, rx, ry);
    g.fillStyle = '#140c10';
    g.beginPath(); g.ellipse(rx, ry + DH / 2 + 26, 170, 40, 0, Math.PI, 0); g.fill(); // la collina
    let tower = null, best = 0;
    for (const pts of st) {
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        g.fillStyle = '#140c10'; rough(g, slab(a, b, 20), 4, r); g.fill();
        const vertical = Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (vertical && len > best) { best = len; tower = a[1] < b[1] ? a : b; }
        if (!vertical) { // merli spezzati sui muri orizzontali
          const n = Math.floor(len / 16);
          for (let m = 1; m < n; m += 2) {
            const t = m / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
            if (r() < 0.75) { rough(g, [[x - 4, y - 10], [x + 4, y - 10], [x + 4, y - 4], [x - 4, y - 4]], 2, r); g.fill(); }
          }
        }
      }
    }
    if (tower) { // la torre più alta: merli in cima e una feritoia accesa
      for (let m = -1; m <= 1; m++) { g.fillStyle = '#140c10'; rough(g, [[tower[0] + m * 9 - 4, tower[1] - 22], [tower[0] + m * 9 + 4, tower[1] - 22], [tower[0] + m * 9 + 4, tower[1] - 6], [tower[0] + m * 9 - 4, tower[1] - 6]], 2, r); g.fill(); }
      g.fillStyle = 'rgba(255,170,80,0.85)'; g.fillRect(tower[0] - 2, tower[1] + 22, 5, 9);
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = '#140c10'; g.beginPath(); g.ellipse(rx + (r() - 0.5) * 150, ry + DH / 2 + 10 + r() * 22, 4 + r() * 7, 3 + r() * 4, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(30,40,20,0.9)'; g.beginPath(); g.arc(rx + (r() - 0.5) * DW, ry + r() * DH * 0.5, 2 + r() * 3, 0, TAU); g.fill(); } // edera
  }

  // --- l'altare di pietra a Nord, al chiaro di luna: le pietre disegnano la cifra ---
  for (const dx of [0, W]) {
    const ax = bx(0) + dx, ay = TARGETS[0].y;
    const st = strokesAt(TARGETS[0].digit, ax, ay);
    g.fillStyle = '#1c1a1e'; g.beginPath(); g.ellipse(ax, ay + DH / 2 + 6, 190, 28, 0, Math.PI, 0); g.fill(); // altopiano
    g.fillStyle = 'rgba(10,8,12,0.45)'; g.beginPath(); g.ellipse(ax + 8, ay + DH / 2 + 6, 70, 7, 0, 0, TAU); g.fill(); // ombra
    for (const pts of st) {
      for (let k = 0; k < pts.length - 1; k++) {
        const lit = 150 + Math.floor(r() * 50);
        stone(g, slab(pts[k], pts[k + 1], 17), r, '#5a564e', `rgb(${lit},${lit - 6},${lit - 22})`);
      }
    }
    // il cerchio di pietre intorno, più piccole e irregolari
    for (const [ox, h] of [[-118, 30], [-84, 22], [-150, 16], [92, 28], [124, 20], [156, 14]]) stone(g, [[ax + ox, ay + DH / 2 + 4 - h], [ax + ox + 11, ay + DH / 2 + 2 - h], [ax + ox + 12, ay + DH / 2 + 4], [ax + ox - 1, ay + DH / 2 + 4]], r, '#4a463e', '#8a8478');
  }
  // velo di foschia sul fondovalle
  const haze = g.createLinearGradient(0, HORIZON - 20, 0, HORIZON + 140);
  haze.addColorStop(0, 'rgba(120,100,130,0)'); haze.addColorStop(0.5, 'rgba(120,100,130,0.12)'); haze.addColorStop(1, 'rgba(120,100,130,0)');
  g.fillStyle = haze; g.fillRect(0, HORIZON - 20, W, 160);
  return c;
}

function nearTarget(x, y, rad) {
  return TARGETS.some((t) => {
    const tx = bx(t.bearing);
    for (const dx of [-W, 0, W]) if (Math.hypot(x - tx - dx, y - t.y) < rad) return true;
    return false;
  }) || (Math.abs(x - bx(180)) < 280 && y < HORIZON + 130 && y > HORIZON - 120);
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export class Landscape {
  constructor(controls, camera) {
    this.controls = controls;
    this.camera = camera;
    this.el = document.getElementById('land');
    this.canvas = document.getElementById('land-canvas');
    this.g = this.canvas.getContext('2d');
    this.msg = document.getElementById('land-msg');
    this.slots = document.getElementById('land-slots');
    this.found = new Set();
    this.onComplete = null;
    this.onFound = null;
    let last = null;
    this.canvas.addEventListener('pointerdown', (e) => { last = { x: e.clientX, y: e.clientY }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!last || this.controls.gyro) return;
      this.controls.yaw += (e.clientX - last.x) * 0.003;
      this.controls.pitch = Math.max(-0.6, Math.min(0.6, this.controls.pitch + (e.clientY - last.y) * 0.003));
      last = { x: e.clientX, y: e.clientY };
    });
    const up = () => { last = null; };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    window.addEventListener('resize', () => this.isOpen && this._layout());
  }

  open(found = []) {
    if (!panoCache) panoCache = paintPanorama();
    this.pano = panoCache;
    this.found = new Set(found);
    this.isOpen = true;
    this.el.hidden = false;
    this.hold = 0;
    this.holdT = null;
    this._layout();
    this._renderSlots();
    this.msg.textContent = this.found.size >= 3
      ? 'Le tre coordinate sono già tue: ' + CODE.join(' · ') + '.'
      : 'Osserva bene. Nella valle si nascondono tre coordinate.';
    let t0 = 0;
    const loop = (t) => {
      if (!this.isOpen) return;
      const dt = t0 ? Math.min(0.1, (t - t0) / 1000) : 0;
      t0 = t;
      this._frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  close() {
    this.isOpen = false;
    this.el.hidden = true;
    cancelAnimationFrame(this.raf);
  }

  _layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.R = Math.min(w, h * 0.75) * 0.45;
    this.cx = w / 2; this.cy = h * 0.44;
    this.scale = this.R / Math.tan(HALF_FOV) / PPR; // pixel di schermo per pixel di panorama
  }

  _renderSlots() {
    this.slots.innerHTML = '';
    for (const t of TARGETS) {
      const d = document.createElement('div');
      const i = TARGETS.indexOf(t);
      d.className = this.found.has(i) ? 'on' : '';
      d.innerHTML = `<small>${t.dir}</small><b>${this.found.has(i) ? t.digit : '?'}</b>`;
      this.slots.appendChild(d);
    }
  }

  _view() {
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const yaw = Math.atan2(-f.x, -f.z);
    const bearing = ((-yaw % TAU) + TAU) % TAU;
    const pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
    return { bearing, pitch };
  }

  _frame(dt) {
    const { g, w, h, cx, cy, R, scale } = this;
    const { bearing, pitch } = this._view();
    const px = (bearing / TAU) * W, py = HORIZON - pitch * PPR;
    g.fillStyle = '#060302'; g.fillRect(0, 0, w, h);
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    // porzione di panorama, con il giro dei 360° (si disegna due volte vicino al bordo)
    // (ritaglio a mano: Safari non disegna se la sorgente esce dai bordi dell'immagine)
    const sw = (R * 2) / scale, sh = (R * 2) / scale;
    const top = py - sh / 2, c0 = Math.max(0, top), c1 = Math.min(H, top + sh);
    for (const dx of [-W, 0, W]) {
      const left = px - sw / 2 + dx, a0 = Math.max(0, left), a1 = Math.min(W, left + sw);
      if (a1 <= a0 || c1 <= c0) continue;
      g.drawImage(this.pano, a0, c0, a1 - a0, c1 - c0, cx - R + (a0 - left) * scale, cy - R + (c0 - top) * scale, (a1 - a0) * scale, (c1 - c0) * scale);
    }
    // vignetta e tinta del vetro
    const v = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    v.addColorStop(0, 'rgba(10,6,4,0)'); v.addColorStop(1, 'rgba(10,6,4,0.8)');
    g.fillStyle = v; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    // reticolo
    g.strokeStyle = 'rgba(240,220,180,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 14, cy); g.moveTo(cx + 14, cy); g.lineTo(cx + R, cy);
    g.moveTo(cx, cy + 14); g.lineTo(cx, cy + R); g.stroke();
    g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.stroke();
    // bussola che scorre in alto nell'oculare
    const k = PPR * scale * (Math.PI / 180); // pixel di schermo per grado
    const bdeg = (bearing * 180) / Math.PI;
    g.fillStyle = 'rgba(10,6,4,0.55)'; g.fillRect(cx - R, cy - R + R * 0.12, R * 2, 30);
    g.font = '13px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let d = Math.floor(bdeg - 40); d <= bdeg + 40; d++) {
      if (d % 5) continue;
      const x = cx + (d - bdeg) * k, y0 = cy - R + R * 0.12;
      const dd = ((d % 360) + 360) % 360;
      g.strokeStyle = 'rgba(240,220,180,0.7)';
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + (dd % 45 === 0 ? 10 : dd % 15 === 0 ? 7 : 4)); g.stroke();
      if (dd % 45 === 0) { g.fillStyle = dd % 90 === 0 ? '#ffd890' : 'rgba(240,220,180,0.85)'; g.fillText(DIRS[dd / 45], x, y0 + 21); }
    }
    g.fillStyle = '#ffd890';
    g.beginPath(); g.moveTo(cx - 6, cy - R + R * 0.12 + 30); g.lineTo(cx + 6, cy - R + R * 0.12 + 30); g.lineTo(cx, cy - R + R * 0.12 + 24); g.fill();
    // registrazione: il reticolo fermo su una coordinata
    let aiming = null;
    for (const tg of TARGETS) {
      if (this.found.has(TARGETS.indexOf(tg))) continue;
      let db = (tg.bearing - bdeg + 540) % 360 - 180;
      const dp = (HORIZON - tg.y) / PPR * 180 / Math.PI - pitch * 180 / Math.PI;
      if (Math.hypot(db, dp) < 2.6) aiming = tg;
    }
    if (aiming && aiming === this.holdT) this.hold += dt;
    else { this.hold = 0; this.holdT = aiming; }
    if (aiming && this.hold > 0.05) {
      g.strokeStyle = 'rgba(255,214,140,0.95)'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + Math.min(1, this.hold / HOLD) * TAU); g.stroke();
    }
    if (aiming && this.hold >= HOLD) this._register(aiming);
    g.restore();
    // anello d'ottone
    g.lineWidth = 14; g.strokeStyle = '#7a5418'; g.beginPath(); g.arc(cx, cy, R + 7, 0, TAU); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#e8c070'; g.beginPath(); g.arc(cx, cy, R + 1, 0, TAU); g.stroke();
    // lettura della direzione sotto l'oculare
    const name = DIRS[Math.round(bdeg / 45) % 8];
    g.fillStyle = 'rgba(240,220,180,0.8)'; g.font = '14px Georgia, serif'; g.textAlign = 'center';
    g.fillText(`${Math.round(bdeg) % 360}° ${name}`, cx, cy + R + 28);
  }

  _register(tg) {
    this.found.add(TARGETS.indexOf(tg));
    this.hold = 0; this.holdT = null;
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    this._renderSlots();
    this.onFound?.([...this.found]);
    const n = this.found.size;
    if (n === 1) this.msg.textContent = 'Una coordinata. La valle ne nasconde altre due.';
    else if (n === 2) this.msg.textContent = 'Due coordinate. Ne manca una sola.';
    else {
      this.msg.textContent = `Tre coordinate. Da Nord, come girano le lancette: ${CODE.join(' · ')}. Qualcosa nella villa si apre con tre cifre… forse un lucchetto, nel primo corridoio.`;
      this.onComplete?.();
    }
  }
}
