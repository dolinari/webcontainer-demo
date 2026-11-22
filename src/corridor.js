// Scena 2 — Corridoio principale
import * as THREE from 'three';
import * as T from './textures.js';
import { IS_EN } from './i18n.js';
import { valleyPaintingCanvas, codexSpreadCanvas, PAINTING } from './valley.js';
import { assets, box, cyl, lathe, glowSprite, CandleSet, candelabra, bust, painting, armchair, stool, foliageCross, urn, sconce, worldPoints } from './props.js';

export function buildCorridor() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050302);
  scene.fog = new THREE.FogExp2(0x0a0503, 0.035);
  scene.add(new THREE.HemisphereLight(0x8a6850, 0x1a120c, 1.25));

  const HW = 1.8, Z0 = 3, Z1 = -15, WH = 3.2, LEN = Z0 - Z1, ZC = (Z0 + Z1) / 2;
  const plaster = new THREE.MeshStandardMaterial({ map: T.plasterTex([5, 1.2]), roughness: 0.95 });
  const plasterS = new THREE.MeshStandardMaterial({ map: T.plasterTex([1.4, 1.2]), roughness: 0.95 });
  const vaultMat = new THREE.MeshStandardMaterial({ map: T.plasterTex([3, 5], 1), roughness: 1, side: THREE.BackSide });
  const trim = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 });

  const wall = (w, h, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
  };

  // pavimento, tappeto
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, LEN + 6), new THREE.MeshStandardMaterial({ map: T.tilesTex([2, 12]), roughness: 0.32, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ZC - 3); scene.add(floor);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 13.5), new THREE.MeshStandardMaterial({ map: T.rugTex([1, 5]), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, -6.2); scene.add(rug);

  // pareti
  // parete sinistra, con il varco delle scale per il piano di sopra (z -9.15…-10.85)
  const SZ0 = -9.15, SZ1 = -10.85, SH = 2.7;
  wall(Z0 - SZ0, WH, plaster, -HW, WH / 2, (Z0 + SZ0) / 2, Math.PI / 2);
  wall(SZ1 - Z1, WH, plasterS, -HW, WH / 2, (SZ1 + Z1) / 2, Math.PI / 2);
  wall(SZ0 - SZ1, WH - SH, plasterS, -HW, SH + (WH - SH) / 2, (SZ0 + SZ1) / 2, Math.PI / 2);
  for (const z of [SZ0, SZ1]) scene.add(box(0.14, SH, 0.14, A.wood, -HW - 0.02, SH / 2, z));
  scene.add(box(0.14, 0.12, SZ0 - SZ1 + 0.28, A.wood, -HW - 0.02, SH + 0.06, (SZ0 + SZ1) / 2));
  // la rampa: sedici gradini che salgono verso una finestra accesa
  const stepM = new THREE.MeshStandardMaterial({ map: T.woodTex([1, 0.3]), roughness: 0.6 });
  for (let i = 0; i < 16; i++) {
    const top = 0.19 * (i + 1);
    scene.add(box(0.26, top, SZ0 - SZ1, stepM, -HW - 0.13 - 0.25 * i, top / 2, (SZ0 + SZ1) / 2));
  }
  const RX1 = -HW - 4.3, stairWall = new THREE.MeshStandardMaterial({ map: T.plasterTex([2, 2], 1), roughness: 0.95 });
  wall(-HW - RX1, 6.6, stairWall, (-HW + RX1) / 2, 3.3, SZ0, Math.PI);
  wall(-HW - RX1, 6.6, stairWall, (-HW + RX1) / 2, 3.3, SZ1, 0);
  wall(SZ0 - SZ1, 6.6, stairWall, RX1, 3.3, (SZ0 + SZ1) / 2, Math.PI / 2);
  // soffitto inclinato sopra la rampa (una lastra sottile, visibile da sotto)
  const slope = box(Math.hypot(-HW - RX1, 3.3), 0.06, SZ0 - SZ1 + 0.02, stairWall, (-HW + RX1) / 2, SH + 0.15 + 1.65, (SZ0 + SZ1) / 2);
  slope.rotation.z = -Math.atan2(3.3, -HW - RX1); scene.add(slope);
  for (const z of [SZ0 - 0.06, SZ1 + 0.06]) { const hr = cyl(0.025, 0.025, 4.6, A.wood, (-HW + RX1) / 2, 1.0 + 1.55, z, 6); hr.rotation.z = Math.PI / 2 - Math.atan2(3.04, 4.0); scene.add(hr); }
  const stairWin = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), new THREE.MeshBasicMaterial({ map: T.windowTex(true, true), color: 0xffd0a0, fog: false }));
  stairWin.position.set(RX1 + 0.01, 4.4, (SZ0 + SZ1) / 2); stairWin.rotation.y = Math.PI / 2; scene.add(stairWin);
  const stairGlow = glowSprite(0xff9a4a, 2.2, 0.4); stairGlow.position.set(RX1 + 0.4, 4.3, (SZ0 + SZ1) / 2); scene.add(stairGlow);
  const stairLow = new THREE.PointLight(0xffa860, 2.5, 5, 2); stairLow.position.set(-HW - 0.5, 2.25, (SZ0 + SZ1) / 2); scene.add(stairLow); // la parte bassa della rampa non resta al buio
  const stairLight = new THREE.PointLight(0xffa860, 7, 9, 2); stairLight.position.set(RX1 + 1.2, 4.2, (SZ0 + SZ1) / 2); scene.add(stairLight);
  const LZ0 = -2.3, LZ1 = -4.7; // varco verso la biblioteca
  wall(Z0 - LZ0, WH, plasterS, HW, WH / 2, (Z0 + LZ0) / 2, -Math.PI / 2);
  wall(LZ1 - Z1, WH, plaster, HW, WH / 2, (LZ1 + Z1) / 2, -Math.PI / 2);
  wall(LZ0 - LZ1, WH - 2.75, plasterS, HW, (WH + 2.75) / 2, (LZ0 + LZ1) / 2, -Math.PI / 2);
  // stipiti
  for (const z of [LZ0, LZ1]) scene.add(box(0.5, 2.75, 0.16, A.wood, HW + 0.2, 1.375, z));
  scene.add(box(0.54, 0.18, LZ0 - LZ1 + 0.3, A.wood, HW + 0.2, 2.8, (LZ0 + LZ1) / 2));
  // doppia porta della biblioteca: chiusa finché Livia non dice di cercarla tra i libri
  const libDoors = [];
  for (const [zh, dir] of [[LZ0, -1], [LZ1, 1]]) {
    const pivot = new THREE.Group();
    pivot.position.set(HW + 0.06, 1.35, zh);
    pivot.add(box(0.07, 2.66, 1.18, A.woodPanel, 0, 0, dir * 0.59));
    pivot.add(box(0.05, 0.14, 0.05, A.gold, -0.05, 0, dir * 1.08)); // maniglia
    scene.add(pivot);
    libDoors.push({ pivot, dir });
  }
  let libAngle = 0, libTarget = 0;

  // volta a botte + costoloni
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(HW, HW, LEN, 18, 1, true, Math.PI / 2, Math.PI), vaultMat);
  vault.rotation.x = Math.PI / 2; vault.position.set(0, WH, ZC); scene.add(vault);
  for (let z = 0.6; z > Z1; z -= 3.9) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(HW - 0.03, 0.1, 6, 18, Math.PI), trim);
    rib.position.set(0, WH, z); scene.add(rib);
    for (const s of [-1, 1]) {
      // sul lato della biblioteca il costolone poggia su una mensola sopra la porta: il pilastro la coprirebbe
      const overLibrary = s > 0 && z < LZ0 + 0.3 && z > LZ1 - 0.3;
      if (!overLibrary) scene.add(box(0.14, WH, 0.24, trim, s * (HW - 0.06), WH / 2, z));
      scene.add(box(0.22, 0.14, 0.34, trim, s * (HW - 0.08), WH, z));
    }
  }

  // parete d'ingresso (dietro) con portone aperto sul tramonto
  wall(HW * 2, 5.2, plasterS, 0, 2.6, Z0, Math.PI);
  const dusk = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9), new THREE.MeshBasicMaterial({ map: T.duskTex(), fog: false }));
  dusk.position.set(0, 1.45, Z0 - 0.02); dusk.rotation.y = Math.PI; scene.add(dusk);
  for (const s of [-1, 1]) { const l = box(0.85, 2.9, 0.07, A.woodPanel, s * 1.2, 1.45, Z0 - 0.3); l.rotation.y = s * 0.5; scene.add(l); }
  scene.add(box(2.1, 0.16, 0.2, A.wood, 0, 2.98, Z0 - 0.06));

  // parete di fondo con porta ad arco
  const DW = 1.5, DH = 2.5;
  for (const s of [-1, 1]) wall((HW * 2 - DW) / 2, DH, plasterS, s * (DW / 2 + (HW * 2 - DW) / 4), DH / 2, Z1, 0);
  wall(HW * 2, 5.2 - DH - 0.75, plasterS, 0, DH + 0.75 + (5.2 - DH - 0.75) / 2, Z1, 0);
  // lunetta con trafori
  const [tc, tg] = T.mk(128, 64);
  tg.fillStyle = '#6e553a'; tg.fillRect(0, 0, 128, 64);
  tg.fillStyle = '#120a08'; tg.beginPath(); tg.arc(64, 64, 60, Math.PI, 0); tg.fill();
  tg.strokeStyle = '#3a2416'; tg.lineWidth = 4;
  for (const cx of [34, 64, 94]) { tg.beginPath(); tg.arc(cx, 64, 30, Math.PI, 0); tg.stroke(); }
  tg.beginPath(); tg.arc(64, 64, 59, Math.PI, 0); tg.stroke();
  const lun = wall(DW, 0.75, new THREE.MeshStandardMaterial({ map: T.toTex(tc), roughness: 0.8 }), 0, DH + 0.375, Z1 + 0.005, 0);
  lun.scale.x = (HW * 2) / DW; // riempie tutta la larghezza tra i due tratti
  for (const s of [-1, 1]) scene.add(box(0.14, DH, 0.3, A.wood, s * (DW / 2 + 0.05), DH / 2, Z1));
  scene.add(box(DW + 0.3, 0.14, 0.3, A.wood, 0, DH + 0.05, Z1));
  const dleaf = box(0.07, DH - 0.05, 0.75, A.woodPanel, DW / 2 - 0.02, DH / 2, Z1 - 0.4); scene.add(dleaf);

  // anteprima della stanza in fondo (materiali non illuminati, niente luci extra)
  const dim = (c) => new THREE.MeshBasicMaterial({ color: c });
  wall(4, 3.4, new THREE.MeshBasicMaterial({ map: T.plasterTex([1, 1], 1), color: 0x5a4030 }), 0, 1.7, Z1 - 6, 0);
  wall(6, 3.4, dim(0x140c08), -2, 1.7, Z1 - 3, Math.PI / 2);
  wall(6, 3.4, dim(0x140c08), 2, 1.7, Z1 - 3, -Math.PI / 2);
  scene.add(box(1.5, 0.75, 0.7, dim(0x1c0f08), 0, 0.38, Z1 - 4.2));
  scene.add(box(0.45, 0.3, 0.05, dim(0x9a8660), 0.1, 0.98, Z1 - 4.2));
  scene.add(box(0.4, 0.5, 0.4, dim(0x2a160c), -0.35, 0.3, Z1 - 3.3));
  const pw = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ map: T.paintingTex(1), color: 0x6a5a4a }));
  pw.position.set(-0.1, 2.0, Z1 - 5.97); scene.add(pw);
  for (const x of [-0.8, 0.85]) { const f = glowSprite(0xffa040, 0.5, 0.9); f.position.set(x, 1.55, Z1 - 5.4); scene.add(f); }
  const prevGlow = glowSprite(0xff8a30, 4.5, 0.22); prevGlow.position.set(0, 1.4, Z1 - 4); scene.add(prevGlow);

  // --- lato sinistro: credenza, candelabro, vaso, busto, quadro ---
  const sbZ = -1.5;
  scene.add(box(0.56, 0.9, 2.7, A.woodPanel, -HW + 0.3, 0.45, sbZ));
  scene.add(box(0.64, 0.06, 2.8, new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.25, metalness: 0.2 }), -HW + 0.32, 0.93, sbZ));
  const TOP = 0.96;
  const cb = candelabra(3, 0.42, 0.14);
  cb.group.position.set(-HW + 0.36, TOP, -0.75); cb.group.rotation.y = Math.PI / 2;
  scene.add(cb.group);
  const candles = new CandleSet(scene, worldPoints(cb.group, cb.cups), { color: 0xffb070, intensity: 4, distance: 11, height: 0.2 });

  const vase = urn(A.bronze, 1.0); vase.position.set(-HW + 0.34, TOP, -1.6); scene.add(vase);
  const fl = foliageCross(0x8a3424, 0.75); fl.position.set(-HW + 0.36, TOP + 0.72, -1.6); scene.add(fl);
  const sb = bust(A.terracotta, 0.62); sb.position.set(-HW + 0.34, TOP, -2.35); sb.rotation.y = Math.PI / 2 + 0.3; scene.add(sb);
  const book = box(0.22, 0.03, 0.3, new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.9 }), -HW + 0.42, TOP + 0.015, -0.25); book.rotation.y = 0.3; scene.add(book);

  const p1 = painting(T.paintingTex(0), 2.0, 1.45); p1.position.set(-HW + 0.04, 2.25, -1.4); p1.rotation.y = Math.PI / 2; scene.add(p1);
  const st = stool(); st.position.set(-HW + 0.42, 0, -3.35); scene.add(st);

  // trofeo con palchi
  const bone = new THREE.MeshStandardMaterial({ color: 0xa89878, roughness: 0.8 });
  const trophy = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 6), bone); skull.rotation.x = Math.PI; skull.position.y = -0.1; trophy.add(skull);
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.05, 0.05, 0), new THREE.Vector3(s * 0.22, 0.25, 0.08), new THREE.Vector3(s * 0.34, 0.55, 0.05), new THREE.Vector3(s * 0.3, 0.8, 0)]);
    trophy.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.018, 5), bone));
    for (const [u, len] of [[0.35, 0.22], [0.65, 0.2]]) {
      const p = curve.getPoint(u);
      const tine = cyl(0.006, 0.014, len, bone, p.x + s * 0.03, p.y + len / 2, p.z + 0.05, 4); tine.rotation.x = 0.4; trophy.add(tine);
    }
  }
  trophy.add(box(0.2, 0.3, 0.03, A.wood, 0, -0.08, -0.05));
  trophy.position.set(-HW + 0.08, 2.7, -7.95); trophy.rotation.y = Math.PI / 2; scene.add(trophy); // tra due costoloni: prima le corna entravano nell'arco

  // armadio
  // carcassa con l'interno scuro, due ante apribili e un lucchetto a combinazione
  const WX = -HW + 0.33, WZ = -5.4, FX = -HW + 0.64; // centro e fronte dell'armadio
  const inner = new THREE.MeshStandardMaterial({ color: 0x1a0e08, roughness: 0.9 });
  scene.add(box(0.04, 2.38, 1.27, inner, -HW + 0.04, 1.225, WZ));
  for (const s of [-1, 1]) scene.add(box(0.62, 2.4, 0.04, A.woodPanel, WX, 1.225, WZ + s * 0.655));
  scene.add(box(0.56, 0.03, 1.27, inner, WX, 1.24, WZ));
  scene.add(box(0.56, 0.03, 1.27, inner, WX, 0.2, WZ));
  // dentro: la foto di una donna e una lettera piegata
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshStandardMaterial({ map: T.toTex(T.womanPhotoCanvas()), roughness: 0.7, emissive: 0x2a1c10, emissiveIntensity: 0.5 }));
  photo.position.set(-HW + 0.2, 1.41, WZ - 0.22); photo.rotation.set(0, Math.PI / 2, 0); photo.rotation.z = 0; photo.rotateX(-0.12);
  scene.add(photo);
  scene.add(box(0.012, 0.3, 0.24, A.gold, -HW + 0.19, 1.41, WZ - 0.22));
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9, emissive: 0x3a2c18, emissiveIntensity: 0.5 }));
  letter.rotation.x = -Math.PI / 2; letter.rotation.z = 0.3; letter.position.set(WX + 0.05, 1.26, WZ + 0.22);
  scene.add(letter);
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(FX + 0.01, 1.225, WZ + s * 0.665);
    const leaf = box(0.04, 2.34, 0.655, A.woodPanel, 0, 0, -s * 0.3325);
    pivot.add(leaf);
    pivot.add(box(0.03, 0.12, 0.05, A.gold, 0.03, 0.02, -s * 0.62)); // maniglia / occhiello
    scene.add(pivot);
    doors.push({ pivot, s });
  }
  const lock = new THREE.Group();
  lock.add(box(0.035, 0.085, 0.075, A.gold, 0, 0, 0));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 12, Math.PI), A.bronze);
  shackle.rotation.y = Math.PI / 2; shackle.position.y = 0.042; lock.add(shackle);
  for (let i = 0; i < 3; i++) { const d = cyl(0.012, 0.012, 0.016, new THREE.MeshStandardMaterial({ color: 0x2a1c0c, roughness: 0.5, metalness: 0.5 }), 0.02, -0.018, -0.022 + i * 0.022, 8); d.rotation.z = Math.PI / 2; lock.add(d); }
  lock.position.set(FX + 0.06, 1.27, WZ);
  scene.add(lock);
  let doorAngle = 0, doorTarget = 0;
  const setWardrobe = (open, instant = false) => {
    doorTarget = open ? 1 : 0;
    lock.visible = !open;
    if (instant) doorAngle = doorTarget;
  };
  scene.add(box(0.72, 0.1, 1.5, A.wood, -HW + 0.35, 2.5, -5.4));
  scene.add(box(0.68, 0.12, 1.42, A.wood, -HW + 0.34, 0.06, -5.4));
  const cv = urn(new THREE.MeshStandardMaterial({ color: 0xb8ac90, roughness: 0.4 }), 0.95); cv.position.set(-HW + 0.36, 2.55, -5.4); scene.add(cv);

  // --- lampadario ---
  const ch = new THREE.Group();
  ch.add(cyl(0.012, 0.012, 1.15, A.bronze, 0, 0.75, 0, 5));
  ch.add(lathe([[0, -0.28], [0.03, -0.26], [0.06, -0.16], [0.03, -0.06], [0.05, 0.06], [0.02, 0.18], [0, 0.2]], A.bronze, 10));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.014, 5, 20), A.bronze); ring.rotation.x = Math.PI / 2; ring.position.y = -0.08; ch.add(ring);
  const chCups = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 0.42, z = Math.sin(a) * 0.42;
    const arm = cyl(0.007, 0.007, 0.42, A.bronze, x / 2, -0.08, z / 2, 4); arm.rotation.z = Math.PI / 2; arm.rotation.y = -a; ch.add(arm);
    ch.add(cyl(0.028, 0.012, 0.03, A.bronze, x, -0.05, z, 6));
    chCups.push(new THREE.Vector3(x, -0.035, z));
  }
  ch.position.set(0, 3.65, -6.6); scene.add(ch);
  const chandelier = new CandleSet(scene, worldPoints(ch, chCups), { color: 0xffb878, intensity: 16, distance: 16, height: 0.12, lightOffset: -0.2 });

  // --- lato destro: biblioteca ---
  const LX0 = HW + 0.4, LX1 = HW + 4.2, LZa = -0.6, LZb = -6.4;
  const lfloor = new THREE.Mesh(new THREE.PlaneGeometry(LX1 - HW, LZa - LZb), new THREE.MeshStandardMaterial({ map: T.rugTex([2, 2]), roughness: 1 }));
  lfloor.rotation.x = -Math.PI / 2; lfloor.position.set((LX1 + HW) / 2, 0.005, (LZa + LZb) / 2); scene.add(lfloor);
  const booksM = new THREE.MeshStandardMaterial({ map: T.booksTex([2, 1]), roughness: 0.9 });
  wall(LZa - LZb, 3.2, booksM, LX1, 1.6, (LZa + LZb) / 2, -Math.PI / 2);
  wall(LX1 - HW, 3.2, booksM, (LX1 + HW) / 2, 1.6, LZb, 0);
  wall(LX1 - HW, 3.2, plasterS, (LX1 + HW) / 2, 1.6, LZa, Math.PI);
  const lceil = new THREE.Mesh(new THREE.PlaneGeometry(LX1 - HW, LZa - LZb), plasterS); lceil.rotation.x = Math.PI / 2; lceil.position.set((LX1 + HW) / 2, 3.2, (LZa + LZb) / 2); scene.add(lceil);
  // retro delle pareti del corridoio viste dalla biblioteca
  wall(LZa - LZ0 + 0.01, 3.2, plasterS, LX0 - 0.39, 1.6, (LZa + LZ0) / 2, Math.PI / 2);
  wall(LZ1 - LZb, 3.2, plasterS, LX0 - 0.39, 1.6, (LZ1 + LZb) / 2, Math.PI / 2);
  const ac = armchair(); ac.position.set(LX0 + 1.9, 0, -4.3); ac.rotation.y = -Math.PI / 2 + 0.5; scene.add(ac);
  // lampada a stelo
  const lampX = LX0 + 2.75, lampZ = -4.95; // accanto alla poltrona: non copre il dipinto
  scene.add(lathe([[0, 0], [0.16, 0], [0.14, 0.04], [0.03, 0.08], [0.05, 0.3], [0.02, 0.5], [0.02, 1.25], [0, 1.25]], A.gold));
  scene.children[scene.children.length - 1].position.set(lampX, 0, lampZ);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.36, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8a050, side: THREE.DoubleSide }));
  shade.position.set(lampX, 1.42, lampZ); scene.add(shade);
  const lampGlow = glowSprite(0xff9a40, 1.8, 0.55); lampGlow.position.copy(shade.position); scene.add(lampGlow);
  const lamp = new THREE.PointLight(0xffb468, 16, 12, 2); lamp.position.set(lampX, 1.5, lampZ); scene.add(lamp);

  // --- arredi nuovi della biblioteca: leggio, romanzo, scaffale dell'enigma ---
  // il leggio, con un atlante aperto
  const lect = new THREE.Group();
  lect.add(cyl(0.05, 0.07, 1.05, A.wood, 0, 0.52, 0, 8));
  lect.add(cyl(0.22, 0.26, 0.05, A.wood, 0, 0.025, 0, 10));
  const top = box(0.5, 0.04, 0.38, A.wood, 0, 1.08, 0); top.rotation.x = -0.45; lect.add(top);
  // il libro aperto, la cronaca delle lanterne, appoggiato sul piano inclinato (ne segue la rotazione)
  top.add(box(0.47, 0.025, 0.33, new THREE.MeshStandardMaterial({ color: 0x3a1a0c, roughness: 0.6 }), 0, 0.032, 0));
  const codex = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), new THREE.MeshStandardMaterial({ map: T.toTex(codexSpreadCanvas()), roughness: 0.85, emissive: 0x2a1a0c, emissiveIntensity: 0.35 }));
  codex.position.set(0, 0.047, 0); codex.rotation.set(-Math.PI / 2, 0, Math.PI); top.add(codex); // il testo si legge dal lato basso del leggio
  // girato verso chi entra dalla porta: chi legge sta dal lato basso del piano
  lect.position.set(LX1 - 1.3, 0, LZa - 0.9); lect.rotation.y = 0.61;
  scene.add(lect);
  // il grande dipinto della valle al tramonto, su tutta la parete di destra per chi entra
  const valley = painting(T.toTex(valleyPaintingCanvas()), 3.5, 1.75);
  valley.position.set((LX1 + HW) / 2 + 0.1, 2.12, LZa - 0.04); valley.rotation.y = Math.PI;
  scene.add(valley);
  const [plaqueC, pg] = T.mk(512, 64);
  pg.fillStyle = '#b8903a'; pg.fillRect(0, 0, 512, 64);
  pg.strokeStyle = '#6a4a1a'; pg.lineWidth = 4; pg.strokeRect(4, 4, 504, 56);
  pg.fillStyle = '#2a1808'; pg.font = 'italic 24px Georgia, serif'; pg.textAlign = 'center'; pg.textBaseline = 'middle';
  pg.fillText(PAINTING.title, 256, 33);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.0625), new THREE.MeshStandardMaterial({ map: T.toTex(plaqueC), roughness: 0.4, metalness: 0.4 }));
  plaque.position.set((LX1 + HW) / 2 + 0.1, 1.1, LZa - 0.02); plaque.rotation.y = Math.PI; scene.add(plaque);
  const valleyLight = new THREE.PointLight(0xffb070, 3, 5, 2); valleyLight.position.set((LX1 + HW) / 2, 2.9, LZa - 1.2); scene.add(valleyLight);

  // il romanzo: sporge dallo scaffale della parete destra, con il dorso leggibile
  const spineCanvas = (title, author, w, h, color) => {
    const [c, g] = T.mk(w, h);
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.strokeStyle = '#d8b060'; g.lineWidth = 2;
    for (const y of [18, 26, h - 26, h - 18]) { g.beginPath(); g.moveTo(6, y); g.lineTo(w - 6, y); g.stroke(); }
    g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = '#f0d088'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold ${Math.round(w * 0.36)}px Georgia, serif`; g.fillText(title, 0, -w * 0.08);
    g.font = `italic ${Math.round(w * 0.22)}px Georgia, serif`; g.fillText(author, 0, w * 0.3);
    g.restore();
    return c;
  };
  const novelSpine = T.toTex(spineCanvas(IS_EN ? 'THE LANTERN KEEPER' : 'IL CUSTODE DELLE LANTERNE', 'M. Ashcombe · 1831', 64, 512, '#5a1a14'));
  const novelMat = new THREE.MeshStandardMaterial({ color: 0x5a1a14, roughness: 0.7 });
  const novel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.22), [novelMat, novelMat, novelMat, novelMat, new THREE.MeshStandardMaterial({ map: novelSpine, roughness: 0.6, emissive: 0x2a1006, emissiveIntensity: 0.6 }), new THREE.MeshStandardMaterial({ color: 0xd8c8a0 })]);
  novel.rotation.y = -Math.PI / 2; // così il dorso col titolo guarda verso la stanza
  novel.position.set(LX1 - 0.18, 1.45, -2.4);
  scene.add(novel);
  // la mensola su cui poggia (prima il libro restava sospeso nel vuoto)
  scene.add(box(0.32, 0.03, 0.5, A.woodPanel, LX1 - 0.16, 1.285, -2.4));
  const novelGlint = glowSprite(0xffc070, 0.5, 0.25); novelGlint.position.set(LX1 - 0.3, 1.45, -2.4); scene.add(novelGlint);
  // lo scaffale dell'enigma, contro la parete di fondo: otto libri con una lettera sul dorso
  const SX = (LX1 + HW) / 2, SZ = LZb, BW = 0.2;
  const halves = [new THREE.Group(), new THREE.Group()];
  halves.forEach((hg, i) => {
    const side = i ? 1 : -1;
    // mobile aperto: fondo con altri libri, fianchi, cielo, zoccolo e ripiani
    hg.add(box(0.86, 2.5, 0.02, new THREE.MeshStandardMaterial({ map: T.booksTex([0.5, 1]), roughness: 0.9 }), side * 0.45, 1.3, 0.03));
    for (const x of [0.015, 0.885]) hg.add(box(0.03, 2.6, 0.34, A.wood, side * x, 1.3, 0.17));
    hg.add(box(0.9, 0.06, 0.34, A.wood, side * 0.45, 2.57, 0.17));
    hg.add(box(0.9, 0.12, 0.34, A.wood, side * 0.45, 0.06, 0.17));
    for (const y of [0.55, 1.12, 1.62, 2.2]) hg.add(box(0.86, 0.04, 0.3, A.wood, side * 0.45, y, 0.18));
    hg.position.set(SX, 0, SZ + 0.02);
    scene.add(hg);
  });
  // la fila dei libri con le lettere, appoggiata sul ripiano a 1.14 m
  const letterBooks = [];
  const bookColors = ['#3a1a12', '#1e2a1c', '#4a2a14', '#2a1828', '#3a2a10', '#1a2228', '#4a1a1a', '#2a2018'];
  const letterTex = (ch, color) => {
    const [c, g] = T.mk(64, 192);
    g.fillStyle = color; g.fillRect(0, 0, 64, 192);
    g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.strokeRect(6, 8, 52, 176);
    g.fillStyle = '#f0d088'; g.font = 'bold 46px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 96);
    return T.toTex(c);
  };
  for (let i = 0; i < 8; i++) {
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: 0x1a0c06, emissiveIntensity: 0.5 });
    const bk = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.012, 0.42, 0.24), [mat, mat, mat, mat, mat, mat]);
    const half = i < 4 ? 0 : 1;
    bk.position.set((i < 4 ? -0.82 + i * BW : 0.02 + (i - 4) * BW) + BW / 2 - 0.0, 1.35, 0.2);
    halves[half].add(bk);
    letterBooks.push(bk);
  }
  // la targhetta d'ottone sotto i primi quattro
  const plate = box(0.62, 0.06, 0.02, A.gold, -0.42, 1.08, 0.36); halves[0].add(plate);
  const setShelf = (letters) => {
    letters.forEach((ch, i) => {
      const color = bookColors[(ch.charCodeAt(0) + i * 0) % bookColors.length];
      const front = new THREE.MeshStandardMaterial({ map: letterTex(ch, color), roughness: 0.6, emissive: 0x2a1408, emissiveIntensity: 0.55 });
      const m = letterBooks[i].material; m[4] = front;
      for (const k of [0, 1, 2, 3, 5]) m[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    });
  };
  // dietro lo scaffale: una nicchia con il libro antico
  const niche = box(1.7, 2.4, 0.02, new THREE.MeshStandardMaterial({ color: 0x140a06, roughness: 1 }), SX, 1.25, SZ + 0.03);
  scene.add(niche);
  const tome = new THREE.Group();
  const tomeCover = new THREE.MeshStandardMaterial({ color: 0x3a1a0c, roughness: 0.55 });
  // libro aperto: copertina sotto, due blocchi di pagine sopra (nessuna faccia sovrapposta)
  tome.add(box(0.54, 0.03, 0.38, tomeCover, 0, -0.015, 0));
  const pagesM = new THREE.MeshStandardMaterial({ color: 0xe0d0a8, roughness: 0.9 });
  for (const s of [-1, 1]) {
    const pg = box(0.245, 0.045, 0.35, pagesM, s * 0.13, 0.0225, 0);
    pg.rotation.z = s * 0.05; // le pagine scendono verso la piega
    tome.add(pg);
  }
  for (const x of [-0.262, 0.262]) tome.add(box(0.02, 0.05, 0.39, A.gold, x, -0.005, 0));
  tome.add(box(0.6, 0.97, 0.3, A.wood, 0, -0.515, 0)); // il piccolo leggio della nicchia, poggiato a terra
  tome.position.set(SX, 1.0, SZ + 0.2);
  tome.visible = false;
  scene.add(tome);
  const tomeGlow = glowSprite(0xffd090, 1.6, 0); tomeGlow.position.set(SX, 1.2, SZ + 0.45); scene.add(tomeGlow);
  const tomeLight = new THREE.PointLight(0xffc888, 0, 5, 2); tomeLight.position.set(SX, 1.6, SZ + 0.9); scene.add(tomeLight);
  let shelfOpen = 0, shelfTarget = 0;

  // piedistallo con busto scuro
  scene.add(box(0.46, 1.1, 0.46, A.woodPanel, HW - 0.3, 0.55, -6.3));
  scene.add(box(0.54, 0.06, 0.54, A.wood, HW - 0.3, 1.13, -6.3));
  const db = bust(A.darkStone, 1.0); db.position.set(HW - 0.3, 1.16, -6.3); db.rotation.y = -Math.PI / 2 + 0.35; scene.add(db);
  const p2 = painting(T.paintingTex(1), 0.8, 1.05); p2.position.set(HW - 0.04, 2.2, -8.2); p2.rotation.y = -Math.PI / 2; scene.add(p2);

  // --- tavolino con il carillon ---
  const mbZ = -10.6, mbX = HW - 0.32;
  scene.add(box(0.5, 0.05, 0.9, A.wood, mbX, 0.8, mbZ));
  scene.add(box(0.44, 0.1, 0.84, A.woodPanel, mbX, 0.73, mbZ));
  for (const [x, z] of [[-0.2, -0.38], [0.2, -0.38], [-0.2, 0.38], [0.2, 0.38]]) scene.add(cyl(0.025, 0.018, 0.7, A.wood, mbX + x, 0.35, mbZ + z, 6));
  const mb = new THREE.Group();
  const mbWood = new THREE.MeshStandardMaterial({ color: 0x5a2a14, roughness: 0.35 });
  mb.add(box(0.2, 0.08, 0.14, mbWood, 0, 0.04, 0));
  const lid = box(0.2, 0.012, 0.14, mbWood, 0, 0.07, 0); lid.geometry.translate(0, 0, -0.07); lid.position.set(0, 0.082, 0.07); lid.rotation.x = 1.9; mb.add(lid);
  mb.add(box(0.17, 0.004, 0.11, A.gold, 0, 0.083, 0));
  const drum = cyl(0.022, 0.022, 0.12, A.gold, 0, 0.1, 0.0, 10); drum.rotation.z = Math.PI / 2; mb.add(drum);
  const crank = cyl(0.004, 0.004, 0.05, A.gold, 0.115, 0.05, 0, 4); crank.rotation.z = Math.PI / 2; mb.add(crank);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), A.gold); knob.position.set(0.14, 0.065, 0); mb.add(knob);
  mb.position.set(mbX - 0.02, 0.825, mbZ); mb.rotation.y = Math.PI - 0.41; scene.add(mb); // il davanti (lato opposto alla cerniera) guarda chi arriva dall'ingresso, manovella verso il corridoio
  const mbGlint = glowSprite(0xffd080, 0.35, 0.0); mbGlint.position.set(mbX - 0.02, 0.95, mbZ); scene.add(mbGlint);

  // applique sopra il carillon e in fondo
  const s1 = sconce(); s1.group.position.set(HW - 0.02, 1.9, mbZ); s1.group.rotation.y = -Math.PI / 2; scene.add(s1.group);
  const s2 = sconce(); s2.group.position.set(-HW + 0.02, 1.9, -12.6); s2.group.rotation.y = Math.PI / 2; scene.add(s2.group);
  const s3 = sconce(); s3.group.position.set(-HW + 0.02, 1.9, -8.6); s3.group.rotation.y = Math.PI / 2; scene.add(s3.group);
  const sconces = new CandleSet(scene, [...worldPoints(s1.group, s1.cups), ...worldPoints(s2.group, s2.cups), ...worldPoints(s3.group, s3.cups)], { color: 0xffb070, intensity: 10, distance: 12, height: 0.11 });
  sconces.light.position.set(0.3, 2.2, -11.2);

  let playing = false;
  const update = (dt, t, wind) => {
    doorAngle += (doorTarget - doorAngle) * Math.min(1, dt * 2.2);
    libAngle += (libTarget - libAngle) * Math.min(1, dt * 1.6);
    for (const d of libDoors) d.pivot.rotation.y = -d.dir * libAngle * 1.6;
    shelfOpen += (shelfTarget - shelfOpen) * Math.min(1, dt * 0.9);
    halves[0].position.x = SX - shelfOpen * 0.95; halves[1].position.x = SX + shelfOpen * 0.95;
    tome.position.z = SZ + 0.2 + Math.max(0, shelfOpen - 0.5) * 1.0; // il libro esce dalla nicchia
    tome.visible = shelfOpen > 0.34; // compare solo quando le due metà dello scaffale non lo attraversano più
    tomeGlow.material.opacity = 0.6 * shelfOpen * (0.9 + 0.1 * Math.sin(t * 3));
    tomeLight.intensity = 6 * shelfOpen;
    novelGlint.material.opacity = 0.18 + 0.1 * Math.sin(t * 2.2);
    for (const d of doors) d.pivot.rotation.y = -d.s * doorAngle * 1.75;
    candles.update(dt, t, wind);
    chandelier.update(dt, t, 0);
    sconces.update(dt, t, 0);
    lamp.intensity = 16 * (0.97 + 0.03 * Math.sin(t * 3.1));
    if (playing) { drum.rotation.x += dt * 1.6; crank.rotation.x += dt * 1.6; knob.position.y = 0.05 + Math.cos(drum.rotation.x) * 0.015; knob.position.z = Math.sin(drum.rotation.x) * 0.015; }
    mbGlint.material.opacity += ((playing ? 0.35 + 0.15 * Math.sin(t * 4) : 0.12 + 0.08 * Math.sin(t * 2)) - mbGlint.material.opacity) * Math.min(1, dt * 3);
  };

  return {
    scene, update, candles,
    setPlaying: (v) => { playing = v; },
    exposure: 1.5, // più luminoso: su molti telefoni gli interni risultavano troppo scuri
    waypoints: [new THREE.Vector3(0, 1.6, 1.4), new THREE.Vector3(0, 1.6, -5.2), new THREE.Vector3(0, 1.6, -11.6)],
    candlePos: candles.center.clone(),
    candleView: new THREE.Vector3(-0.55, 1.5, -0.2),
    musicPos: new THREE.Vector3(mbX, 0.92, mbZ),
    musicView: new THREE.Vector3(0.55, 1.4, -9.9),
    endDoor: new THREE.Vector3(0, 1.35, Z1),
    setWardrobe,
    setLibrary: (open, instant = false) => { libTarget = open ? 1 : 0; if (instant) libAngle = libTarget; },
    setShelf,
    openShelf: (instant = false) => { shelfTarget = 1; if (instant) shelfOpen = 1; },
    libraryEntry: new THREE.Vector3(3.3, 1.6, -3.5),
    libraryLook: new THREE.Vector3(4, 1.4, -6.4),
    libraryExit: new THREE.Vector3(0, 1.6, -3.5),
    libraryDoor: new THREE.Vector3(HW + 0.1, 1.4, (LZ0 + LZ1) / 2),
    stairPos: new THREE.Vector3(-HW - 0.2, 1.3, (SZ0 + SZ1) / 2),
    stairView: new THREE.Vector3(-0.8, 1.6, (SZ0 + SZ1) / 2),
    paintingPos: new THREE.Vector3((LX1 + HW) / 2 + 0.1, 2.0, LZa - 0.1),
    paintingView: new THREE.Vector3((LX1 + HW) / 2, 1.6, LZa - 2.9),
    lecternPos: new THREE.Vector3(LX1 - 1.3, 1.2, LZa - 0.9),
    lecternView: new THREE.Vector3(LX1 - 1.3 - 0.52, 1.55, LZa - 0.9 - 0.75),
    novelPos: new THREE.Vector3(LX1 - 0.2, 1.45, -2.4),
    novelView: new THREE.Vector3(LX1 - 1.3, 1.55, -2.4),
    shelfPos: new THREE.Vector3(SX - 0.4, 1.35, SZ + 0.35),
    shelfView: new THREE.Vector3(SX, 1.55, SZ + 1.6),
    tomePos: new THREE.Vector3(SX, 1.05, SZ + 0.7),
    lockPos: new THREE.Vector3(FX + 0.06, 1.27, WZ),
    lockView: new THREE.Vector3(-0.15, 1.5, WZ + 0.15),
    wardrobeInside: new THREE.Vector3(-HW + 0.3, 1.35, WZ),
    exitDoor: new THREE.Vector3(0, 1.45, Z0 - 0.1),
  };
}
