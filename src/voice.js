// Comandi vocali con la Web Speech API (Chrome Android, Safari iOS 14.5+).
// Riconosce parole chiave in italiano e le passa a chi ascolta.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

// parola detta → comando
const WORDS = [
  [/\b(cammina(?:re)?(?: avanti)?|avanti)\b/g, 'walk'],
  [/\b(torna indietro|indietro|arretra)\b/g, 'back'],
  [/\b(fermati|fermo|ferma|stop|basta)\b/g, 'stop'],
  [/\b(destra)\b/g, 'right'],
  [/\b(sinistra)\b/g, 'left'],
  [/\b(spegni)\b/g, 'torchOff'],
  [/\b(accendi|torcia|luce)\b/g, 'torchOn'],
  [/\b(entra|apri)\b/g, 'enter'],
];

export class VoiceCommands {
  constructor() {
    this.supported = !!SR;
    this.enabled = false;   // l'utente vuole la voce attiva
    this.paused = false;    // sospesa temporaneamente (candele, carillon)
    this.running = false;
    this.onCommand = null;  // (cmd, parola) => void
    this.onState = null;    // (stato) => void : 'listening' | 'idle' | 'off' | 'denied' | 'error'
    this._fired = new Map();
    this._errors = 0;
  }

  _create() {
    const r = new SR();
    r.lang = 'it-IT';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onstart = () => { this.running = true; this._emit('listening'); };
    r.onresult = (e) => { this._errors = 0; this._handle(e); };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.enabled = false;
        this._emit('denied');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        this._lastError = e.error;
        // errori ripetuti (rete assente, microfono occupato): smetti di riprovare
        if (++this._errors >= 3) { this.enabled = false; this._emit('error'); }
      }
    };
    r.onend = () => {
      this.running = false;
      this._fired.clear();
      // Chrome chiude la sessione dopo qualche secondo di silenzio: riapri subito
      if (this.enabled && !this.paused && !document.hidden) {
        clearTimeout(this._restart);
        this._restart = setTimeout(() => this._start(), this._lastError ? 1200 : 200);
        this._lastError = null;
      } else this._emit(this.enabled ? 'idle' : 'off');
    };
    return r;
  }

  _emit(s) { this.state = s; this.onState?.(s); }

  _start() {
    if (!this.supported || this.running) return;
    try {
      this.rec = this.rec || this._create();
      this.rec.start();
    } catch {
      // già in avvio: ignora
    }
  }

  /**
   * Prima attivazione: va chiamata dentro un tap (iOS chiede qui il permesso).
   * Risolve true quando il riconoscimento è partito davvero.
   */
  enable() {
    if (!this.supported) return Promise.resolve(false);
    this.enabled = true;
    this.paused = false;
    this._errors = 0;
    return new Promise((resolve) => {
      let done = false;
      const prev = this.onState;
      const finish = (ok) => { if (!done) { done = true; this.onState = prev; prev?.(this.state); resolve(ok); } };
      this.onState = (s) => {
        if (s === 'listening') finish(true);
        else if (s === 'denied' || s === 'error') finish(false);
      };
      this._start();
      setTimeout(() => finish(this.running), 6000);
    });
  }

  disable() {
    this.enabled = false;
    clearTimeout(this._restart);
    try { this.rec?.abort(); } catch { /* già fermo */ }
    this._emit('off');
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    clearTimeout(this._restart);
    try { this.rec?.abort(); } catch { /* già fermo */ }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.enabled) this._start();
  }

  _fire(cmd, word) {
    // Chrome su Android a volte ripete lo stesso risultato: ignora i doppioni ravvicinati
    const now = performance.now();
    if (this._last && this._last.cmd === cmd && now - this._last.t < 350) return;
    this._last = { cmd, t: now };
    this.onCommand?.(cmd, word);
  }

  _handle(e) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript.toLowerCase();
      // conta le occorrenze di ogni comando in questo risultato: con i risultati
      // provvisori la frase cresce, quindi scatta solo ciò che è nuovo
      const seen = this._fired.get(i) || {};
      for (const [re, cmd] of WORDS) {
        if (cmd === 'torchOn' && /\bspegni\b/.test(text)) continue; // "spegni la torcia"
        const n = (text.match(re) || []).length;
        const before = seen[cmd] || 0;
        for (let k = before; k < n; k++) this._fire(cmd, text.match(re)[k]);
        seen[cmd] = Math.max(before, n);
      }
      this._fired.set(i, seen);
    }
  }
}
