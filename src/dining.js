// Scena 4 — Sala da pranzo con camino e giradischi, e lo studiolo in fondo
import * as THREE from 'three';
import * as T from './textures.js';
import { assets, box, cyl, lathe, glowSprite, CandleSet, candelabra, bust, painting, urn, sconce, worldPoints } from './props.js';
import { drawManuscript } from './magnifier.js';

export function buildDining() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050302);
  scene.fog = new THREE.FogExp2(0x0a0503, 0.03);
  scene.add(new THREE.HemisphereLight(0x8a6048, 0x1a100a, 0.75));

  const X0 = -4, X1 = 4, Z0 = 3, Z1 = -9, H = 3.6;
  const paper = new THREE.MeshStandardMaterial({ map: T.wallpaperTex([6, 1.6]), roughness: 0.9 });
  const paperS = new THREE.MeshStandardMaterial({ map: T.wallpaperTex([2, 1.6]), roughness: 0.9 });
  const wains = new THREE.MeshStandardMaterial({ map: T.woodTex([6, 1], true), roughness: 0.5 });
  const wainsS = new THREE.MeshStandardMaterial({ map: T.woodTex([2, 1], true), roughness: 0.5 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x2a170c, roughness: 0.45 });
  const plane = (w, h, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
  };
  // parete con boiserie in basso e carta da parati sopra
  const wall = (w, x, z, ry, big = true, h = H, y0 = 0) => {
    plane(w, 1.05, big ? wains : wainsS, x, y0 + 0.525, z, ry);
    plane(w, h - 1.05, big ? paper : paperS, x, y0 + 1.05 + (h - 1.05) / 2, z, ry);
    const n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(0.02);
    const rail = box(ry === 0 || Math.abs(ry) === Math.PI ? w : 0.05, 0.06, ry === 0 || Math.abs(ry) === Math.PI ? 0.05 : w, trim, x + n.x, y0 + 1.06, z + n.z);
    scene.add(rail);
  };

  // pavimento, soffitto, pareti lunghe
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z0 - Z1), new THREE.MeshStandardMaterial({ map: T.parquetTex([2, 3]), roughness: 0.35, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (Z0 + Z1) / 2); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z0 - Z1), new THREE.MeshStandardMaterial({ map: T.plasterTex([2, 3], 1), roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (Z0 + Z1) / 2); scene.add(ceil);
  for (let z = 2; z > Z1; z -= 2.2) scene.add(box(X1 - X0, 0.22, 0.2, A.wood, 0, H - 0.11, z));
  wall(Z0 - Z1, X0, (Z0 + Z1) / 2, Math.PI / 2);
  wall(Z0 - Z1, X1, (Z0 + Z1) / 2, -Math.PI / 2);
  // parete d'ingresso con la porta aperta sulla sera
  const DW = 1.4, DH = 2.4;
  for (const s of [-1, 1]) wall((X1 - X0 - DW) / 2, s * (DW / 2 + (X1 - X0 - DW) / 4), Z0, Math.PI, false);
  plane(DW, H - DH, paperS, 0, DH + (H - DH) / 2, Z0, Math.PI);
  plane(DW, DH, new THREE.MeshBasicMaterial({ map: T.duskTex(), fog: false }), 0, DH / 2, Z0 + 0.02, Math.PI);
  for (const s of [-1, 1]) { const l = box(0.7, DH, 0.06, A.woodPanel, s * 0.98, DH / 2, Z0 - 0.3); l.rotation.y = s * 0.55; scene.add(l); }
  scene.add(box(DW + 0.3, 0.14, 0.12, trim, 0, DH + 0.07, Z0 - 0.04));
  // parete di fondo con il passaggio verso lo studiolo
  const PW = 1.3, PH = 2.4;
  for (const s of [-1, 1]) wall((X1 - X0 - PW) / 2, s * (PW / 2 + (X1 - X0 - PW) / 4), Z1, 0, false);
  plane(PW, H - PH, paperS, 0, PH + (H - PH) / 2, Z1, 0);
  for (const s of [-1, 1]) scene.add(box(0.12, PH, 0.26, trim, s * (PW / 2 + 0.04), PH / 2, Z1));
  scene.add(box(PW + 0.3, 0.14, 0.26, trim, 0, PH + 0.06, Z1));

  // tappeto
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6.4), new THREE.MeshStandardMaterial({ map: T.rugTex([1.4, 2.4]), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.4, 0.008, -3.2); scene.add(rug);

  // --- camino (parete sinistra) ---
  const FZ = -3;
  const marble = new THREE.MeshStandardMaterial({ color: 0x2c2420, roughness: 0.3, metalness: 0.1 });
  for (const s of [-1, 1]) scene.add(box(0.5, 0.95, 0.5, marble, X0 + 0.25, 0.475, FZ + s * 0.85));
  scene.add(box(0.5, 0.55, 2.2, marble, X0 + 0.25, 1.225, FZ));
  scene.add(box(0.66, 0.08, 2.5, marble, X0 + 0.33, 1.54, FZ));
  scene.add(box(0.9, 0.05, 2.6, marble, X0 + 0.45, 0.025, FZ));
  const soot = new THREE.MeshBasicMaterial({ color: 0x080404 });
  plane(1.2, 0.95, soot, X0 + 0.02, 0.475, FZ, Math.PI / 2);
  plane(0.5, 0.95, soot, X0 + 0.25, 0.475, FZ - 0.6, 0);
  plane(0.5, 0.95, soot, X0 + 0.25, 0.475, FZ + 0.6, Math.PI);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x2a160a, roughness: 1, emissive: 0x3a1004, emissiveIntensity: 0.6 });
  for (const [y, z, r] of [[0.1, -0.15, 0.2], [0.1, 0.18, -0.15], [0.22, 0.02, 0.05]]) {
    const lg = cyl(0.06, 0.07, 0.9, logMat, X0 + 0.3, y, FZ + z, 7);
    lg.rotation.set(Math.PI / 2, 0, r);
    scene.add(lg);
  }
  const flames = [];
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.flame, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, color: i % 2 ? 0xffb060 : 0xff8a3a }));
    f.position.set(X0 + 0.32, 0.3, FZ - 0.36 + i * 0.12);
    scene.add(f);
    flames.push({ f, ph: Math.random() * 10, s: 0.75 + Math.random() * 0.5 });
  }
  const fireGlow = glowSprite(0xff6a1a, 1.8, 0.55);
  fireGlow.position.set(X0 + 0.45, 0.45, FZ);
  scene.add(fireGlow);
  const fireLight = new THREE.PointLight(0xff7a2a, 24, 13, 2);
  fireLight.position.set(X0 + 0.9, 0.7, FZ);
  scene.add(fireLight);
  // sopra il camino: dipinto e due candelieri
  const pf = painting(T.paintingTex(0), 1.5, 1.05); pf.position.set(X0 + 0.03, 2.45, FZ); pf.rotation.y = Math.PI / 2; scene.add(pf);
  const mantelCups = [];
  for (const s of [-1, 1]) {
    const c = candelabra(1, 0.3);
    c.group.position.set(X0 + 0.32, 1.58, FZ + s * 1.0);
    scene.add(c.group);
    mantelCups.push(...worldPoints(c.group, c.cups));
  }
  const mantelCandles = new CandleSet(scene, mantelCups, { color: 0xffb070, intensity: 2.5, distance: 7, height: 0.2 });
  const clockM = box(0.18, 0.28, 0.32, A.wood, X0 + 0.3, 1.72, FZ); scene.add(clockM);

  // --- tavola apparecchiata ---
  const TX = 0.4, TZ = -3.2;
  scene.add(box(1.3, 0.07, 4.4, new THREE.MeshStandardMaterial({ color: 0x2a150a, roughness: 0.25, metalness: 0.1 }), TX, 0.76, TZ));
  scene.add(box(0.5, 0.006, 4.5, new THREE.MeshStandardMaterial({ color: 0x6a1410, roughness: 0.9 }), TX, 0.797, TZ));
  for (const [x, z] of [[-0.55, -2.0], [0.55, -2.0], [-0.55, 2.0], [0.55, 2.0]]) {
    const leg = lathe([[0, 0], [0.05, 0], [0.04, 0.1], [0.06, 0.3], [0.035, 0.55], [0.045, 0.72], [0, 0.72]], A.wood, 8);
    leg.position.set(TX + x, 0, TZ + z);
    scene.add(leg);
  }
  const china = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xc8d8e0, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 });
  const chairs = [];
  for (const z of [-1.7, -3.2, -4.7]) for (const s of [-1, 1]) {
    scene.add(cyl(0.12, 0.1, 0.012, china, TX + s * 0.42, 0.805, z, 16));
    scene.add(cyl(0.025, 0.02, 0.1, glass, TX + s * 0.42 - s * 0.05, 0.85, z - 0.18, 8));
    chairs.push([TX + s * 0.98, z, s]);
  }
  chairs.push([TX, -0.45, 0], [TX, -5.95, 2]);
  for (const [x, z, s] of chairs) {
    const ch = new THREE.Group();
    ch.add(box(0.46, 0.06, 0.46, A.velvet, 0, 0.48, 0));
    ch.add(box(0.46, 0.72, 0.05, A.wood, 0, 0.88, -0.22));
    ch.add(box(0.36, 0.5, 0.02, A.velvet, 0, 0.9, -0.19));
    for (const [cx, cz] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) ch.add(cyl(0.022, 0.018, 0.46, A.wood, cx, 0.23, cz, 6));
    ch.position.set(x, 0, z);
    ch.rotation.y = s === 0 ? Math.PI : s === 2 ? 0 : s * Math.PI / 2;
    if (s === 0) { ch.position.x += 0.35; ch.position.z += 0.25; ch.rotation.y += 0.5; } // la sedia scostata
    scene.add(ch);
  }
  const tc = candelabra(5, 0.46, 0.12);
  tc.group.position.set(TX, 0.8, TZ);
  scene.add(tc.group);
  const tableCandles = new CandleSet(scene, worldPoints(tc.group, tc.cups), { color: 0xffb070, intensity: 5, distance: 10, height: 0.2 });

  // --- lampadario ---
  const ch = new THREE.Group();
  ch.add(cyl(0.012, 0.012, 0.9, A.bronze, 0, 0.55, 0, 5));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.016, 5, 24), A.bronze); ring.rotation.x = Math.PI / 2; ch.add(ring);
  const chCups = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * 0.5, z = Math.sin(a) * 0.5;
    ch.add(cyl(0.028, 0.012, 0.03, A.bronze, x, 0.02, z, 6));
    chCups.push(new THREE.Vector3(x, 0.035, z));
  }
  ch.position.set(TX, 2.85, TZ); scene.add(ch);
  const chandelier = new CandleSet(scene, worldPoints(ch, chCups), { color: 0xffb878, intensity: 9, distance: 13, height: 0.12, lightOffset: -0.2 });

  // --- parete destra: finestre, tende, giradischi, ritratto, pendola ---
  const night = new THREE.MeshBasicMaterial({ color: 0x1a1824 });
  for (const z of [0.7, -5.6]) {
    plane(1.1, 2.0, night, X1 - 0.02, 1.75, z, -Math.PI / 2);
    scene.add(box(0.1, 0.08, 1.3, trim, X1 - 0.05, 2.8, z));
    scene.add(box(0.14, 0.08, 1.3, trim, X1 - 0.07, 0.72, z));
    scene.add(box(0.06, 2.0, 0.05, trim, X1 - 0.04, 1.75, z));
    scene.add(box(0.06, 0.05, 1.1, trim, X1 - 0.04, 1.75, z));
    for (const s of [-1, 1]) scene.add(box(0.12, 2.9, 0.4, A.velvet, X1 - 0.1, 1.8, z + s * 0.78));
    const g = glowSprite(0xff7a30, 1.2, 0.08); g.position.set(X1 - 0.05, 0.9, z); scene.add(g); // riflesso del fuoco nel vetro
  }
  // giradischi su un mobiletto
  const GZ = -2.3, GX = X1 - 0.32;
  scene.add(box(0.55, 0.85, 1.0, A.woodPanel, GX, 0.425, GZ));
  scene.add(box(0.6, 0.04, 1.06, A.wood, GX, 0.87, GZ));
  scene.add(box(0.38, 0.14, 0.38, new THREE.MeshStandardMaterial({ color: 0x4a2412, roughness: 0.35 }), GX + 0.02, 0.96, GZ));
  const record = new THREE.Group();
  record.add(cyl(0.155, 0.155, 0.01, new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.25, metalness: 0.3 }), 0, 0, 0, 24));
  record.add(cyl(0.05, 0.05, 0.012, new THREE.MeshStandardMaterial({ color: 0x8a1a12, roughness: 0.6 }), 0, 0, 0, 16));
  record.position.set(GX + 0.02, 1.04, GZ);
  scene.add(record);
  const arm = box(0.012, 0.012, 0.22, A.gold, GX + 0.12, 1.06, GZ + 0.05); arm.rotation.y = 0.5; scene.add(arm);
  const horn = lathe([[0.02, 0], [0.025, 0.15], [0.045, 0.3], [0.1, 0.42], [0.2, 0.5], [0.25, 0.52]], A.gold, 18);
  horn.material = A.gold.clone(); horn.material.side = THREE.DoubleSide;
  horn.position.set(GX + 0.14, 1.03, GZ - 0.12);
  horn.rotation.set(0.15, 0, 0.95);
  scene.add(horn);
  const p1 = painting(T.paintingTex(1), 0.75, 0.98); p1.position.set(X1 - 0.03, 2.25, GZ); p1.rotation.y = -Math.PI / 2; scene.add(p1);
  // pendola
  scene.add(box(0.5, 2.1, 0.42, A.woodPanel, X1 - 0.27, 1.05, -7.8));
  scene.add(box(0.56, 0.12, 0.48, A.wood, X1 - 0.27, 2.16, -7.8));
  const face = cyl(0.17, 0.17, 0.02, new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.6 }), X1 - 0.5, 1.75, -7.8, 20);
  face.rotation.z = Math.PI / 2; scene.add(face);
  const handM = new THREE.MeshBasicMaterial({ color: 0x140c08 });
  const hourH = box(0.012, 0.09, 0.012, handM, X1 - 0.515, 1.79, -7.8); scene.add(hourH);
  const minH = box(0.008, 0.012, 0.13, handM, X1 - 0.515, 1.75, -7.79); minH.rotation.x = -0.2; scene.add(minH);
  const pend = new THREE.Group();
  pend.add(box(0.01, 0.5, 0.01, A.gold, 0, -0.25, 0));
  pend.add(cyl(0.06, 0.06, 0.012, A.gold, 0, -0.5, 0, 14).rotateZ(Math.PI / 2));
  pend.position.set(X1 - 0.5, 1.45, -7.8);
  scene.add(pend);

  // --- parete sinistra: ritratto, busto ---
  const p2 = painting(T.paintingTex(1), 0.8, 1.05); p2.position.set(X0 + 0.03, 2.2, 0.8); p2.rotation.y = Math.PI / 2; scene.add(p2);
  const p3 = painting(T.paintingTex(0), 1.1, 0.8); p3.position.set(X0 + 0.03, 2.2, -6.6); p3.rotation.y = Math.PI / 2; scene.add(p3);
  scene.add(box(0.44, 1.1, 0.44, marble, X0 + 0.42, 0.55, -7.9));
  const b1 = bust(new THREE.MeshStandardMaterial({ color: 0xb8ac98, roughness: 0.45 }), 1.0); b1.position.set(X0 + 0.42, 1.1, -7.9); b1.rotation.y = 0.9; scene.add(b1);
  const cv = urn(A.bronze, 1.1); cv.position.set(X0 + 0.3, 0, 1.9); scene.add(cv);
  // applique
  const s1 = sconce(); s1.group.position.set(X0 + 0.02, 1.95, -0.6); s1.group.rotation.y = Math.PI / 2; scene.add(s1.group);
  const s2 = sconce(); s2.group.position.set(X1 - 0.02, 1.95, -4.0); s2.group.rotation.y = -Math.PI / 2; scene.add(s2.group);
  const sconces = new CandleSet(scene, [...worldPoints(s1.group, s1.cups), ...worldPoints(s2.group, s2.cups)], { color: 0xffb070, intensity: 4, distance: 9, height: 0.11 });
  sconces.light.position.set(0, 2.2, -2.3);

  // ================= studiolo =================
  const SX = 2, SZ1 = -13, SH = 3.0;
  const sPlaster = new THREE.MeshStandardMaterial({ map: T.plasterTex([1.5, 1], 1), roughness: 0.95, color: 0xb8a088 });
  const sFloor = new THREE.Mesh(new THREE.PlaneGeometry(SX * 2, Z1 - SZ1), new THREE.MeshStandardMaterial({ map: T.parquetTex([1, 1]), roughness: 0.4 }));
  sFloor.rotation.x = -Math.PI / 2; sFloor.position.set(0, 0.002, (Z1 + SZ1) / 2); scene.add(sFloor);
  const sCeil = new THREE.Mesh(new THREE.PlaneGeometry(SX * 2, Z1 - SZ1), sPlaster);
  sCeil.rotation.x = Math.PI / 2; sCeil.position.set(0, SH, (Z1 + SZ1) / 2); scene.add(sCeil);
  plane(Z1 - SZ1, SH, sPlaster, -SX, SH / 2, (Z1 + SZ1) / 2, Math.PI / 2);
  plane(Z1 - SZ1, SH, sPlaster, SX, SH / 2, (Z1 + SZ1) / 2, -Math.PI / 2);
  plane(SX * 2, SH, sPlaster, 0, SH / 2, SZ1, 0);
  for (const s of [-1, 1]) plane(SX - PW / 2, SH, sPlaster, s * (PW / 2 + (SX - PW / 2) / 2), SH / 2, Z1 - 0.01, Math.PI);
  plane(SX * 2, 0.7, sPlaster, 0, SH, Z1 - 0.01, Math.PI);
  // libreria
  plane(3.2, 2.5, new THREE.MeshStandardMaterial({ map: T.booksTex([1.3, 1]), roughness: 0.9 }), -SX + 0.03, 1.25, -11, Math.PI / 2);
  scene.add(box(0.2, 2.6, 3.4, A.wood, -SX + 0.02, 1.3, -11));
  // mappa
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: T.mapTex(), roughness: 0.8 }));
  map.position.set(SX - 0.03, 1.75, -11); map.rotation.y = -Math.PI / 2; scene.add(map);
  scene.add(box(0.04, 0.05, 1.3, A.gold, SX - 0.03, 2.17, -11)); scene.add(box(0.04, 0.05, 1.3, A.gold, SX - 0.03, 1.33, -11));
  // scrivania
  const DZ = -12.3, DT = 0.78;
  scene.add(box(1.5, 0.06, 0.75, new THREE.MeshStandardMaterial({ color: 0x2a150a, roughness: 0.3 }), 0, DT - 0.03, DZ));
  scene.add(box(1.36, 0.02, 0.6, new THREE.MeshStandardMaterial({ color: 0x1e3a24, roughness: 0.9 }), 0, DT + 0.002, DZ));
  for (const s of [-1, 1]) scene.add(box(0.42, DT - 0.06, 0.68, A.woodPanel, s * 0.52, (DT - 0.06) / 2, DZ));
  // mappamondo
  const globe = new THREE.Group();
  globe.add(cyl(0.08, 0.1, 0.03, A.wood, 0, 0.015, 0, 12));
  globe.add(cyl(0.012, 0.012, 0.14, A.gold, 0, 0.1, 0, 6));
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.008, 5, 28, Math.PI * 1.3), A.gold);
  meridian.position.y = 0.33; meridian.rotation.set(0, Math.PI / 2, -0.6); globe.add(meridian);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshStandardMaterial({ map: T.globeTex(), roughness: 0.55 }));
  sphere.position.y = 0.33; sphere.rotation.z = 0.41; globe.add(sphere);
  globe.position.set(-0.5, DT, DZ - 0.12); scene.add(globe);
  // lampada a olio
  const lampBase = lathe([[0, 0], [0.07, 0], [0.06, 0.03], [0.02, 0.06], [0.07, 0.12], [0.06, 0.16], [0.02, 0.18], [0, 0.18]], A.gold, 12);
  lampBase.position.set(0.55, DT, DZ - 0.15);
  scene.add(lampBase);
  const chimney = cyl(0.03, 0.045, 0.2, new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.85 }), 0.55, DT + 0.28, DZ - 0.15, 10);
  scene.add(chimney);
  const lampGlow = glowSprite(0xffa850, 1.0, 0.7); lampGlow.position.set(0.55, DT + 0.28, DZ - 0.15); scene.add(lampGlow);
  const lamp = new THREE.PointLight(0xffb060, 5, 6, 2); lamp.position.set(0.5, DT + 0.45, DZ + 0.05); scene.add(lamp);
  // manoscritto (stessa grafica della vista con la lente, in piccolo)
  const [mc, mg] = T.mk(360, 500);
  drawManuscript(mg, 360, 500);
  const msMat = new THREE.MeshStandardMaterial({ map: T.toTex(mc), roughness: 0.9, emissive: 0x2a1c0c, emissiveIntensity: 0.4 });
  const ms = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.36), msMat);
  ms.rotation.x = -Math.PI / 2; ms.rotation.z = -0.08; ms.position.set(0.0, DT + 0.016, DZ + 0.12); scene.add(ms);
  // lente d'ingrandimento
  const lens = new THREE.Group();
  const lr = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 24), A.gold); lr.rotation.x = Math.PI / 2; lens.add(lr);
  const lg = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.02, metalness: 0.6, transparent: true, opacity: 0.35 }));
  lg.rotation.x = -Math.PI / 2; lens.add(lg);
  const handle = cyl(0.01, 0.012, 0.11, new THREE.MeshStandardMaterial({ color: 0xd8cbb0, roughness: 0.5 }), 0.11, 0, 0, 8); handle.rotation.z = Math.PI / 2; lens.add(handle);
  lens.position.set(0.27, DT + 0.024, DZ + 0.2); lens.rotation.y = 0.5; scene.add(lens);
  // sedia
  const sc = new THREE.Group();
  sc.add(box(0.46, 0.06, 0.46, A.velvet, 0, 0.48, 0));
  sc.add(box(0.46, 0.7, 0.05, A.wood, 0, 0.86, -0.22));
  for (const [cx, cz] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) sc.add(cyl(0.022, 0.018, 0.46, A.wood, cx, 0.23, cz, 6));
  sc.position.set(0.95, 0, -11.45); sc.rotation.y = Math.PI + 0.7; scene.add(sc);

  let playing = false;
  const update = (dt, t) => {
    tableCandles.update(dt, t, 0);
    mantelCandles.update(dt, t, 0);
    chandelier.update(dt, t, 0);
    sconces.update(dt, t, 0);
    const fl = 0.82 + 0.1 * Math.sin(t * 7.1) + 0.07 * Math.sin(t * 13.7 + 1) + (Math.random() - 0.5) * 0.08;
    fireLight.intensity = 24 * fl;
    fireGlow.material.opacity = 0.5 * fl;
    for (const f of flames) {
      const k = f.s * (0.75 + 0.25 * Math.sin(t * 9 + f.ph) + (Math.random() - 0.5) * 0.15);
      f.f.scale.set(0.2 * k, 0.42 * k, 1);
      f.f.position.y = 0.16 + 0.21 * k;
    }
    if (playing) record.rotation.y -= dt * 3.5;
    pend.rotation.z = Math.sin(t * 2.6) * 0.12;
    sphere.rotation.y += dt * 0.05;
    lamp.intensity = 5 * (0.96 + 0.04 * Math.sin(t * 5));
  };

  // area calpestabile: sala + passaggio + studiolo, meno la tavola
  const rects = [[-3.1, 3.05, -8.6, 2.55], [-0.5, 0.5, -9.4, -8.6], [-1.6, 1.6, -11.75, -9.4]];
  const blocks = [[-0.75, 1.6, -6.35, -0.15], [0.65, 1.3, -11.8, -11.05]];
  const inside = (p, [x0, x1, z0, z1]) => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;

  return {
    scene, update,
    exposure: 1.0,
    setPlaying: (v) => { playing = v; },
    entry: new THREE.Vector3(0, 1.6, 1.9),
    entryLook: new THREE.Vector3(0, 1.4, -6),
    gramophonePos: new THREE.Vector3(GX, 1.1, GZ),
    firePos: new THREE.Vector3(X0 + 0.4, 0.5, FZ),
    manuscriptPos: new THREE.Vector3(0, DT + 0.01, DZ + 0.12),
    manuscriptView: new THREE.Vector3(0.05, 1.42, -11.35),
    studyDoor: new THREE.Vector3(0, 1.3, Z1),
    exitDoor: new THREE.Vector3(0, 1.3, Z0 - 0.1),
    waypoints: [new THREE.Vector3(0, 1.6, 1.9), new THREE.Vector3(-2.2, 1.6, -3.0), new THREE.Vector3(2.4, 1.6, -3.2), new THREE.Vector3(0, 1.6, -7.6), new THREE.Vector3(0, 1.6, -10.4)],
    walkable: (p) => rects.some((r) => inside(p, r)) && !blocks.some((r) => inside(p, r)),
  };
}
