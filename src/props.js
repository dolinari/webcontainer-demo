// Oggetti riutilizzabili: candele, candelabri, mobili, busti, quadri.
import * as THREE from 'three';
import * as T from './textures.js';

let shared;
export function assets() {
  if (shared) return shared;
  const glow = T.glowTex(), flame = T.flameTex();
  shared = {
    glow, flame,
    wax: new THREE.MeshStandardMaterial({ color: 0xe8dcc0, emissive: 0x6a4a20, emissiveIntensity: 0.5, roughness: 0.6 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x4a3418, roughness: 0.45, metalness: 0.7 }),
    gold: new THREE.MeshStandardMaterial({ color: 0x9a6a22, roughness: 0.4, metalness: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ map: T.woodTex(), roughness: 0.55 }),
    woodPanel: new THREE.MeshStandardMaterial({ map: T.woodTex(null, true), roughness: 0.5 }),
    velvet: new THREE.MeshStandardMaterial({ color: 0x7a1414, roughness: 0.9 }),
    darkStone: new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.5, metalness: 0.2 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0x9a5a38, roughness: 0.85 }),
    leaf: T.leafClusterTex(1),
  };
  return shared;
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

export function lathe(profile, mat, seg = 14) {
  return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
}

export function glowSprite(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: assets().glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity, fog: false,
  }));
  s.scale.setScalar(size);
  return s;
}

/**
 * Un gruppo di candele con una sola luce puntiforme condivisa (economico su mobile).
 * Ogni candela può essere spenta (soffio) e riaccesa.
 */
export class CandleSet {
  constructor(parent, positions, { color = 0xff9a3c, intensity = 4, distance = 10, height = 0.2, lightOffset = 0.25 } = {}) {
    const A = assets();
    this.parent = parent;
    this.candles = [];
    this.base = intensity;
    this.smoke = [];
    const center = new THREE.Vector3();
    for (const p of positions) {
      const pos = p.clone ? p.clone() : new THREE.Vector3(...p);
      const wax = cyl(0.016, 0.018, height, A.wax, pos.x, pos.y + height / 2, pos.z, 8);
      parent.add(wax);
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.flame, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      flame.scale.set(0.05, 0.1, 1);
      flame.position.set(pos.x, pos.y + height + 0.045, pos.z);
      parent.add(flame);
      const halo = glowSprite(0xff8a30, 0.5, 0.5);
      halo.position.copy(flame.position);
      parent.add(halo);
      this.candles.push({ flame, halo, lit: true, k: 1, phase: Math.random() * 10, top: flame.position.clone() });
      center.add(flame.position);
    }
    center.multiplyScalar(1 / positions.length);
    this.center = center;
    this.light = new THREE.PointLight(color, intensity, distance, 2);
    this.light.position.copy(center).add(new THREE.Vector3(0, lightOffset, 0));
    parent.add(this.light);
  }

  get litCount() { return this.candles.filter((c) => c.lit).length; }

  /** Spegne la prossima candela accesa. Ritorna true se ne ha spenta una. */
  blowOne() {
    const c = this.candles.find((x) => x.lit);
    if (!c) return false;
    c.lit = false;
    const puff = glowSprite(0x8a8078, 0.12, 0.5);
    puff.material.blending = THREE.NormalBlending;
    puff.position.copy(c.top);
    this.parent.add(puff);
    this.smoke.push({ s: puff, t: 0 });
    return true;
  }

  relight() { for (const c of this.candles) c.lit = true; }

  /** wind 0..1: fa piegare le fiamme mentre si soffia */
  update(dt, t, wind = 0) {
    let sum = 0;
    for (const c of this.candles) {
      const target = c.lit ? 1 : 0;
      c.k += (target - c.k) * Math.min(1, dt * (c.lit ? 3 : 10));
      const fl = 0.86 + 0.1 * Math.sin(t * 11 + c.phase) + 0.07 * Math.sin(t * 23.7 + c.phase * 2) + (Math.random() - 0.5) * 0.06;
      const k = c.k * fl;
      c.flame.visible = c.k > 0.02;
      c.halo.visible = c.flame.visible;
      c.flame.scale.set(0.05 * (0.8 + 0.2 * k) * (1 + wind * 0.6), 0.1 * k * (1 - wind * 0.45), 1);
      c.flame.position.x = c.top.x + Math.sin(t * 7 + c.phase) * 0.003 + wind * 0.02 * Math.sin(t * 40 + c.phase);
      c.flame.material.rotation = wind * 0.7 * Math.sin(t * 31 + c.phase);
      c.halo.material.opacity = 0.5 * k;
      sum += k;
    }
    this.light.intensity = this.base * (sum / this.candles.length) * (1 - wind * 0.3);
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.t += dt;
      p.s.position.y += dt * 0.25;
      p.s.position.x += Math.sin(p.t * 5) * dt * 0.04;
      p.s.scale.setScalar(0.12 + p.t * 0.25);
      p.s.material.opacity = Math.max(0, 0.45 * (1 - p.t / 1.8));
      if (p.t > 1.8) { this.parent.remove(p.s); this.smoke.splice(i, 1); }
    }
  }
}

