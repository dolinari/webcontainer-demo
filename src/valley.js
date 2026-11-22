// La biblioteca: il grande dipinto della valle al tramonto e il libro sul leggio,
// la cronaca delle lanterne. Disegni e testi in italiano e in inglese.
import { L } from './i18n.js';
import { mk } from './textures.js';

const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

// ---------- il grande dipinto ----------
/**
 * Olio su tela, panoramico: Lichtensee al tramonto. Un lago alpino stretto fra pareti di roccia,
 * il paese di legno con il campanile sulla riva, la Lanterna Grande che galleggia sull'acqua,
 * la catena di luci sul crinale, l'altare sulla collina, il rudere all'orizzonte e la villa fra i cipressi.
 */
export function valleyPaintingCanvas(W = 2048, H = 1024, { rite = true } = {}) {
  const [c, g] = mk(W, H);
  const r = seeded(4242);
  const LY = H * 0.66; // la linea dell'acqua
  // cielo
  const sky = g.createLinearGradient(0, 0, 0, LY);
  sky.addColorStop(0, '#2e1230'); sky.addColorStop(0.35, '#7a2626'); sky.addColorStop(0.72, '#de6e2a'); sky.addColorStop(1, '#f6c062');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sx = W * 0.6, sy = H * 0.47;
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.5);
  halo.addColorStop(0, 'rgba(255,236,170,0.95)'); halo.addColorStop(0.08, 'rgba(255,200,110,0.7)'); halo.addColorStop(0.4, 'rgba(240,120,50,0.2)'); halo.addColorStop(1, 'rgba(200,60,30,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(sx, sy, H * 0.032, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 70; i++) {
    const y = H * (0.05 + r() * 0.33), x = r() * W, w = 120 + r() * 380;
    g.strokeStyle = `rgba(${200 + r() * 55 | 0},${70 + r() * 80 | 0},${50 + r() * 40 | 0},${0.12 + r() * 0.2})`;
    g.lineWidth = 4 + r() * 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6 + r() * 12, x + w, y + (r() - 0.5) * 10); g.stroke();
  }
  // montagne lontane, azzurrate dalla foschia
  const ridge = (base, amp, color, rough, seed, top = H) => {
    const rr = seeded(seed);
    g.fillStyle = color; g.beginPath(); g.moveTo(0, top);
    let y = base;
    for (let x = 0; x <= W; x += 14) { y += (rr() - 0.5) * rough; y += (base - y) * 0.05; g.lineTo(x, y - Math.sin(x / W * Math.PI * (2 + seed % 3)) * amp); }
    g.lineTo(W, top); g.closePath(); g.fill();
  };
  ridge(H * 0.5, H * 0.07, '#6a3050', 20, 7, LY + 2);
  ridge(H * 0.56, H * 0.05, '#5a2a40', 16, 11, LY + 2);
  // le pareti di roccia a picco sul lago, a sinistra e a destra (alla Hallstatt)
  const cliff = (pts, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(pts[0][0] * W, pts[0][1] * H); for (const [x, y] of pts.slice(1)) g.lineTo(x * W, y * H); g.closePath(); g.fill(); };
  cliff([[0, 0.2], [0.06, 0.16], [0.12, 0.24], [0.17, 0.3], [0.22, 0.42], [0.27, 0.55], [0.31, 0.66], [0, 0.66]], '#3e1c26');
  cliff([[1, 0.24], [0.94, 0.2], [0.89, 0.3], [0.84, 0.36], [0.8, 0.48], [0.76, 0.6], [0.73, 0.66], [1, 0.66]], '#43202a');
  // lumeggiature calde sulle rocce, a pennellate verticali
  for (let i = 0; i < 260; i++) {
    const left = r() < 0.5, x = left ? r() * W * 0.26 : W * (0.78 + r() * 0.22), y = H * (0.25 + r() * 0.4);
    g.strokeStyle = `rgba(${150 + r() * 80 | 0},${60 + r() * 40 | 0},${40 + r() * 30 | 0},${0.12 + r() * 0.15})`;
    g.lineWidth = 2 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 10, y + 20 + r() * 50); g.stroke();
  }
  // il lago: riflette il cielo, con la scia del sole
  const lake = g.createLinearGradient(0, LY, 0, H * 0.86);
  lake.addColorStop(0, '#f0a050'); lake.addColorStop(0.35, '#a8442a'); lake.addColorStop(1, '#3a1822');
  g.fillStyle = lake; g.fillRect(0, LY, W, H * 0.2);
  for (let i = 0; i < 160; i++) {
    const y = LY + Math.pow(r(), 1.4) * H * 0.19, near = Math.abs(r() - 0.5) * (y - LY) * 3 + 20;
    const x = sx + (r() - 0.5) * near * 2;
    g.fillStyle = `rgba(255,${200 + r() * 50 | 0},${120 + r() * 60 | 0},${0.25 + r() * 0.5})`;
    g.fillRect(x, y, 10 + r() * 50, 2 + r() * 2);
  }
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(60,20,20,${0.1 + r() * 0.15})`; g.fillRect(r() * W, LY + r() * H * 0.19, 40 + r() * 140, 2); }
  // riflessi scuri delle pareti nell'acqua
  g.fillStyle = 'rgba(40,16,24,0.45)'; g.fillRect(0, LY, W * 0.3, H * 0.12); g.fillRect(W * 0.74, LY, W * 0.26, H * 0.12);
  // la riva vicina, in basso: prati d'autunno e alberi a tocchi
  const shore = g.createLinearGradient(0, H * 0.84, 0, H);
  shore.addColorStop(0, '#6a3018'); shore.addColorStop(1, '#22100a');
  g.fillStyle = shore; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, H * (0.85 + Math.sin(x / 170) * 0.012 + (x > W * 0.35 && x < W * 0.5 ? 0.02 : 0)));
  g.lineTo(W, H); g.closePath(); g.fill();
  // il ruscello che scende al lago
  g.lineCap = 'round';
  for (const [lw, col] of [[26, 'rgba(60,20,10,0.6)'], [15, '#e8903a'], [6, '#ffd690']]) {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(W * 0.36, H * 1.02); g.bezierCurveTo(W * 0.44, H * 0.95, W * 0.37, H * 0.9, W * 0.43, H * 0.86); g.stroke();
  }
  for (let i = 0; i < 700; i++) {
    const x = r() * W, y = H * (0.85 + r() * 0.15), s = 3 + (y / H - 0.84) * 60 * r();
    g.fillStyle = ['#a8381c', '#c8641c', '#8a2a14', '#d8902c', '#5a3a14'][(r() * 5) | 0];
    g.globalAlpha = 0.55 + r() * 0.4; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // il paese di legno sulla riva sinistra, a gradoni sotto la parete, con il campanile a punta sull'acqua
  for (let i = 0; i < 26; i++) {
    const k = i / 25, x = W * (0.03 + k * 0.23) + (r() - 0.5) * 30, base = LY - (1 - k) * H * 0.07 - r() * H * 0.03;
    const w = 22 + r() * 22, h = 22 + r() * 18;
    g.fillStyle = ['#e0d0b0', '#d8c098', '#c8a878'][(r() * 3) | 0]; g.fillRect(x, base - h * 0.45, w, h * 0.45); // piano terra in muratura chiara
    g.fillStyle = ['#6a3a1c', '#5a2e16', '#7a4422'][(r() * 3) | 0]; g.fillRect(x, base - h, w, h * 0.55);     // piano alto in legno scuro
    g.fillStyle = '#3a1e14'; g.beginPath(); g.moveTo(x - 4, base - h); g.lineTo(x + w / 2, base - h - 14); g.lineTo(x + w + 4, base - h); g.fill();
    g.fillStyle = '#ffd070'; if (r() < 0.75) g.fillRect(x + w * 0.3, base - h * 0.75, 4, 5); if (r() < 0.5) g.fillRect(x + w * 0.62, base - h * 0.3, 4, 5);
    g.fillStyle = 'rgba(255,190,90,0.35)'; g.fillRect(x + w * 0.3, LY + (LY - base) * 0.4 + 6, 3, 14); // riflesso delle finestre
  }
  const cx = W * 0.27, cy = LY - 2;
  g.fillStyle = '#ece0c8'; g.fillRect(cx - 12, cy - 120, 24, 120);
  g.fillStyle = '#2a1410'; g.beginPath(); g.moveTo(cx - 15, cy - 120); g.lineTo(cx, cy - 190); g.lineTo(cx + 15, cy - 120); g.fill();
  g.fillStyle = '#ffd070'; g.fillRect(cx - 3, cy - 100, 6, 9);
  g.fillStyle = 'rgba(236,224,200,0.22)'; g.fillRect(cx - 10, LY + 4, 20, 70);
  // l'altare sulla spalla della parete sinistra e il rudere all'orizzonte, a destra
  g.fillStyle = '#c8a880'; g.fillRect(W * 0.13, H * 0.235, 26, 12); g.fillRect(W * 0.13 + 4, H * 0.222, 18, 7);
  g.fillStyle = '#4a2030'; g.fillRect(W * 0.9, H * 0.205, 12, 34); g.fillRect(W * 0.9 + 22, H * 0.212, 10, 26); g.fillRect(W * 0.9 - 5, H * 0.23, 52, 7);
  // la villa, piccolissima tra i cipressi, sulla riva destra: quasi nascosta
  const hx = W * 0.8, hy = H * 0.64;
  g.fillStyle = '#d8b088'; g.fillRect(hx, hy - 24, 38, 24);
  g.fillStyle = '#7a3a22'; g.beginPath(); g.moveTo(hx - 4, hy - 24); g.lineTo(hx + 19, hy - 33); g.lineTo(hx + 42, hy - 24); g.fill();
  g.fillStyle = '#ffd070'; g.fillRect(hx + 8, hy - 17, 4, 5); g.fillRect(hx + 25, hy - 17, 4, 5);
  for (const dx of [-12, 48, 57]) { g.fillStyle = '#1a2414'; g.beginPath(); g.ellipse(hx + dx, hy - 24, 6, 28, 0, 0, Math.PI * 2); g.fill(); }
  // luci che splendono: la catena sul crinale, la processione sulla riva, le barche, la Lanterna Grande
  const light = (x, y, rad, a = 1) => {
    const gl = g.createRadialGradient(x, y, 0, x, y, rad);
    gl.addColorStop(0, `rgba(255,232,160,${a})`); gl.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  };
  if (rite) { // la notte del rito: senza, è la vista di una sera qualunque
  for (let i = 0; i < 22; i++) { const k = i / 21; light(W * (0.79 + k * 0.17), H * (0.47 - k * 0.24 + Math.sin(k * 12) * 0.01), 9); }
  for (let i = 0; i < 20; i++) { const k = i / 19; light(W * (0.06 + k * 0.08), H * (0.62 - k * 0.38), 8 - k * 3); }
  for (const [bx, by] of [[0.42, 0.74], [0.5, 0.79], [0.68, 0.76], [0.36, 0.7]]) {
    g.fillStyle = '#1a0c08'; g.beginPath(); g.ellipse(W * bx, H * by, 22, 5, 0, 0, Math.PI * 2); g.fill();
    light(W * bx + 6, H * by - 10, 12);
  }
  for (let i = 0; i < 30; i++) { const x = W * (0.32 + r() * 0.4), y = LY + H * (0.02 + r() * 0.15); light(x, y, 5 + r() * 5, 0.85); }
  const gx = W * 0.56, gy = H * 0.72;
  light(gx, gy - 30, 120, 0.55);
  g.fillStyle = '#2a1608'; g.fillRect(gx - 22, gy - 4, 44, 6);
  g.fillStyle = '#ffe6a8'; g.fillRect(gx - 16, gy - 62, 32, 58);
  g.strokeStyle = '#2a1608'; g.lineWidth = 4; g.strokeRect(gx - 16, gy - 62, 32, 58);
  g.fillStyle = '#2a1608'; g.beginPath(); g.moveTo(gx - 22, gy - 62); g.lineTo(gx, gy - 84); g.lineTo(gx + 22, gy - 62); g.fill();
  g.fillStyle = 'rgba(255,220,140,0.5)'; for (let k = 0; k < 9; k++) g.fillRect(gx - 14 + (r() - 0.5) * 10, gy + 6 + k * 9, 28 - k * 2, 3);
  }
  // grana della tela e patina della vernice antica
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,230,200' : '20,8,4'},${0.03 + r() * 0.04})`; g.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 2); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,12,4,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

