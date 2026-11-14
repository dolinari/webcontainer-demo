// La Villa al Tramonto — regia: scene, permessi, camminata, punti d'interesse, interfaccia.
import * as THREE from 'three';
import { buildExterior } from './exterior.js';
import { buildCorridor } from './corridor.js';
import { buildStudy } from './study.js';
import { LookControls } from './controls.js';
import { AudioEngine, PhysicalTorch } from './audio.js';
import { VoiceCommands } from './voice.js';
import { findObserved, describe } from './observe.js';
import { buildDining } from './dining.js';
import { Magnifier } from './magnifier.js';
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
const voice = new VoiceCommands();

// torcia virtuale: un faretto solidale con la camera, quindi segue il telefono
const torch = new THREE.SpotLight(0xfff0d8, 0, 26, 0.44, 0.75, 1.5);
torch.position.set(0.12, -0.12, 0);
torch.target.position.set(0, -0.02, -1);
camera.add(torch, torch.target);

const S = { exterior: buildExterior(), corridor: buildCorridor(), study: buildStudy(), dining: buildDining() };
const TITLES = { exterior: 'La villa al tramonto', corridor: 'Il corridoio', study: 'Lo studio', dining: 'La sala da pranzo' };
const magnifier = new Magnifier();
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* archiviazione bloccata */ } },
};

const state = {
  scene: 'exterior',
  focus: null,        // null | candle | music | paper
  home: null,         // dove tornare quando si esce da un primo piano
  torch: false,
  micOk: false,
  ledOk: false,
  gyro: false,
  busy: false,
  started: false,
  listen: 0,
  typed: false,       // la macchina da scrivere ha già risposto
  unlocked: store.get('villa-porta') === '1', // l'altro ingresso è aperto
  read: store.get('villa-letto') === '1',     // le righe nascoste sono state lette
  gramophone: true,
};
if (state.unlocked) S.exterior.setSideDoor(true);
let move = null;      // spostamento animato verso un punto
let walk = null;      // camminata libera (comando vocale)
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
const lookWord = () => (controls.gyro ? 'Muovi il telefono' : 'Trascina con il dito');
const walkWord = () => (voice.enabled ? 'Di’ «cammina» o «corri» per muoverti, «osserva» davanti a un oggetto.' : 'Tocca i cerchi luminosi per muoverti.');

// ---------- spostamenti animati ----------
function moveTo(pos, look, done, dur = 1.5) {
  walk = null;
  move = { from: camera.position.clone(), to: pos.clone(), t: 0, dur, done };
  if (look) controls.aimAt(look, dur + 0.3);
}
const ease = (x) => x * x * (3 - 2 * x);

function swapScene(name, pos, look) {
  hideObserve();
  cur.scene.remove(camera);
  for (const m of markers) cur.scene.remove(m);
  state.scene = name;
  cur = S[name];
  cur.scene.add(camera);
  for (const m of markers) cur.scene.add(m);
  camera.position.copy(pos);
  controls.face(look);
  audio.setAmbience(name === 'exterior' ? 'ext' : name === 'dining' ? 'dining' : 'int');
  if (name === 'dining' && state.gramophone) { audio.startGramophone(); S.dining.setPlaying(true); }
  if (name !== 'dining') { audio.stopGramophone(); S.dining.setPlaying(false); }
  applyTorch();
  showTitle(name);
}

function goScene(name, pos, look, after) {
  if (state.busy) return;
  state.busy = true;
  walk = null;
  $('fade').classList.add('on');
  setTimeout(() => {
    move = null;
    swapScene(name, pos, look);
    after?.();
    $('fade').classList.remove('on');
    setTimeout(() => { state.busy = false; }, 500);
  }, 750);
}

