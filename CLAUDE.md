# La Villa al Tramonto — istruzioni di progetto

## Regola: ogni modifica in doppia lingua (italiano + inglese)

L'esperienza è bilingue. **Qualsiasi testo nuovo o modificato va scritto in italiano e in inglese**, senza eccezioni (salvo la pagina di diagnostica `?diag`, che è solo per l'autore).

- Testo nell'HTML (`index.html`): italiano nel contenuto, inglese nell'attributo `data-en` (e `data-en-aria`, `data-en-alt`, `data-en-src` per etichette, alt e immagini). Lo applica `translatePage()` in `src/i18n.js`.
- Testo nel codice: `L('italiano', 'english')` da `src/i18n.js`; per liste o valori diversi usare `IS_EN`.
- Testi disegnati su canvas (manoscritto, scritte nelle scene, bussola) e descrizioni di «osserva» (`src/observe.js`): sempre entrambe le versioni.
- Comandi vocali nuovi: parole chiave in entrambe le liste di `src/voice.js` (`WORDS_IT`, `WORDS_EN`) e nei chip dell'introduzione e della guida.
- Immagini con testo (guida in `public/tutorial/` e `public/tutorial/en/`): rigenerarle in entrambe le lingue.
- In inglese le virgolette sono “ ”, in italiano « ».

## La storia

La trama nascosta (E., Livia, il culto delle lanterne, il paese vicino a Vienna) è in `STORIA.md`. Va fatta emergere poco a poco attraverso stanze, oggetti, enigmi e descrizioni di «osserva»: non va mai spiegata tutta insieme. La fine di E. va trattata con delicatezza (vedi le regole in `STORIA.md`).

## Altre note

- La partita in corso sta in `sessionStorage` (chiavi `villa-*`). I salvataggi (automatico + slot 1–3) stanno in `localStorage` (`salvataggi-villa`, vedi `src/saves.js`) e restano anche chiudendo il link; caricare uno slot ricopia le chiavi nella sessione e ricarica la pagina. La lingua scelta sta in `localStorage` (`lingua-villa`).
- Avvio: schermata del titolo (vento + il carillon del menu, `startMenuMusic`) → Nuova partita / Carica partita / Crediti → secondo menu (come si gioca, guida, sensori).
- Audio d'ambiente: fuori vento e foglie; dentro il vento è a zero e la casa si riconosce da scricchiolii e candele (`setAmbience` in `src/audio.js`). Il tic-tac si sente solo nella sala da pranzo, a tempo con l'orologio a pendolo e più forte avvicinandosi: niente suoni di oggetti che nella stanza non ci sono. Il tono della stanza è volutamente cupo: sull'altoparlante del telefono non deve sembrare vento.
- Crediti: «La Villa al Tramonto è un'experience interattiva creata da Dario Molinari. © 2026 · Tutti i diritti riservati.» / “The Villa at Sunset is an interactive experience created by Dario Molinari. © 2026 · All rights reserved.” Nella schermata Crediti: ideazione, storia e game design — Dario Molinari; programmazione — programmato con Claude, di Anthropic; musica e suoni — composti per il gioco con Claude.
- Pubblicazione: ogni push sul branch di lavoro compila il sito e aggiorna `gh-pages` (GitHub Pages).
- Regola di gioco: ogni nuova zona si apre risolvendo un enigma (stile escape room), con un segnale chiaro in IT/EN («qualcosa si è aperto…»).
- Mappa: esterno → corridoio (biblioteca a destra, scale a sinistra prima della stanza in fondo) → studio; sala da pranzo e studiolo dall'altro ingresso; piano di sopra (`src/upper.js`, scale chiuse da un cordone rosso finché non si apre lo scaffale della biblioteca, chiave `villa-scale`): salone, camera da letto, atelier con la vetrata sulla valle, una porta chiusa con un nastro rosso (per un capitolo futuro).
