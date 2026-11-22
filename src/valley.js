// La biblioteca: il grande dipinto della valle al tramonto e il libro sul leggio,
// la cronaca delle lanterne. Disegni e testi in italiano e in inglese.
import { L } from './i18n.js';
import { mk } from './textures.js';

const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

// ---------- il grande dipinto ----------
/** Olio su tela, panoramico: la vallata al tramonto vista dalla villa. */
export function valleyPaintingCanvas(W = 2048, H = 1024) {
  const [c, g] = mk(W, H);
  const r = seeded(4242);
  // cielo
  const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, '#3a1430'); sky.addColorStop(0.35, '#8a2a24'); sky.addColorStop(0.7, '#e2742a'); sky.addColorStop(1, '#f6c060');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // sole basso, un po' a destra, con l'alone
  const sx = W * 0.64, sy = H * 0.5;
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.55);
  halo.addColorStop(0, 'rgba(255,236,170,0.95)'); halo.addColorStop(0.08, 'rgba(255,200,110,0.7)'); halo.addColorStop(0.4, 'rgba(240,120,50,0.22)'); halo.addColorStop(1, 'rgba(200,60,30,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(sx, sy, H * 0.035, 0, Math.PI * 2); g.fill();
  // nuvole a pennellate orizzontali
  for (let i = 0; i < 70; i++) {
    const y = H * (0.06 + r() * 0.36), x = r() * W, w = 120 + r() * 380;
    g.strokeStyle = `rgba(${200 + r() * 55 | 0},${70 + r() * 80 | 0},${50 + r() * 40 | 0},${0.12 + r() * 0.2})`;
    g.lineWidth = 4 + r() * 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6 + r() * 12, x + w, y + (r() - 0.5) * 10); g.stroke();
  }
  // catene di monti, dal lontano al vicino
  const ridge = (base, amp, color, rough, seed) => {
    const rr = seeded(seed);
    g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
    let y = base;
    for (let x = 0; x <= W; x += 16) {
      y += (rr() - 0.5) * rough; y += (base - y) * 0.04;
      g.lineTo(x, y - Math.sin(x / W * Math.PI * (2 + seed % 3)) * amp);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  ridge(H * 0.52, H * 0.06, '#6a3048', 18, 7);
  ridge(H * 0.57, H * 0.05, '#5a2a38', 14, 11);
  ridge(H * 0.63, H * 0.04, '#7a3a26', 12, 13);
  // fondovalle
  const floor = g.createLinearGradient(0, H * 0.62, 0, H);
  floor.addColorStop(0, '#8a4a22'); floor.addColorStop(0.5, '#5a2a14'); floor.addColorStop(1, '#2a140a');
  g.fillStyle = floor; g.fillRect(0, H * 0.66, W, H * 0.34);
  ridge(H * 0.7, H * 0.025, '#6a3418', 9, 17);
  // il ruscello che serpeggia e riflette il cielo
  g.lineCap = 'round';
  for (const [lw, col] of [[34, 'rgba(60,20,10,0.6)'], [22, '#e8903a'], [9, '#ffd690']]) {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(W * 0.62, H * 0.69);
    g.bezierCurveTo(W * 0.5, H * 0.74, W * 0.72, H * 0.8, W * 0.52, H * 0.86);
    g.bezierCurveTo(W * 0.36, H * 0.91, W * 0.48, H * 0.96, W * 0.4, H * 1.02);
    g.stroke();
  }
  // filari d'alberi d'autunno a tocchi
  for (let i = 0; i < 900; i++) {
    const x = r() * W, y = H * (0.68 + Math.pow(r(), 0.8) * 0.3);
    const s = 3 + (y / H - 0.66) * 40 * r();
    g.fillStyle = ['#a8381c', '#c8641c', '#8a2a14', '#d8902c', '#5a3a14'][(r() * 5) | 0];
    g.globalAlpha = 0.55 + r() * 0.4;
    g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // il borgo con il campanile, a sinistra
  const vx = W * 0.22, vy = H * 0.7;
  for (let i = 0; i < 16; i++) {
    const w = 16 + r() * 22, h = 14 + r() * 20, x = vx + (r() - 0.5) * 220, y = vy + (r() - 0.5) * 30;
    g.fillStyle = ['#c89a6a', '#b07a4a', '#d8b080'][(r() * 3) | 0]; g.fillRect(x, y - h, w, h);
    g.fillStyle = '#7a3420'; g.beginPath(); g.moveTo(x - 3, y - h); g.lineTo(x + w / 2, y - h - 9); g.lineTo(x + w + 3, y - h); g.fill();
    if (r() < 0.6) { g.fillStyle = '#ffd070'; g.fillRect(x + w * 0.4, y - h * 0.6, 4, 5); }
  }
  g.fillStyle = '#c8a070'; g.fillRect(vx - 8, vy - 92, 18, 92);
  g.fillStyle = '#6a2a18'; g.beginPath(); g.moveTo(vx - 12, vy - 92); g.lineTo(vx + 1, vy - 122); g.lineTo(vx + 14, vy - 92); g.fill();
  // il vecchio altare sulla collina di sinistra e il rudere all'orizzonte, a destra
  g.fillStyle = '#c8a880'; g.fillRect(W * 0.08, H * 0.56, 30, 14); g.fillRect(W * 0.08 + 4, H * 0.545, 22, 8);
  g.fillStyle = '#4a2030';
  g.fillRect(W * 0.86, H * 0.49, 14, 40); g.fillRect(W * 0.86 + 26, H * 0.5, 12, 32); g.fillRect(W * 0.86 - 6, H * 0.52, 60, 8);
  // la villa, piccolissima tra i cipressi, quasi nascosta
  const hx = W * 0.79, hy = H * 0.665;
  g.fillStyle = '#d8b088'; g.fillRect(hx, hy - 26, 40, 26);
  g.fillStyle = '#7a3a22'; g.beginPath(); g.moveTo(hx - 4, hy - 26); g.lineTo(hx + 20, hy - 36); g.lineTo(hx + 44, hy - 26); g.fill();
  g.fillStyle = '#ffd070'; g.fillRect(hx + 8, hy - 18, 4, 5); g.fillRect(hx + 26, hy - 18, 4, 5);
  for (const dx of [-14, 50, 60]) { g.fillStyle = '#1a2414'; g.beginPath(); g.ellipse(hx + dx, hy - 26, 6, 30, 0, 0, Math.PI * 2); g.fill(); }
  // la processione di lanterne lungo la strada che sale all'altare
  for (let i = 0; i < 26; i++) {
    const k = i / 25;
    const x = W * (0.42 - k * 0.32) + Math.sin(k * 9) * 30, y = H * (0.86 - k * 0.27);
    const gl = g.createRadialGradient(x, y, 0, x, y, 14 - k * 7);
    gl.addColorStop(0, 'rgba(255,230,150,1)'); gl.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, 14 - k * 7, 0, Math.PI * 2); g.fill();
  }
  // grana della tela e pennellate sovrapposte
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,230,200' : '20,8,4'},${0.03 + r() * 0.04})`;
    g.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 2);
  }
  // patina e vignettatura della vernice antica
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,12,4,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