// passaggi tra le scene
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function enterCorridorFromOutside() {
  moveTo(V(0, 1.9, 1.6), S.exterior.doorPos, null, 1.6);
  goScene('corridor', S.corridor.waypoints[0], V(0, 1.6, -8), () => setHint(lookWord() + ' per guardarti intorno. ' + walkWord()));
}
function enterStudy() {
  moveTo(V(0, 1.6, -13.6), S.corridor.endDoor, null, 1.2);
  goScene('study', S.study.home, S.study.homeLook, () => setHint(voice.enabled ? 'È più buio, qui. Di’ «torcia» per accendere la luce.' : 'È più buio, qui. La torcia può aiutare.'));
}
function backToCorridor() {
  goScene('corridor', V(0, 1.6, -12.6), V(0, 1.5, 0), () => setHint('Il corridoio. La porta d’ingresso è in fondo.'));
}
function goOutside() {
  goScene('exterior', S.exterior.near.pos, V(-4, 3, 30), () => setHint('L’aria della sera. La porta è alle tue spalle.'));
}
function enterDining() {
  if (!state.unlocked) { toast('La porta è chiusa a chiave.', 2000); return; }
  moveTo(V(10.2, 1.65, 1.0), S.exterior.sideDoorPos, null, 1.4);
  goScene('dining', S.dining.entry, S.dining.entryLook, () => setHint('Il calore del camino, un valzer al grammofono. ' + (voice.enabled ? 'Di’ «osserva» davanti alle cose.' : 'Tocca i cerchi per muoverti.')));
}
function diningToOutside() {
  goScene('exterior', V(10.2, 1.65, 3.6), V(8, 2.5, 20), () => setHint('Sei di nuovo fuori. Il portone principale è più a sinistra.'));
}

// ---------- camminata libera (voce) ----------
// area calpestabile e porte di ogni scena
const WORLD = {
  exterior: {
    clamp(p) { p.x = THREE.MathUtils.clamp(p.x, -9, 11); p.z = THREE.MathUtils.clamp(p.z, Math.abs(p.x) < 1.3 || (p.x > 9.5 && p.x < 10.9) ? 2.6 : 3.4, 21); },
    door(p) {
      if (Math.abs(p.x) < 1.3 && p.z < 3.6) return enterCorridorFromOutside;
      if (p.x > 9.5 && p.x < 10.9 && p.z < 3.0) return enterDining;
      return null;
    },
  },
  corridor: {
    clamp(p) { p.x = THREE.MathUtils.clamp(p.x, -1.1, 1.1); p.z = THREE.MathUtils.clamp(p.z, -14.3, 2.6); },
    door(p) {
      if (p.z < -13.9 && Math.abs(p.x) < 0.75) return enterStudy;
      if (p.z > 2.4 && Math.abs(p.x) < 0.8) return goOutside;
      return null;
    },
  },
  dining: {
    // area irregolare (sala + passaggio + studiolo, senza la tavola): niente clamp, si controlla se il punto è calpestabile
    valid: (p) => S.dining.walkable(p),
    door(p) { return p.z > 2.5 && Math.abs(p.x) < 0.8 ? diningToOutside : null; },
  },
  study: {
    clamp(p) { p.x = THREE.MathUtils.clamp(p.x, -2.5, 2.5); p.z = THREE.MathUtils.clamp(p.z, Math.abs(p.x) < 1.4 ? -2.85 : -6.3, 0.85); },
    door(p) { return p.z > 0.75 && Math.abs(p.x) < 0.7 ? backToCorridor : null; },
  },
};
// «cammina» = due passi lenti; «corri» = tre falcate più lunghe e veloci
const GAIT = {
  walk: { stride: 0.72, steps: 2, speed: 1.25, bob: 0.035 },
  run: { stride: 0.95, steps: 3, speed: 3.1, bob: 0.07 },
};
function startWalk(dir, gait = 'walk') {
  if (!canMoveFreely()) return;
  if (state.focus) leaveFocus(true);
  const g = GAIT[gait];
  const add = g.stride * g.steps;
  if (walk && walk.dir === dir) {
    walk.left = Math.min(walk.left + add, add * 3);
    walk.g = g;
  } else walk = { dir, left: add, since: 0, g };
}
function canMoveFreely() { return state.started && !state.busy && $('write').hidden; }
const fwd = new THREE.Vector3(), nextPos = new THREE.Vector3();
function updateWalk(dt) {
  if (!walk) return;
  if (move || state.busy) { walk = null; return; }
  fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
  fwd.y = 0;
  if (fwd.lengthSq() < 1e-4) return;
  fwd.normalize().multiplyScalar(walk.dir);
  const g = walk.g;
  const d = Math.min(walk.left, dt * g.speed);
  nextPos.copy(camera.position).addScaledVector(fwd, d);
  const w = WORLD[state.scene];
  const door = w.door(nextPos);
  if (door) { walk = null; door(); return; }
  if (w.valid) {
    // scivola lungo gli ostacoli: prova il passo intero, poi solo x, poi solo z
    if (!w.valid(nextPos)) {
      const zOnly = V(camera.position.x, 0, nextPos.z), xOnly = V(nextPos.x, 0, camera.position.z);
      if (w.valid(xOnly)) nextPos.z = camera.position.z;
      else if (w.valid(zOnly)) nextPos.x = camera.position.x;
      else nextPos.copy(camera.position);
    }
  } else w.clamp(nextPos);
  const moved = nextPos.distanceTo(camera.position);
  camera.position.x = nextPos.x; camera.position.z = nextPos.z;
  walk.left -= d;
  walk.since += moved;
  if (walk.since > g.stride * 0.5) { walk.since -= g.stride; audio.click(g === GAIT.run ? 'run' : 'step'); }
  camera.position.y = 1.6 + Math.abs(Math.sin((walk.left / g.stride) * Math.PI)) * g.bob;
  if (walk.left <= 0 || moved < d * 0.25) {
    if (moved < d * 0.25) toast('Non si passa da qui.', 1600);
    walk = null;
    camera.position.y = 1.6;
  }
}

