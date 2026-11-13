// Scena 1 — Esterno della villa al tramonto
import * as THREE from 'three';
import * as T from './textures.js';
import { assets, box, cyl, lathe, glowSprite } from './props.js';

export function buildExterior() {
  const A = assets();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x5a3022, 0.01);
  const rand = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  // --- cielo e sole ---
  const sunU = 0.842;
  const phi = sunU * Math.PI * 2;
  const sunDir = new THREE.Vector3(-Math.cos(phi), 0.075, Math.sin(phi)).normalize();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.MeshBasicMaterial({ map: T.skyTex(sunU), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);
  const sun = glowSprite(0xffe090, 26, 1);
  sun.position.copy(sunDir).multiplyScalar(200);
  scene.add(sun);
  const sunHalo = glowSprite(0xff6a20, 110, 0.55);
  sunHalo.position.copy(sun.position);
  scene.add(sunHalo);

  scene.add(new THREE.HemisphereLight(0xffc0a0, 0x3a2a20, 1.25));
  const sunL = new THREE.DirectionalLight(0xff7a30, 2.2);
  sunL.position.copy(sunDir).multiplyScalar(50).add(new THREE.Vector3(0, 8, 0));
  scene.add(sunL);
  const fill = new THREE.DirectionalLight(0xffc8a0, 0.9);
  fill.position.set(-6, 6, 20);
  scene.add(fill);

  // --- terreno ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: T.groundTex([70, 70]), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const drive = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ map: T.groundTex([5, 9], true), roughness: 1 }));
  drive.rotation.x = -Math.PI / 2;
  drive.scale.set(7, 15, 1);
  drive.position.set(-1.5, 0.02, 9);
  scene.add(drive);
  const hillMat = new THREE.MeshBasicMaterial({ color: 0x24121a });
  for (const [x, z, sx, sy] of [[-90, -160, 90, 9], [-10, -190, 120, 14], [-170, -70, 80, 9], [120, -150, 100, 22], [-150, 40, 70, 12]]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), hillMat);
    h.scale.set(sx, sy, sx * 0.6);
    h.position.set(x, -4, z);
    scene.add(h);
  }

  // --- villa ---
  const stone = new THREE.MeshStandardMaterial({ map: T.stoneTex([4, 3]), roughness: 0.95 });
  const stoneTrim = new THREE.MeshStandardMaterial({ color: 0x8a7458, roughness: 0.9 });
  const body = box(14, 10, 9, stone, 0, 5, -4.5);
  scene.add(body);
  const wing = box(6, 4.6, 6, new THREE.MeshStandardMaterial({ map: T.stoneTex([2, 1.5]), roughness: 0.95 }), 10, 2.3, -4.2);
  scene.add(wing);
  scene.add(box(6.3, 0.2, 6.3, stoneTrim, 10, 4.7, -4.2));
  const wingDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ color: 0x0c0806 }));
  wingDoor.position.set(10.2, 1.2, -1.18);
  scene.add(wingDoor);

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a4a30, roughness: 0.9, flatShading: true });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1.7, 4, 1), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(15.4 / Math.SQRT2, 1, 10.4 / Math.SQRT2);
  roof.position.set(0, 10.95, -4.5);
  scene.add(roof);
  scene.add(box(15, 0.16, 10, stoneTrim, 0, 10.05, -4.5));
  scene.add(box(0.7, 1.6, 0.7, stone, 3.5, 11.5, -5));
  scene.add(box(0.6, 1.3, 0.6, stone, -3.8, 11.3, -6));

  // finestre
  const litWin = new THREE.MeshBasicMaterial({ map: T.windowTex(true), fog: true });
  const darkWin = new THREE.MeshBasicMaterial({ map: T.windowTex(false) });
  const shutter = new THREE.MeshStandardMaterial({ color: 0x1c2a22, roughness: 0.8 });
  const D0 = 0.54; // quota del pavimento d'ingresso (sopra i gradini)
  const addWindow = (x, y, w, h, lit) => {
    scene.add(box(w + 0.3, h + 0.3, 0.1, stoneTrim, x, y, 0.02));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit ? litWin : darkWin);
    p.position.set(x, y, 0.08);
    scene.add(p);
    for (const s of [-1, 1]) {
      const sh = box(w / 2, h, 0.05, shutter, x + s * (w / 2 + w / 4 + 0.04), y, 0.1);
      sh.rotation.y = -s * 0.25;
      scene.add(sh);
    }
    if (lit) { const g = glowSprite(0xff8a2a, h * 2.2, 0.35); g.position.set(x, y, 0.4); scene.add(g); }
  };
  const cols = [-5.2, -2.6, 2.6, 5.2];
  cols.forEach((x, i) => addWindow(x, 2.3 + D0 * 0.5, 1.0, 1.9, i !== 0));
  [-5.2, -2.6, 0, 2.6, 5.2].forEach((x, i) => addWindow(x, 5.9, 0.95, x === 0 ? 2.1 : 1.7, i === 1 || i === 2 || i === 4));
  [-5.2, -2.6, 0, 2.6, 5.2].forEach((x, i) => addWindow(x, 8.6, 0.85, 1.2, i === 3));

  // portone ad arco
  const glimpse = new THREE.MeshBasicMaterial({ map: T.doorGlimpseTex() });
  const doorRect = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.0), glimpse);
  doorRect.position.set(0, D0 + 1.5, 0.03);
  scene.add(doorRect);
  const doorArch = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0c06 }));
  doorArch.position.set(0, D0 + 3.0, 0.03);
  scene.add(doorArch);
  for (const s of [-1, 1]) {
    scene.add(box(0.4, 3.0, 0.35, stoneTrim, s * 1.12, D0 + 1.5, 0.12));
    scene.add(box(0.52, 0.16, 0.45, stoneTrim, s * 1.12, D0 + 3.0, 0.14));
    scene.add(box(0.52, 0.3, 0.45, stoneTrim, s * 1.12, D0 + 0.15, 0.14));
    // battenti aperti
    const leaf = box(0.86, 2.95, 0.07, A.woodPanel, s * 0.86, D0 + 1.48, 0.42);
    leaf.rotation.y = s * 1.25;
    scene.add(leaf);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.2, 6, 18, Math.PI), stoneTrim);
  arch.position.set(0, D0 + 3.05, 0.1);
  scene.add(arch);
  scene.add(box(0.36, 0.5, 0.4, stoneTrim, 0, D0 + 4.2, 0.14));
  const doorGlow = glowSprite(0xff8a30, 5, 0.4);
  doorGlow.position.set(0, D0 + 1.4, 0.6);
  scene.add(doorGlow);

  // gradini
  scene.add(box(4.6, 0.18, 1.9, stoneTrim, 0, 0.09, 0.95));
  scene.add(box(4.0, 0.18, 1.5, stoneTrim, 0, 0.27, 0.75));
  scene.add(box(3.4, 0.18, 1.1, stoneTrim, 0, 0.45, 0.55));

  // balcone
  const iron = new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.6, metalness: 0.5 });
  scene.add(box(3.6, 0.16, 1.0, stoneTrim, 0, 4.78, 0.5));
  for (const x of [-1.4, 1.4]) scene.add(box(0.25, 0.5, 0.7, stoneTrim, x, 4.46, 0.35));
  scene.add(box(3.6, 0.05, 0.05, iron, 0, 5.75, 0.97));
  for (let i = 0; i <= 14; i++) scene.add(box(0.03, 0.9, 0.03, iron, -1.75 + i * 0.25, 5.3, 0.97));
  for (const x of [-1.78, 1.78]) { scene.add(box(0.05, 0.05, 0.95, iron, x, 5.75, 0.5)); }

  // lanterna
  const lantern = new THREE.Group();
  lantern.add(cyl(0.01, 0.01, 0.5, iron, 0, 0.45, 0, 4));
  lantern.add(box(0.26, 0.04, 0.26, iron, 0, 0.2, 0));
  lantern.add(box(0.2, 0.36, 0.2, new THREE.MeshBasicMaterial({ color: 0xffb040 }), 0, 0, 0));
  lantern.add(box(0.26, 0.04, 0.26, iron, 0, -0.2, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lantern.add(box(0.025, 0.4, 0.025, iron, x * 0.115, 0, z * 0.115));
  lantern.position.set(0, 4.0, 0.75);
  scene.add(lantern);
  const lg = glowSprite(0xffa040, 2.4, 0.9);
  lg.position.copy(lantern.position);
  scene.add(lg);
  const lanternLight = new THREE.PointLight(0xffa040, 30, 16, 2);
  lanternLight.position.set(0, 3.8, 1.2);
  scene.add(lanternLight);
  const side = sideLantern(iron);
  side.position.set(-2.2, 2.9, 0.25);
  scene.add(side);
  const sg = glowSprite(0xffa040, 1.2, 0.7); sg.position.copy(side.position); scene.add(sg);

  // vasi di terracotta
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x24301c, roughness: 1, flatShading: true });
  const bushRed = new THREE.MeshStandardMaterial({ color: 0x5a1c14, roughness: 1, flatShading: true });
  const pot = (x, z, s, y = 0, red = false) => {
    const p = lathe([[0, 0], [0.22, 0], [0.34, 0.2], [0.4, 0.45], [0.33, 0.66], [0.27, 0.72], [0.31, 0.78], [0, 0.78]], A.terracotta, 12);
    p.scale.setScalar(s); p.position.set(x, y, z); scene.add(p);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 1), red ? bushRed : bushMat);
    b.position.set(x, y + 1.0 * s, z); b.scale.y = 0.8; scene.add(b);
  };
  for (const s of [-1, 1]) {
    scene.add(box(0.7, 0.9, 0.7, stoneTrim, s * 2.75, 0.45, 1.3));
    pot(s * 2.75, 1.3, 0.9, 0.9, s > 0);
  }
  pot(-1.9, 2.6, 1.15); pot(-3.4, 2.9, 0.8, 0, true); pot(4.6, 2.4, 1.3); pot(6.2, 1.2, 0.9); pot(-5.6, 1.3, 1.0);

  // cespugli alla base
  for (let i = 0; i < 14; i++) {
    const x = -6.8 + rand() * 13.6;
    if (Math.abs(x) < 2.6) continue;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + rand() * 0.5, 1), rand() < 0.3 ? bushRed : bushMat);
    b.position.set(x, 0.4, 0.5 + rand() * 0.5); b.scale.y = 0.8; scene.add(b);
  }

  // edera rossa sulla facciata
  const ivyMats = [0x8a1a10, 0xa82c14, 0x6a1410, 0x7a3a14].map((c) => new THREE.MeshStandardMaterial({ map: A.leaf, color: c, alphaTest: 0.35, roughness: 1 }));
  const ivy = (cx, cy, w, h, n) => {
    for (let i = 0; i < n; i++) {
      const s = 1.2 + rand() * 1.6;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 1.2), ivyMats[(rand() * ivyMats.length) | 0]);
      p.position.set(cx + (rand() - 0.5) * w, cy + (rand() - 0.5) * h, 0.14 + rand() * 0.1);
      p.rotation.z = rand() * 6;
      scene.add(p);
    }
  };
  ivy(3.9, 3.6, 1.8, 7, 16);
  ivy(1.5, 7.3, 2.4, 1.4, 6);
  ivy(-3.9, 5.6, 1.6, 5, 10);
  ivy(-1.6, 3.2, 0.9, 2.6, 5);
  ivy(6.5, 5, 0.9, 6, 7);

  // muretto in primo piano
  const wallMat = new THREE.MeshStandardMaterial({ map: T.stoneTex([2, 0.4]), roughness: 1 });
  scene.add(box(7, 0.95, 0.8, wallMat, -11.5, 0.47, 11));
  scene.add(box(0.8, 0.95, 5, wallMat, -8.4, 0.47, 8.9));
  scene.add(box(1.1, 1.25, 1.1, wallMat, -8.4, 0.62, 11));
  pot(-8.4, 11, 0.8, 1.25);

  // cipressi
  const cyMat = new THREE.MeshStandardMaterial({ color: 0x1c2a18, roughness: 1, flatShading: true });
  for (const [x, z, h, r] of [[-9.6, 3, 12, 1.25], [-14.5, -1.5, 14.5, 1.6], [-8.6, -5, 10, 1.1], [-18, 5, 9, 1.2], [-21, -6, 13, 1.5]]) {
    const geo = new THREE.ConeGeometry(r, h, 7, 5);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (0.85 + rand() * 0.3));
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, cyMat);
    c.position.set(x, h / 2 + 0.3, z);
    scene.add(c);
  }

  // alberi d'autunno: tronco + chiome a sprite
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c120c, roughness: 1 });
  const leafTexes = [A.leaf, T.leafClusterTex(2), T.leafClusterTex(3)];
  const tree = (x, z, h, lean, palette, n, radius) => {
    const tr = cyl(0.22, 0.42, h, trunkMat, x + lean * h * 0.25, h / 2, z, 7);
    tr.rotation.z = -lean * 0.5;
    scene.add(tr);
    const top = new THREE.Vector3(x + lean * h * 0.5, h, z);
    for (let i = 0; i < 4; i++) {
      const br = cyl(0.05, 0.13, 3.2, trunkMat, top.x + (rand() - 0.5) * 2.4, h + 0.6, top.z + (rand() - 0.5) * 2.4, 5);
      br.rotation.set((rand() - 0.5) * 1.6, 0, (rand() - 0.5) * 1.6);
      scene.add(br);
    }
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: leafTexes[i % 3], color: palette[(rand() * palette.length) | 0], alphaTest: 0.3, rotation: rand() * 6 });
      const s = new THREE.Sprite(m);
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * radius;
      s.position.set(top.x + Math.cos(a) * d, h + 0.5 + rand() * radius * 0.55 - d * 0.18, top.z + Math.sin(a) * d);
      s.scale.setScalar(3 + rand() * 2.6);
      scene.add(s);
    }
  };
  const yellow = [0xd8901c, 0xe8a82c, 0xb86a14, 0xc87a18, 0x8a4a10];
  const red = [0x8e1a10, 0xb02a14, 0x6a1010, 0xa0200e, 0x4a0c0a];
  tree(-10.5, 14.5, 7.5, 0.5, yellow, 22, 6.5);
  tree(-15, 9, 8, 0.2, yellow, 14, 5);
  tree(5.5, 14, 7, -0.4, red, 22, 6.5);
  tree(12, 6, 6.5, -0.2, red, 14, 5);
  tree(-6, 26, 8, 0.1, yellow, 12, 5);
  tree(8, 25, 8, 0, red, 10, 5);
  tree(17, -8, 9, 0, [0x3a2414, 0x5a2a12, 0x2a1a10], 10, 6);
  tree(-24, 14, 8, 0, [0x7a4a14, 0x5a2a10, 0x9a5a18], 10, 6);

  // foglie che cadono
  const N = 110, lp = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) {
    lp[i * 3] = -14 + rand() * 28; lp[i * 3 + 1] = rand() * 9; lp[i * 3 + 2] = 1 + rand() * 14;
    seeds.push(rand() * 10);
  }
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const leaves = new THREE.Points(lgeo, new THREE.PointsMaterial({ color: 0xc8782a, size: 0.07, sizeAttenuation: true }));
  scene.add(leaves);

  const update = (dt, t) => {
    for (let i = 0; i < N; i++) {
      lp[i * 3 + 1] -= dt * (0.35 + (seeds[i] % 1) * 0.3);
      lp[i * 3] += Math.sin(t * 0.9 + seeds[i]) * dt * 0.5 + dt * 0.12;
      if (lp[i * 3 + 1] < 0) { lp[i * 3 + 1] = 8 + (seeds[i] % 2); lp[i * 3] = -14 + ((seeds[i] * 37) % 28); }
    }
    lgeo.attributes.position.needsUpdate = true;
    const f = 0.9 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 17.3);
    lanternLight.intensity = 30 * f;
    lg.material.opacity = 0.9 * f;
    sunHalo.material.opacity = 0.5 + 0.05 * Math.sin(t * 0.4);
  };

  return {
    scene, update,
    doorPos: new THREE.Vector3(0, D0 + 1.3, 0.4),
    far: { pos: new THREE.Vector3(-4, 1.65, 19), look: new THREE.Vector3(-2.5, 4.2, 0) },
    near: { pos: new THREE.Vector3(-1.6, 1.65, 6.8), look: new THREE.Vector3(0, 2.6, 0) },
    exposure: 1.0,
  };
}

function sideLantern(iron) {
  const g = new THREE.Group();
  g.add(box(0.16, 0.26, 0.16, new THREE.MeshBasicMaterial({ color: 0xffa838 })));
  g.add(box(0.2, 0.04, 0.2, iron, 0, 0.15, 0));
  g.add(box(0.2, 0.04, 0.2, iron, 0, -0.15, 0));
  return g;
}
