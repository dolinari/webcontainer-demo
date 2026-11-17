// La Villa al Tramonto — regia: scene, permessi, camminata, punti d'interesse, interfaccia.
import * as THREE from 'three';
import { L, IS_EN, LANG, setLang, translatePage } from './i18n.js';
import { buildExterior } from './exterior.js';
import { buildCorridor } from './corridor.js';
import { buildStudy } from './study.js';
import { LookControls } from './controls.js';
import { AudioEngine, PhysicalTorch } from './audio.js';
import { VoiceCommands, IS_IOS, IOS_OTHER_BROWSER } from './voice.js';
import { findObserved, describe } from './observe.js';
import { buildDining } from './dining.js';
import { Magnifier } from './magnifier.js';
import { Scope } from './scope.js';
import { Novel, Shelf, Tome, START_ORDER } from './library.js';
import { Landscape, CODE, setCode, randomCode } from './landscape.js';
import { womanPhotoCanvas } from './textures.js';
import { ringTex, parchmentCanvas } from './textures.js';

const $ = (id) => document.getElementById(id);
translatePage();
// selettore della lingua nella schermata iniziale (cambiare lingua ricarica la pagina, i progressi restano)
document.querySelectorAll('#lang-switch button').forEach((b) => {
  b.setAttribute('aria-pressed', String(b.dataset.lang === LANG));
  b.addEventListener('click', () => setLang(b.dataset.lang));
});
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
const TITLES = { exterior: L('La villa al tramonto', 'The villa at sunset'), corridor: L('Il corridoio', 'The corridor'), study: L('Lo studio', 'The study'), dining: L('La sala da pranzo', 'The dining room') };
const magnifier = new Magnifier();
const scope = new Scope(controls, camera);   // il binocolo, con la fotocamera
const land = new Landscape(controls, camera); // il cannocchiale, con il paesaggio dipinto
const novel = new Novel(), shelf = new Shelf(), tome = new Tome(); // la biblioteca
// le versioni precedenti salvavano i progressi per sempre: si cancellano all'apertura
try { Object.keys(localStorage).filter((k) => k.startsWith('villa-')).forEach((k) => localStorage.removeItem(k)); } catch { /* archiviazione bloccata */ }
const store = {
  // i progressi valgono solo per questa scheda: riaprendo il link si riparte da zero,
  // mentre un ricaricamento accidentale della stessa scheda non fa perdere la partita
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* archiviazione bloccata */ } },
  clear() { try { Object.keys(sessionStorage).filter((k) => k.startsWith('villa-')).forEach((k) => sessionStorage.removeItem(k)); } catch { /* archiviazione bloccata */ } },
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
  scope: store.get('villa-cannocchiale') === '1', // il cannocchiale è stato scoperto
  coords: JSON.parse(store.get('villa-coordinate') || '[]'), // coordinate trovate nel paesaggio (0 = N, 1 = E, 2 = O)
  wardrobe: store.get('villa-armadio') === '1',   // l'armadio è aperto
  bino: store.get('villa-binocolo') === '1',       // il binocolo è stato scoperto
  library: store.get('villa-biblioteca') === '1',   // la biblioteca è aperta (dopo Livia)
  novelRead: store.get('villa-romanzo') === '1',    // il romanzo è stato sfogliato fino all'indovinello
  shelfSolved: store.get('villa-scaffale') === '1', // lo scaffale è stato aperto
};
if (state.unlocked) S.exterior.setSideDoor(true);
// chi aveva già letto il manoscritto con una versione precedente trova il cannocchiale pronto
if (state.read && !state.scope) { state.scope = true; store.set('villa-cannocchiale', '1'); }
if (state.scope) S.exterior.setObservatory(true);
if (state.wardrobe) S.corridor.setWardrobe(true, true);
if (state.bino) S.exterior.setBinocular(true);
if (state.library) S.corridor.setLibrary(true, true);
let shelfOrder = null;
try { shelfOrder = JSON.parse(store.get('villa-ordine')); } catch { /* nessun ordine salvato */ }
if (!Array.isArray(shelfOrder) || shelfOrder.length !== 8) shelfOrder = [...START_ORDER];
S.corridor.setShelf(shelfOrder);
shelf.solved = state.shelfSolved;
if (state.shelfSolved) S.corridor.openShelf(true);
// il codice del lucchetto cambia a ogni partita; resta uguale se si ricarica la stessa scheda
{
  let code = null;
  try { code = JSON.parse(store.get('villa-codice')); } catch { /* nessun codice salvato */ }
  if (!Array.isArray(code) || code.length !== 3) { code = randomCode(); store.set('villa-codice', JSON.stringify(code)); }
  setCode(code);
}
const codeDone = () => [0, 1, 2].every((i) => state.coords.includes(i));
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
const lookWord = () => (controls.gyro ? L('Muovi il telefono', 'Move your phone') : L('Trascina con il dito', 'Drag with your finger'));
const walkWord = () => (voice.enabled ? L('Di’ «cammina» o «corri» per muoverti, «osserva» davanti a un oggetto.', 'Say “walk” or “run” to move, “observe” in front of an object.') : L('Tocca i cerchi luminosi per muoverti.', 'Tap the glowing circles to move.'));