// ---------- torcia ----------
function applyTorch() {
  torch.intensity = state.torch ? (state.scene === 'exterior' ? 90 : 55) : 0;
  renderer.toneMappingExposure = cur.exposure * (state.torch ? 1.18 : 1);
  $('btn-torch').setAttribute('aria-pressed', String(state.torch));
}
async function setTorch(on) {
  if (state.torch === on) return;
  state.torch = on;
  applyTorch();
  if (on && state.ledOk) {
    const ok = await ledTorch.on();
    if (!state.torch) ledTorch.off();
    else if (ok && navigator.vibrate) navigator.vibrate(20);
  } else if (!on) ledTorch.off();
}
$('btn-torch').addEventListener('click', () => setTorch(!state.torch));
$('btn-center').addEventListener('click', () => controls.recenter(defaultLook()));
$('btn-sound').addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  $('btn-sound').setAttribute('aria-pressed', String(!audio.muted));
});
function defaultLook() {
  if (state.scene === 'dining') return V(camera.position.x, 1.4, camera.position.z - 6);
  if (state.focus === 'candle') return cur.candlePos;
  if (state.focus === 'music') return cur.musicPos;
  if (state.scene === 'exterior') return V(0, 3, 0);
  if (state.scene === 'corridor') return V(camera.position.x, 1.5, camera.position.z - 6);
  return S.study.homeLook;
}

// ---------- voce ----------
const chip = $('voice-chip'), chipText = chip.querySelector('span');
let chipTimer;
function showVoiceState() {
  const on = voice.enabled;
  $('btn-voice').hidden = !voice.supported || !state.micOk;
  // la torcia si comanda con la voce; il tasto resta solo se la voce non è disponibile
  $('btn-torch').hidden = on;
  $('btn-voice').setAttribute('aria-pressed', String(on));
  chip.hidden = !state.started || !on;
  chip.classList.toggle('paused', voice.paused || voice.state !== 'listening');
  if (!chip.classList.contains('heard')) chipText.textContent = voice.paused ? 'Voce in pausa' : 'Ti ascolto';
}
voice.onState = (s) => {
  if (s === 'denied' && state.started) toast('Il riconoscimento vocale è stato negato: puoi muoverti toccando i cerchi.', 4500);
  if (s === 'error' && state.started) toast('Il riconoscimento vocale si è interrotto (serve la connessione). Riattivalo con il pulsante Voce.', 4500);
  showVoiceState();
};
voice.onCommand = (cmd, word) => {
  if (!state.started) return;
  chip.classList.add('heard');
  chipText.textContent = '«' + word + '»';
  clearTimeout(chipTimer);
  chipTimer = setTimeout(() => { chip.classList.remove('heard'); showVoiceState(); }, 1200);
  switch (cmd) {
    case 'walk': startWalk(1); break;
    case 'run': startWalk(1, 'run'); break;
    case 'back': startWalk(-1); break;
    case 'stop': walk = null; camera.position.y = 1.6; break;
    case 'right': controls.turn(-Math.PI / 4); break;
    case 'left': controls.turn(Math.PI / 4); break;
    case 'torchOn': setTorch(true); break;
    case 'torchOff': setTorch(false); break;
    case 'observe': observe(); break;
    case 'help': toast('Comandi: «cammina», «corri», «indietro», «fermati», «destra», «sinistra», «osserva», «torcia», «spegni torcia», «entra».', 7000); break;
    case 'enter': {
      const d = activeSpots.filter((h) => h.door).sort((a, b) => camera.position.distanceTo(a.pos) - camera.position.distanceTo(b.pos))[0];
      if (d && camera.position.distanceTo(d.pos) < (state.scene === 'exterior' ? 9 : 4)) d.act();
      else toast('Nessuna porta qui vicino.', 1600);
      break;
    }
  }
};
$('btn-voice').addEventListener('click', async () => {
  if (voice.enabled) { voice.disable(); toast('Comandi vocali spenti.', 1800); }
  else {
    const ok = await voice.enable();
    toast(ok ? 'Comandi vocali accesi: di’ «cammina».' : 'Non riesco ad avviare il riconoscimento vocale.', 2500);
    if (ok && state.focus) voice.pause();
  }
  showVoiceState();
});

