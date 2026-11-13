// La Villa al Tramonto — regia: scene, punti d'interesse, sensori, interfaccia.
import * as THREE from 'three';
import { buildExterior } from './exterior.js';
import { buildCorridor } from './corridor.js';
import { buildStudy } from './study.js';
import { LookControls } from './controls.js';
import { AudioEngine, PhysicalTorch } from './audio.js';
import { ringTex, parchmentCanvas } from './textures.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(pixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 600);
const controls = new LookControls(camera, canvas);
const audio = new AudioEngine();
const ledTorch = new PhysicalTorch();

// torcia virtuale: un faretto solidale con la camera, quindi segue il telefono
const torch = new THREE.SpotLight(0xfff0d8, 0, 26, 0.44, 0.75, 1.5);
torch.position.set(0.12, -0.12, 0);
torch.target.position.set(0, -0.02, -1);
camera.add(torch, torch.target);

const S = { exterior: buildExterior(), corridor: buildCorridor(), study: buildStudy() };
const TITLES = { exterior: 'La villa al tramonto', corridor: 'Il corridoio', study: 'Lo studio' };

const state = {
  scene: 'exterior',
  spot: 'far',        // esterno: far | near — corridoio: indice del punto di sosta
  focus: null,        // null | candle | music | paper
  torch: false,
  micOk: false,
  busy: false,
  started: false,
  listen: 0,
};
let move = null;
let cur = S.exterior;

// ---------- interfaccia ----------
const hintEl = $('hint'), panel = $('panel'), panelText = $('panel-text'), meter = $('meter'), meterBar = meter.firstElementChild;
let baseHint = '', toastTimer;
function setHint(t) { baseHint = t; hintEl.textContent = t; }
function toast(t, ms = 3600) {
  const el = $('toast');
  el.innerHTML = '';
  const s = document.createElement('span'); s.textContent = t; el.appendChild(s);
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}
function showPanel(text, { mic = false, listen = false } = {}) {
  panelText.textContent = text;
  meter.hidden = !mic;
  $('btn-listen').hidden = !listen;
  panel.hidden = false;
  document.body.classList.add('focus');
}
function hidePanel() { panel.hidden = true; document.body.classList.remove('focus'); }
function showTitle(name) {
  const el = $('scene-title');
  el.textContent = TITLES[name];
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 4200);
}
const lookWord = () => (controls.gyro ? 'Inclina e ruota il telefono' : 'Trascina con il dito');

// ---------- movimento ----------
function moveTo(pos, look, done, dur = 1.5) {
  move = { from: camera.position.clone(), to: pos.clone(), t: 0, dur, done };
  if (look) controls.aimAt(look, dur + 0.3);
}
const ease = (x) => x * x * (3 - 2 * x);

function swapScene(name, pos, look) {
  cur.scene.remove(camera);
  for (const m of markers) cur.scene.remove(m);
  state.scene = name;
  cur = S[name];
  cur.scene.add(camera);
  for (const m of markers) cur.scene.add(m);
  camera.position.copy(pos);
  controls.face(look);
  audio.setAmbience(name === 'exterior' ? 'ext' : 'int');
  applyTorch();
  showTitle(name);
}

function goScene(name, pos, look, after) {
  if (state.busy) return;
  state.busy = true;
  $('fade').classList.add('on');
  setTimeout(() => {
    move = null;
    swapScene(name, pos, look);
    after?.();
    $('fade').classList.remove('on');
    setTimeout(() => { state.busy = false; }, 500);
  }, 750);
}

