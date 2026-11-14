# La Villa al Tramonto

Esperienza web 3D (Three.js) da esplorare con lo smartphone: una villa di pietra al tramonto, un corridoio a lume di candela, uno studio buio in fondo.

## Avvio

```bash
npm install
npm run dev      # sviluppo
npm run build    # build statica in dist/
```

**Online:** https://dolinari.github.io/webcontainer-demo/ (si aggiorna da solo a ogni push).

**Serve HTTPS sul telefono.** Giroscopio, microfono e torcia funzionano solo in un contesto sicuro: apri il sito da un indirizzo `https://` (hosting statico della cartella `dist/`, un tunnel, o l'anteprima di StackBlitz/WebContainer). Su `http://192.168…` i sensori restano bloccati e l'esperienza ripiega sul trascinamento con il dito.

## Le scene e la storia

1. **Esterno** – tocca il cerchio sul portone (o di' «cammina») per avvicinarti ed entrare.
2. **Corridoio** – candelabro (soffio), carillon (ascolto), biblioteca chiusa, porta in fondo.
3. **Studio** – candele, una scritta sul muro visibile solo con la torcia, e il foglio: quando ci scrivi un messaggio, la macchina da scrivere risponde da sola «Non è qui quello che cerchi. Prova l'altro ingresso.» e si apre la porta dell'ala laterale, fuori a destra.
4. **Sala da pranzo** (dall'altro ingresso) – camino acceso, tavola apparecchiata, un grammofono che suona un valzer per violino, ritratti, busto, pendola. In fondo, lo **studiolo**: mappamondo, mappa, lampada a olio e un manoscritto con righe minuscole in fondo.
5. **La lente** – il manoscritto si apre a schermo intero; si muove la lente inclinando il telefono (o col dito). Lette le righe nascoste, chiudendo la lente il grammofono si ferma e dall'altra ala suona il carillon.

I progressi (porta aperta, manoscritto letto, messaggio) restano salvati nel browser.

## Interazioni e sensori

All'avvio una schermata chiede i permessi uno alla volta (un tocco per ciascuno, come richiede iOS): movimento, microfono, comandi vocali e, su Android, la torcia LED. Ogni passo si può saltare.

| Interazione | Come funziona | Ripiego |
| --- | --- | --- |
| Guardarsi intorno | `deviceorientation` | trascinamento touch/mouse |
| Camminare | comandi vocali (Web Speech API, it-IT): «cammina» = due passi nella direzione in cui guardi, «corri» = tre falcate più lunghe e veloci, «indietro», «fermati», «destra»/«sinistra» (gira di 45°), «entra», «aiuto» (elenco dei comandi) | cerchi luminosi da toccare |
| Spegnere le candele | microfono, rileva un soffio; la voce va in pausa mentre sei alle candele | tocco sulle fiamme |
| Torcia | comando vocale «torcia» / «spegni torcia»: faretto virtuale che segue il telefono; su Android Chrome anche il LED | tasto Torcia, visibile solo se la voce non è attiva |
| Osservare | comando vocale «osserva»: descrizione breve dell'oggetto che stai guardando (testi in `src/observe.js`) | – |
| Carillon | quasi inudibile a telefono lontano; all'orecchio (telefono verticale e inclinato) si sente forte con effetto telefonata/walkie-talkie | pulsante «Tieni premuto per ascoltare» |
| Messaggio | disegno con il dito; la macchina da scrivere risponde e apre l'altro ingresso | – |
| Lente | giroscopio: inclinare il telefono sposta la lente sul manoscritto; il testo ingrandito è ridisegnato in scala, quindi resta nitido | trascinamento col dito |

Il riconoscimento vocale di Chrome e Safari usa i server di Google/Apple: serve la connessione.

Nessun audio viene registrato o inviato: il microfono serve solo a misurare il volume in locale.

## Struttura

- `src/main.js` – regia: scene, punti d'interesse, interfaccia, ciclo di rendering
- `src/exterior.js`, `src/corridor.js`, `src/study.js` – le tre scene
- `src/props.js` – candele, candelabri, mobili
- `src/textures.js` – texture procedurali su canvas (nessun asset esterno)
- `src/controls.js` – giroscopio / trascinamento, posa «all'orecchio»
- `src/voice.js` – comandi vocali
- `src/observe.js` – descrizioni del comando «osserva»
- `src/dining.js` – sala da pranzo e studiolo
- `src/magnifier.js` – manoscritto e lente d'ingrandimento
- `src/audio.js` – audio sintetizzato, microfono, torcia LED

Prestazioni: pixel ratio limitato a 2 (e ridotto automaticamente se il frame rate cala), nessuna ombra dinamica, poche luci puntiformi per scena.
