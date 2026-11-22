// Il piano di sopra: il salone dei ricevimenti, la camera da letto di E. e l'atelier con la vista sulla valle.
// Si arriva dalle scale del corridoio. Coordinate: pavimento a y = 0, il salone al centro,
// la camera a sinistra (x < -4), l'atelier in fondo (z < -8).
import * as THREE from 'three';
import * as T from './textures.js';
import { L } from './i18n.js';
import { assets, box, cyl, lathe, glowSprite, CandleSet, painting, armchair, stool, urn, sconce, worldPoints, mergeStatic } from './props.js';
import { valleyPaintingCanvas } from './valley.js';

const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/** Uno schizzo a matita appuntato al muro: mani, lanterne, una finestra, una ragazza di spalle. */
function sketchCanvas(kind) {
  const [c, g] = T.mk(256, 320);
  const r = seeded(31 + kind * 7);
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = 'rgba(50,40,30,0.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
  const scribble = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + (r() - 0.5) * 2, y + (r() - 0.5) * 2) : g.moveTo(x, y))); g.stroke(); };
  if (kind % 4 === 0) {
    // una ragazza di spalle, i capelli raccolti
    scribble([[128, 60], [104, 70], [98, 100], [110, 126], [128, 132], [146, 126], [158, 100], [152, 70], [128, 60]]);
    scribble([[110, 132], [90, 160], [74, 240], [70, 300]]); scribble([[146, 132], [166, 160], [182, 240], [186, 300]]);
    scribble([[120, 62], [128, 44], [138, 62]]);
  } else if (kind % 4 === 1) {
    // una lanterna
    scribble([[100, 80], [156, 80], [150, 210], [106, 210], [100, 80]]); scribble([[96, 80], [128, 50], [160, 80]]);
    scribble([[128, 50], [128, 30]]); for (let i = 0; i < 6; i++) scribble([[128, 145], [128 + Math.cos(i) * 60, 145 + Math.sin(i) * 60]]);
  } else if (kind % 4 === 2) {
    // una mano aperta
    scribble([[90, 260], [86, 170], [96, 110], [104, 170], [110, 90], [122, 170], [130, 84], [140, 170], [150, 100], [158, 180], [176, 150], [170, 210], [150, 260]]);
  } else {
    // una finestra sul tramonto
    scribble([[70, 60], [186, 60], [186, 260], [70, 260], [70, 60]]); scribble([[128, 60], [128, 260]]); scribble([[70, 160], [186, 160]]);
    g.beginPath(); g.arc(150, 200, 22, Math.PI, 0); g.stroke();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.05})`; g.fillRect(r() * 256, r() * 320, 2, 2); }
  return c;
}

export function buildUpper() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050302);
  scene.fog = new THREE.FogExp2(0x0a0503, 0.028);
  scene.add(new THREE.HemisphereLight(0x9a6a50, 0x1a100a, 1.05));

  const H = 4.0; // soffitti alti al piano nobile
  const paper = new THREE.MeshStandardMaterial({ map: T.wallpaperTex([5, 1.8]), roughness: 0.9, color: 0xd8c0a8 });
  const paperS = new THREE.MeshStandardMaterial({ map: T.wallpaperTex([2, 1.8]), roughness: 0.9, color: 0xd8c0a8 });
  const wains = new THREE.MeshStandardMaterial({ map: T.woodTex([5, 1], true), roughness: 0.5 });
  const plaster = new THREE.MeshStandardMaterial({ map: T.plasterTex([2, 2], 1), roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.45 });
  const parquet = new THREE.MeshStandardMaterial({ map: T.parquetTex([3, 4]), roughness: 0.32, metalness: 0.05 });
  const plane = (w, h, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
  };
  /** parete con boiserie in basso e carta da parati sopra; ry orienta la faccia visibile */
  const wall = (w, x, z, ry, h = H) => {
    plane(w, 1.0, wains, x, 0.5, z, ry);
    plane(w, h - 1.0, w > 3 ? paper : paperS, x, 1.0 + (h - 1.0) / 2, z, ry);
  };
  /** parete con un vano porta largo dw, alto dh, centrato in c (lungo l'asse della parete) */
  const wallWithDoor = (from, to, c, dw, dh, fixed, axis, ry, h = H) => {
    const a = Math.min(from, to), b = Math.max(from, to);
    const segs = [[a, c - dw / 2], [c + dw / 2, b]];
    for (const [s0, s1] of segs) {
      if (s1 - s0 < 0.01) continue;
      const mid = (s0 + s1) / 2, w = s1 - s0;
      if (axis === 'x') wall(w, mid, fixed, ry, h); else wall(w, fixed, mid, ry, h);
    }
    if (axis === 'x') plane(dw, h - dh, paperS, c, dh + (h - dh) / 2, fixed, ry);
    else plane(dw, h - dh, paperS, fixed, dh + (h - dh) / 2, c, ry);
    // stipiti e architrave
    const n = 0.12;
    if (axis === 'x') {
      for (const s of [-1, 1]) scene.add(box(0.12, dh, 0.22, trim, c + s * (dw / 2 + 0.06), dh / 2, fixed));
      scene.add(box(dw + 0.36, 0.16, 0.22, trim, c, dh + 0.08, fixed));
    } else {
      for (const s of [-1, 1]) scene.add(box(0.22, dh, 0.12, trim, fixed, dh / 2, c + s * (dw / 2 + 0.06)));
      scene.add(box(0.22, 0.16, dw + 0.36, trim, fixed, dh + 0.08, c));
    }
    return n;
  };

  // ================= salone dei ricevimenti =================
  const HX0 = -4, HX1 = 4, HZ0 = 2, HZ1 = -8;
  // pavimento con il vano delle scale (x -3.9…-1.5, z 0.2…2)
  const floorPiece = (x0, x1, z0, z1, mat = parquet) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z0 - z1), mat);
    f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(f);
  };
  floorPiece(HX0, HX1, 0.2, HZ1);
  floorPiece(-1.5, HX1, HZ0, 0.2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HX1 - HX0, HZ0 - HZ1), plaster);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (HZ0 + HZ1) / 2); scene.add(ceil);
  // soffitto a cassettoni
  for (let x = -3; x <= 3; x += 1.5) scene.add(box(0.12, 0.16, HZ0 - HZ1, A.wood, x, H - 0.08, (HZ0 + HZ1) / 2));
  for (let z = 1.2; z > HZ1; z -= 1.6) scene.add(box(HX1 - HX0, 0.16, 0.12, A.wood, 0, H - 0.08, z));
  // cornice sotto il soffitto
  scene.add(box(HX1 - HX0, 0.14, 0.14, trim, 0, H - 0.07, HZ0 - 0.07));
  scene.add(box(HX1 - HX0, 0.14, 0.14, trim, 0, H - 0.07, HZ1 + 0.07));

  // parete d'ingresso (alle spalle di chi sale): una porta chiusa a chiave a destra
  wallWithDoor(HX0, HX1, 2.6, 1.0, 2.3, HZ0, 'x', Math.PI);
  const lockedDoor = box(1.0, 2.3, 0.06, A.woodPanel, 2.6, 1.15, HZ0 - 0.04); scene.add(lockedDoor);
  scene.add(box(0.04, 0.12, 0.05, A.gold, 2.95, 1.1, HZ0 - 0.1));
  const ribbon = box(0.03, 0.22, 0.01, new THREE.MeshStandardMaterial({ color: 0x8a2a1c, roughness: 0.8 }), 2.95, 0.95, HZ0 - 0.12); scene.add(ribbon);
  // parete sinistra: porta della camera da letto (z -5)
  wallWithDoor(HZ0, HZ1, -5, 1.1, 2.4, HX0, 'z', Math.PI / 2);
  // parete di fondo: doppia porta aperta verso l'atelier
  wallWithDoor(HX0, HX1, 0, 1.6, 2.7, HZ1, 'x', 0);
  for (const s of [-1, 1]) { const l = box(0.8, 2.65, 0.06, A.woodPanel, s * 1.15, 1.33, HZ1 - 0.42); l.rotation.y = s * 1.1; scene.add(l); }
  // parete destra: tre finestre alte sul tramonto
  const winTex = T.windowTex(true, true);
  const winZ = [-0.6, -3.4, -6.2];
  const segs = [[HZ0, -0.0], [-1.2, -2.8], [-4.0, -5.6], [-6.8, HZ1]];
  for (const [a, b] of segs) wall(Math.abs(a - b), HX1, (a + b) / 2, -Math.PI / 2);
  const winMat = new THREE.MeshBasicMaterial({ map: winTex, color: 0xffd0a0, fog: false });
  const curtain = new THREE.MeshStandardMaterial({ color: 0x5a1418, roughness: 0.95 });
  for (const z of winZ) {
    plane(1.2, 1.0, wains, HX1, 0.5, z, -Math.PI / 2);
    plane(1.2, 0.5, paperS, HX1, H - 0.25, z, -Math.PI / 2);
    plane(1.2, 2.5, winMat, HX1 + 0.01, 2.25, z, -Math.PI / 2);
    scene.add(box(0.2, 0.08, 1.4, trim, HX1 - 0.08, 1.0, z));
    for (const s of [-1, 1]) scene.add(box(0.12, 3.2, 0.34, curtain, HX1 - 0.1, 2.3, z + s * 0.78));
    const gl = glowSprite(0xff9a4a, 3.2, 0.32); gl.position.set(HX1 - 0.4, 2.3, z); scene.add(gl);
  }
  // la luce del tramonto che entra dalle finestre
  const sunIn = new THREE.DirectionalLight(0xff9a52, 1.4); sunIn.position.set(10, 4, -3); sunIn.target.position.set(-2, 0, -3); scene.add(sunIn, sunIn.target);

  // il grande tappeto e i divani
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), new THREE.MeshStandardMaterial({ map: T.rugTex([1.6, 1.3]), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-0.5, 0.006, -3); scene.add(rug);
  const sofa = (x, z, ry) => {
    const g = new THREE.Group();
    g.add(box(1.9, 0.22, 0.8, A.velvet, 0, 0.36, 0));
    g.add(box(1.9, 0.62, 0.18, A.velvet, 0, 0.72, -0.34));
    for (const s of [-1, 1]) g.add(box(0.16, 0.52, 0.8, A.velvet, s * 0.95, 0.5, 0));
    for (const [cx, cz] of [[-0.85, 0.32], [0.85, 0.32], [-0.85, -0.32], [0.85, -0.32]]) g.add(cyl(0.03, 0.025, 0.26, A.wood, cx, 0.13, cz, 6));
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  };
  sofa(-0.5, -1.75, Math.PI); sofa(-0.5, -4.25, 0);
  scene.add(box(1.2, 0.06, 0.6, A.wood, -0.5, 0.45, -3)); // tavolino
  for (const [x, z] of [[-1.05, -2.75], [0.05, -2.75], [-1.05, -3.25], [0.05, -3.25]]) scene.add(cyl(0.025, 0.02, 0.42, A.wood, x, 0.21, z, 6));
  scene.add(cyl(0.11, 0.08, 0.02, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.3 }), -0.8, 0.49, -2.95, 14));
  // il pianoforte a coda, vicino alle finestre
  const pianoMat = new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: 0.18, metalness: 0.2 });
  const piano = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.75, 0); shape.lineTo(0.75, 0); shape.lineTo(0.75, -0.6); shape.bezierCurveTo(0.7, -1.4, 0.1, -1.2, 0.0, -1.9); shape.lineTo(-0.75, -1.9); shape.lineTo(-0.75, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: false }), pianoMat);
  body.rotation.x = -Math.PI / 2; body.position.y = 0.62; piano.add(body);
  piano.add(box(1.5, 0.06, 0.24, pianoMat, 0, 0.72, 0.12));
  piano.add(box(1.36, 0.02, 0.16, new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.4 }), 0, 0.76, 0.14));
  piano.add(box(1.36, 0.03, 0.06, pianoMat, 0, 0.79, 0.06));
  for (const [x, z] of [[-0.65, 0.05], [0.65, 0.05], [-0.4, -1.7]]) piano.add(cyl(0.05, 0.04, 0.62, pianoMat, x, 0.31, z, 8));
  const music = box(0.5, 0.3, 0.02, new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 }), 0, 1.02, 0.02); music.rotation.x = -0.2; piano.add(music);
  piano.add(stool().translateZ(0.55).translateY(0));
  piano.position.set(2.4, 0, -4.6); piano.rotation.y = Math.PI / 2 + 0.25; scene.add(piano);
  // consolle accanto alle scale, con una lanterna spenta
  scene.add(box(1.0, 0.06, 0.4, A.wood, -3.75, 0.86, -0.8));
  for (const dz of [-0.3, 0.3]) scene.add(box(0.05, 0.86, 0.05, A.wood, -3.65, 0.43, -0.8 + dz));
  const lantern = new THREE.Group();
  lantern.add(box(0.16, 0.02, 0.16, A.bronze, 0, 0, 0)); lantern.add(box(0.16, 0.02, 0.16, A.bronze, 0, 0.26, 0));
  lantern.add(box(0.12, 0.24, 0.12, new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.2, transparent: true, opacity: 0.55 }), 0, 0.13, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lantern.add(box(0.015, 0.26, 0.015, A.bronze, x * 0.07, 0.13, z * 0.07));
  lantern.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 5, 12, Math.PI), A.bronze).translateY(0.28));
  lantern.position.set(-3.75, 0.9, -0.8); scene.add(lantern);
  // ritratti di famiglia sulla parete sinistra, con lo spazio vuoto di quello che manca
  const p1 = painting(T.paintingTex(1), 0.8, 1.05); p1.position.set(HX0 + 0.04, 2.3, -1.4); p1.rotation.y = Math.PI / 2; scene.add(p1);
  const p2 = painting(T.paintingTex(1), 0.8, 1.05); p2.position.set(HX0 + 0.04, 2.3, -6.8); p2.rotation.y = Math.PI / 2; scene.add(p2);
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), new THREE.MeshStandardMaterial({ map: T.wallpaperTex([0.35, 0.45]), color: 0xf0e0c8, roughness: 0.9 }));
  ghost.position.set(HX0 + 0.012, 2.3, -3.2); ghost.rotation.y = Math.PI / 2; scene.add(ghost);
  scene.add(cyl(0.008, 0.008, 0.04, A.bronze, HX0 + 0.03, 2.86, -3.2, 5).rotateZ(Math.PI / 2));
  // il balcone delle scale: balaustra attorno al vano
  const rail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ang = Math.atan2(z1 - z0, x1 - x0);
    const top = box(len, 0.08, 0.1, A.wood, cx, 0.95, cz); top.rotation.y = -ang; scene.add(top);
    const n = Math.max(2, Math.round(len / 0.18));
    for (let i = 0; i <= n; i++) { const k = i / n; scene.add(cyl(0.022, 0.03, 0.9, A.wood, x0 + (x1 - x0) * k, 0.45, z0 + (z1 - z0) * k, 6)); }
  };
  rail(-3.95, 0.2, -1.5, 0.2);
  rail(-1.5, 0.2, -1.5, 1.4);
  // i gradini che scendono nel vano, verso il corridoio
  for (let i = 0; i < 9; i++) scene.add(box(0.26, 0.19, 1.2, A.wood, -1.65 - i * 0.26, -0.1 - i * 0.19, 1.2));
  plane(2.6, 3.0, plaster, -2.7, -1.5, 0.2, 0);
  // il lampadario grande
  const ch = new THREE.Group();
  ch.add(cyl(0.014, 0.014, 0.9, A.bronze, 0, 0.6, 0, 5));
  ch.add(lathe([[0, -0.36], [0.04, -0.33], [0.08, -0.2], [0.04, -0.08], [0.07, 0.08], [0.02, 0.2], [0, 0.22]], A.gold, 12));
  const chCups = [];
  for (const [rad, n, y] of [[0.62, 10, -0.12], [0.36, 6, 0.08]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.016, 5, 28), A.gold); ring.rotation.x = Math.PI / 2; ring.position.y = y - 0.02; ch.add(ring);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + y, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      ch.add(cyl(0.03, 0.014, 0.03, A.gold, x, y, z, 6));
      chCups.push(new THREE.Vector3(x, y + 0.015, z));
    }
  }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), new THREE.MeshStandardMaterial({ color: 0xfff0e0, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.8 })); d.position.set(Math.cos(a) * 0.62, -0.24, Math.sin(a) * 0.62); ch.add(d); }
  ch.position.set(-0.3, H - 0.85, -3); scene.add(ch);
  const chandelier = new CandleSet(scene, worldPoints(ch, chCups), { color: 0xffb878, intensity: 22, distance: 18, height: 0.11, lightOffset: -0.2 });
  // applique sulle pareti
  const scs = [];
  for (const [x, z, ry] of [[HX0 + 0.02, -0.0, Math.PI / 2], [HX0 + 0.02, -6.0, Math.PI / 2], [HX1 - 0.02, -1.95, -Math.PI / 2], [HX1 - 0.02, -4.75, -Math.PI / 2]]) {
    const s = sconce(); s.group.position.set(x, 2.1, z); s.group.rotation.y = ry; scene.add(s.group);
    scs.push(...worldPoints(s.group, s.cups));
  }
  const sconces = new CandleSet(scene, scs, { color: 0xffb070, intensity: 6, distance: 9, height: 0.11 });

  // ================= camera da letto =================
  const BX0 = -9, BX1 = HX0, BZ0 = -2.4, BZ1 = -8, BH = 3.4;
  floorPiece(BX0, BX1, BZ0, BZ1);
  const bceil = new THREE.Mesh(new THREE.PlaneGeometry(BX1 - BX0, BZ0 - BZ1), plaster);
  bceil.rotation.x = Math.PI / 2; bceil.position.set((BX0 + BX1) / 2, BH, (BZ0 + BZ1) / 2); scene.add(bceil);
  // retro della parete del salone, visto dalla camera
  wallWithDoor(BZ0, BZ1, -5, 1.1, 2.4, BX1 - 0.01, 'z', -Math.PI / 2, BH);
  wall(BX1 - BX0, (BX0 + BX1) / 2, BZ0, Math.PI, BH);
  wall(BX1 - BX0, (BX0 + BX1) / 2, BZ1, 0, BH);
  // parete di fondo con la finestra verso la strada che porta via dal paese
  wall(1.9, BX0, BZ0 - 0.95, Math.PI / 2, BH); wall(1.9, BX0, BZ1 + 0.95, Math.PI / 2, BH);
  plane(1.8, 1.0, wains, BX0, 0.5, (BZ0 + BZ1) / 2, Math.PI / 2);
  plane(1.8, 0.4, paperS, BX0, BH - 0.2, (BZ0 + BZ1) / 2, Math.PI / 2);
  plane(1.8, 2.0, winMat, BX0 - 0.01, 2.0, (BZ0 + BZ1) / 2, Math.PI / 2);
  for (const s of [-1, 1]) scene.add(box(0.12, 2.8, 0.3, curtain, BX0 + 0.1, 1.85, (BZ0 + BZ1) / 2 + s * 1.05));
  const bglow = glowSprite(0xff9a4a, 2.6, 0.3); bglow.position.set(BX0 + 0.4, 2, (BZ0 + BZ1) / 2); scene.add(bglow);
  // il letto, rifatto senza una piega
  const bed = new THREE.Group();
  bed.add(box(1.5, 0.32, 2.05, A.wood, 0, 0.26, 0));
  bed.add(box(1.42, 0.18, 1.95, new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9 }), 0, 0.5, 0));
  bed.add(box(1.46, 0.06, 1.45, new THREE.MeshStandardMaterial({ color: 0x23402e, roughness: 0.95 }), 0, 0.61, 0.27));
  for (const s of [-1, 1]) bed.add(box(0.6, 0.14, 0.36, new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.9 }), s * 0.36, 0.66, -0.75));
  bed.add(box(1.6, 1.25, 0.08, A.woodPanel, 0, 0.62, -1.04));
  bed.add(box(1.6, 0.6, 0.08, A.woodPanel, 0, 0.3, 1.04));
  bed.position.set(-6.4, 0, BZ1 + 1.1); scene.add(bed);
  // comodino con una candela e una fotografia in una cornice d'argento
  scene.add(box(0.46, 0.6, 0.42, A.woodPanel, -7.5, 0.3, BZ1 + 0.35));
  const nightCandle = new CandleSet(scene, [new THREE.Vector3(-7.62, 0.61, BZ1 + 0.32)], { color: 0xffb070, intensity: 3.5, distance: 6, height: 0.14 });
  const frame = new THREE.Group();
  frame.add(box(0.16, 0.2, 0.012, new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.25, metalness: 0.9 }), 0, 0, 0));
  frame.add(new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), new THREE.MeshStandardMaterial({ map: T.toTex(T.womanPhotoCanvas()), roughness: 0.7, emissive: 0x1a120a, emissiveIntensity: 0.4 })).translateZ(0.007));
  frame.position.set(-7.4, 0.71, BZ1 + 0.42); frame.rotation.set(-0.15, 0.5, 0); scene.add(frame);
  // armadio e sedia con il cappotto
  scene.add(box(1.3, 2.3, 0.6, A.woodPanel, -6.4, 1.15, BZ0 - 0.32));
  scene.add(box(1.36, 0.08, 0.66, A.wood, -6.4, 2.34, BZ0 - 0.32));
  const chair = new THREE.Group();
  chair.add(box(0.44, 0.05, 0.44, A.wood, 0, 0.46, 0)); chair.add(box(0.44, 0.6, 0.04, A.wood, 0, 0.78, -0.2));
  for (const [cx, cz] of [[-0.19, 0.19], [0.19, 0.19], [-0.19, -0.19], [0.19, -0.19]]) chair.add(cyl(0.02, 0.016, 0.46, A.wood, cx, 0.23, cz, 6));
  const coatM = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.95 });
  chair.add(box(0.5, 0.7, 0.08, coatM, 0, 0.82, -0.25)); chair.add(box(0.46, 0.08, 0.3, coatM, 0, 1.1, -0.12));
  chair.position.set(-8.2, 0, -3.4); chair.rotation.y = 0.9; scene.add(chair);
  const bedLight = new THREE.PointLight(0xffb070, 3.2, 8, 2); bedLight.position.set(-6.4, 2.6, -5.2); scene.add(bedLight); // la luce calda della sera, nella camera
  const brug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshStandardMaterial({ map: T.rugTex([1, 0.7]), roughness: 1 }));
  brug.rotation.x = -Math.PI / 2; brug.position.set(-6.4, 0.006, -5.4); scene.add(brug);

  // ================= atelier con la vista =================
  const AX0 = -4, AX1 = 4, AZ0 = HZ1, AZ1 = -15.5;
  floorPiece(AX0, AX1, AZ0, AZ1, new THREE.MeshStandardMaterial({ map: T.woodTex([3, 4]), roughness: 0.6 }));
  const aceil = new THREE.Mesh(new THREE.PlaneGeometry(AX1 - AX0, AZ0 - AZ1), plaster);
  aceil.rotation.x = Math.PI / 2; aceil.position.set(0, H, (AZ0 + AZ1) / 2); scene.add(aceil);
  for (let z = -9; z > AZ1; z -= 1.6) scene.add(box(AX1 - AX0, 0.2, 0.18, A.wood, 0, H - 0.1, z));
  // retro della parete di fondo del salone
  wallWithDoor(AX0, AX1, 0, 1.6, 2.7, AZ0 - 0.01, 'x', Math.PI);
  const aplaster = new THREE.MeshStandardMaterial({ map: T.plasterTex([3, 1.6], 1), roughness: 0.95, color: 0xd8c8b0 });
  plane(AZ0 - AZ1, H, aplaster, AX0, H / 2, (AZ0 + AZ1) / 2, Math.PI / 2);
  plane(AZ0 - AZ1, H, aplaster, AX1, H / 2, (AZ0 + AZ1) / 2, -Math.PI / 2);
  // la grande vetrata sulla valle: la stessa vista del dipinto della biblioteca
  const view = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.4), new THREE.MeshBasicMaterial({ map: T.toTex(valleyPaintingCanvas(2048, 916)), fog: false }));
  view.position.set(0, 2.05, AZ1 - 0.02); scene.add(view);
  plane(AX1 - AX0, 0.35, aplaster, 0, 0.175, AZ1, 0);
  plane(AX1 - AX0, 0.25, aplaster, 0, H - 0.125, AZ1, 0);
  const mullion = new THREE.MeshStandardMaterial({ color: 0x2a1a0e, roughness: 0.6 });
  for (let x = -3.8; x <= 3.81; x += 1.9) scene.add(box(0.1, 3.4, 0.12, mullion, x, 2.05, AZ1 + 0.04));
  for (const y of [0.4, 2.6, 3.72]) scene.add(box(AX1 - AX0, 0.08, 0.12, mullion, 0, y, AZ1 + 0.04));
  const sunA = new THREE.DirectionalLight(0xff9a52, 1.6); sunA.position.set(0, 3, AZ1 - 10); sunA.target.position.set(0, 0, -9); scene.add(sunA, sunA.target);
  const viewGlow = glowSprite(0xff8a3a, 6, 0.22); viewGlow.position.set(1.2, 2.2, AZ1 + 0.6); scene.add(viewGlow);
  // cavalletti: una tela incompiuta e una coperta da un telo
  const easel = (x, z, ry, canvasMat, covered) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) { const leg = cyl(0.02, 0.025, 1.9, A.wood, s * 0.35, 0.92, 0, 5); leg.rotation.z = s * 0.12; g.add(leg); }
    const back = cyl(0.02, 0.025, 1.9, A.wood, 0, 0.9, -0.35, 5); back.rotation.x = -0.25; g.add(back);
    g.add(box(0.9, 0.04, 0.08, A.wood, 0, 0.72, 0.03));
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.03), canvasMat); cv.position.set(0, 1.25, 0.06); cv.rotation.x = -0.08; g.add(cv);
    if (covered) {
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.18, 0.1), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 1 }));
      cloth.position.set(0, 1.2, 0.08); cloth.rotation.x = -0.08; g.add(cloth);
      for (const s of [-1, 1]) g.add(box(0.06, 0.5, 0.06, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 1 }), s * 0.44, 0.58, 0.1));
    }
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  };
  const unfinished = new THREE.MeshStandardMaterial({ map: T.toTex(sketchCanvas(0)), roughness: 0.8 });
  easel(-1.6, -12.2, 0.35, unfinished, false);
  easel(2.3, -11.4, -0.5, new THREE.MeshStandardMaterial({ color: 0xe0d6c0 }), true);
  // la scrivania con le lettere da Vienna
  scene.add(box(1.6, 0.06, 0.8, A.wood, -2.9, 0.78, -9.8));
  for (const [x, z] of [[-3.6, -9.5], [-2.2, -9.5], [-3.6, -10.1], [-2.2, -10.1]]) scene.add(cyl(0.03, 0.025, 0.76, A.wood, x, 0.38, z, 6));
  const letterM = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9, emissive: 0x2a1c0c, emissiveIntensity: 0.3 });
  for (let i = 0; i < 6; i++) { const l = box(0.22, 0.012, 0.15, letterM, -3.1, 0.82 + i * 0.013, -9.75); l.rotation.y = (i % 2 ? 0.08 : -0.06); scene.add(l); }
  scene.add(box(0.24, 0.01, 0.02, new THREE.MeshStandardMaterial({ color: 0x8a1c18, roughness: 0.8 }), -3.1, 0.9, -9.75));
  scene.add(box(0.24, 0.01, 0.02, new THREE.MeshStandardMaterial({ color: 0x8a1c18, roughness: 0.8 }), -3.1, 0.9, -9.75).rotateY(Math.PI / 2));
  const deskCandle = new CandleSet(scene, [new THREE.Vector3(-2.4, 0.81, -10.0)], { color: 0xffb070, intensity: 3.5, distance: 7, height: 0.16 });
  const ac = armchair(); ac.position.set(2.8, 0, -13.6); ac.rotation.y = Math.PI * 0.85; scene.add(ac);
  // tavolo dei colori
  scene.add(box(1.0, 0.05, 0.55, A.wood, 3.2, 0.85, -9.6));
  for (const [x, z] of [[2.8, -9.4], [3.6, -9.4], [2.8, -9.8], [3.6, -9.8]]) scene.add(cyl(0.025, 0.02, 0.84, A.wood, x, 0.42, z, 6));
  const r = seeded(5);
  for (let i = 0; i < 9; i++) scene.add(cyl(0.035, 0.035, 0.08 + r() * 0.06, new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.02 + r() * 0.12, 0.6, 0.3 + r() * 0.25), roughness: 0.5 }), 2.8 + (i % 5) * 0.18, 0.92, -9.5 - Math.floor(i / 5) * 0.2, 8));
  // schizzi appuntati alla parete sinistra
  for (let i = 0; i < 7; i++) {
    const sk = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ map: T.toTex(sketchCanvas(i)), roughness: 0.9 }));
    sk.position.set(AX0 + 0.015 + i * 0.001, 1.6 + (i % 2) * 0.55 + r() * 0.1, -11.0 - i * 0.48);
    sk.rotation.set(0, Math.PI / 2, (r() - 0.5) * 0.12); scene.add(sk);
  }
  const atelierLamp = new THREE.PointLight(0xffb070, 5, 10, 2); atelierLamp.position.set(-1, 3.2, -11); scene.add(atelierLamp);

  // meno chiamate di disegno: le mesh fisse si uniscono per materiale
  mergeStatic(scene, [lockedDoor, ribbon, view, ghost]);

  const update = (dt, t) => {
    chandelier.update(dt, t, 0);
    sconces.update(dt, t, 0);
    nightCandle.update(dt, t, 0);
    deskCandle.update(dt, t, 0);
  };

  // dove si può camminare: tre stanze collegate dalle porte, meno i mobili e il vano scale
  const inside = (p, [x0, x1, z0, z1]) => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
  const rooms = [
    [-3.5, 3.5, -7.6, 1.6],     // salone
    [-4.7, -3.3, -5.45, -4.55], // porta della camera
    [-8.5, -4.4, -7.5, -2.9],   // camera
    [-0.6, 0.6, -8.6, -7.4],    // porta dell'atelier
    [-3.5, 3.5, -15.0, -8.4],   // atelier
  ];
  const blocks = [
    [-4.0, -1.35, 0.05, 2.1],   // vano scale
    [-1.9, 0.9, -4.85, -1.15],  // divani e tavolino
    [1.25, 3.55, -5.9, -3.3],   // pianoforte
    [-7.3, -5.5, -8, -5.8],     // letto
    [-3.8, -2.0, -10.3, -9.3],  // scrivania
    [2.6, 3.8, -10.0, -9.2],    // tavolo dei colori
  ];
  const AREAS = {
    hall: [HX0, HX1, HZ1, HZ0],
    bedroom: [BX0, BX1 - 0.3, BZ1, BZ0],
    atelier: [AX0, AX1, AZ1, AZ0 - 0.3],
  };
  const areaAt = (p) => (inside(p, AREAS.bedroom) ? 'bedroom' : inside(p, AREAS.atelier) ? 'atelier' : 'hall');

  return {
    scene, update,
    exposure: 1.45,
    arrival: new THREE.Vector3(-0.8, 1.6, 0.9),
    arrivalLook: new THREE.Vector3(0.5, 1.6, -6),
    stairPos: new THREE.Vector3(-2.6, 0.9, 1.1),
    bedroomDoor: new THREE.Vector3(HX0 + 0.1, 1.3, -5),
    bedroomView: new THREE.Vector3(-5.2, 1.6, -5),
    atelierDoor: new THREE.Vector3(0, 1.3, HZ1 + 0.1),
    atelierView: new THREE.Vector3(0, 1.6, -9.4),
    lockedDoorPos: new THREE.Vector3(2.6, 1.2, HZ0 - 0.1),
    waypoints: [
      new THREE.Vector3(-0.8, 1.6, 0.9), new THREE.Vector3(2.2, 1.6, -1.6), new THREE.Vector3(-2.6, 1.6, -5.8),
      new THREE.Vector3(0, 1.6, -6.6), new THREE.Vector3(-6.4, 1.6, -4.4), new THREE.Vector3(0.2, 1.6, -10.4),
      new THREE.Vector3(0, 1.6, -14.0),
    ],
    walkable: (p) => rooms.some((rr) => inside(p, rr)) && !blocks.some((rr) => inside(p, rr)),
    areaAt,
    AREAS,
  };
}

export const UPPER_AREA_TITLES = {
  hall: L('Il salone', 'The great hall'),
  bedroom: L('La camera da letto', 'The bedroom'),
  atelier: L('L’atelier', 'The studio'),
};