// ---------- torcia ----------
function applyTorch() {
  torch.intensity = state.torch ? (state.scene === 'exterior' ? 90 : 55) : 0;
  renderer.toneMappingExposure = cur.exposure * (state.torch ? 1.18 : 1);
  $('btn-torch').setAttribute('aria-pressed', String(state.torch));
}
let ledAsked = false;
$('btn-torch').addEventListener('click', async () => {
  state.torch = !state.torch;
  applyTorch();
  if (state.torch) {
    if (ledTorch.supportedGuess) {
      if (!ledAsked) { ledAsked = true; toast('Su Android provo ad accendere anche il LED: il browser chiede la fotocamera solo per questo.'); }
      const ok = await ledTorch.on();
      if (!state.torch) ledTorch.off();
      else if (ok && navigator.vibrate) navigator.vibrate(20);
    }
  } else ledTorch.off();
});
$('btn-center').addEventListener('click', () => {
  controls.recenter(defaultLook());
});
$('btn-sound').addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  $('btn-sound').setAttribute('aria-pressed', String(!audio.muted));
});

function defaultLook() {
  if (state.focus === 'candle') return cur.candlePos;
  if (state.focus === 'music') return cur.musicPos;
  if (state.scene === 'exterior') return S.exterior[state.spot].look;
  if (state.scene === 'corridor') return new THREE.Vector3(0, 1.5, camera.position.z - 6);
  return S.study.homeLook;
}

// ---------- punti d'interesse ----------
const markerTex = ringTex();
const markers = Array.from({ length: 8 }, () => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex, depthTest: false, depthWrite: false, transparent: true, fog: false }));
  s.renderOrder = 10;
  s.visible = false;
  return s;
});
const floorOf = (v) => new THREE.Vector3(v.x, 0.35, v.z);

function hotspots() {
  if (state.busy || move || !state.started) return [];
  const E = S.exterior, C = S.corridor, D = S.study, list = [];
  if (state.scene === 'exterior') {
    if (state.spot === 'far') list.push({ pos: E.doorPos, label: 'Tocca il cerchio per avvicinarti all’ingresso', act: () => { state.spot = 'near'; moveTo(E.near.pos, E.near.look, () => setHint('La porta è aperta. Tocca il cerchio per entrare.'), 3.2); } });
    else {
      list.push({ pos: E.doorPos, label: 'Entra nella villa', act: enterCorridorFromOutside });
      list.push({ pos: floorOf(E.far.pos), label: 'Torna sul viale', act: () => { state.spot = 'far'; moveTo(E.far.pos, null, null, 3.2); } });
    }
  } else if (state.scene === 'corridor') {
    if (state.focus === 'candle') candleTapSpot(list, C);
    else if (!state.focus) {
      C.waypoints.forEach((w, i) => { if (i !== state.spot) list.push({ pos: floorOf(w), label: 'Cammina fin qui', act: () => { state.spot = i; moveTo(w, null, null, 1.2 + Math.abs(w.z - camera.position.z) * 0.14); } }); });
      list.push({ pos: C.candlePos, label: 'Il candelabro — avvicinati', act: () => focusCandle(C) });
      list.push({ pos: C.musicPos, label: 'Un carillon — avvicinati', act: focusMusic });
      list.push({ pos: C.endDoor, label: 'La stanza in fondo', act: () => { moveTo(new THREE.Vector3(0, 1.6, -13.6), C.endDoor, null, 1.4); goScene('study', D.home, D.homeLook, () => { state.spot = 0; setHint('È più buio, qui. La torcia può aiutare.'); }); } });
      list.push({ pos: C.exitDoor, label: 'Esci nel giardino', act: () => goScene('exterior', E.near.pos, new THREE.Vector3(-4, 3, 30), () => { state.spot = 'near'; setHint('L’aria della sera. La porta è alle tue spalle.'); }) });
    }
  } else {
    if (state.focus === 'candle') candleTapSpot(list, D);
    else if (!state.focus) {
      list.push({ pos: D.candlePos, label: 'Le candele sulla scrivania', act: () => focusCandle(D) });
      list.push({ pos: D.paperPos, label: hasInk ? 'Il tuo messaggio — riscrivilo' : 'Un foglio bianco — scrivi', act: focusPaper });
      list.push({ pos: D.backDoor, label: 'Torna nel corridoio', act: () => goScene('corridor', S.corridor.waypoints[2], new THREE.Vector3(0, 1.5, 0), () => { state.spot = 2; setHint('Il corridoio. ' + lookWord() + ' per guardarti intorno.'); }) });
    }
  }
  return list;
}

