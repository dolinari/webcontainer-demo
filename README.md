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

## Le tre scene

1. **Esterno** – tocca il cerchio sul portone per avvicinarti, poi per entrare.
2. **Corridoio** – candelabro (soffio), carillon (ascolto), biblioteca, porta in fondo.
3. **Studio** – candele, foglio su cui scrivere, una scritta sul muro che si legge solo con la torcia.

## Interazioni e sensori

All'avvio una schermata chiede i permessi uno alla volta (un tocco per ciascuno, come richiede iOS): movimento, microfono, comandi vocali e, su Android, la torcia LED. Ogni passo si può saltare.

| Interazione | Come funziona | Ripiego |
| --- | --- | --- |
| Guardarsi intorno | `deviceorientation` | trascinamento touch/mouse |
| Camminare | comandi vocali (Web Speech API, it-IT): «cammina» = due passi nella direzione in cui guardi, «indietro», «fermati», «destra»/«sinistra» (gira di 45°), «entra», «accendi/spegni la torcia» | cerchi luminosi da toccare |
| Spegnere le candele | microfono, rileva un soffio; la voce va in pausa mentre sei alle candele | tocco sulle fiamme |
| Torcia | faretto virtuale che segue il telefono; su Android Chrome anche il LED | solo virtuale (iPhone) |
| Carillon | quasi inudibile a telefono lontano; all'orecchio (telefono verticale e inclinato) si sente forte con effetto telefonata/walkie-talkie | pulsante «Tieni premuto per ascoltare» |
| Messaggio | disegno con il dito; la macchina da scrivere risponde con una frase scelta a caso tra 5, mai la stessa due volte di fila | – |

Il riconoscimento vocale di Chrome e Safari usa i server di Google/Apple: serve la connessione.

Nessun audio viene registrato o inviato: il microfono serve solo a misurare il volume in locale.

## Struttura

- `src/main.js` – regia: scene, punti d'interesse, interfaccia, ciclo di rendering
- `src/exterior.js`, `src/corridor.js`, `src/study.js` – le tre scene
- `src/props.js` – candele, candelabri, mobili
- `src/textures.js` – texture procedurali su canvas (nessun asset esterno)
- `src/controls.js` – giroscopio / trascinamento, posa «all'orecchio»
- `src/voice.js` – comandi vocali
- `src/audio.js` – audio sintetizzato, microfono, torcia LED

Prestazioni: pixel ratio limitato a 2 (e ridotto automaticamente se il frame rate cala), nessuna ombra dinamica, poche luci puntiformi per scena.
