// Scena 2 — Corridoio principale
import * as THREE from 'three';
import * as T from './textures.js';
import { assets, box, cyl, lathe, glowSprite, CandleSet, candelabra, bust, painting, armchair, stool, foliageCross, urn, sconce, worldPoints } from './props.js';

export function buildCorridor() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050302);
  scene.fog = new THREE.FogExp2(0x0a0503, 0.035);
  scene.add(new THREE.HemisphereLight(0x8a6850, 0x1a120c, 0.95));

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
  wall(LEN, WH, plaster, -HW, WH / 2, ZC, Math.PI / 2);
  const LZ0 = -2.3, LZ1 = -4.7; // varco verso la biblioteca
  wall(Z0 - LZ0, WH, plasterS, HW, WH / 2, (Z0 + LZ0) / 2, -Math.PI / 2);
  wall(LZ1 - Z1, WH, plaster, HW, WH / 2, (LZ1 + Z1) / 2, -Math.PI / 2);
  wall(LZ0 - LZ1, WH - 2.75, plasterS, HW, (WH + 2.75) / 2, (LZ0 + LZ1) / 2, -Math.PI / 2);
  // stipiti
  for (const z of [LZ0, LZ1]) scene.add(box(0.5, 2.75, 0.16, A.wood, HW + 0.2, 1.375, z));
  scene.add(box(0.5, 0.16, LZ0 - LZ1 + 0.16, A.wood, HW + 0.2, 2.75, (LZ0 + LZ1) / 2));
  const leaf = box(0.07, 2.7, 1.0, A.woodPanel, HW + 0.05, 1.35, LZ0 + 0.55);
  scene.add(leaf);

  // volta a botte + costoloni
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(HW, HW, LEN, 18, 1, true, Math.PI / 2, Math.PI), vaultMat);
  vault.rotation.x = Math.PI / 2; vault.position.set(0, WH, ZC); scene.add(vault);
  for (let z = 0.6; z > Z1; z -= 3.9) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(HW - 0.03, 0.1, 6, 18, Math.PI), trim);
    rib.position.set(0, WH, z); scene.add(rib);
    for (const s of [-1, 1]) { scene.add(box(0.14, WH, 0.24, trim, s * (HW - 0.06), WH / 2, z)); scene.add(box(0.22, 0.14, 0.34, trim, s * (HW - 0.08), WH, z)); }
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
  trophy.position.set(-HW + 0.08, 2.85, -3.6); trophy.rotation.y = Math.PI / 2; scene.add(trophy);

  // armadio
  scene.add(box(0.62, 2.45, 1.35, A.woodPanel, -HW + 0.33, 1.225, -5.4));
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
  const lampX = LX0 + 1.2, lampZ = -2.9;
  scene.add(lathe([[0, 0], [0.16, 0], [0.14, 0.04], [0.03, 0.08], [0.05, 0.3], [0.02, 0.5], [0.02, 1.25], [0, 1.25]], A.gold));
  scene.children[scene.children.length - 1].position.set(lampX, 0, lampZ);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.36, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8a050, side: THREE.DoubleSide }));
  shade.position.set(lampX, 1.42, lampZ); scene.add(shade);
  const lampGlow = glowSprite(0xff9a40, 1.8, 0.55); lampGlow.position.copy(shade.position); scene.add(lampGlow);
  const lamp = new THREE.PointLight(0xffb468, 16, 12, 2); lamp.position.set(lampX, 1.5, lampZ); scene.add(lamp);

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
  mb.add(box(0.17, 0.004, 0.11, A.gold, 0, 0.081, 0));
  const drum = cyl(0.022, 0.022, 0.12, A.gold, 0, 0.1, 0.0, 10); drum.rotation.z = Math.PI / 2; mb.add(drum);
  const crank = cyl(0.004, 0.004, 0.05, A.gold, 0.115, 0.05, 0, 4); crank.rotation.z = Math.PI / 2; mb.add(crank);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), A.gold); knob.position.set(0.14, 0.065, 0); mb.add(knob);
  mb.position.set(mbX - 0.02, 0.825, mbZ); mb.rotation.y = -Math.PI / 2 + 0.25; scene.add(mb);
  const mbGlint = glowSprite(0xffd080, 0.35, 0.0); mbGlint.position.set(mbX - 0.02, 0.95, mbZ); scene.add(mbGlint);

  // applique sopra il carillon e in fondo
  const s1 = sconce(); s1.group.position.set(HW - 0.02, 1.9, mbZ); s1.group.rotation.y = -Math.PI / 2; scene.add(s1.group);
  const s2 = sconce(); s2.group.position.set(-HW + 0.02, 1.9, -12.6); s2.group.rotation.y = Math.PI / 2; scene.add(s2.group);
  const s3 = sconce(); s3.group.position.set(-HW + 0.02, 1.9, -8.6); s3.group.rotation.y = Math.PI / 2; scene.add(s3.group);
  const sconces = new CandleSet(scene, [...worldPoints(s1.group, s1.cups), ...worldPoints(s2.group, s2.cups), ...worldPoints(s3.group, s3.cups)], { color: 0xffb070, intensity: 10, distance: 12, height: 0.11 });
  sconces.light.position.set(0.3, 2.2, -11.2);

  let playing = false;
  const update = (dt, t, wind) => {
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
    exposure: 1.0,
    waypoints: [new THREE.Vector3(0, 1.6, 1.4), new THREE.Vector3(0, 1.6, -5.2), new THREE.Vector3(0, 1.6, -11.6)],
    candlePos: candles.center.clone(),
    candleView: new THREE.Vector3(-0.55, 1.5, -0.2),
    musicPos: new THREE.Vector3(mbX, 0.92, mbZ),
    musicView: new THREE.Vector3(0.55, 1.4, -9.9),
    endDoor: new THREE.Vector3(0, 1.35, Z1),
    exitDoor: new THREE.Vector3(0, 1.45, Z0 - 0.1),
  };
}
