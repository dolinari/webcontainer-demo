// Lingua dell'esperienza: italiano o inglese.
// La scelta resta salvata nel browser (è una preferenza, non un progresso di gioco).
// La prima volta si usa la lingua del telefono.

const KEY = 'lingua-villa';

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'it' || saved === 'en') return saved;
  } catch { /* archiviazione bloccata */ }
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'it';
  return /^it\b/i.test(nav) ? 'it' : 'en';
}

export const LANG = detect();
export const IS_EN = LANG === 'en';

/** Sceglie il testo nella lingua attiva: L('ciao', 'hello'). */
export const L = (it, en) => (IS_EN ? en : it);

/** Cambia lingua: salva la scelta e ricarica (i progressi della scheda restano). */
export function setLang(lang) {
  if (lang === LANG) return;
  try { localStorage.setItem(KEY, lang); } catch { /* archiviazione bloccata */ }
  location.reload();
}

/** Traduce l'HTML statico: ogni elemento con data-en riceve il testo inglese. */
export function translatePage() {
  document.documentElement.lang = LANG;
  if (!IS_EN) return;
  document.querySelectorAll('[data-en]').forEach((el) => { el.innerHTML = el.dataset.en; });
  document.querySelectorAll('[data-en-aria]').forEach((el) => el.setAttribute('aria-label', el.dataset.enAria));
  document.querySelectorAll('[data-en-alt]').forEach((el) => el.setAttribute('alt', el.dataset.enAlt));
  document.querySelectorAll('[data-en-src]').forEach((el) => el.setAttribute('src', el.dataset.enSrc));
  document.querySelectorAll('meta[data-en-content]').forEach((el) => el.setAttribute('content', el.dataset.enContent));
  if (document.body.dataset.enTitle) document.title = document.body.dataset.enTitle;
}
