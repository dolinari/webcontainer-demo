// Scena 3 — Lo studio in fondo al corridoio
import * as THREE from 'three';
import * as T from './textures.js';
import { assets, box, cyl, glowSprite, CandleSet, candelabra, painting, sconce, worldPoints } from './props.js';

export function buildStudy() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030202);
  scene.fog = new THREE.FogExp2(0x050302, 0.05);
  scene.add(new THREE.HemisphereLight(0x6a5040, 0x120c08, 0.5));

  const HW = 3, Z0 = 1.2, Z1 = -7, H = 3.3, ZC = (Z0 + Z1) / 2, LEN = Z0 - Z1;
  const plaster = new THREE.MeshStandardMaterial({ map: T.plasterTex([2.2, 1.1], 1), roughness: 0.95 });
  const wall = (w, h, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, LEN), new THREE.MeshStandardMaterial({ map: T.tilesTex([3, 4]), roughness: 0.4, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ZC); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, LEN), plaster);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, ZC); scene.add(ceil);
  for (let z = 0.4; z > Z1; z -= 1.3) scene.add(box(HW * 2, 0.2, 0.18, A.wood, 0, H - 0.1, z));
  wall(HW * 2, H, plaster, 0, H / 2, Z1, 0);
  wall(LEN, H, plaster, -HW, H / 2, ZC, Math.PI / 2);
  wall(LEN, H, plaster, HW, H / 2, ZC, -Math.PI / 2);
  wall(HW * 2, H, plaster, 0, H / 2, Z0, Math.PI);

  // porta di ritorno verso il corridoio
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.5), new THREE.MeshBasicMaterial({ color: 0x2a1408 }));
  back.position.set(0, 1.25, Z0 - 0.02); back.rotation.y = Math.PI; scene.add(back);
  const bg = glowSprite(0xff8a30, 2.6, 0.3); bg.position.set(0, 1.3, Z0 - 0.1); scene.add(bg);
  for (const s of [-1, 1]) scene.add(box(0.14, 2.5, 0.2, A.wood, s * 0.82, 1.25, Z0 - 0.05));
  scene.add(box(1.8, 0.14, 0.2, A.wood, 0, 2.56, Z0 - 0.05));

  // tappeto
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.4), new THREE.MeshStandardMaterial({ map: T.rugTex([1, 1.3]), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, -3.2); scene.add(rug);

  // scrivania
  const DZ = -3.7, DT = 0.8;
  scene.add(box(1.9, 0.07, 0.95, new THREE.MeshStandardMaterial({ color: 0x2a170d, roughness: 0.3, metalness: 0.15 }), 0, DT - 0.035, DZ));
  for (const s of [-1, 1]) scene.add(box(0.5, DT - 0.07, 0.85, A.woodPanel, s * 0.65, (DT - 0.07) / 2, DZ));
  scene.add(box(0.8, 0.14, 0.85, A.wood, 0, DT - 0.14, DZ));

  // macchina da scrivere
  const tw = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x0e0d0c, roughness: 0.35, metalness: 0.5 });
  tw.add(box(0.36, 0.07, 0.34, black, 0, 0.035, 0));
  const slope = box(0.32, 0.03, 0.2, black, 0, 0.085, 0.08); slope.rotation.x = 0.35; tw.add(slope);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xc8c0a8, roughness: 0.4 });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) tw.add(cyl(0.011, 0.011, 0.008, keyMat, -0.128 + k * 0.032 + (r % 2) * 0.012, 0.1 + (2 - r) * 0.022 - 0.022, 0.14 - (2 - r) * 0.05 + 0.05, 6));
  tw.add(box(0.34, 0.1, 0.12, black, 0, 0.11, -0.1));
  const platen = cyl(0.025, 0.025, 0.42, black, 0, 0.17, -0.12, 10); platen.rotation.z = Math.PI / 2; tw.add(platen);
  for (const s of [-1, 1]) tw.add(cyl(0.022, 0.022, 0.02, A.gold, s * 0.22, 0.17, -0.12, 8).rotateZ(Math.PI / 2));
  // foglio nella macchina: una texture canvas su cui "batte" da sola
  const [tc, tg] = T.mk(256, 320);
  const typedTex = T.toTex(tc);
  const drawTyped = (text) => {
    tg.fillStyle = '#d8ccae'; tg.fillRect(0, 0, 256, 320);
    tg.fillStyle = '#1a1410'; tg.font = 'bold 25px "Courier New", monospace'; tg.textBaseline = 'top';
    const lines = text.split('\n');
    const y0 = Math.min(180, 300 - lines.length * 32);
    lines.forEach((l, i) => tg.fillText(l, 22, y0 + i * 32));
    typedTex.needsUpdate = true;
  };
  drawTyped('');
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), new THREE.MeshStandardMaterial({ map: typedTex, roughness: 0.9, side: THREE.DoubleSide }));
  sheet.position.set(0, 0.33, -0.145); sheet.rotation.x = -0.18; tw.add(sheet);
  tw.position.set(0.42, DT, DZ - 0.05); tw.rotation.y = -0.12; scene.add(tw);

  // candelabro sulla scrivania
  const cb = candelabra(2, 0.36, 0.16);
  cb.group.position.set(-0.62, DT, DZ - 0.18); cb.group.rotation.y = 0.3; scene.add(cb.group);
  const candles = new CandleSet(scene, worldPoints(cb.group, cb.cups), { color: 0xffb070, intensity: 4.5, distance: 9, height: 0.18 });

  // il foglio su cui scrivere
  const paperCanvas = T.parchmentCanvas(384, 540);
  const paperBase = T.parchmentCanvas(384, 540);
  const paperTex = T.toTex(paperCanvas);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9, emissive: 0x2a1c0c, emissiveIntensity: 0.6 }));
  paper.rotation.x = -Math.PI / 2; paper.rotation.z = 0.18; paper.position.set(-0.12, DT + 0.004, DZ + 0.2); scene.add(paper);
  const pen = cyl(0.004, 0.006, 0.17, black, 0.1, DT + 0.01, DZ + 0.25, 5); pen.rotation.set(Math.PI / 2, 0, 0.9); scene.add(pen);
  const ink = cyl(0.03, 0.035, 0.045, black, 0.12, DT + 0.022, DZ + 0.02, 8); scene.add(ink);
  // libri impilati
  [[0x4a1a12, 0], [0x1e2a1c, 0.3], [0x3a2a14, -0.2]].forEach(([c, r], i) => { const b = box(0.24, 0.045, 0.32, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), -0.2, DT + 0.023 + i * 0.046, DZ - 0.22); b.rotation.y = r; scene.add(b); });

  // sedia
  const chair = new THREE.Group();
  chair.add(box(0.46, 0.06, 0.46, A.velvet, 0, 0.48, 0));
  chair.add(box(0.46, 0.6, 0.05, A.wood, 0, 0.85, -0.22));
  for (const [x, z] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) chair.add(cyl(0.022, 0.018, 0.46, A.wood, x, 0.23, z, 6));
  chair.position.set(0.95, 0, DZ + 1.15); chair.rotation.y = Math.PI + 0.6; scene.add(chair);

  // fondo: quadro, finestra al crepuscolo, applique
  const p = painting(T.paintingTex(1), 0.85, 1.1); p.position.set(-0.2, 2.0, Z1 + 0.04); scene.add(p);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), new THREE.MeshBasicMaterial({ map: T.windowTex(true), color: 0x6a4a44 }));
  win.position.set(1.9, 1.8, Z1 + 0.02); scene.add(win);
  scene.add(box(1.1, 0.1, 0.12, A.wood, 1.9, 2.85, Z1 + 0.05)); scene.add(box(1.1, 0.1, 0.2, A.wood, 1.9, 0.76, Z1 + 0.08));
  const wg = glowSprite(0xff7a40, 2.6, 0.16); wg.position.set(1.9, 1.8, Z1 + 0.2); scene.add(wg);
  const s1 = sconce(); s1.group.position.set(-1.5, 1.95, Z1 + 0.02); scene.add(s1.group);
  const sconces = new CandleSet(scene, worldPoints(s1.group, s1.cups), { intensity: 2.2, distance: 8, height: 0.11 });

  // libreria a sinistra, mobile a destra
  wall(3.6, 2.6, new THREE.MeshStandardMaterial({ map: T.booksTex([1.5, 1]), roughness: 0.9 }), -HW + 0.03, 1.3, -3.6, Math.PI / 2);
  scene.add(box(0.2, 2.7, 3.8, A.wood, -HW + 0.02, 1.35, -3.6));
  scene.add(box(0.5, 1.0, 1.4, A.woodPanel, HW - 0.27, 0.5, -5.4));

  // scritta nascosta: si legge bene solo con la torcia
  const msg = wall(2.6, 1.3, new THREE.MeshStandardMaterial({
    map: T.textTex(['Chi lascia parole', 'non se ne va', 'mai del tutto.'], { w: 512, h: 256, color: '#e8d8b0', font: 'italic 40px Georgia, serif', lineH: 58 }),
    transparent: true, opacity: 0.5, roughness: 1, depthWrite: false,
  }), HW - 0.02, 1.9, -2.6, -Math.PI / 2);

  let typing = null;
  const update = (dt, t, wind) => {
    candles.update(dt, t, wind);
    sconces.update(dt, t, 0);
    if (typing) {
      typing.t += dt;
      const n = Math.min(typing.text.length, Math.floor(typing.t / 0.16));
      if (n !== typing.n) {
        typing.n = n;
        drawTyped(typing.text.slice(0, n));
        const ch = typing.text[n - 1];
        if (ch && ch !== ' ' && ch !== '\n') typing.onKey?.();
        if (n >= typing.text.length) { const done = typing.onDone; typing = null; done?.(); }
      }
    }
  };

  return {
    scene, update, candles, msg,
    exposure: 1.0,
    home: new THREE.Vector3(0, 1.6, -0.3),
    homeLook: new THREE.Vector3(0, 1.1, DZ),
    candlePos: candles.center.clone(),
    candleView: new THREE.Vector3(-0.5, 1.32, DZ + 1.0),
    paperPos: new THREE.Vector3(-0.12, DT + 0.03, DZ + 0.2),
    paperView: new THREE.Vector3(-0.05, 1.5, DZ + 0.95),
    backDoor: new THREE.Vector3(0, 1.4, Z0 - 0.1),
    /** Mostra sul foglio 3D il disegno fatto con il dito */
    setMessage(inkCanvas) {
      const g = paperCanvas.getContext('2d');
      g.drawImage(paperBase, 0, 0);
      if (inkCanvas) g.drawImage(inkCanvas, 0, 0, paperCanvas.width, paperCanvas.height);
      paperTex.needsUpdate = true;
    },
    typeReply(text, onKey, onDone) { typing = { text, t: -1.4, n: 0, onKey, onDone }; },
  };
}
