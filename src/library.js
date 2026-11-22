// La biblioteca: il romanzo da sfogliare col dito, lo scaffale con le lettere da
// riordinare e il libro antico con la fotografia della villa nel 1826.
// Tutti i testi sono in italiano e in inglese.
import { L, IS_EN } from './i18n.js';

// --- l'enigma: una parola di quattro lettere, diversa per lingua ---
export const WORD = IS_EN ? 'HOME' : 'CASA';
// otto libri sullo scaffale: le quattro lettere giuste e quattro che non servono
export const START_ORDER = IS_EN ? ['T', 'O', 'L', 'E', 'S', 'H', 'A', 'M'] : ['L', 'A', 'T', 'S', 'E', 'C', 'U', 'A'];

// --- il romanzo: tre pagine ---
const PAGES = [
  `<div class="tp">
    <small>${L('romanzo', 'a novel')}</small>
    <h3>${L('Il Custode<br />delle Lanterne', 'The Lantern<br />Keeper')}</h3>
    <p class="au">${L('di M. Ashcombe', 'by M. Ashcombe')}</p>
    <p class="yr">MDCCCXXXI</p>
    <p class="hand">${L('A E., perché la luce<br />non si spenga mai.<br />— L.', 'For E., so that the light<br />never goes out.<br />— L.')}</p>
  </div>`,
  `<h4>${L('Capitolo primo', 'Chapter One')}</h4>
   <p>${L('Nella valle, ogni lanterna custodiva un nome. Il vecchio Custode le accendeva al calar del sole, una per una, e a ciascuna sussurrava la strada del ritorno.', 'In the valley, every lantern kept a name. The old Keeper lit them at sundown, one by one, and to each he whispered the way back.')}</p>
   <p>${L('Si diceva che chi si perdeva nella nebbia potesse ritrovarsi seguendo quella luce: anche dopo molti anni, anche dopo che tutti lo avevano dato per perduto.', 'It was said that whoever got lost in the fog could find the way again by following that light: even after many years, even after everyone had given them up for lost.')}</p>`,
  `<p>${L('Una notte una lanterna rimase spenta. Il Custode la cercò fra le pietre del vecchio altare, lungo il ruscello, fin sotto il rudere sulla collina.', 'One night a lantern stayed dark. The Keeper searched for it among the stones of the old altar, along the stream, all the way up to the ruin on the hill.')}</p>
   <p>${L('Solo all’alba capì che quella luce non si era persa: aspettava soltanto che qualcuno la riportasse a casa.', 'Only at dawn did he understand that the light had not been lost: it was simply waiting for someone to bring it home.')}</p>
   <p class="pencil">${L('Quattro lettere e mille ricordi.<br />Chi parte la porta nel cuore,<br />chi torna la ritrova al tramonto.<br />Rimettila in ordine,<br />sotto la targhetta d’ottone.', 'Four letters and a thousand memories.<br />Those who leave carry it in their hearts,<br />those who return find it again at sunset.<br />Put it back in order,<br />under the brass plate.')}</p>`,
];

/**
 * Un libro da sfogliare col dito. «prefix» indica gli elementi della pagina (novel, codex…);
 * «pages» può essere una funzione, chiamata alla prima apertura (per le pagine con immagini disegnate).
 */
export class Novel {
  constructor(prefix = 'novel', pages = PAGES) {
    const $ = (s) => document.getElementById(`${prefix}${s}`);
    this.el = $('');
    this.page = $('-page');
    this.num = $('-num');
    this.prev = $('-prev'); this.next = $('-next');
    this.source = pages;
    this.i = 0;
    this.onLastPage = null;
    this.prev.addEventListener('click', () => this.turn(-1));
    this.next.addEventListener('click', () => this.turn(1));
    // sfogliare col dito: trascina verso sinistra per andare avanti, verso destra per tornare
    let x0 = null;
    this.page.addEventListener('pointerdown', (e) => { x0 = e.clientX; this.page.setPointerCapture(e.pointerId); });
    this.page.addEventListener('pointermove', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      this.page.style.transform = `perspective(900px) rotateY(${Math.max(-35, Math.min(35, dx / 6))}deg)`;
    });
    const up = (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0; x0 = null;
      this.page.style.transform = '';
      if (Math.abs(dx) > 50) this.turn(dx < 0 ? 1 : -1);
    };
    this.page.addEventListener('pointerup', up);
    this.page.addEventListener('pointercancel', up);
  }

  get pages() {
    if (typeof this.source === 'function') this.source = this.source();
    return this.source;
  }

  open() { this.i = 0; this.render(); this.el.hidden = false; }
  close() { this.el.hidden = true; }

  turn(d) {
    const j = Math.max(0, Math.min(this.pages.length - 1, this.i + d));
    if (j === this.i) return;
    this.page.classList.add(d > 0 ? 'out-left' : 'out-right');
    setTimeout(() => {
      this.i = j;
      this.render();
      this.page.classList.remove('out-left', 'out-right');
      this.page.classList.add(d > 0 ? 'in-right' : 'in-left');
      requestAnimationFrame(() => requestAnimationFrame(() => this.page.classList.remove('in-right', 'in-left')));
    }, 220);
  }

  render() {
    const pages = this.pages;
    this.page.innerHTML = pages[this.i];
    this.page.scrollTop = 0;
    this.num.textContent = `${this.i + 1} / ${pages.length}`;
    this.prev.disabled = this.i === 0;
    this.next.disabled = this.i === pages.length - 1;
    if (this.i === pages.length - 1) this.onLastPage?.();
  }
}