function candleTapSpot(list, sc) {
  const lit = sc.candles.litCount;
  if (lit === 0) list.push({ pos: sc.candlePos, label: 'Tocca per riaccendere', act: () => { sc.candles.relight(); audio.click('puff'); candlePanel(sc); } });
  else if (!state.micOk) list.push({ pos: sc.candlePos, label: 'Tocca per spegnere', act: () => blow(sc) });
}

function enterCorridorFromOutside() {
  const E = S.exterior, C = S.corridor;
  moveTo(new THREE.Vector3(0, 1.9, 1.6), E.doorPos, null, 1.6);
  goScene('corridor', C.waypoints[0], new THREE.Vector3(0, 1.6, -8), () => {
    state.spot = 0;
    setHint(lookWord() + ' per guardarti intorno. I cerchi luminosi indicano cosa puoi fare.');
  });
}

// ---------- candele + microfono ----------
function candlePanel(sc) {
  const lit = sc.candles.litCount;
  if (lit === 0) showPanel('Buio. Resta solo un filo di fumo. Tocca le candele per riaccenderle.', { mic: false });
  else if (state.micOk) showPanel(lit === sc.candles.candles.length ? 'Soffia sul microfono del telefono per spegnere una candela.' : 'Ancora: soffia per spegnere la prossima.', { mic: true });
  else showPanel('Microfono non disponibile: tocca le fiamme per spegnerle.', { mic: false });
}
async function focusCandle(sc) {
  state.focus = 'candle';
  const micPromise = audio.startMic(); // avviato dentro il tap: il browser mostra qui la richiesta di permesso
  moveTo(sc.candleView, sc.candlePos, null, 1.6);
  showPanel('Mi avvicino alle candele…');
  state.micOk = await micPromise;
  if (state.focus === 'candle') candlePanel(sc); else audio.stopMic();
}
function blow(sc) {
  if (sc.candles.blowOne()) {
    audio.click('puff');
    if (navigator.vibrate) navigator.vibrate(15);
    candlePanel(sc);
  }
}

// ---------- carillon ----------
let listenHold = false, earTime = 0;
function focusMusic() {
  const C = S.corridor;
  state.focus = 'music';
  moveTo(C.musicView, C.musicPos, () => {
    audio.startMusicBox();
    C.setPlaying(true);
  }, 1.8);
  showPanel(controls.gyro
    ? 'Il carillon suona piano. Porta il telefono all’orecchio per sentirlo meglio, oppure tieni premuto il pulsante.'
    : 'Il carillon suona piano. Tieni premuto il pulsante per avvicinare l’orecchio.', { listen: true });
}
const btnListen = $('btn-listen');
const hold = (v) => (e) => { e.preventDefault(); listenHold = v; };
btnListen.addEventListener('pointerdown', hold(true));
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btnListen.addEventListener(ev, hold(false));
btnListen.addEventListener('contextmenu', (e) => e.preventDefault());

function updateListening(dt) {
  if (state.focus !== 'music') return;
  earTime = controls.earPose() ? earTime + dt : 0;
  const want = listenHold || earTime > 0.35 ? 1 : 0;
  if (want !== state.listen) {
    state.listen = want;
    audio.setListen(want);
    document.body.classList.toggle('listening', !!want);
    btnListen.classList.toggle('on', !!want);
    btnListen.textContent = want ? 'In ascolto…' : 'Tieni premuto per ascoltare';
    if (want && navigator.vibrate) navigator.vibrate(12);
  }
}