// ---------- osserva ----------
const obsEl = $('observe');
let obsTimer;
function observe() {
  if (state.focus || state.busy) return;
  const hit = findObserved(state.scene, camera);
  let title, text;
  if (!hit) { title = 'Niente di particolare'; text = 'Guarda verso un oggetto e avvicinati, poi di’ di nuovo «osserva».'; }
  else if (hit.far) { title = hit.item.name; text = 'È troppo lontano per vederlo bene. Avvicinati.'; }
  else { title = hit.item.name; text = describe(hit.item, { torch: state.torch, hasInk, typed: state.typed, unlocked: state.unlocked, read: state.read, gramophone: state.gramophone }); }
  obsEl.querySelector('b').textContent = title;
  obsEl.querySelector('p').textContent = text;
  obsEl.hidden = false;
  document.body.classList.add('observing');
  clearTimeout(obsTimer);
  obsTimer = setTimeout(hideObserve, Math.max(5000, text.split(' ').length * 380));
}
function hideObserve() { obsEl.hidden = true; document.body.classList.remove('observing'); }
obsEl.addEventListener('click', hideObserve);

// ---------- punti d'interesse ----------
const markerTex = ringTex();
const markers = Array.from({ length: 8 }, () => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex, depthTest: false, depthWrite: false, transparent: true, fog: false }));
  s.renderOrder = 10;
  s.visible = false;
  return s;
});
const floorOf = (v) => V(v.x, 0.35, v.z);

function hotspots() {
  if (state.busy || move || !state.started) return [];
  const E = S.exterior, C = S.corridor, D = S.study, list = [];
  const here = camera.position;
  if (state.scene === 'exterior') {
    if (here.z > 9) list.push({ pos: E.doorPos, door: true, label: 'Tocca il cerchio per avvicinarti all’ingresso', act: () => moveTo(E.near.pos, E.near.look, () => setHint('La porta è aperta. Tocca il cerchio o di’ «entra».'), 3.2) });
    else {
      list.push({ pos: E.doorPos, door: true, label: 'Entra nella villa', act: enterCorridorFromOutside });
      list.push({ pos: floorOf(E.far.pos), label: 'Torna sul viale', act: () => moveTo(E.far.pos, null, null, 3.2) });
    }
    if (state.unlocked) {
      const far = here.distanceTo(E.sideDoorPos) > 7;
      list.push({ pos: E.sideDoorPos, door: true, label: far ? 'L’altro ingresso — avvicinati' : 'Entra dall’altro ingresso', act: far ? () => moveTo(E.sideNear.pos, E.sideNear.look, null, 3) : enterDining });
    }
  } else if (state.scene === 'corridor') {
    if (state.focus === 'candle') candleTapSpot(list, C);
    else if (!state.focus) {
      C.waypoints.forEach((w) => { if (Math.hypot(w.x - here.x, w.z - here.z) > 1.6) list.push({ pos: floorOf(w), label: 'Cammina fin qui', act: () => moveTo(w, null, null, 1.2 + Math.abs(w.z - here.z) * 0.14) }); });
      list.push({ pos: C.candlePos, label: 'Il candelabro — avvicinati', act: () => focusCandle(C) });
      list.push({ pos: C.musicPos, label: 'Un carillon — avvicinati', act: focusMusic });
      list.push({ pos: C.endDoor, door: true, label: 'La stanza in fondo', act: enterStudy });
      list.push({ pos: C.exitDoor, door: true, label: 'Esci nel giardino', act: goOutside });
    }
  } else if (state.scene === 'dining') {
    const G = S.dining;
    if (!state.focus) {
      G.waypoints.forEach((w) => { if (Math.hypot(w.x - here.x, w.z - here.z) > 1.6) list.push({ pos: floorOf(w), label: 'Cammina fin qui', act: () => moveTo(w, null, null, 1.2 + w.distanceTo(here) * 0.18) }); });
      list.push({ pos: G.gramophonePos, label: state.gramophone ? 'Il grammofono — tocca per fermarlo' : 'Il grammofono — tocca per farlo suonare', act: toggleGramophone });
      if (here.z < -8.4) list.push({ pos: G.manuscriptPos, label: 'Il manoscritto — guarda con la lente', act: focusLens });
      list.push({ pos: G.exitDoor, door: true, label: 'Esci in giardino', act: diningToOutside });
    }
  } else {
    if (state.focus === 'candle') candleTapSpot(list, D);
    else if (!state.focus) {
      list.push({ pos: D.candlePos, label: 'Le candele sulla scrivania', act: () => focusCandle(D) });
      list.push({ pos: D.paperPos, label: hasInk ? 'Il tuo messaggio — riscrivilo' : 'Un foglio bianco — scrivi', act: focusPaper });
      list.push({ pos: D.backDoor, door: true, label: 'Torna nel corridoio', act: backToCorridor });
    }
  }
  return list;
}