// ---------- spostamenti animati ----------
function moveTo(pos, look, done, dur = 1.5) {
  walk = null;
  move = { from: camera.position.clone(), to: pos.clone(), t: 0, dur, done };
  // passi a ritmo naturale (circa due al secondo), non legati alla velocità dello spostamento
  const dist = Math.hypot(pos.x - move.from.x, pos.z - move.from.z);
  move.steps = dist < 0.4 ? 0 : Math.max(1, Math.min(Math.round(dist / 0.7), Math.floor(dur / 0.45)));
  move.stepped = 0;
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
  audio.surface = name === 'exterior' ? 'leaves' : 'floor'; // foglie fuori, pavimento dentro
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
  goScene('corridor', S.corridor.waypoints[0], V(0, 1.6, -8), () => setHint(lookWord() + L(' per guardarti intorno. ', ' to look around. ') + walkWord()));
}
function enterStudy() {
  moveTo(V(0, 1.6, -13.6), S.corridor.endDoor, null, 1.2);
  goScene('study', S.study.home, S.study.homeLook, () => setHint(voice.enabled ? L('È più buio, qui. Di’ «torcia» per accendere la luce.', 'It’s darker here. Say “torch” to turn on the light.') : L('È più buio, qui. La torcia può aiutare.', 'It’s darker here. The torch can help.')));
}
function backToCorridor() {
  goScene('corridor', V(0, 1.6, -12.6), V(0, 1.5, 0), () => setHint(L('Il corridoio. La porta d’ingresso è in fondo.', 'The corridor. The front door is at the far end.')));
}
function goOutside() {
  goScene('exterior', S.exterior.near.pos, V(-4, 3, 30), () => setHint(L('L’aria della sera. La porta è alle tue spalle.', 'The evening air. The door is behind you.')));
}
function enterDining() {
  if (!state.unlocked) { toast(L('La porta è chiusa a chiave.', 'The door is locked.'), 2000); return; }
  moveTo(V(10.2, 1.65, 1.0), S.exterior.sideDoorPos, null, 1.4);
  goScene('dining', S.dining.entry, S.dining.entryLook, () => setHint(L('Il calore del camino, un valzer al grammofono. ', 'The warmth of the fire, a waltz on the gramophone. ') + (voice.enabled ? L('Di’ «osserva» davanti alle cose.', 'Say “observe” in front of things.') : L('Tocca i cerchi per muoverti.', 'Tap the circles to move.'))));
}
function diningToOutside() {
  goScene('exterior', V(10.2, 1.65, 3.6), V(8, 2.5, 20), () => setHint(L('Sei di nuovo fuori. Il portone principale è più a sinistra.', 'You are outside again. The main door is further left.')));
}

// ---------- camminata libera (voce) ----------
// area calpestabile e porte di ogni scena
const WORLD = {
  exterior: {
    clamp(p) { p.x = THREE.MathUtils.clamp(p.x, -9, 11); p.z = THREE.MathUtils.clamp(p.z, Math.abs(p.x) < 1.3 || (p.x > 9.5 && p.x < 10.9) ? 2.6 : 3.4, 23.8); },
    door(p) {
      if (Math.abs(p.x) < 1.3 && p.z < 3.6) return enterCorridorFromOutside;
      if (p.x > 9.5 && p.x < 10.9 && p.z < 3.0) return enterDining;
      return null;
    },
  },
  corridor: {
    clamp(p) {
      const C = THREE.MathUtils.clamp, here = camera.position;
      const inDoor = (z) => z < -2.5 && z > -4.5;
      if (state.library && (p.x > 1.9 || here.x > 1.9)) {
        // dentro la biblioteca; si esce solo dal vano della porta
        if (p.x < 1.95 && !inDoor(p.z)) p.x = 1.95;
        p.x = C(p.x, p.x < 1.95 ? 1.0 : 1.95, 5.6); p.z = C(p.z, -6.0, -1.0);
      } else if (state.library && p.x > 1.0 && inDoor(p.z)) {
        p.x = C(p.x, -1.1, 5.6); // nel vano della porta
      } else { p.x = C(p.x, -1.1, 1.1); p.z = C(p.z, -14.3, 2.6); }
    },
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
    if (moved < d * 0.25) toast(L('Non si passa da qui.', 'You can’t get through here.'), 1600);
    walk = null;
    camera.position.y = 1.6;
  }
}