export const PAINTING = {
  title: L('La Valle delle Lanterne, al tramonto', 'The Valley of Lanterns, at Sunset'),
  meta: L('Olio su tela · autore ignoto · primi dell’Ottocento', 'Oil on canvas · unknown artist · early 19th century'),
  text: L(
    'La grande vallata vista dalla villa, nell’ora in cui il sole tocca le montagne. Il ruscello brilla come un filo di rame; a sinistra il borgo col campanile, sulla collina il vecchio altare, all’orizzonte il rudere. Lungo la strada che sale, decine di piccoli punti di luce: una processione di lanterne. Chi l’ha dipinto ha messo la villa piccolissima, quasi nascosta fra i cipressi, come se non volesse farsi trovare.',
    'The great valley seen from the villa, at the hour when the sun touches the mountains. The stream gleams like a copper thread; on the left the village with its bell tower, on the hill the old altar, on the horizon the ruin. Along the rising road, dozens of tiny points of light: a procession of lanterns. Whoever painted it made the villa very small, almost hidden among the cypresses, as if it did not want to be found.'),
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
     <p>${L('Una volta l’anno, quando il sole tramonta più lento, la gente della valle sale dal ruscello al vecchio altare. Ognuno porta una lanterna per chi è lontano: chi è partito, chi si è perso, chi non è mai tornato.', 'Once a year, when the sun sets most slowly, the people of the valley climb from the stream to the old altar. Each one carries a lantern for someone far away: those who left, those who got lost, those who never came back.')}</p>
     <p>${L('Le lanterne restano accese sulla pietra fino all’alba. Il Custode dice il nome di ciascuno, a bassa voce, e non lo ripete mai.', 'The lanterns stay lit on the stone until dawn. The Keeper speaks each name, quietly, and never says it twice.')}</p>
     <p>${L('Si racconta che chi è lontano veda quella luce, ovunque si trovi, e ritrovi la strada. Ma se una lanterna si spegne prima del giorno, la valle trattiene il suo nome, e nessuno lo pronuncia più.', 'It is said that whoever is far away sees that light, wherever they are, and finds the way back. But if a lantern goes out before daybreak, the valley keeps its name, and no one speaks it again.')}</p>`,
    `${img(signCanvas(), L('Un cerchio tagliato da una linea, con tre punti: in alto, a destra, in basso', 'A circle cut by a line, with three dots: at the top, on the right, at the bottom'), 'sign')}
     <h4>${L('Il segno', 'The Sign')}</h4>
     <p>${L('Sulla pietra dell’altare è inciso un cerchio con tre luci: una in alto, una sull’orizzonte, una nell’acqua. «Così si guarda la valle», scrive il Custode, «con tre occhi: verso il cielo, verso la terra, verso ciò che scorre».', 'On the altar stone is carved a circle with three lights: one up high, one on the horizon, one in the water. “This is how the valley is watched,” the Keeper writes, “with three eyes: towards the sky, towards the land, towards what flows.”')}</p>
     <p class="pencil">${L('Chi conta le luci della valle<br />trova sempre tre numeri.', 'Whoever counts the lights of the valley<br />always finds three numbers.')}</p>`,
    `${img(lanternPhotoCanvas(), L('Fotografia antica: lanterne che galleggiano sul ruscello, figure scure sulla riva', 'Old photograph: lanterns floating on the stream, dark figures on the bank'), 'photo')}
     <p class="caption">${L('La notte delle lanterne, 1902. Nessuno ricorda chi scattò questa fotografia.', 'The night of the lanterns, 1902. No one remembers who took this photograph.')}</p>
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