function candleTapSpot(list, sc) {
  const lit = sc.candles.litCount;
  if (lit === 0) list.push({ pos: sc.candlePos, label: 'Tocca per riaccendere', act: () => { sc.candles.relight(); audio.click('puff'); candlePanel(sc); } });
  else if (!state.micOk) list.push({ pos: sc.candlePos, label: 'Tocca per spegnere', act: () => blow(sc) });
}

// entrata/uscita dai primi piani: la voce si mette in pausa, perché il microfono
// serve al soffio e il riconoscimento vocale abbasserebbe l'audio del carillon
function enterFocus(kind) {
  hideObserve();
  state.home = camera.position.clone();
  state.focus = kind;
  walk = null;
  voice.pause();
  showVoiceState();
}

// ---------- candele + microfono ----------
function candlePanel(sc) {
  const lit = sc.candles.litCount;
  if (lit === 0) showPanel('Buio. Resta solo un filo di fumo. Tocca le candele per riaccenderle.', { mic: false });
  else if (state.micOk) showPanel(lit === sc.candles.candles.length ? 'Soffia sul microfono del telefono per spegnere una candela.' : 'Ancora: soffia per spegnere la prossima.', { mic: true });
  else showPanel('Microfono non disponibile: tocca le fiamme per spegnerle.', { mic: false });
}
async function focusCandle(sc) {
  enterFocus('candle');
  const micPromise = audio.startMic();
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
  enterFocus('music');
  moveTo(C.musicView, C.musicPos, () => {
    audio.startMusicBox();
    C.setPlaying(true);
  }, 1.8);
  showPanel(controls.gyro
    ? 'Si sente appena. Porta il telefono all’orecchio, come in una telefonata, per ascoltarlo.'
    : 'Si sente appena. Tieni premuto il pulsante e avvicina il telefono all’orecchio.', { listen: true });
}
const btnListen = $('btn-listen');
const hold = (v) => (e) => { e.preventDefault(); listenHold = v; };
btnListen.addEventListener('pointerdown', hold(true));
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btnListen.addEventListener(ev, hold(false));
btnListen.addEventListener('contextmenu', (e) => e.preventDefault());