// ---------- torcia ----------
function applyTorch() {
  torch.intensity = state.torch ? (state.scene === 'exterior' ? 90 : 55) : 0;
  renderer.toneMappingExposure = cur.exposure * (state.torch ? 1.18 : 1);
  // la scritta sul muro dello studio si rivela solo con la torcia
  S.study.msg.material.opacity = state.torch ? 0.6 : 0.08;
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
// tre modalità: telefono completo → solo inclinazione → solo dito
const MOTION = {
  full: { label: L('Movimento', 'Motion'), toast: L('Movimento completo: muovi e ruota il telefono per guardarti intorno.', 'Full motion: move and turn your phone to look around.') },
  tilt: { label: L('Inclina', 'Tilt'), toast: L('Solo inclinazione: alza e abbassa il telefono per guardare su e giù; per girarti trascina il dito o di’ «destra» / «sinistra».', 'Tilt only: raise and lower your phone to look up and down; to turn, drag your finger or say “right” / “left”.') },
  off: { label: L('Dito', 'Finger'), toast: L('Movimento spento: trascina con il dito per guardarti intorno.', 'Motion off: drag with your finger to look around.') },
};
function setMotionMode(mode, quiet = false) {
  controls.setMotion(mode);
  $('btn-motion').setAttribute('aria-pressed', String(mode !== 'off'));
  $('btn-motion').querySelector('span').textContent = MOTION[mode].label;
  $('btn-center').hidden = mode === 'off';
  if (!quiet) toast(MOTION[mode].toast, 4200);
}
$('btn-motion').addEventListener('click', () => {
  const next = { full: 'tilt', tilt: 'off', off: 'full' }[controls.mode || 'full'];
  setMotionMode(next);
});
// se il sensore si rivela rumoroso durante il gioco, suggerisci la modalità più stabile
controls.onNoisy = () => {
  if (state.started && controls.mode === 'full') toast(L('Il sensore di questo telefono è instabile. Se la vista gira da sola, tocca «Movimento» per passare a «Inclina».', 'This phone’s sensor is unstable. If the view turns by itself, tap “Motion” to switch to “Tilt”.'), 7000);
};
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
  chip.classList.toggle('tap', voice.needsTap);
  if (!chip.classList.contains('heard')) chipText.textContent = voice.paused ? L('Voce in pausa', 'Voice paused') : voice.needsTap ? L('Tocca lo schermo per riattivare la voce', 'Tap the screen to turn the voice back on') : L('Ti ascolto', 'Listening');
}
// spiegazione chiara del perché la voce non va, con il rimedio
function voiceProblem() {
  if (!voice.supported) return IOS_OTHER_BROWSER
    ? L('I comandi vocali su iPhone funzionano solo in Safari: apri il link con Safari.', 'On iPhone, voice commands only work in Safari: open the link in Safari.')
    : L('Questo browser non ha il riconoscimento vocale: prova con Chrome (Android) o Safari (iPhone).', 'This browser has no speech recognition: try Chrome (Android) or Safari (iPhone).');
  if (voice.lastError === 'network') return L('Il riconoscimento vocale ha bisogno della connessione a internet.', 'Speech recognition needs an internet connection.');
  if (voice.lastError === 'audio-capture') return L('Il microfono è occupato da un’altra app: chiudila e tocca «Voce».', 'The microphone is busy in another app: close it and tap “Voice”.');
  if (IS_IOS) return L('Su iPhone serve la Dettatura: Impostazioni → Generali → Tastiera → «Abilita dettatura». Controlla anche Impostazioni → Privacy e sicurezza → Riconoscimento vocale. Poi tocca «Voce».', 'On iPhone you need Dictation: Settings → General → Keyboard → “Enable Dictation”. Also check Settings → Privacy & Security → Speech Recognition. Then tap “Voice”.');
  return L('Il riconoscimento vocale è stato negato: consenti il microfono al sito e tocca «Voce». Intanto puoi muoverti toccando i cerchi.', 'Speech recognition was denied: allow the microphone for this site and tap “Voice”. Meanwhile you can move by tapping the circles.');
}
voice.onState = (s) => {
  if ((s === 'denied' || s === 'error') && state.started) toast(voiceProblem(), 9000);
  showVoiceState();
};
// iPhone: la voce si ferma tra una frase e l'altra e riparte solo con un tocco.
// Ogni tocco sullo schermo la rimette in ascolto, senza fare altro.
window.addEventListener('pointerdown', () => { if (state.started) voice.tapRestart(); }, true);
voice.onCommand = (cmd, word) => {
  if (!state.started || !$('tutorial').hidden) return;
  chip.classList.add('heard');
  chipText.textContent = L('«', '“') + word + L('»', '”');
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
    case 'help': openGuide(); break;
    case 'menu': showMenu(); break;
    case 'enter': {
      const d = activeSpots.filter((h) => h.door).sort((a, b) => camera.position.distanceTo(a.pos) - camera.position.distanceTo(b.pos))[0];
      if (d && camera.position.distanceTo(d.pos) < (state.scene === 'exterior' ? 9 : 4)) d.act();
      else toast(L('Nessuna porta qui vicino.', 'No door nearby.'), 1600);
      break;
    }
  }
};
$('btn-voice').addEventListener('click', async () => {
  if (voice.enabled) { voice.disable(); toast(L('Comandi vocali spenti.', 'Voice commands off.'), 1800); }
  else {
    const ok = await voice.enable();
    toast(ok ? L('Comandi vocali accesi: di’ «cammina».', 'Voice commands on: say “walk”.') : L('Non riesco ad avviare il riconoscimento vocale.', 'I can’t start speech recognition.'), 2500);
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
  if (!hit) { title = L('Niente di particolare', 'Nothing in particular'); text = L('Guarda verso un oggetto e avvicinati, poi di’ di nuovo «osserva».', 'Look towards an object and get closer, then say “observe” again.'); }
  else if (hit.far) { title = hit.item.name; text = L('È troppo lontano per vederlo bene. Avvicinati.', 'It’s too far away to see well. Get closer.'); }
  else { title = hit.item.name; text = describe(hit.item, { torch: state.torch, hasInk, typed: state.typed, unlocked: state.unlocked, read: state.read, gramophone: state.gramophone, scope: state.scope, wardrobe: state.wardrobe, code: codeDone(), bino: state.bino, library: state.library, novelRead: state.novelRead, shelfSolved: state.shelfSolved }); }
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
    if (here.z > 9) list.push({ pos: E.doorPos, door: true, label: L('Tocca il cerchio per avvicinarti all’ingresso', 'Tap the circle to approach the entrance'), act: () => moveTo(E.near.pos, E.near.look, () => setHint(L('La porta è aperta. Tocca il cerchio o di’ «entra».', 'The door is open. Tap the circle or say “enter”.')), 3.2) });
    else {
      list.push({ pos: E.doorPos, door: true, label: L('Entra nella villa', 'Enter the villa'), act: enterCorridorFromOutside });
      list.push({ pos: floorOf(E.far.pos), label: L('Torna sul viale', 'Back to the driveway'), act: () => moveTo(E.far.pos, null, null, 3.2) });
    }
    {
      const d = here.distanceTo(E.scopePos);
      if (state.scope) list.push({ pos: E.scopePos, label: d > 4 ? L('Il cannocchiale — avvicinati', 'The telescope — get closer') : L('Guarda nel cannocchiale', 'Look through the telescope'), act: d > 4 ? () => moveTo(E.scopeView, E.scopeLook, null, 1 + d * 0.25) : focusScope });
      else if (d < 7) list.push({ pos: E.scopePos, label: L('Il cannocchiale', 'The telescope'), act: () => toast(L('La lente è chiusa da un coperchio di legno. Forse non è ancora il momento.', 'The lens is closed with a wooden cap. Perhaps it isn’t time yet.'), 3000) });
      if (state.bino) {
        const b = here.distanceTo(E.binoPos);
        list.push({ pos: E.binoPos, label: b > 4 ? L('Il binocolo — avvicinati', 'The binoculars — get closer') : L('Guarda nel binocolo', 'Look through the binoculars'), act: b > 4 ? () => moveTo(E.binoView, E.binoLook, null, 1 + b * 0.22) : focusBino });
      }
    }
    if (state.unlocked) {
      const far = here.distanceTo(E.sideDoorPos) > 7;
      list.push({ pos: E.sideDoorPos, door: true, label: far ? L('L’altro ingresso — avvicinati', 'The other entrance — get closer') : L('Entra dall’altro ingresso', 'Go in through the other entrance'), act: far ? () => moveTo(E.sideNear.pos, E.sideNear.look, null, 3) : enterDining });
    }
  } else if (state.scene === 'corridor' && state.library && here.x > 1.9) {
    // dentro la biblioteca: solo i suoi punti (gli altri si vedrebbero attraverso il muro)
    if (!state.focus) {
      list.push({ pos: C.novelPos, label: L('Un libro dal dorso dorato', 'A book with a gilded spine'), act: focusNovel });
      if (!state.shelfSolved) list.push({ pos: C.shelfPos, label: L('Lo scaffale con la targhetta d’ottone', 'The shelf with the brass plate'), act: focusShelf });
      else list.push({ pos: C.tomePos, label: L('Il libro antico', 'The ancient book'), act: openTome });
      list.push({ pos: C.libraryDoor, door: true, label: L('Torna nel corridoio', 'Back to the corridor'), act: () => moveTo(C.libraryExit, V(0, 1.5, -10), null, 1.6) });
    }
  } else if (state.scene === 'corridor') {
    if (state.focus === 'candle') candleTapSpot(list, C);
    else if (!state.focus) {
      C.waypoints.forEach((w) => { if (Math.hypot(w.x - here.x, w.z - here.z) > 1.6) list.push({ pos: floorOf(w), label: L('Cammina fin qui', 'Walk here'), act: () => moveTo(w, null, null, 1.2 + Math.abs(w.z - here.z) * 0.14) }); });
      list.push({ pos: C.candlePos, label: L('Il candelabro — avvicinati', 'The candelabra — get closer'), act: () => focusCandle(C) });
      list.push({ pos: C.musicPos, label: L('Un carillon — avvicinati', 'A music box — get closer'), act: focusMusic });
      list.push({ pos: C.endDoor, door: true, label: L('La stanza in fondo', 'The room at the end'), act: enterStudy });
      if (state.library && here.distanceTo(C.libraryDoor) < 7) list.push({ pos: C.libraryDoor, door: true, label: L('La biblioteca — entra', 'The library — go in'), act: () => moveTo(C.libraryEntry, C.libraryLook, null, 1.6) });
      if (here.distanceTo(C.lockPos) < 4) {
        if (!state.wardrobe) list.push({ pos: C.lockPos, label: L('Il lucchetto dell’armadio', 'The wardrobe padlock'), act: focusLock });
        else list.push({ pos: C.wardrobeInside, label: L('La lettera nell’armadio', 'The letter in the wardrobe'), act: openLetter });
      }
      list.push({ pos: C.exitDoor, door: true, label: L('Esci nel giardino', 'Go out into the garden'), act: goOutside });
    }
  } else if (state.scene === 'dining') {
    const G = S.dining;
    if (!state.focus) {
      G.waypoints.forEach((w) => { if (Math.hypot(w.x - here.x, w.z - here.z) > 1.6) list.push({ pos: floorOf(w), label: L('Cammina fin qui', 'Walk here'), act: () => moveTo(w, null, null, 1.2 + w.distanceTo(here) * 0.18) }); });
      list.push({ pos: G.gramophonePos, label: state.gramophone ? L('Il grammofono — tocca per fermarlo', 'The gramophone — tap to stop it') : L('Il grammofono — tocca per farlo suonare', 'The gramophone — tap to play it'), act: toggleGramophone });
      if (here.z < -8.4) list.push({ pos: G.manuscriptPos, label: L('Il manoscritto — guarda con la lente', 'The manuscript — look with the magnifying glass'), act: focusLens });
      list.push({ pos: G.exitDoor, door: true, label: L('Esci in giardino', 'Go out to the garden'), act: diningToOutside });
    }
  } else {
    if (state.focus === 'candle') candleTapSpot(list, D);
    else if (!state.focus) {
      list.push({ pos: D.candlePos, label: L('Le candele sulla scrivania', 'The candles on the desk'), act: () => focusCandle(D) });
      list.push({ pos: D.paperPos, label: hasInk ? L('Il tuo messaggio — riscrivilo', 'Your message — write it again') : L('Un foglio bianco — scrivi', 'A blank sheet — write'), act: focusPaper });
      list.push({ pos: D.backDoor, door: true, label: L('Torna nel corridoio', 'Back to the corridor'), act: backToCorridor });
    }
  }
  return list;
}

function candleTapSpot(list, sc) {
  const lit = sc.candles.litCount;
  if (lit === 0) list.push({ pos: sc.candlePos, label: L('Tocca per riaccendere', 'Tap to relight'), act: () => { sc.candles.relight(); audio.click('puff'); candlePanel(sc); } });
  else if (!state.micOk) list.push({ pos: sc.candlePos, label: L('Tocca per spegnere', 'Tap to put out'), act: () => blow(sc) });
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
  if (lit === 0) showPanel(L('Buio. Resta solo un filo di fumo. Tocca le candele per riaccenderle.', 'Darkness. Only a thread of smoke remains. Tap the candles to relight them.'), { mic: false });
  else if (state.micOk) showPanel(lit === sc.candles.candles.length ? L('Soffia sul microfono del telefono per spegnere una candela.', 'Blow on your phone’s microphone to put out a candle.') : L('Ancora: soffia per spegnere la prossima.', 'Again: blow to put out the next one.'), { mic: true });
  else showPanel(L('Microfono non disponibile: tocca le fiamme per spegnerle.', 'Microphone unavailable: tap the flames to put them out.'), { mic: false });
}
async function focusCandle(sc) {
  enterFocus('candle');
  const micPromise = audio.startMic();
  moveTo(sc.candleView, sc.candlePos, null, 1.6);
  showPanel(L('Mi avvicino alle candele…', 'Getting closer to the candles…'));
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
    ? L('Si sente appena. Porta il telefono all’orecchio, come in una telefonata, per ascoltarlo.', 'You can barely hear it. Hold the phone to your ear, as in a call, to listen.')
    : L('Si sente appena. Tieni premuto il pulsante e avvicina il telefono all’orecchio.', 'You can barely hear it. Hold the button and bring the phone to your ear.'), { listen: true });
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
    btnListen.textContent = want ? L('In ascolto…', 'Listening…') : L('Tieni premuto per ascoltare', 'Hold to listen');
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
  if (!hasInk) { toast(L('Il foglio è rimasto bianco.', 'The sheet is still blank.')); leaveFocus(); return; }
  D.setMessage(inkCanvas);
  store.set('villa-messaggio', inkCanvas.toDataURL('image/png'));
  leaveFocus();
  toast(L('Hai lasciato il tuo messaggio sulla scrivania.', 'You left your message on the desk.'));
  D.typeReply(L('Non è qui\nquello che\ncerchi.\nProva l’altro\ningresso.', 'What you seek\nis not here.\nTry the other\nentrance.'), () => audio.click('key'), unlockSideDoor);
  state.typed = true;
  setTimeout(() => setHint(L('La macchina da scrivere… ha battuto da sola?', 'The typewriter… did it type by itself?')), 2600);
});
try {
  const saved = store.get('villa-messaggio');
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
  setHint(L('«Prova l’altro ingresso»… Fuori, sul lato destro della villa, una porta si è aperta.', '“Try the other entrance”… Outside, on the right side of the villa, a door has opened.'));
  toast(L('Da qualche parte, fuori, una porta si è aperta.', 'Somewhere outside, a door has opened.'), 4000);
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
  moveTo(G.manuscriptView, G.manuscriptPos, () => { if (state.focus === 'lens') { magnifier.useMotion = controls.gyro; magnifier.open(); } }, 1.4);
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
  state.scope = true;
  store.set('villa-cannocchiale', '1');
  S.exterior.setObservatory(true);
  setTimeout(() => {
    toast(L('Il grammofono si è fermato. Fuori, sul belvedere, si sono accese due lanterne.', 'The gramophone has stopped. Outside, on the terrace, two lanterns have lit up.'), 7000);
    setHint(L('«Guarda oltre te stesso»: esci, torna dove sei arrivato e voltati. Cerca il cannocchiale.', '“Look beyond yourself”: go out, return to where you arrived and turn around. Find the telescope.'));
  }, 1500);
}