export const PAINTING = {
  title: L('Lichtensee, la Notte delle Lanterne', 'Lichtensee, the Night of the Lanterns'),
  meta: L('Olio su tela · autore ignoto · primi dell’Ottocento', 'Oil on canvas · unknown artist · early 19th century'),
  text: L(
    'Il lago al tramonto, stretto fra pareti di roccia. Sulla riva sinistra il paese di legno sale a gradoni sotto la montagna, con il campanile bianco quasi nell’acqua. Al centro del lago galleggia una lanterna enorme; intorno, barche con un lume a prua e decine di piccole luci lasciate sull’acqua. Una fila di fiammelle sale verso il vecchio altare, un’altra corre lungo il crinale fino al rudere. Chi l’ha dipinto ha messo la villa piccolissima, quasi nascosta fra i cipressi, come se non volesse farsi trovare.',
    'The lake at sunset, held between walls of rock. On the left shore the wooden village climbs in tiers beneath the mountain, its white bell tower almost in the water. In the middle of the lake floats an enormous lantern; around it, boats with a light at the bow and dozens of small lights left on the water. A line of flames climbs towards the old altar, another runs along the ridge to the ruin. Whoever painted it made the villa very small, almost hidden among the cypresses, as if it did not want to be found.'),
};

// ---------- il libro sul leggio: la cronaca delle lanterne ----------
/** Incisione a inchiostro: la processione che sale all'altare, sotto un sole basso. */
export function engravingCanvas(W = 640, H = 460) {
  const [c, g] = mk(W, H);
  const r = seeded(77);
  g.fillStyle = '#efe2c2'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#2a1a10'; g.fillStyle = '#2a1a10'; g.lineCap = 'round';
  g.lineWidth = 3; g.strokeRect(14, 14, W - 28, H - 28); g.lineWidth = 1; g.strokeRect(22, 22, W - 44, H - 44);
  // sole a raggi
  const sx = W * 0.7, sy = H * 0.36;
  g.beginPath(); g.arc(sx, sy, 34, 0, Math.PI * 2); g.stroke();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) { g.beginPath(); g.moveTo(sx + Math.cos(a) * 42, sy + Math.sin(a) * 42); g.lineTo(sx + Math.cos(a) * (60 + (a * 7 % 3) * 6), sy + Math.sin(a) * (60 + (a * 7 % 3) * 6)); g.stroke(); }
  // colline a tratteggio
  for (let k = 0; k < 3; k++) {
    const base = H * (0.5 + k * 0.1);
    g.beginPath();
    for (let x = 24; x < W - 24; x += 6) g.lineTo(x, base - Math.sin(x / 70 + k * 2) * 18 - k * 4);
    g.stroke();
    for (let x = 30; x < W - 30; x += 9) { const y = base - Math.sin(x / 70 + k * 2) * 18 - k * 4; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x - 5, y + 14 + k * 4); g.stroke(); }
  }
  // l'altare in cima
  g.fillRect(W * 0.18, H * 0.4, 46, 16); g.fillRect(W * 0.18 + 6, H * 0.37, 34, 6);
  // figure incappucciate con le lanterne, in fila
  for (let i = 0; i < 9; i++) {
    const x = W * (0.3 + i * 0.065), y = H * (0.8 - i * 0.035), s = 1 - i * 0.05;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 9 * s, y + 0); g.lineTo(x - 5 * s, y - 34 * s); g.arc(x - 2 * s, y - 38 * s, 6 * s, Math.PI, 0); g.lineTo(x + 6 * s, y); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + 6 * s, y - 24 * s); g.lineTo(x + 14 * s, y - 30 * s); g.stroke();
    g.strokeRect(x + 11 * s, y - 30 * s, 7 * s, 9 * s);
    g.save(); g.globalAlpha = 0.35; g.beginPath(); g.arc(x + 14.5 * s, y - 25.5 * s, 9 * s, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  // il ruscello in primo piano, a onde
  for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 30; x < W - 30; x += 5) g.lineTo(x, H * 0.88 + k * 6 + Math.sin(x / 18 + k) * 2); g.stroke(); }
  // macchie e ingiallimento
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,80,30,${r() * 0.08})`; g.beginPath(); g.arc(r() * W, r() * H, 4 + r() * 30, 0, Math.PI * 2); g.fill(); }
  return c;
}

/** Fotografia antica, virata seppia: le lanterne lasciate sull'acqua del ruscello. */
export function lanternPhotoCanvas(W = 640, H = 460) {
  const [c, g] = mk(W, H);
  const r = seeded(1902);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#5a4630'); bg.addColorStop(0.45, '#8a7050'); bg.addColorStop(0.55, '#3a2c1c'); bg.addColorStop(1, '#1e160e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // la riva e gli alberi scuri
  g.fillStyle = '#20180e';
  g.beginPath(); g.moveTo(0, H * 0.5); for (let x = 0; x <= W; x += 12) g.lineTo(x, H * 0.5 - 30 - Math.sin(x / 40) * 14 - r() * 18); g.lineTo(W, H * 0.56); g.lineTo(0, H * 0.56); g.fill();
  // figure sulla riva, controluce
  for (let i = 0; i < 7; i++) {
    const x = W * (0.12 + i * 0.12) + r() * 20, y = H * 0.56;
    g.fillStyle = '#140e08'; g.beginPath(); g.ellipse(x, y - 26, 7, 24, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x, y - 52, 6, 0, Math.PI * 2); g.fill();
  }
  // le lanterne che galleggiano, con il riflesso
  for (let i = 0; i < 14; i++) {
    const x = r() * W, y = H * (0.6 + r() * 0.32), s = 4 + (y / H - 0.6) * 16;
    const gl = g.createRadialGradient(x, y, 0, x, y, s * 3);
    gl.addColorStop(0, 'rgba(255,240,200,0.95)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, s * 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,230,180,0.35)'; g.fillRect(x - 1, y + s, 2, s * 5);
  }
  // grana, graffi, vignettatura e bordo bianco della stampa
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,240,210' : '0,0,0'},${r() * 0.08})`; g.fillRect(r() * W, r() * H, 1.5, 1.5); }
  g.strokeStyle = 'rgba(255,240,210,0.25)';
  for (let i = 0; i < 8; i++) { g.beginPath(); const x = r() * W; g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 40, H); g.lineWidth = 0.6; g.stroke(); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.6);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.75)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#efe6d2'; g.lineWidth = 18; g.strokeRect(0, 0, W, H);
  return c;
}