/** Candelabro da tavolo a n bracci. Ritorna il gruppo e le posizioni (mondo locale del parent) delle coppette. */
export function candelabra(n = 3, h = 0.42, spread = 0.13) {
  const A = assets(), g = new THREE.Group();
  const base = lathe([[0, 0], [0.085, 0], [0.09, 0.015], [0.05, 0.04], [0.022, 0.07], [0.03, 0.12], [0.016, 0.16], [0.016, h * 0.7], [0, h * 0.7]], A.bronze);
  g.add(base);
  const cups = [];
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
    const y = h - Math.abs(off) * 0.55;
    if (off !== 0) {
      const arm = cyl(0.008, 0.008, Math.hypot(off, y - h * 0.62), A.bronze, off / 2, (y + h * 0.62) / 2, 0, 6);
      arm.rotation.z = -Math.atan2(off, y - h * 0.62);
      g.add(arm);
    } else g.add(cyl(0.012, 0.014, h * 0.3, A.bronze, 0, h * 0.85, 0, 6));
    g.add(cyl(0.03, 0.014, 0.025, A.bronze, off, y, 0, 8));
    cups.push(new THREE.Vector3(off, y + 0.012, 0));
  }
  return { group: g, cups };
}

export function bust(mat, s = 1) {
  const g = new THREE.Group();
  const sh = lathe([[0, 0], [0.11, 0], [0.12, 0.03], [0.09, 0.06], [0.17, 0.14], [0.19, 0.22], [0.12, 0.3], [0.055, 0.34], [0.05, 0.4], [0, 0.4]], mat, 12);
  sh.scale.z = 0.62;
  g.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), mat);
  head.scale.set(0.82, 1.08, 0.95);
  head.position.y = 0.48;
  g.add(head);
  const nose = box(0.022, 0.05, 0.03, mat, 0, 0.47, 0.092);
  g.add(nose);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
  hair.position.set(0, 0.5, -0.012);
  g.add(hair);
  g.scale.setScalar(s);
  return g;
}

/** Quadro con cornice dorata, rivolto verso +z */
export function painting(tex, w, h) {
  const A = assets(), g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })));
  const f = 0.09;
  g.add(box(w + f * 2, f, 0.06, A.gold, 0, h / 2 + f / 2, 0));
  g.add(box(w + f * 2, f, 0.06, A.gold, 0, -h / 2 - f / 2, 0));
  g.add(box(f, h, 0.06, A.gold, -w / 2 - f / 2, 0, 0));
  g.add(box(f, h, 0.06, A.gold, w / 2 + f / 2, 0, 0));
  return g;
}

export function armchair() {
  const A = assets(), g = new THREE.Group();
  g.add(box(0.7, 0.2, 0.7, A.velvet, 0, 0.42, 0));
  g.add(box(0.74, 0.75, 0.16, A.velvet, 0, 0.85, -0.32));
  g.add(box(0.14, 0.3, 0.7, A.velvet, -0.4, 0.62, 0));
  g.add(box(0.14, 0.3, 0.7, A.velvet, 0.4, 0.62, 0));
  g.add(box(0.8, 0.05, 0.2, A.wood, 0, 1.25, -0.32));
  for (const [x, z] of [[-0.36, 0.3], [0.36, 0.3], [-0.36, -0.3], [0.36, -0.3]]) g.add(cyl(0.03, 0.02, 0.32, A.wood, x, 0.16, z, 6));
  return g;
}

export function stool() {
  const A = assets(), g = new THREE.Group();
  g.add(box(0.42, 0.08, 0.42, A.velvet, 0, 0.47, 0));
  g.add(box(0.44, 0.05, 0.44, A.wood, 0, 0.41, 0));
  for (const [x, z] of [[-0.18, 0.18], [0.18, 0.18], [-0.18, -0.18], [0.18, -0.18]]) g.add(cyl(0.025, 0.018, 0.4, A.wood, x, 0.2, z, 6));
  return g;
}

/** Ciuffo di fiori secchi / foglie fatto di piani incrociati illuminabili */
export function foliageCross(color, size) {
  const A = assets(), g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: A.leaf, color, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    p.rotation.y = (i * Math.PI) / 3;
    g.add(p);
  }
  return g;
}

export function urn(mat, s = 1) {
  const m = lathe([[0, 0], [0.09, 0], [0.07, 0.04], [0.05, 0.08], [0.14, 0.2], [0.17, 0.32], [0.13, 0.42], [0.09, 0.46], [0.12, 0.5], [0.1, 0.5]], mat);
  m.material.side = THREE.DoubleSide;
  m.scale.setScalar(s);
  return m;
}

/** Applique a muro con due candele: ritorna gruppo + posizioni delle coppette */
export function sconce() {
  const A = assets(), g = new THREE.Group();
  g.add(box(0.1, 0.22, 0.03, A.bronze, 0, 0, 0.015));
  const cups = [];
  for (const x of [-0.09, 0.09]) {
    const arm = cyl(0.008, 0.008, 0.16, A.bronze, x * 0.6, -0.02, 0.09, 6);
    arm.rotation.x = Math.PI / 2.6;
    g.add(arm);
    g.add(cyl(0.028, 0.014, 0.025, A.bronze, x, 0.03, 0.15, 8));
    cups.push(new THREE.Vector3(x, 0.042, 0.15));
  }
  return { group: g, cups };
}

export function worldPoints(group, pts) {
  group.updateMatrixWorld(true);
  return pts.map((p) => p.clone().applyMatrix4(group.matrixWorld));
}