/** Lo scaffale: otto libri da trascinare; i primi quattro, sotto la targhetta, devono comporre la parola. */
export class Shelf {
  constructor() {
    this.el = document.getElementById('shelf');
    this.row = document.getElementById('shelf-row');
    this.msg = document.getElementById('shelf-msg');
    this.order = [...START_ORDER];
    this.onChange = null;
    this.onSolved = null;
    this.solved = false;
  }

  open(order) {
    if (order && order.length === 8) this.order = [...order];
    this.el.hidden = false;
    this.msg.textContent = this.solved
      ? L('Lo scaffale è aperto.', 'The shelf is open.')
      : L('Trascina i libri col dito. Sotto la targhetta d’ottone ci sono quattro posti.', 'Drag the books with your finger. There are four places under the brass plate.');
    this.render();
  }

  close() { this.el.hidden = true; }

  render() {
    this.row.innerHTML = '';
    this.order.forEach((ch, i) => {
      const b = document.createElement('div');
      b.className = 'spine';
      b.style.setProperty('--hue', String((ch.charCodeAt(0) * 47) % 360));
      b.innerHTML = `<b>${ch}</b>`;
      b.dataset.i = i;
      this.row.appendChild(b);
      if (!this.solved) this._drag(b);
    });
  }

  _drag(b) {
    let x0 = null, start = 0;
    b.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; start = +b.dataset.i;
      b.setPointerCapture(e.pointerId);
      b.classList.add('lift');
    });
    b.addEventListener('pointermove', (e) => {
      if (x0 == null) return;
      b.style.transform = `translate(${e.clientX - x0}px, -10px)`;
    });
    const up = (e) => {
      if (x0 == null) return;
      const w = b.getBoundingClientRect().width + 6;
      const to = Math.max(0, Math.min(7, start + Math.round((e.clientX - x0) / w)));
      x0 = null;
      b.classList.remove('lift');
      b.style.transform = '';
      if (to !== start) {
        const [ch] = this.order.splice(start, 1);
        this.order.splice(to, 0, ch);
        if (navigator.vibrate) navigator.vibrate(8);
        this.onChange?.(this.order);
        this.render();
        this._check();
      }
    };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  }

  _check() {
    if (this.order.slice(0, 4).join('') !== WORD) return;
    this.solved = true;
    this.row.classList.add('solved');
    this.msg.textContent = L('Clic… qualcosa si sblocca dietro lo scaffale.', 'Click… something unlocks behind the shelf.');
    if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 60]);
    this.render();
    setTimeout(() => this.onSolved?.(), 1400);
  }
}

/** Il libro antico, aperto sulla fotografia della villa duecento anni fa. */
export class Tome {
  constructor() {
    this.el = document.getElementById('tome');
    document.getElementById('tome-title').innerHTML = L('Cronache della<br />Villa al Tramonto', 'Chronicles of the<br />Villa at Sunset');
    document.getElementById('tome-text').innerHTML = L(
      'La villa come appariva duecento anni fa, in una delle prime eliografie della valle. L’edera saliva appena sui muri, e i cipressi erano ancora giovani.',
      'The villa as it looked two hundred years ago, in one of the very first heliographs of the valley. The ivy was only beginning to climb the walls, and the cypresses were still young.');
    document.getElementById('tome-ink').innerHTML = L(
      '«Qui abiteranno E. e L.,<br />finché ci sarà una luce accesa.»',
      '“Here E. and L. shall live,<br />as long as a light is burning.”');
    document.getElementById('tome-caption').textContent = L('Villa al Tramonto — 1826', 'The Villa at Sunset — 1826');
  }
  open() { this.el.hidden = false; this.el.scrollTop = 0; }
  close() { this.el.hidden = true; }
}