function updateListening(dt) {
  if (state.focus !== 'music') return;
  audio.tickRadio();
  earTime = controls.earPose() ? earTime + dt : 0;
  const want = listenHold || earTime > 0.35 ? 1 : 0;
  if (want !== state.listen) {
    state.listen = want;
    audio.setListen(want);
    document.body.classList.toggle('listening', !!want);
    btnListen.classList.toggle('on', !!want);
    btnListen.textContent = want ? 'In ascolto…' : 'Tieni premuto per ascoltare';
    if (want && navigator.vibrate) navigator.vibrate([12, 40, 12]);
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
  enterFocus('paper');
  moveTo(D.paperView, D.paperPos, () => { redrawPaper(); $('write').hidden = false; }, 1.5);
}
$('btn-clear').addEventListener('click', () => { ink.clearRect(0, 0, 384, 540); hasInk = false; redrawPaper(); });
$('btn-close').addEventListener('click', () => { $('write').hidden = true; leaveFocus(); });
$('btn-leave').addEventListener('click', () => {
  const D = S.study;
  $('write').hidden = true;
  if (!hasInk) { toast('Il foglio è rimasto bianco.'); leaveFocus(); return; }
  D.setMessage(inkCanvas);
  try { localStorage.setItem('villa-messaggio', inkCanvas.toDataURL('image/png')); } catch { /* il messaggio resta solo per questa visita */ }
  leaveFocus();
  toast('Hai lasciato il tuo messaggio sulla scrivania.');
  D.typeReply('Non è qui\nquello che\ncerchi.\nProva l’altro\ningresso.', () => audio.click('key'), unlockSideDoor);
  state.typed = true;
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

function unlockSideDoor() {
  if (!state.unlocked) {
    state.unlocked = true;
    store.set('villa-porta', '1');
    S.exterior.setSideDoor(true);
  }
  setHint('«Prova l’altro ingresso»… Fuori, sul lato destro della villa, una porta si è aperta.');
  toast('Da qualche parte, fuori, una porta si è aperta.', 4000);
}

// ---------- grammofono, lente, finale ----------
function toggleGramophone() {
  state.gramophone = !state.gramophone;
  if (state.gramophone) audio.startGramophone(); else audio.stopGramophone();
  S.dining.setPlaying(state.gramophone);
}
function focusLens() {
  const G = S.dining;
  enterFocus('lens');
  moveTo(G.manuscriptView, G.manuscriptPos, () => { if (state.focus === 'lens') magnifier.open(); }, 1.4);
}
magnifier.read = state.read;
magnifier.onRead = () => {
  state.read = true;
  store.set('villa-letto', '1');
  state.ending = true;
};
$('lens-close').addEventListener('click', () => leaveFocus());
function playEnding() {
  state.ending = false;
  state.gramophone = false;
  audio.stopGramophone();
  S.dining.setPlaying(false);
  setTimeout(() => {
    toast('Il grammofono si è fermato. Nel silenzio, dall’altra ala della casa, suona il carillon.', 7000);
    audio.distantMusicBox(24);
  }, 1500);
}

// ---------- uscita dal primo piano ----------
function leaveFocus(instant = false) {
  const was = state.focus;
  if (!was) return;
  state.focus = null;
  hidePanel();
  $('write').hidden = true;
  if (was === 'candle') audio.stopMic();
  if (was === 'lens') { magnifier.close(); if (state.ending) playEnding(); }
  if (was === 'music') {
    audio.stopMusicBox(); audio.setListen(0); S.corridor.setPlaying(false);
    state.listen = 0; listenHold = false; document.body.classList.remove('listening');
    btnListen.classList.remove('on'); btnListen.textContent = 'Tieni premuto per ascoltare';
  }
  voice.resume();
  showVoiceState();
  if (state.home) {
    if (instant) { move = null; camera.position.copy(state.home); }
    else moveTo(state.home, null, null, 1.3);
  }
}
$('btn-back').addEventListener('click', () => leaveFocus());

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
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
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
      const dot = v3.copy(hs.pos).sub(camera.position).normalize().dot(f);
      if (dot > bestDot) { bestDot = dot; focusLabel = hs.label; }
    }
  });
  if (!state.focus) hintEl.textContent = focusLabel || baseHint;
}

