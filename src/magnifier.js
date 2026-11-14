// La lente d'ingrandimento: il manoscritto a schermo intero e una lente che si
// muove inclinando il telefono (o trascinando il dito). Le ultime righe sono
// scritte così in piccolo che si leggono solo sotto la lente.
import { parchmentCanvas } from './textures.js';

// coordinate del foglio: 720 × 1000 unità
const SW = 720, SH = 1000;
const TITLE = 'Villa al Tramonto, 14 novembre';
const BODY = [
  'Ho rimesso il carillon al suo posto,',
  'come ogni sera. Ho acceso il fuoco',
  'e ho lasciato il disco sul grammofono,',
  'perché la casa non resti in silenzio.',
  '',
  'Il resto l’ho scritto qui sotto, piccolo,',
  'perché lo legga solo chi lo cerca davvero.',
];
export const TINY = [
  'Se sei arrivato fin qui, hai ascoltato il carillon',
  'e hai lasciato le tue parole sulla mia scrivania.',
  'Ma quello che cerchi non è tra queste mura.',
  'Per vederlo devi guardare oltre te stesso:',
  'torna dove sei arrivato e voltati. Sul belvedere',
  'il cannocchiale guarda la valle. Guarda con lui.',
];
const TINY_Y0 = 838, TINY_DY = 16, TINY_X0 = 70, TINY_FONT = 'italic 11px Georgia, "Times New Roman", serif';
// larghezza reale della riga più lunga: serve per capire quando la lente l'ha percorsa tutta
let tinyX1 = 0;
function tinyRight() {
  if (!tinyX1) {
    const g = document.createElement('canvas').getContext('2d');
    g.font = TINY_FONT;
    tinyX1 = TINY_X0 + Math.max(...TINY.map((l) => g.measureText(l).width));
  }
  return tinyX1;
}

let parchment;
/** Disegna il manoscritto su un contesto 2D di dimensioni w × h. */
export function drawManuscript(g, w, h) {
  parchment = parchment || parchmentCanvas(512, 711);
  g.save();
  g.drawImage(parchment, 0, 0, w, h);
  g.scale(w / SW, h / SH);
  drawInk(g);
  g.restore();
}

function drawInk(g) {
  g.fillStyle = 'rgba(40,22,10,0.9)';
  g.textBaseline = 'alphabetic';
  g.font = 'italic 34px Georgia, "Times New Roman", serif';
  g.fillText(TITLE, 70, 110);
  g.fillRect(70, 128, 420, 1.5);
  g.font = 'italic 29px Georgia, "Times New Roman", serif';
  BODY.forEach((l, i) => g.fillText(l, 70, 200 + i * 52));
  // firma e un piccolo disegno: il carillon
  g.strokeStyle = 'rgba(40,22,10,0.7)'; g.lineWidth = 2;
  g.strokeRect(520, 600, 120, 70);
  g.beginPath(); g.moveTo(520, 600); g.lineTo(560, 560); g.lineTo(680, 560); g.lineTo(640, 600); g.stroke();
  g.beginPath(); g.arc(580, 635, 16, 0, 7); g.stroke();
  g.font = 'italic 40px Georgia, serif';
  g.fillText('E.', 600, 760);
  // righe minuscole
  g.font = TINY_FONT;
  g.fillStyle = 'rgba(40,22,10,0.85)';
  TINY.forEach((l, i) => g.fillText(l, TINY_X0, TINY_Y0 + i * TINY_DY));
  g.fillText('— E.', tinyRight() - 24, TINY_Y0 + TINY.length * TINY_DY + 4);
}

const COLS = 8; // per capire se la lente è passata su tutte le righe minuscole

export class Magnifier {
  constructor() {
    this.el = document.getElementById('lens');
    this.canvas = document.getElementById('lens-canvas');
    this.g = this.canvas.getContext('2d');
    this.msg = document.getElementById('lens-msg');
    this.open_ = false;
    this.zoom = 3.4;
    this.pos = { x: SW / 2, y: 560 };
    this.target = { ...this.pos };
    this.seen = new Set();
    this.read = false;
    this.onRead = null;

    this._orient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      this.hasGyro = true;
      if (!this.base) { this.base = { b: e.beta, g: e.gamma, x: this.target.x, y: this.target.y }; return; }
      // inclinare a destra/sinistra sposta la lente in orizzontale, avanti/indietro in verticale
      this.target.x = this.base.x + (e.gamma - this.base.g) * (SW / 46);
      this.target.y = this.base.y + (e.beta - this.base.b) * (SH / 52);
      this._clamp(this.target);
      this.last = e;
    };