/** Il segno inciso sull'altare: un cerchio e tre luci, in alto, all'orizzonte, nell'acqua. */
export function signCanvas(W = 360, H = 360) {
  const [c, g] = mk(W, H);
  g.fillStyle = '#efe2c2'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#3a2010'; g.fillStyle = '#3a2010'; g.lineWidth = 5;
  g.beginPath(); g.arc(W / 2, H / 2, W * 0.36, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.14, H / 2); g.lineTo(W * 0.86, H / 2); g.stroke();
  for (const [x, y] of [[0.5, 0.24], [0.8, 0.5], [0.5, 0.78]]) {
    g.beginPath(); g.arc(W * x, H * y, 13, 0, Math.PI * 2); g.fill();
    g.save(); g.globalAlpha = 0.3; g.beginPath(); g.arc(W * x, H * y, 26, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  return c;
}

const img = (canvas, alt, cls = '') => `<figure class="cplate ${cls}"><img src="${canvas.toDataURL('image/jpeg', 0.85)}" alt="${alt}" /></figure>`;

/** Le pagine del libro sul leggio (create al primo uso, perché disegnano delle immagini). */
export function codexPages() {
  return [
    `<div class="tp">
      <small>${L('cronaca di un custode', 'chronicle of a keeper')}</small>
      <h3>${L('Delle Lanterne<br />della Valle', 'Of the Lanterns<br />of the Valley')}</h3>
      ${img(engravingCanvas(), L('Incisione: una processione di figure incappucciate con le lanterne sale verso un altare, sotto il sole basso', 'Engraving: a procession of hooded figures with lanterns climbs towards an altar, under a low sun'))}
      <p class="yr">MDCCLXXX</p>
    </div>`,
    `<h4>${L('La sera dell’ultima luce', 'The Evening of the Last Light')}</h4>
     <p>${L('Una volta l’anno, quando il sole d’autunno tramonta più lento, a Lichtensee si spegne ogni altra luce. I bambini girano per i vicoli con le lanterne fatte a mano, cantando le vecchie filastrocche. Gli altri, incappucciati, scendono in silenzio fino al lago.', 'Once a year, when the autumn sun sets most slowly, every other light goes out in Lichtensee. The children walk the lanes with handmade lanterns, singing the old rhymes. The others, hooded, go down to the lake in silence.')}</p>
     <p>${L('Al centro dell’acqua galleggia la Lanterna Grande. Ognuno affida al lago una lanterna per chi è lontano: chi è partito, chi si è perso, chi non è mai tornato. Poi si sale al vecchio altare, e lungo il crinale si accendono i fuochi, uno dopo l’altro. Il Custode dice il nome di ciascuno, a bassa voce, e non lo ripete mai.', 'In the middle of the water floats the Great Lantern. Each one entrusts to the lake a lantern for someone far away: those who left, those who got lost, those who never came back. Then they climb to the old altar, and along the ridge the fires are lit, one after another. The Keeper speaks each name, quietly, and never says it twice.')}</p>
     <p>${L('Si racconta che chi è lontano veda quella luce, ovunque si trovi, e ritrovi la strada. Ma se una lanterna si spegne prima del giorno, la valle trattiene il suo nome, e nessuno lo pronuncia più.', 'It is said that whoever is far away sees that light, wherever they are, and finds the way back. But if a lantern goes out before daybreak, the valley keeps its name, and no one speaks it again.')}</p>`,
    `${img(signCanvas(), L('Un cerchio tagliato da una linea, con tre punti: in alto, a destra, in basso', 'A circle cut by a line, with three dots: at the top, on the right, at the bottom'), 'sign')}
     <h4>${L('Il segno', 'The Sign')}</h4>
     <p>${L('Sulla pietra dell’altare è inciso un cerchio con tre luci: una in alto, una sull’orizzonte, una nell’acqua. «Così si guarda la valle», scrive il Custode, «con tre occhi: verso il cielo, verso la terra, verso ciò che scorre».', 'On the altar stone is carved a circle with three lights: one up high, one on the horizon, one in the water. “This is how the valley is watched,” the Keeper writes, “with three eyes: towards the sky, towards the land, towards what flows.”')}</p>
     <p class="pencil">${L('Chi conta le luci della valle<br />trova sempre tre numeri.', 'Whoever counts the lights of the valley<br />always finds three numbers.')}</p>`,
    `${img(lanternPhotoCanvas(), L('Fotografia antica: lanterne che galleggiano sul ruscello, figure scure sulla riva', 'Old photograph: lanterns floating on the stream, dark figures on the bank'), 'photo')}
     <p class="caption">${L('La Notte delle Lanterne sul lago, 1902. Nessuno ricorda chi scattò questa fotografia.', 'The Night of the Lanterns on the lake, 1902. No one remembers who took this photograph.')}</p>
     <p class="pencil">${L('L. era fra loro.<br />Portava una lanterna senza nome.', 'L. was among them.<br />She carried a lantern with no name.')}</p>`,
  ];
}

/** La doppia pagina vista sul leggio, in 3D: incisione a sinistra, righe di testo a destra. */
export function codexSpreadCanvas(W = 1024, H = 700) {
  const [c, g] = mk(W, H);
  const paper = g.createLinearGradient(0, 0, W, 0);
  paper.addColorStop(0, '#cdb88a'); paper.addColorStop(0.08, '#ece0c0'); paper.addColorStop(0.47, '#e4d4b0'); paper.addColorStop(0.5, '#a88a5a'); paper.addColorStop(0.53, '#e4d4b0'); paper.addColorStop(0.92, '#ece0c0'); paper.addColorStop(1, '#cdb88a');
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.drawImage(engravingCanvas(), W * 0.06, H * 0.12, W * 0.38, H * 0.6);
  g.fillStyle = '#3a2010'; g.font = 'italic 30px Georgia, serif'; g.textAlign = 'center';
  g.fillText(L('Delle Lanterne della Valle', 'Of the Lanterns of the Valley'), W * 0.25, H * 0.84);
  g.drawImage(signCanvas(), W * 0.66, H * 0.08, H * 0.18, H * 0.18);
  g.fillStyle = 'rgba(40,24,12,0.75)';
  const r = seeded(9);
  for (let y = H * 0.33; y < H * 0.9; y += 22) {
    const w = W * (0.34 - (r() < 0.12 ? 0.15 : 0) - r() * 0.03);
    for (let x = W * 0.56; x < W * 0.56 + w; x += 10 + r() * 22) g.fillRect(x, y, 6 + r() * 18, 3);
  }
  return c;
}