// ---------- foglio ----------
const paperEl = $('paper'), pg = paperEl.getContext('2d');
const inkCanvas = document.createElement('canvas');
inkCanvas.width = 384; inkCanvas.height = 540;
const ink = inkCanvas.getContext('2d');
const parchment = parchmentCanvas(384, 540);
paperEl.width = 384; paperEl.height = 540;
let hasInk = false;
function redrawPaper() { pg.drawImage(parchment, 0, 0); pg.drawImage(inkCanvas, 0, 0); }
{
  let last = null;
  const pt = (e) => { const r = paperEl.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 384, y: ((e.clientY - r.top) / r.height) * 540 }; };
  ink.lineCap = ink.lineJoin = 'round';
  ink.strokeStyle = 'rgba(38,22,12,0.92)';
  paperEl.addEventListener('pointerdown', (e) => {
    e.preventDefault(); paperEl.setPointerCapture(e.pointerId);
    last = pt(e); hasInk = true;
    ink.fillStyle = ink.strokeStyle; ink.beginPath(); ink.arc(last.x, last.y, 1.6, 0, 7); ink.fill(); redrawPaper();
  });
  paperEl.addEventListener('pointermove', (e) => {
    if (!last) return;
    const p = pt(e), d = Math.hypot(p.x - last.x, p.y - last.y);
    ink.lineWidth = Math.max(1.6, 4.2 - d * 0.12); // tratto più sottile quando il dito corre
    ink.beginPath(); ink.moveTo(last.x, last.y); ink.lineTo(p.x, p.y); ink.stroke();
    last = p; redrawPaper();
  });
  const end = () => { last = null; };
  paperEl.addEventListener('pointerup', end); paperEl.addEventListener('pointercancel', end);
}
function focusPaper() {
  const D = S.study;
  state.focus = 'paper';
  moveTo(D.paperView, D.paperPos, () => { redrawPaper(); $('write').hidden = false; }, 1.5);
}
$('btn-clear').addEventListener('click', () => { ink.clearRect(0, 0, 384, 540); hasInk = false; redrawPaper(); });
$('btn-close').addEventListener('click', () => { $('write').hidden = true; leaveFocus(); });
$('btn-leave').addEventListener('click', () => {
  const D = S.study;
  $('write').hidden = true;
  if (!hasInk) { toast('Il foglio è rimasto bianco.'); leaveFocus(); return; }
  D.setMessage(inkCanvas);
  try { localStorage.setItem('villa-messaggio', inkCanvas.toDataURL('image/png')); } catch { /* spazio non disponibile: il messaggio resta solo per questa visita */ }
  leaveFocus();
  toast('Hai lasciato il tuo messaggio sulla scrivania.');
  D.typeReply('Ho letto.\nTorna quando\nvuoi.', () => audio.click('key'));
  setTimeout(() => setHint('La macchina da scrivere… ha battuto da sola?'), 2600);
});
try {
  const saved = localStorage.getItem('villa-messaggio');
  if (saved) {
    const img = new Image();
    img.onload = () => { ink.drawImage(img, 0, 0); hasInk = true; S.study.setMessage(inkCanvas); };
    img.src = saved;
  }
} catch { /* archiviazione bloccata */ }

// ---------- uscita dal primo piano ----------
function leaveFocus() {
  const was = state.focus;
  state.focus = null;
  hidePanel();
  if (was === 'candle') audio.stopMic();
  if (was === 'music') {
    audio.stopMusicBox(); audio.setListen(0); S.corridor.setPlaying(false);
    state.listen = 0; listenHold = false; document.body.classList.remove('listening');
    btnListen.classList.remove('on'); btnListen.textContent = 'Tieni premuto per ascoltare';
  }
  const home = state.scene === 'corridor' ? S.corridor.waypoints[state.spot] : S.study.home;
  moveTo(home, null, null, 1.3);
}
$('btn-back').addEventListener('click', leaveFocus);

// ---------- tocco sui punti d'interesse ----------
const v3 = new THREE.Vector3();
let activeSpots = [];
controls.onTap = (x, y) => {
  let best = null, bestD = 1e9;
  for (const h of activeSpots) {
    if (h.sx == null) continue;
    const d = Math.hypot(h.sx - x, h.sy - y);
    if (d < Math.max(46, h.sr * 1.4) && d < bestD) { best = h; bestD = d; }
  }
  if (best) best.act();
};

