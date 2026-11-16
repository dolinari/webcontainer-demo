# La Villa al Tramonto — istruzioni di progetto

## Regola: ogni modifica in doppia lingua (italiano + inglese)

L'esperienza è bilingue. **Qualsiasi testo nuovo o modificato va scritto in italiano e in inglese**, senza eccezioni (salvo la pagina di diagnostica `?diag`, che è solo per l'autore).

- Testo nell'HTML (`index.html`): italiano nel contenuto, inglese nell'attributo `data-en` (e `data-en-aria`, `data-en-alt`, `data-en-src` per etichette, alt e immagini). Lo applica `translatePage()` in `src/i18n.js`.
- Testo nel codice: `L('italiano', 'english')` da `src/i18n.js`; per liste o valori diversi usare `IS_EN`.
- Testi disegnati su canvas (manoscritto, scritte nelle scene, bussola) e descrizioni di «osserva» (`src/observe.js`): sempre entrambe le versioni.
- Comandi vocali nuovi: parole chiave in entrambe le liste di `src/voice.js` (`WORDS_IT`, `WORDS_EN`) e nei chip dell'introduzione e della guida.
- Immagini con testo (guida in `public/tutorial/` e `public/tutorial/en/`): rigenerarle in entrambe le lingue.
- In inglese le virgolette sono “ ”, in italiano « ».

## Altre note

- I progressi di gioco stanno in `sessionStorage` (chiavi `villa-*`): riaprendo il link si riparte da zero. La lingua scelta sta in `localStorage` (`lingua-villa`).
- Crediti: «La Villa al Tramonto è un'experience interattiva creata da Dario Molinari. © 2026 · Tutti i diritti riservati.» / “The Villa at Sunset is an interactive experience created by Dario Molinari. © 2026 · All rights reserved.”
- Pubblicazione: ogni push sul branch di lavoro compila il sito e aggiorna `gh-pages` (GitHub Pages).