    let drag = false;
    const toSheet = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const sx = (e.clientX - r.left - this.sheet.x) / this.sheet.s;
      const sy = (e.clientY - r.top - this.sheet.y - this.lensR * 0.9) / this.sheet.s; // lente sopra il dito
      return { x: sx, y: sy };
    };
    this.canvas.addEventListener('pointerdown', (e) => { drag = true; this.canvas.setPointerCapture(e.pointerId); Object.assign(this.target, toSheet(e)); this._clamp(this.target); });
    this.canvas.addEventListener('pointermove', (e) => { if (!drag) return; Object.assign(this.target, toSheet(e)); this._clamp(this.target); });
    const up = () => { drag = false; this.base = null; }; // il giroscopio riparte da dove hai lasciato la lente
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    document.getElementById('lens-center').addEventListener('click', () => {
      this.target.x = TINY_X0 + 140; this.target.y = TINY_Y0 + 40; this.base = null;
    });
    window.addEventListener('resize', () => this.open_ && this._layout());
  }

  _clamp(p) {
    p.x = Math.max(0, Math.min(SW, p.x));
    p.y = Math.max(0, Math.min(SH, p.y));
  }

  _layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 70, bottom = 110;
    const s = Math.min((w * 0.92) / SW, (h - top - bottom) / SH);
    this.sheet = { s, x: (w - SW * s) / 2, y: top + (h - top - bottom - SH * s) / 2 };
    this.lensR = Math.min(w, h) * 0.27;
    this.w = w; this.h = h;
    this.bg = null;
  }

  open() {
    this.el.hidden = false;
    this.open_ = true;
    this._layout();
    this.base = null;
    this.target = { x: SW / 2, y: 520 };
    this.pos = { ...this.target };
    window.addEventListener('deviceorientation', this._orient);
    this._setMsg();
    const loop = () => { if (!this.open_) return; this._frame(); this.raf = requestAnimationFrame(loop); };
    loop();
  }

  close() {
    this.open_ = false;
    this.el.hidden = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('deviceorientation', this._orient);
  }

  _setMsg() {
    this.msg.textContent = this.read
      ? 'Hai letto le righe nascoste.'
      : this.hasGyro || 'ondeviceorientation' in window
        ? 'Inclina il telefono per muovere la lente, o trascina il dito. Cerca le righe minuscole in fondo.'
        : 'Trascina il dito per muovere la lente. Cerca le righe minuscole in fondo.';
  }

  _frame() {
    const k = 0.18;
    this.pos.x += (this.target.x - this.pos.x) * k;
    this.pos.y += (this.target.y - this.pos.y) * k;
    this._track();
    const { g, w, h, sheet } = this;
    // scrivania e foglio
    if (!this.bg) {
      this.bg = document.createElement('canvas');
      this.bg.width = this.canvas.width; this.bg.height = this.canvas.height;
      const b = this.bg.getContext('2d');
      b.setTransform(this.canvas.width / w, 0, 0, this.canvas.height / h, 0, 0);
      const gr = b.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h * 0.45, Math.max(w, h) * 0.75);
      gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#0c0604');
      b.fillStyle = gr; b.fillRect(0, 0, w, h);
      b.save();
      b.translate(sheet.x, sheet.y);
      b.shadowColor = 'rgba(0,0,0,0.6)'; b.shadowBlur = 30; b.shadowOffsetY = 10;
      b.fillStyle = '#d8c8a0'; b.fillRect(0, 0, SW * sheet.s, SH * sheet.s);
      b.shadowColor = 'transparent';
      drawManuscript(b, SW * sheet.s, SH * sheet.s);
      b.restore();
    }
    g.drawImage(this.bg, 0, 0, w, h);

    const cx = sheet.x + this.pos.x * sheet.s, cy = sheet.y + this.pos.y * sheet.s, R = this.lensR;
    // ombra della lente sul foglio
    g.save();
    g.beginPath(); g.arc(cx + 10, cy + 14, R + 6, 0, Math.PI * 2);
    g.fillStyle = 'rgba(20,10,4,0.28)'; g.fill();
    g.restore();
    // contenuto ingrandito: il testo viene ridisegnato in scala, quindi resta nitido
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    const z = sheet.s * this.zoom;
    g.translate(cx - this.pos.x * z, cy - this.pos.y * z);
    g.fillStyle = '#e2d2a8'; g.fillRect(0, 0, SW * z, SH * z);
    drawManuscript(g, SW * z, SH * z);
    g.restore();
    // vetro: bordo scuro, riflesso e anello d'ottone
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    const v = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,5,0.35)');
    g.fillStyle = v; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    const hl = g.createLinearGradient(cx - R, cy - R, cx, cy);
    hl.addColorStop(0, 'rgba(255,255,255,0.22)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    // manico
    g.save();
    g.translate(cx, cy); g.rotate(Math.PI * 0.22);
    g.fillStyle = '#2a1a0e'; g.fillRect(R + 4, -9, R * 0.95, 18);
    g.fillStyle = '#b8862e'; g.fillRect(R, -11, 16, 22);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = '#a87a2a';
    g.beginPath(); g.arc(cx, cy, R + 4, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#f0d088';
    g.beginPath(); g.arc(cx, cy, R + 1, 0, Math.PI * 2); g.stroke();
  }

  // segna le colonne delle righe minuscole già passate sotto la lente
  _track() {
    if (this.read) return;
    const yMid = TINY_Y0 + (TINY.length * TINY_DY) / 2;
    if (Math.abs(this.pos.y - yMid) > 70) return;
    // la lente copre un po' di testo intorno al centro: conta anche i bordi
    const col = Math.floor(((this.pos.x - TINY_X0 + 20) / (tinyRight() - TINY_X0 + 40)) * COLS);
    if (col < 0 || col >= COLS) return;
    this.seen.add(col);
    if (this.seen.size >= COLS - 1) {
      this.read = true;
      this._setMsg();
      if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
      this.onRead?.();
    }
  }
}