// ---------- cannocchiale: le tre coordinate nel paesaggio ----------
function focusScope() {
  const E = S.exterior;
  enterFocus('land');
  moveTo(E.scopeView, E.scopeLook, () => { if (state.focus === 'land') land.open(state.coords); }, 1.3);
}
land.onFound = (list) => { state.coords = list; store.set('villa-coordinate', JSON.stringify(list)); };
$('land-close').addEventListener('click', () => leaveFocus());

// ---------- l'armadio: lucchetto e lettera ----------
const wheelVals = [0, 0, 0];
const wheelEls = [...document.querySelectorAll('.wheel')];
function setWheel(i, v) {
  wheelVals[i] = (v + 10) % 10;
  wheelEls[i].querySelector('b').textContent = wheelVals[i];
  audio.click('key');
}
wheelEls.forEach((el, i) => {
  el.querySelector('.up').addEventListener('click', () => setWheel(i, wheelVals[i] + 1));
  el.querySelector('.down').addEventListener('click', () => setWheel(i, wheelVals[i] - 1));
  // trascinare la rotella in su o in giù la fa girare
  const b = el.querySelector('b');
  let y0 = null;
  b.addEventListener('pointerdown', (e) => { y0 = e.clientY; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    const steps = Math.trunc((y0 - e.clientY) / 26);
    if (steps) { setWheel(i, wheelVals[i] + steps); y0 -= steps * 26; }
  });
  b.addEventListener('pointerup', () => { y0 = null; });
  b.addEventListener('pointercancel', () => { y0 = null; });
});
function focusLock() {
  const C = S.corridor;
  enterFocus('lock');
  moveTo(C.lockView, C.lockPos, () => {
    if (state.focus !== 'lock') return;
    $('lock-msg').textContent = codeDone() ? L('Tre rotelle d’ottone. Tre cifre… forse le hai già viste da qualche parte.', 'Three brass wheels. Three digits… perhaps you have already seen them somewhere.') : L('Tre rotelle d’ottone. Servono tre cifre.', 'Three brass wheels. Three digits are needed.');
    $('lock').hidden = false;
  }, 1.2);
}
$('lock-open').addEventListener('click', () => {
  if (wheelVals.join('') === CODE.join('')) {
    $('lock-msg').textContent = L('Clic. Il lucchetto si apre.', 'Click. The padlock opens.');
    if (navigator.vibrate) navigator.vibrate([20, 50, 40]);
    audio.click('puff');
    state.wardrobe = true;
    store.set('villa-armadio', '1');
    setTimeout(() => {
      $('lock').hidden = true;
      S.corridor.setWardrobe(true);
      setTimeout(() => { if (state.focus === 'lock') openLetter(); }, 1600);
    }, 700);
  } else {
    $('lock').classList.remove('wrong'); void $('lock').offsetWidth; $('lock').classList.add('wrong');
    if (navigator.vibrate) navigator.vibrate(60);
    $('lock-msg').textContent = codeDone()
      ? L('Il lucchetto non cede. Ricorda l’ordine: da Nord, come girano le lancette.', 'The padlock won’t give. Remember the order: from North, the way clock hands turn.')
      : L('Il lucchetto non cede. Le cifre giuste sono altrove, forse oltre il giardino.', 'The padlock won’t give. The right digits are elsewhere, perhaps beyond the garden.');
  }
});
$('lock-close').addEventListener('click', () => leaveFocus());
let photoDrawn = false;
function openLetter() {
  if (!state.focus) enterFocus('letter');
  state.focus = 'letter';
  if (!photoDrawn) { $('letter-photo').getContext('2d').drawImage(womanPhotoCanvas(300, 380), 0, 0); photoDrawn = true; }
  $('letter').hidden = false;
  $('letter').scrollTop = 0;
}
$('letter-close').addEventListener('click', () => leaveFocus());

