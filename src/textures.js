// Texture procedurali disegnate su canvas: nessun asset esterno da scaricare.
import * as THREE from 'three';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function toTex(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function grain(g, w, h, r, n, alpha) {
  for (let i = 0; i < n; i++) {
    const v = r() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${r() * alpha})`;
    const s = 1 + r() * 2;
    g.fillRect(r() * w, r() * h, s, s);
  }
}

function blotches(g, w, h, r, n, colors, minR, maxR, alpha) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = minR + r() * (maxR - minR);
    const col = colors[(r() * colors.length) | 0];
    for (const dx of [-w, 0, w]) {
      for (const dy of [-h, 0, h]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        gr.addColorStop(0, `rgba(${col},${alpha})`);
        gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr;
        g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
    }
  }
}

function rr(g, x, y, w, h, rad) {
  g.beginPath();
  g.roundRect(x, y, w, h, rad);
  g.fill();
}

export function stoneTex(repeat) {
  const S = 512, [c, g] = mk(S, S), r = rng(7);
  g.fillStyle = '#2e2218';
  g.fillRect(0, 0, S, S);
  const rows = [38, 46, 30, 52, 36, 44, 34, 48, 40, 32, 50, 62];
  let y = 0;
  for (const rh of rows) {
    let x = -r() * 60;
    while (x < S) {
      const w = 38 + r() * 80;
      const hue = 28 + r() * 14, sat = 8 + r() * 14, lig = 34 + r() * 20;
      g.fillStyle = `hsl(${hue},${sat}%,${lig}%)`;
      for (const dx of [0, S]) rr(g, x + 2 - dx + S * (x < 0 ? 0 : 0), y + 2, w - 4, rh - 4, 5 + r() * 5);
      if (x < 0) rr(g, x + 2 + S, y + 2, w - 4, rh - 4, 6);
      x += w;
    }
    y += rh;
  }
  blotches(g, S, S, r, 40, ['30,20,12', '90,70,45', '20,14,10'], 30, 110, 0.22);
  grain(g, S, S, r, 9000, 0.16);
  return toTex(c, repeat);
}

export function plasterTex(repeat, tone = 0) {
  const S = 512, [c, g] = mk(S, S), r = rng(21 + tone);
  g.fillStyle = tone ? '#5a4631' : '#6e553a';
  g.fillRect(0, 0, S, S);
  blotches(g, S, S, r, 70, ['40,26,14', '120,92,60', '30,20,12', '95,70,42'], 30, 140, 0.2);
  for (let i = 0; i < 26; i++) {
    const x = r() * S, y0 = r() * S * 0.5, len = 60 + r() * 240;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len);
    gr.addColorStop(0, 'rgba(25,16,9,0.1)');
    gr.addColorStop(1, 'rgba(25,16,9,0)');
    g.fillStyle = gr;
    g.fillRect(x, y0, 3 + r() * 12, len);
  }
  grain(g, S, S, r, 8000, 0.12);
  return toTex(c, repeat);
}

export function woodTex(repeat, panels = false) {
  const S = 256, [c, g] = mk(S, S), r = rng(panels ? 33 : 34);
  g.fillStyle = '#2b170c';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    g.fillStyle = r() < 0.5 ? `rgba(10,5,2,${0.1 + r() * 0.3})` : `rgba(110,62,30,${0.05 + r() * 0.14})`;
    g.fillRect(x, 0, 1 + r() * 2.5, S);
  }
  if (panels) {
    const p = (x, y, w, h) => {
      g.strokeStyle = 'rgba(8,4,2,0.85)';
      g.lineWidth = 5;
      g.strokeRect(x, y, w, h);
      g.strokeStyle = 'rgba(150,90,45,0.28)';
      g.lineWidth = 2;
      g.strokeRect(x + 6, y + 6, w - 12, h - 12);
      g.strokeStyle = 'rgba(8,4,2,0.6)';
      g.strokeRect(x + 14, y + 14, w - 28, h - 28);
    };
    p(14, 14, 106, 228);
    p(136, 14, 106, 228);
  }
  grain(g, S, S, r, 2500, 0.1);
  return toTex(c, repeat);
}

export function tilesTex(repeat) {
  const S = 512, [c, g] = mk(S, S), r = rng(5);
  g.fillStyle = '#120e0b';
  g.fillRect(0, 0, S, S);
  const n = 4, t = S / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const l = 13 + r() * 9;
      g.fillStyle = `hsl(${24 + r() * 10},${12 + r() * 10}%,${l}%)`;
      g.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
    }
  blotches(g, S, S, r, 30, ['70,52,36', '8,6,4'], 20, 90, 0.2);
  grain(g, S, S, r, 5000, 0.1);
  return toTex(c, repeat);
}

export function rugTex(repeat) {
  const W = 256, H = 256, [c, g] = mk(W, H), r = rng(11);
  g.fillStyle = '#4e100e';
  g.fillRect(0, 0, W, H);
  // bordi laterali
  const band = (x, w, col) => { g.fillStyle = col; g.fillRect(x, 0, w, H); g.fillRect(W - x - w, 0, w, H); };
  band(0, 10, '#1a0d10');
  band(10, 6, '#a8803a');
  band(16, 20, '#2a1418');
  band(36, 4, '#8a2a1a');
  for (let y = 8; y < H; y += 16) {
    for (const x of [26, W - 26]) {
      g.fillStyle = '#b89250';
      g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.fill();
    }
  }
  // campo centrale: losanghe e medaglioni
  const dia = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.7, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.7, y); g.fill(); };
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 4; i++) {
      const x = 62 + i * 44 + (j % 2 ? 0 : 0), y = 32 + j * 64;
      dia(x, y, 26, '#1c1220');
      dia(x, y, 19, '#8a2418');
      dia(x, y, 11, '#c0a060');
      dia(x, y, 5, '#1c1220');
      dia(x + 22, y + 32, 10, '#2a1a2a');
      dia(x + 22, y + 32, 5, '#a8803a');
    }
  blotches(g, W, H, r, 14, ['10,4,4'], 20, 70, 0.25);
  grain(g, W, H, r, 5000, 0.14);
  return toTex(c, repeat);
}

// Cielo del tramonto, mappato all'interno di una sfera. sunU = posizione orizzontale del sole (0..1)
export function skyTex(sunU) {
  const W = 1024, H = 512, [c, g] = mk(W, H), r = rng(3);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0.0, '#2a1a30');
  gr.addColorStop(0.2, '#5a2436');
  gr.addColorStop(0.34, '#a8361f');
  gr.addColorStop(0.44, '#e8601c');
  gr.addColorStop(0.5, '#ff9a34');
  gr.addColorStop(0.53, '#3a1c14');
  gr.addColorStop(1, '#120a08');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  const sx = sunU * W, sy = H * 0.492;
  for (const dx of [-W, 0, W]) {
    const sg = g.createRadialGradient(sx + dx, sy, 0, sx + dx, sy, 330);
    sg.addColorStop(0, 'rgba(255,240,170,1)');
    sg.addColorStop(0.08, 'rgba(255,200,90,0.9)');
    sg.addColorStop(0.35, 'rgba(255,120,40,0.4)');
    sg.addColorStop(1, 'rgba(255,90,30,0)');
    g.fillStyle = sg;
    g.save();
    g.beginPath(); g.rect(0, 0, W, H * 0.515); g.clip();
    g.fillRect(sx + dx - 330, sy - 330, 660, 660);
    g.restore();
  }
  // nuvole: strisce allungate, più calde verso l'orizzonte
  const cols = ['255,120,50', '230,80,40', '90,36,56', '60,28,48', '255,160,80'];
  for (let i = 0; i < 420; i++) {
    const y = Math.pow(r(), 0.8) * H * 0.47;
    const k = y / (H * 0.47);
    const x = r() * W, rw = 30 + r() * 130, rh = 4 + r() * 14 * (1.2 - k);
    const col = k > 0.75 ? cols[r() < 0.6 ? 4 : 0] : cols[(r() * 4) | 0];
    g.fillStyle = `rgba(${col},${0.05 + r() * 0.2})`;
    for (const dx of [-W, 0, W]) {
      g.beginPath();
      g.ellipse(x + dx, y, rw, rh, (r() - 0.5) * 0.25, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = toTex(c);
  t.anisotropy = 1;
  return t;
}

export function groundTex(repeat, gravel = false) {
  const S = 512, [c, g] = mk(S, S), r = rng(gravel ? 51 : 50);
  g.fillStyle = gravel ? '#54463a' : '#2c2018';
  g.fillRect(0, 0, S, S);
  blotches(g, S, S, r, 30, ['20,12,6', '90,56,30'], 30, 110, 0.25);
  if (gravel) grain(g, S, S, r, 16000, 0.3);
  const leafCols = ['#6a3414', '#7a4a1a', '#4a2010', '#8a6020', '#3a1a0e', '#96702a'];
  const n = gravel ? 200 : 1100;
  for (let i = 0; i < n; i++) {
    g.fillStyle = leafCols[(r() * leafCols.length) | 0];
    g.globalAlpha = 0.55 + r() * 0.45;
    const x = r() * S, y = r() * S, a = r() * Math.PI;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      g.beginPath();
      g.ellipse(x + dx, y + dy, 5 + r() * 5, 2.5 + r() * 2.5, a, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  grain(g, S, S, r, 5000, 0.14);
  return toTex(c, repeat);
}

// Ciuffo di foglie con alpha (bianco/grigio: il colore arriva dal materiale)
export function leafClusterTex(seed = 1, spread = 1) {
  const S = 256, [c, g] = mk(S, S), r = rng(seed);
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * 118 * spread;
    const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d * 0.9;
    const l = 35 + r() * 65;
    g.fillStyle = `hsl(20,0%,${l}%)`;
    g.beginPath();
    g.ellipse(x, y, 6 + r() * 7, 3 + r() * 4, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const t = toTex(c);
  return t;
}

export function glowTex() {
  const S = 128, [c, g] = mk(S, S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return toTex(c);
}

export function flameTex() {
  const W = 64, H = 128, [c, g] = mk(W, H);
  g.translate(W / 2, 0);
  const gr = g.createRadialGradient(0, 88, 2, 0, 74, 56);
  gr.addColorStop(0, 'rgba(255,255,235,1)');
  gr.addColorStop(0.3, 'rgba(255,214,120,1)');
  gr.addColorStop(0.7, 'rgba(255,130,30,0.85)');
  gr.addColorStop(1, 'rgba(200,60,10,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, 6);
  g.bezierCurveTo(26, 60, 24, 104, 0, 118);
  g.bezierCurveTo(-24, 104, -26, 60, 0, 6);
  g.fill();
  return toTex(c);
}

export function ringTex() {
  const S = 128, [c, g] = mk(S, S);
  g.strokeStyle = 'rgba(255,226,170,0.95)';
  g.lineWidth = 6;
  g.beginPath(); g.arc(S / 2, S / 2, 46, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,226,170,0.35)';
  g.lineWidth = 2;
  g.beginPath(); g.arc(S / 2, S / 2, 58, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,240,210,0.95)';
  g.beginPath(); g.arc(S / 2, S / 2, 12, 0, Math.PI * 2); g.fill();
  return toTex(c);
}

export function paintingTex(kind = 0) {
  const W = 256, H = kind === 0 ? 192 : 320, [c, g] = mk(W, H), r = rng(60 + kind);
  if (kind === 0) {
    // paesaggio con torre
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#4a4a3c'); gr.addColorStop(0.5, '#7a6a48'); gr.addColorStop(1, '#2a2416');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    blotches(g, W, H, r, 14, ['150,130,90', '60,60,50'], 20, 70, 0.3);
    g.fillStyle = '#2c2a1e';
    g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(70, 70, 150, 120); g.quadraticCurveTo(210, 140, 256, 110); g.lineTo(256, 192); g.lineTo(0, 192); g.fill();
    g.fillStyle = '#3a3526';
    g.fillRect(84, 40, 22, 80); g.fillRect(80, 34, 30, 10);
    g.beginPath(); g.moveTo(84, 34); g.lineTo(95, 10); g.lineTo(106, 34); g.fill();
    g.fillRect(106, 78, 50, 44); g.fillRect(150, 62, 14, 60);
    g.fillStyle = '#1c2014';
    for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(150 + r() * 110, 120 + r() * 60, 12 + r() * 16, 0, 7); g.fill(); }
  } else {
    // ritratto scuro
    g.fillStyle = '#1a120c'; g.fillRect(0, 0, W, H);
    blotches(g, W, H, r, 10, ['70,44,24'], 40, 120, 0.3);
    g.fillStyle = '#20160f';
    g.beginPath(); g.ellipse(128, 300, 100, 120, 0, 0, 7); g.fill();
    const fg = g.createRadialGradient(120, 120, 4, 128, 128, 52);
    fg.addColorStop(0, '#b08a62'); fg.addColorStop(0.7, '#6a4a30'); fg.addColorStop(1, '#2a1a10');
    g.fillStyle = fg;
    g.beginPath(); g.ellipse(128, 128, 40, 52, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(15,8,5,0.8)';
    g.beginPath(); g.ellipse(128, 92, 46, 30, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(20,10,6,0.7)';
    g.fillRect(108, 118, 12, 4); g.fillRect(136, 118, 12, 4);
  }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return toTex(c);
}

export function booksTex(repeat) {
  const S = 512, [c, g] = mk(S, S), r = rng(77);
  g.fillStyle = '#140b06';
  g.fillRect(0, 0, S, S);
  const shelves = 5, sh = S / shelves;
  const cols = ['#4a1a12', '#3a2a14', '#1e2a1c', '#5a3a18', '#2a1810', '#6a2a1a', '#3a3020', '#1a1a22'];
  for (let s = 0; s < shelves; s++) {
    let x = 4;
    while (x < S - 8) {
      const w = 8 + r() * 16, h = sh * (0.62 + r() * 0.26);
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.fillRect(x, s * sh + (sh - 10 - h), w - 1, h);
      if (r() < 0.6) {
        g.fillStyle = 'rgba(200,160,80,0.5)';
        g.fillRect(x + 1, s * sh + (sh - 10 - h) + h * (0.15 + r() * 0.2), w - 3, 2);
      }
      x += w;
    }
    g.fillStyle = '#2a170c';
    g.fillRect(0, (s + 1) * sh - 10, S, 10);
  }
  grain(g, S, S, r, 3000, 0.1);
  return toTex(c, repeat);
}

export function windowTex(lit = true, arched = false) {
  const W = 64, H = 128, [c, g] = mk(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  if (lit) { gr.addColorStop(0, '#ffb650'); gr.addColorStop(0.6, '#ff9428'); gr.addColorStop(1, '#d8660f'); }
  else { gr.addColorStop(0, '#3a2a2a'); gr.addColorStop(1, '#140e10'); }
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = lit ? '#3a1c0a' : '#0c0808';
  g.fillRect(W / 2 - 2, 0, 4, H);
  for (let i = 1; i < 4; i++) g.fillRect(0, (i * H) / 4 - 1.5, W, 3);
  g.strokeStyle = g.fillStyle; g.lineWidth = 6; g.strokeRect(0, 0, W, H);
  if (arched) {
    g.globalCompositeOperation = 'destination-in';
    g.beginPath(); g.moveTo(0, H); g.lineTo(0, W / 2); g.arc(W / 2, W / 2, W / 2, Math.PI, 0); g.lineTo(W, H); g.fill();
  }
  return toTex(c);
}

// Scorcio di interno visto attraverso il portone
export function doorGlimpseTex() {
  const W = 128, H = 256, [c, g] = mk(W, H);
  g.fillStyle = '#0e0705'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(64, 150, 4, 64, 150, 120);
  gr.addColorStop(0, 'rgba(255,170,80,0.9)'); gr.addColorStop(0.4, 'rgba(170,80,30,0.5)'); gr.addColorStop(1, 'rgba(40,16,8,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a120e';
  g.beginPath(); g.moveTo(40, 256); g.lineTo(88, 256); g.lineTo(72, 190); g.lineTo(56, 190); g.fill();
  g.fillStyle = '#1a0c08';
  g.beginPath(); g.moveTo(50, 190); g.lineTo(50, 130); g.arc(64, 130, 14, Math.PI, 0); g.lineTo(78, 190); g.fill();
  g.fillStyle = '#ffe2a0';
  for (const [x, y] of [[56, 96], [64, 92], [72, 96], [60, 100], [68, 100]]) { g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); }
  g.fillStyle = '#ffd890'; g.beginPath(); g.arc(30, 168, 2, 0, 7); g.fill();
  return toTex(c);
}

export function duskTex() {
  const W = 64, H = 128, [c, g] = mk(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#5a2a3a'); gr.addColorStop(0.55, '#e8702a'); gr.addColorStop(0.7, '#3a1c12'); gr.addColorStop(1, '#140a06');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return toTex(c);
}

export function parchmentCanvas(w = 512, h = 720) {
  const [c, g] = mk(w, h), r = rng(90);
  g.fillStyle = '#e2d2a8'; g.fillRect(0, 0, w, h);
  blotches(g, w, h, r, 26, ['170,130,70', '240,226,190'], 40, 180, 0.22);
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
  v.addColorStop(0, 'rgba(90,50,10,0)'); v.addColorStop(1, 'rgba(90,50,10,0.4)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  grain(g, w, h, r, 4000, 0.06);
  return c;
}

export function textTex(lines, { w = 512, h = 256, font = 'italic 34px Georgia, serif', color = '#d8c8a0', lineH = 46 } = {}) {
  const [c, g] = mk(w, h);
  g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = h / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => g.fillText(l, w / 2, y0 + i * lineH));
  return toTex(c);
}

// ---- sala da pranzo e studiolo ----

/** Carta da parati vittoriana: damasco verde scuro */
export function wallpaperTex(repeat) {
  const S = 256, [c, g] = mk(S, S), r = rng(140);
  g.fillStyle = '#1c2a20'; g.fillRect(0, 0, S, S);
  const motif = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(120,140,90,0.22)';
    g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(26, -30, 22, -6, 0, 0); g.bezierCurveTo(-22, -6, -26, -30, 0, -46); g.fill();
    g.beginPath(); g.moveTo(0, 46); g.bezierCurveTo(26, 30, 22, 6, 0, 0); g.bezierCurveTo(-22, 6, -26, 30, 0, 46); g.fill();
    g.beginPath(); g.ellipse(-24, 0, 16, 7, 0, 0, 7); g.ellipse(24, 0, 16, 7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(200,170,100,0.18)';
    g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    g.restore();
  };
  motif(64, 64, 1);
  motif(192, 192, 1);
  blotches(g, S, S, r, 18, ['8,12,8', '50,60,40'], 20, 80, 0.18);
  grain(g, S, S, r, 2500, 0.08);
  return toTex(c, repeat);
}

/** Parquet a listoni */
export function parquetTex(repeat) {
  const S = 512, [c, g] = mk(S, S), r = rng(141);
  const rows = 8, h = S / rows;
  for (let i = 0; i < rows; i++) {
    let x = -r() * 200;
    while (x < S) {
      const w = 160 + r() * 140;
      g.fillStyle = `hsl(${22 + r() * 8},${35 + r() * 15}%,${14 + r() * 9}%)`;
      g.fillRect(x, i * h, w, h);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(x, i * h + r() * h, w, 1); }
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, i * h, 2, h);
      x += w;
    }
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, i * h, S, 2);
  }
  grain(g, S, S, r, 3000, 0.08);
  return toTex(c, repeat);
}

/** Mappamondo antico: continenti a macchie su fondo pergamena */
export function globeTex() {
  const W = 512, H = 256, [c, g] = mk(W, H), r = rng(142);
  g.fillStyle = '#c8b07a'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#8a6a38';
  const land = [[90, 80, 50, 35], [120, 150, 30, 50], [250, 70, 40, 30], [270, 140, 35, 55], [360, 80, 80, 40], [420, 170, 30, 20], [200, 40, 20, 10]];
  for (const [x, y, rx, ry] of land) {
    for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * rx * 1.4, y + (r() - 0.5) * ry * 1.4, rx * (0.3 + r() * 0.4), ry * (0.3 + r() * 0.4), r() * 3, 0, 7); g.fill(); }
  }
  g.strokeStyle = 'rgba(70,40,15,0.4)'; g.lineWidth = 1;
  for (let x = 0; x <= W; x += W / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += H / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  blotches(g, W, H, r, 20, ['90,60,20'], 20, 70, 0.2);
  return toTex(c);
}

/** Mappa antica da appendere al muro */
export function mapTex() {
  const W = 384, H = 256, [c, g] = mk(W, H), r = rng(143);
  g.fillStyle = '#cdb88a'; g.fillRect(0, 0, W, H);
  blotches(g, W, H, r, 20, ['150,110,60', '230,210,170'], 30, 100, 0.25);
  g.strokeStyle = 'rgba(80,50,20,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(40, 200);
  for (let i = 0; i < 18; i++) g.lineTo(40 + i * 17 + r() * 8, 120 + Math.sin(i * 0.8) * 60 + r() * 14);
  g.stroke();
  g.fillStyle = 'rgba(80,50,20,0.55)';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * W, r() * H, 1.5, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(120,30,20,0.8)'; g.setLineDash([5, 5]);
  g.beginPath(); g.moveTo(60, 60); g.bezierCurveTo(150, 30, 220, 160, 320, 90); g.stroke(); g.setLineDash([]);
  g.font = 'italic 20px Georgia, serif'; g.fillStyle = 'rgba(70,40,15,0.85)'; g.fillText('Terra incognita', 210, 225);
  g.beginPath(); g.arc(320, 90, 7, 0, 7); g.strokeStyle = 'rgba(120,30,20,0.9)'; g.stroke();
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
  v.addColorStop(0, 'rgba(60,30,10,0)'); v.addColorStop(1, 'rgba(60,30,10,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return toTex(c);
}

/** Scorcio dell'ala laterale aperta: luce di camino */
export function fireGlimpseTex() {
  const W = 128, H = 256, [c, g] = mk(W, H);
  g.fillStyle = '#120604'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(40, 200, 4, 40, 200, 150);
  gr.addColorStop(0, 'rgba(255,150,50,0.95)'); gr.addColorStop(0.35, 'rgba(190,70,20,0.55)'); gr.addColorStop(1, 'rgba(40,12,4,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a0e08'; g.fillRect(70, 150, 50, 50);
  g.fillStyle = '#3a1410'; g.beginPath(); g.moveTo(20, 256); g.lineTo(108, 256); g.lineTo(84, 210); g.lineTo(44, 210); g.fill();
  return toTex(c);
}