function updateMarkers(t) {
  activeSpots = hotspots();
  const w = window.innerWidth, h = window.innerHeight;
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  let focusLabel = null, bestDot = 0.955;
  markers.forEach((m, i) => {
    const hs = activeSpots[i];
    if (!hs) { m.visible = false; return; }
    m.visible = true;
    m.position.copy(hs.pos);
    const dist = camera.position.distanceTo(hs.pos);
    const s = THREE.MathUtils.clamp(dist * 0.055, 0.07, 1.4) * (1 + 0.1 * Math.sin(t * 3 + i));
    m.scale.setScalar(s);
    m.material.opacity = 0.75 + 0.25 * Math.sin(t * 3 + i);
    v3.copy(hs.pos).project(camera);
    if (v3.z < 1) {
      hs.sx = (v3.x * 0.5 + 0.5) * w; hs.sy = (-v3.y * 0.5 + 0.5) * h;
      hs.sr = (s / dist) * h * 0.7;
      const dot = v3.copy(hs.pos).sub(camera.position).normalize().dot(fwd);
      if (dot > bestDot) { bestDot = dot; focusLabel = hs.label; }
    }
  });
  if (!state.focus) hintEl.textContent = focusLabel || baseHint;
}

// ---------- avvio ----------
$('btn-start').addEventListener('click', async () => {
  $('btn-start').disabled = true;
  audio.init();
  const gyro = await controls.enableGyro(); // su iOS la richiesta deve partire da questo tap
  audio.setAmbience('ext');
  $('start').classList.add('out');
  $('hud').hidden = false;
  $('btn-center').hidden = !gyro;
  state.started = true;
  controls.face(S.exterior.far.look);
  showTitle('exterior');
  setHint(lookWord() + ' per guardarti intorno. Tocca il cerchio luminoso sul portone.');
  if (!gyro && 'ontouchstart' in window) toast('Giroscopio non disponibile: trascina con il dito per guardarti intorno.', 4500);
  try { await navigator.wakeLock?.request('screen'); } catch { /* non essenziale */ }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ledTorch.off(); if (state.torch) { state.torch = false; applyTorch(); } }
  else if (state.started) { audio.ctx?.resume(); navigator.wakeLock?.request('screen').catch(() => {}); }
});

// ---------- ciclo di rendering ----------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 78 : 62;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();

cur.scene.add(camera);
for (const m of markers) cur.scene.add(m);
camera.position.copy(S.exterior.far.pos);
controls.face(S.exterior.far.look);
applyTorch();

const clock = new THREE.Clock();
let slow = 0, frames = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;

  if (move) {
    move.t += dt / move.dur;
    const k = ease(Math.min(1, move.t));
    camera.position.lerpVectors(move.from, move.to, k);
    camera.position.y += Math.sin(k * Math.PI * 6) * 0.012 * Math.sin(k * Math.PI); // passo leggero
    if (move.t >= 1) { const d = move.done; move = null; d?.(); }
  }
  controls.update(dt);

  let wind = 0;
  if (state.focus === 'candle' && audio.micOn) {
    if (audio.pollBlow(dt)) blow(cur);
    wind = Math.min(1, audio.blowAmount * 0.8);
    meterBar.style.width = Math.round(Math.min(1, audio.blowAmount) * 100) + '%';
  }
  updateListening(dt);
  cur.update(dt, t, wind);
  updateMarkers(t);
  renderer.render(cur.scene, camera);

  // se il telefono fatica, riduci la risoluzione
  if (state.started && ++frames > 30) {
    slow += dt > 0.034 ? 1 : -0.5;
    if (slow < 0) slow = 0;
    if (slow > 45 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.5); renderer.setPixelRatio(pixelRatio); resize(); slow = 0; }
  }
});

// accesso per test manuali da console
window.__villa = { S, state, controls, camera, goScene, audio, renderer };