// ---------- biblioteca: romanzo, scaffale, libro antico ----------
function focusNovel() {
  const C = S.corridor;
  enterFocus('novel');
  moveTo(C.novelView, C.novelPos, () => { if (state.focus === 'novel') novel.open(); }, 1.2);
}
novel.onLastPage = () => { if (!state.novelRead) { state.novelRead = true; store.set('villa-romanzo', '1'); } };
$('novel-close').addEventListener('click', () => leaveFocus());
function focusShelf() {
  const C = S.corridor;
  enterFocus('shelf');
  moveTo(C.shelfView, C.shelfPos, () => { if (state.focus === 'shelf') shelf.open(shelfOrder); }, 1.3);
}
shelf.onChange = (order) => { shelfOrder = [...order]; store.set('villa-ordine', JSON.stringify(order)); S.corridor.setShelf(order); };
shelf.onSolved = () => {
  state.shelfSolved = true;
  store.set('villa-scaffale', '1');
  shelf.close();
  state.focus = 'shelfOpening'; // si guarda lo scaffale che si apre, poi il libro antico
  S.corridor.openShelf();
  controls.aimAt(S.corridor.tomePos, 3);
  audio.click('puff');
  setTimeout(() => { if (state.focus === 'shelfOpening') { state.focus = 'tome'; tome.open(); } }, 4200);
};
$('shelf-close').addEventListener('click', () => leaveFocus());
function openTome() {
  enterFocus('tome');
  tome.open();
}
$('tome-close').addEventListener('click', () => leaveFocus());
$('tome-menu').addEventListener('click', () => { leaveFocus(true); showMenu(); });

