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
5. **La lente** – il manoscritto si apre a schermo intero; si muove la lente inclinando il telefono (o col dito). Le righe nascoste dicono di «guardare oltre te stesso»: chiudendo la lente il grammofono si ferma e fuori si accendono le lanterne del belvedere.
6. **Il cannocchiale** – il belvedere è alle spalle del punto di arrivo in giardino. Dentro c'è una valle di montagna dipinta a 360° (`src/landscape.js`) con la bussola: villaggio, ruscello, rudere, altare di pietra. Tre "coordinate" sono illusioni ottiche: a Nord l'altare sembra un **7**, a Est il ruscello un **2**, a Ovest il rudere un **4**. Si registrano tenendo il reticolo fermo su ciascuna; il codice si legge da Nord in senso orario: **724**.
7. **L'armadio** – nel corridoio, chiuso da un lucchetto a tre rotelle. Con 724 si apre: dentro la foto di una donna (Livia) e una poesia d'amore firmata E., che parla di «guardare con due occhi» dal muretto che guarda il tramonto.
8. **Il binocolo** – sul muretto a sinistra della villa. Qui si accende la fotocamera posteriore dentro due oculari: si cerca una luce agganciata a un punto del mondo reale e la si tiene al centro finché va a fuoco. È Livia, con una lanterna. Fine: «Hai trovato il mistero della Villa al Tramonto».

I progressi (porta aperta, manoscritto letto, cannocchiale scoperto, coordinate, armadio, binocolo, messaggio) restano salvati nel browser.

## Introduzione e guida

La schermata iniziale spiega i tre modi di giocare (voce, sensori, tocco) e gli enigmi. Poi una guida a 5 schede, con immagini prese dal gioco (`public/tutorial/`), mostra muoversi, osservare, soffiare, la torcia, lente/orecchio/fotocamera. La guida si riapre in gioco con il tasto **Guida** o dicendo «aiuto».

Il tasto **Menu** (in alto a sinistra) o il comando «menu» / «menu principale» riporta alla schermata iniziale: da lì si riprende la partita, si rivede la guida o si ricomincia da capo (con conferma, azzera i progressi). Il tasto c'è anche nella schermata finale.

## Interazioni e sensori

All'avvio una schermata chiede i permessi uno alla volta (un tocco per ciascuno, come richiede iOS): movimento, microfono, comandi vocali e fotocamera (che su Android serve anche alla torcia LED). Ogni passo si può saltare.

| Interazione | Come funziona | Ripiego |
| --- | --- | --- |
| Guardarsi intorno | `deviceorientation` | trascinamento touch/mouse |
| Camminare | comandi vocali (Web Speech API, it-IT): «cammina» = due passi nella direzione in cui guardi, «corri» = tre falcate più lunghe e veloci, «indietro», «fermati», «destra»/«sinistra» (gira di 45°), «entra», «aiuto» (riapre la guida) | cerchi luminosi da toccare |
| Spegnere le candele | microfono, rileva un soffio; la voce va in pausa mentre sei alle candele | tocco sulle fiamme |
| Torcia | comando vocale «torcia» / «spegni torcia»: faretto virtuale che segue il telefono; su Android Chrome anche il LED | tasto Torcia, visibile solo se la voce non è attiva |
| Osservare | comando vocale «osserva»: descrizione breve dell'oggetto che stai guardando (testi in `src/observe.js`) | – |
| Carillon | quasi inudibile a telefono lontano; all'orecchio (telefono verticale e inclinato) si sente forte con effetto telefonata/walkie-talkie | pulsante «Tieni premuto per ascoltare» |
| Messaggio | disegno con il dito; la macchina da scrivere risponde e apre l'altro ingresso | – |
| Cannocchiale | giroscopio sul panorama dipinto a 360°, bussola, tre cifre da registrare tenendo fermo il reticolo | trascinamento col dito |
| Lucchetto | rotelle da girare col dito (frecce o trascinamento) | – |
| Binocolo | fotocamera posteriore in due oculari + giroscopio per cercare la luce; senza fotocamera una valle dipinta | trascinamento col dito |
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
- `src/landscape.js` – il cannocchiale: panorama e coordinate
- `src/scope.js` – il binocolo con la fotocamera
- `src/audio.js` – audio sintetizzato, microfono, torcia LED

Prestazioni: pixel ratio limitato a 2 (e ridotto automaticamente se il frame rate cala), nessuna ombra dinamica, poche luci puntiformi per scena.