// ---------- permessi all'avvio ----------
// Un passo per tap: iOS accetta le richieste di permesso solo dentro un gesto dell'utente.
const isAndroid = /Android/i.test(navigator.userAgent);
const STEPS = [
  { k: 'motion', btn: 'Consenti il movimento', run: async () => { const p = controls.enableGyro(); audio.init(); state.gyro = await p; return state.gyro ? 'ok' : 'no'; } },
  { k: 'mic', btn: 'Consenti il microfono', run: async () => { audio.init(); state.micOk = await audio.askMicPermission(); return state.micOk ? 'ok' : 'no'; } },
  { k: 'voice', btn: 'Attiva i comandi vocali', skip: () => !voice.supported || !state.micOk, run: async () => (await voice.enable()) ? 'ok' : 'no' },
  { k: 'led', btn: 'Consenti la torcia del telefono', skip: () => !isAndroid || !ledTorch.supportedGuess, run: async () => { state.ledOk = await ledTorch.probe(); return state.ledOk ? 'ok' : 'virtual'; } },
];
const LABELS = { ok: 'attivo', no: 'non attivo', skip: 'saltato', na: 'non disponibile', virtual: 'solo virtuale', wait: '…' };
let stepIdx = -1;
function setRow(k, status) {
  const row = document.querySelector(`#perms [data-k="${k}"]`);
  row.dataset.s = status;
  row.querySelector('em').textContent = LABELS[status];
}
function nextStep() {
  stepIdx++;
  while (stepIdx < STEPS.length && STEPS[stepIdx].skip?.()) {
    const k = STEPS[stepIdx].k;
    setRow(k, k === 'led' ? 'virtual' : 'na');
    stepIdx++;
  }
  const btn = $('btn-start'), skip = $('btn-skip');
  if (stepIdx >= STEPS.length) { btn.textContent = 'Entra nella sera'; skip.hidden = true; }
  else { btn.textContent = STEPS[stepIdx].btn; skip.hidden = false; }
  btn.disabled = false;
}
$('btn-start').addEventListener('click', async () => {
  if (stepIdx < 0) { $('intro').hidden = true; $('perm-box').hidden = false; nextStep(); return; }
  if (stepIdx >= STEPS.length) { begin(); return; }
  const step = STEPS[stepIdx];
  $('btn-start').disabled = true;
  setRow(step.k, 'wait');
  let res = 'no';
  try { res = await step.run(); } catch { /* permesso negato o API assente */ }
  setRow(step.k, res);
  nextStep();
});
$('btn-skip').addEventListener('click', () => {
  if (stepIdx < 0 || stepIdx >= STEPS.length) return;
  setRow(STEPS[stepIdx].k, STEPS[stepIdx].k === 'led' ? 'virtual' : 'skip');
  nextStep();
});

async function begin() {
  audio.init();
  audio.setAmbience('ext');
  $('start').classList.add('out');
  $('hud').hidden = false;
  $('btn-center').hidden = !state.gyro;
  state.started = true;
  controls.face(S.exterior.far.look);
  showTitle('exterior');
  showVoiceState();
  setHint(lookWord() + ' per guardarti intorno. ' + (voice.enabled ? 'Di’ «cammina» o «corri» per avvicinarti alla villa.' : 'Tocca il cerchio luminoso sul portone.'));
  if (!state.gyro && 'ontouchstart' in window) toast('Movimento non attivo: trascina con il dito per guardarti intorno.', 4500);
  try { await navigator.wakeLock?.request('screen'); } catch { /* non essenziale */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ledTorch.off(); if (state.torch) { state.torch = false; applyTorch(); } }
  else if (state.started) {
    audio.ctx?.resume();
    navigator.wakeLock?.request('screen').catch(() => {});
    if (voice.enabled && !voice.paused) voice.resume();
  }
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
  updateWalk(dt);
  controls.update(dt);

  let wind = 0;
  if (state.focus === 'candle' && audio.micOn) {
    if (audio.pollBlow(dt)) blow(cur);
    wind = Math.min(1, audio.blowAmount * 0.8);
    meterBar.style.width = Math.round(Math.min(1, audio.blowAmount) * 100) + '%';
  }
  updateListening(dt);
  cur.update(dt, t, wind);
  if (state.scene === 'dining') {
    const G = S.dining;
    audio.setGramophoneLevel(THREE.MathUtils.clamp(1.15 - camera.position.distanceTo(G.gramophonePos) / 9, 0.15, 1));
    audio.tickFire(THREE.MathUtils.clamp(1 - camera.position.distanceTo(G.firePos) / 8, 0, 1));
  }
  updateMarkers(t);
  if (state.focus !== 'lens' || move) renderer.render(cur.scene, camera); // con la lente aperta la scena 3D è coperta

  // se il telefono fatica, riduci la risoluzione
  if (state.started && ++frames > 30) {
    slow += dt > 0.034 ? 1 : -0.5;
    if (slow < 0) slow = 0;
    if (slow > 45 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.5); renderer.setPixelRatio(pixelRatio); resize(); slow = 0; }
  }
});

// accesso per test manuali da console
window.__villa = { S, state, controls, camera, goScene, audio, voice, renderer, startWalk, leaveFocus, observe };