// ---------- binocolo: la fotocamera e il finale ----------
function focusBino() {
  const E = S.exterior;
  enterFocus('scope');
  if (state.torch) setTorch(false); // il LED usa la stessa fotocamera
  moveTo(E.binoView, E.binoLook, () => { if (state.focus === 'scope') scope.open(); }, 1.3);
}
scope.onReveal = () => {
  store.set('villa-fine', '1');
  audio.distantMusicBox(40);
  if (!state.library) { state.library = true; store.set('villa-biblioteca', '1'); S.corridor.setLibrary(true); }
  // la storia continua: niente «Menu principale» qui, solo l'invito a tornare nella villa
  setTimeout(() => { if (scope.isOpen) { $('scope-close').textContent = L('Torna nella villa', 'Back into the villa'); $('scope-end').hidden = false; } }, 19000);
};
$('scope-close').addEventListener('click', () => leaveFocus());

// ---------- uscita dal primo piano ----------
function leaveFocus(instant = false) {
  const was = state.focus;
  if (!was) return;
  state.focus = null;
  hidePanel();
  $('write').hidden = true;
  if (was === 'candle') audio.stopMic();
  if (was === 'lens') { magnifier.close(); if (state.ending) playEnding(); }
  if (was === 'scope') {
    scope.close(); $('scope-end').hidden = true; $('scope-menu').hidden = true; $('scope-close').textContent = L('Chiudi', 'Close');
    if (state.library && !state.shelfSolved) setHint(L('«Cercami tra le pagine del libro che amavamo»… Nel primo corridoio qualcosa si è aperto: forse una stanza in cui prima non potevi entrare.', '“Look for me among the pages of the book we loved”… Something has opened in the first corridor: perhaps a room you couldn’t enter before.'));
  }
  if (was === 'novel') novel.close();
  if (was === 'shelf') shelf.close();
  if (was === 'tome') tome.close();
  if (was === 'land') {
    land.close();
    if (codeDone()) setHint(L('Tre cifre: ', 'Three digits: ') + CODE.join(' · ') + L('. Un lucchetto, nel primo corridoio, aspetta proprio tre cifre.', '. A padlock, in the first corridor, is waiting for exactly three digits.'));
  }
  if (was === 'lock') $('lock').hidden = true;
  if (was === 'letter') {
    $('letter').hidden = true;
    if (!state.bino) {
      state.bino = true;
      store.set('villa-binocolo', '1');
      S.exterior.setBinocular(true);
      setTimeout(() => toast(L('«Guarda con due occhi»… In giardino, sul muretto che guarda il tramonto, c’è un binocolo.', '“Look with two eyes”… In the garden, on the low wall facing the sunset, there are binoculars.'), 6500), 800);
      setHint(L('Esci in giardino: sul muretto a sinistra della villa ti aspetta un binocolo.', 'Go out to the garden: binoculars are waiting on the low wall to the left of the villa.'));
    }
  }
  if (was === 'music') {
    audio.stopMusicBox(); audio.setListen(0); S.corridor.setPlaying(false);
    state.listen = 0; listenHold = false; document.body.classList.remove('listening');
    btnListen.classList.remove('on'); btnListen.textContent = L('Tieni premuto per ascoltare', 'Hold to listen');
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

// ---------- guida a schede ----------
const slidesEl = $('slides'), dotsEl = $('tut-dots');
const slideCount = slidesEl.children.length;
dotsEl.innerHTML = '<i></i>'.repeat(slideCount);
let slideIdx = 0;
function goSlide(i, smooth = true) {
  slideIdx = Math.max(0, Math.min(slideCount - 1, i));
  slidesEl.scrollTo({ left: slideIdx * slidesEl.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  syncGuide();
}
function syncGuide() {
  [...dotsEl.children].forEach((d, k) => d.classList.toggle('on', k === slideIdx));
  $('tut-prev').disabled = slideIdx === 0;
  const last = slideIdx === slideCount - 1;
  $('tut-next').textContent = last ? (state.started ? L('Torna al gioco', 'Back to the game') : state.inMenu ? L('Torna al menu', 'Back to the menu') : L('Attiva i sensori', 'Turn on the sensors')) : L('Avanti', 'Next');
}
let scrollT;
slidesEl.addEventListener('scroll', () => {
  clearTimeout(scrollT);
  scrollT = setTimeout(() => { slideIdx = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth); syncGuide(); }, 60);
});
function openGuide() {
  $('tutorial').hidden = false;
  hideObserve();
  walk = null;
  goSlide(0, false);
}
function closeGuide() {
  $('tutorial').hidden = true;
  if (!state.started && !state.inMenu) showPerms();
}
$('tut-next').addEventListener('click', () => (slideIdx >= slideCount - 1 ? closeGuide() : goSlide(slideIdx + 1)));
$('tut-prev').addEventListener('click', () => goSlide(slideIdx - 1));
$('tut-skip').addEventListener('click', closeGuide);
$('btn-guide').addEventListener('click', openGuide);
$('btn-skip-guide').addEventListener('click', showPerms);
$('btn-guide-hud').addEventListener('click', openGuide);
function showPerms() {
  $('intro').hidden = true;
  $('perm-box').hidden = false;
  $('start').scrollTop = 0;
  if (stepIdx < 0) nextStep();
}

// ---------- permessi all'avvio ----------
// Un passo per tap: iOS accetta le richieste di permesso solo dentro un gesto dell'utente.
const isAndroid = /Android/i.test(navigator.userAgent);
const STEPS = [
  { k: 'motion', btn: L('Consenti il movimento', 'Allow motion'), run: async () => { const p = controls.enableGyro(); audio.init(); state.gyro = await p; return state.gyro ? 'ok' : 'no'; } },
  { k: 'mic', btn: L('Consenti il microfono', 'Allow the microphone'), run: async () => { audio.init(); state.micOk = await audio.askMicPermission(); return state.micOk ? 'ok' : 'no'; } },
  { k: 'voice', btn: L('Attiva i comandi vocali', 'Turn on voice commands'), skip: () => !voice.supported || !state.micOk, run: async () => {
    const ok = await voice.enable();
    if (!ok) setNote('voice', IS_IOS ? L('su iPhone attiva la Dettatura: Impostazioni → Generali → Tastiera', 'on iPhone turn on Dictation: Settings → General → Keyboard') : L('non attivi: puoi giocare col tocco', 'off: you can play by touch'));
    return ok ? 'ok' : 'no';
  } },
  { k: 'camera', btn: L('Consenti la fotocamera', 'Allow the camera'), skip: () => !navigator.mediaDevices?.getUserMedia, run: async () => {
    const ok = await askCamera();
    if (ok && isAndroid && ledTorch.supportedGuess) state.ledOk = await ledTorch.probe(); // su Android la torcia vera usa la fotocamera
    return ok ? 'ok' : 'no';
  } },
];
async function askCamera() {
  try {
    const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
    st.getTracks().forEach((t) => t.stop());
    return true;
  } catch { return false; }
}
function setNote(k, text) { const sp = document.querySelector(`#perms [data-k="${k}"] span`); if (sp) sp.textContent = text; }
const LABELS = IS_EN ? { ok: 'on', no: 'off', skip: 'skipped', na: 'unavailable', virtual: 'virtual only', wait: '…' } : { ok: 'attivo', no: 'non attivo', skip: 'saltato', na: 'non disponibile', virtual: 'solo virtuale', wait: '…' };
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
    setRow(k, 'na');
    if (k === 'voice' && !voice.supported) setNote('voice', IOS_OTHER_BROWSER ? L('su iPhone funzionano solo in Safari', 'on iPhone they only work in Safari') : L('non disponibili in questo browser', 'not available in this browser'));
    stepIdx++;
  }
  const btn = $('btn-start'), skip = $('btn-skip');
  if (stepIdx >= STEPS.length) { btn.textContent = L('Entra nella sera', 'Step into the evening'); skip.hidden = true; }
  else { btn.textContent = STEPS[stepIdx].btn; skip.hidden = false; }
  btn.disabled = false;
}
$('btn-start').addEventListener('click', async () => {
  if (stepIdx < 0) { showPerms(); return; }
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
  setRow(STEPS[stepIdx].k, 'skip');
  nextStep();
});

async function begin() {
  audio.init();
  audio.stopMenuMusic();
  audio.setAmbience('ext');
  $('start').classList.add('out');
  $('hud').hidden = false;
  $('btn-center').hidden = !state.gyro;
  $('btn-motion').hidden = !state.gyro;
  if (state.gyro) {
    if (controls.noGyroscope) {
      // senza giroscopio la rotazione orizzontale viene dalla bussola, che in casa sbanda:
      // si parte con la sola inclinazione, più stabile
      setMotionMode('tilt', true);
      toast(L('Questo telefono non ha un giroscopio: muovilo su e giù per guardare, e trascina il dito (o di’ «destra» / «sinistra») per girarti. Il tasto «Movimento» cambia modalità.', 'This phone has no gyroscope: move it up and down to look, and drag your finger (or say “right” / “left”) to turn. The “Motion” button changes mode.'), 9000);
    } else setMotionMode('full', true);
  }
  state.started = true;
  controls.face(S.exterior.far.look);
  showTitle('exterior');
  showVoiceState();
  setHint(lookWord() + L(' per guardarti intorno. ', ' to look around. ') + (voice.enabled ? L('Di’ «cammina» o «corri» per avvicinarti alla villa.', 'Say “walk” or “run” to approach the villa.') : L('Tocca il cerchio luminoso sul portone.', 'Tap the glowing circle on the front door.')));
  if (!state.gyro && 'ontouchstart' in window) toast(L('Movimento non attivo: trascina con il dito per guardarti intorno.', 'Motion is off: drag with your finger to look around.'), 4500);
  try { await navigator.wakeLock?.request('screen'); } catch { /* non essenziale */ }
}
// musica del menu: il carillon del finale. I browser fanno partire l'audio solo
// dopo un tocco, quindi parte al primo tocco sulla schermata iniziale o sulla guida.
const menuTouch = () => {
  if (state.started) return;
  audio.init();
  audio.startMenuMusic();
};
$('start').addEventListener('pointerdown', menuTouch);
$('tutorial').addEventListener('pointerdown', menuTouch);

// ---------- menu principale ----------
// si torna alla schermata iniziale: si può riprendere la partita o ricominciare
function showMenu() {
  if (!state.started) return;
  if (state.focus) leaveFocus(true);
  hideObserve();
  $('tutorial').hidden = true;
  walk = null; move = null;
  state.started = false;
  state.inMenu = true;
  voice.pause();
  audio.stopGramophone();
  audio.setListen(0);
  if (state.torch) setTorch(false);
  $('hud').hidden = true;
  $('intro').hidden = false;
  $('perm-box').hidden = true;
  $('menu-first').hidden = true;
  $('menu-resume').hidden = false;
  resetNewGame();
  $('start').classList.remove('out');
  $('start').scrollTop = 0;
  audio.startMenuMusic();
}
function resume() {
  audio.stopMenuMusic();
  state.inMenu = false;
  state.started = true;
  $('start').classList.add('out');
  $('hud').hidden = false;
  audio.ctx?.resume();
  audio.setAmbience(state.scene === 'exterior' ? 'ext' : state.scene === 'dining' ? 'dining' : 'int');
  if (state.scene === 'dining' && state.gramophone) audio.startGramophone();
  voice.resume();
  showVoiceState();
  showTitle(state.scene);
}
let newGameT;
function resetNewGame() {
  clearTimeout(newGameT);
  $('btn-newgame').classList.remove('confirm');
  $('btn-newgame').textContent = L('Nuova partita: ricomincia da capo', 'New game: start over');
}
$('btn-menu').addEventListener('click', showMenu);
$('scope-menu').addEventListener('click', () => { leaveFocus(true); showMenu(); });
$('btn-resume').addEventListener('click', resume);
$('btn-guide-menu').addEventListener('click', openGuide);
$('btn-newgame').addEventListener('click', () => {
  // conferma con un secondo tocco: si perdono porte aperte, codici e messaggio
  if (!$('btn-newgame').classList.contains('confirm')) {
    $('btn-newgame').classList.add('confirm');
    $('btn-newgame').textContent = L('Tocca di nuovo: i progressi verranno cancellati', 'Tap again: your progress will be erased');
    newGameT = setTimeout(resetNewGame, 4000);
    return;
  }
  store.clear();
  location.reload();
});

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
    // i passi si sentono anche quando ci si sposta toccando un cerchio: stessi passi di «cammina»,
    // distribuiti nel tempo dello spostamento
    if (move.stepped < move.steps && move.t >= (move.stepped + 0.3) / move.steps && state.started && !state.busy) {
      move.stepped++;
      audio.click('step');
    }
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
  if (!['lens', 'scope', 'land', 'novel', 'tome'].includes(state.focus) || move) renderer.render(cur.scene, camera); // con la lente aperta la scena 3D è coperta

  // se il telefono fatica, riduci la risoluzione
  if (state.started && ++frames > 30) {
    slow += dt > 0.034 ? 1 : -0.5;
    if (slow < 0) slow = 0;
    if (slow > 45 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.5); renderer.setPixelRatio(pixelRatio); resize(); slow = 0; }
  }
});

