// Salvataggi: un salvataggio automatico (checkpoint) e tre slot liberi.
// Restano sul telefono (localStorage), anche chiudendo il link. La partita in corso
// invece vive in sessionStorage (chiavi «villa-*»): caricare uno slot vuol dire
// copiarne le chiavi nella sessione e ricaricare la pagina.
import { L, IS_EN } from './i18n.js';

const KEY = 'salvataggi-villa';
export const SLOT_IDS = ['auto', '1', '2', '3'];

// le tappe della storia, in ordine: danno il nome al capitolo e il conteggio dei progressi
export const MILESTONES = [
  { key: 'villa-porta', name: L('L’altro ingresso', 'The other entrance') },
  { key: 'villa-letto', name: L('Il manoscritto', 'The manuscript') },
  { key: 'coords', name: L('Le cifre nella valle', 'The digits in the valley') },
  { key: 'villa-armadio', name: L('La lettera nell’armadio', 'The letter in the wardrobe') },
  { key: 'villa-fine', name: L('La luce sulla strada', 'The light on the road') },
  { key: 'villa-scaffale', name: L('Il libro antico', 'The ancient book') },
];
const FIRST = L('L’arrivo alla villa', 'Arriving at the villa');

function reached(keys) {
  return MILESTONES.filter((m) => {
    if (m.key !== 'coords') return keys[m.key] === '1';
    try { const c = JSON.parse(keys['villa-coordinate'] || '[]'); return [0, 1, 2].every((i) => c.includes(i)); } catch { return false; }
  });
}

/** Nome del capitolo e conteggio delle tappe raggiunte, per l'etichetta dello slot. */
export function describeSave(snap) {
  const r = reached(snap.keys || {});
  return { chapter: r.length ? r[r.length - 1].name : FIRST, done: r.length, total: MILESTONES.length };
}

export function readSaves() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

/** Scrive uno slot; se lo spazio non basta, rinuncia all'immagine del messaggio scritto a mano. */
export function writeSave(id, snap) {
  const all = readSaves();
  all[id] = snap;
  try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch { /* spazio esaurito */ }
  if (snap.keys?.['villa-messaggio']) {
    const lite = { ...snap, keys: { ...snap.keys } };
    delete lite.keys['villa-messaggio'];
    all[id] = lite;
    try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch { /* ancora niente */ }
  }
  return false;
}

export function hasAnySave() {
  const all = readSaves();
  return SLOT_IDS.some((id) => all[id]);
}

export function formatDate(t) {
  const d = new Date(t);
  try {
    return d.toLocaleString(IS_EN ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return d.toISOString().slice(0, 16).replace('T', ' '); }
}

export const slotName = (id) => (id === 'auto' ? L('Salvataggio automatico', 'Autosave') : L('Slot ', 'Slot ') + id);