// ---------- diagnostica dei sensori (aprire il link con ?diag) ----------
if (new URLSearchParams(location.search).has('diag')) {
  const box = document.createElement('pre');
  box.id = 'diag';
  document.body.appendChild(box);
  let frames = 0, fps = 0, t0 = performance.now();
  const count = () => { frames++; requestAnimationFrame(count); };
  requestAnimationFrame(count);
  setInterval(() => {
    const now = performance.now();
    fps = Math.round((frames * 1000) / (now - t0)); frames = 0; t0 = now;
    const st = controls.stats || {};
    const ua = navigator.userAgent.match(/Android [\d.]+|iPhone OS [\d_]+|Chrome\/[\d]+|Version\/[\d.]+ Mobile/g) || [];
    box.textContent = [
      'DIAGNOSTICA SENSORI',
      'giroscopio vero: ' + (controls.noGyroscope == null ? '?' : controls.noGyroscope ? 'NO' : 'sì'),
      'modalità: ' + (controls.mode || (controls.gyro ? 'full' : 'off')) + (controls.noisy ? ' · rumoroso' : ''),
      'orientamento assoluto (bussola): ' + (controls.absoluteEvent == null ? '?' : controls.absoluteEvent ? 'sì' : 'no'),
      'letture/s: ' + Math.round(st.rate || 0),
      'rumore orizz.: ' + (st.yawNoise || 0).toFixed(2) + '° · inclin.: ' + (st.tiltNoise || 0).toFixed(2) + '°',
      'fps: ' + fps + ' · pixel ratio: ' + renderer.getPixelRatio(),
      'voce: ' + (voice.supported ? (voice.enabled ? (voice.needsTap ? 'attende un tocco' : voice.running ? 'in ascolto' : voice.paused ? 'in pausa' : 'ferma') : 'spenta') : 'non supportata') + (voice.lastError ? ' · errore: ' + voice.lastError : '') + ' · riavvii: ' + voice.restarts,
      'ultima frase: ' + (voice.heard || '—'),
      ua.join(' · '),
    ].join('\n');
  }, 500);
}

// accesso per test manuali da console
window.__villa = { S, state, controls, camera, goScene, audio, voice, renderer, startWalk, moveTo, leaveFocus, observe, land, setCode };
