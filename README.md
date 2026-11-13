# La Villa al Tramonto

Esperienza web 3D (Three.js) da esplorare con lo smartphone: una villa di pietra al tramonto, un corridoio a lume di candela, uno studio buio in fondo.

## Avvio

```bash
npm install
npm run dev      # sviluppo
npm run build    # build statica in dist/
```

**Serve HTTPS sul telefono.** Giroscopio, microfono e torcia funzionano solo in un contesto sicuro: apri il sito da un indirizzo `https://` (hosting statico della cartella `dist/`, un tunnel, o l'anteprima di StackBlitz/WebContainer). Su `http://192.168…` i sensori restano bloccati e l'esperienza ripiega sul trascinamento con il dito.

## Le tre scene

1. **Esterno** – tocca il cerchio sul portone per avvicinarti, poi per entrare.
2. **Corridoio** – candelabro (soffio), carillon (ascolto), biblioteca, porta in fondo.
3. **Studio** – candele, foglio su cui scrivere, una scritta sul muro che si legge solo con la torcia.

## Interazioni e sensori

| Interazione | Come funziona | Ripiego |
| --- | --- | --- |
| Guardarsi intorno | `deviceorientation`; su iOS il permesso viene chiesto al tap su «Entra nella sera» | trascinamento touch/mouse |
| Spegnere le candele | microfono (`getUserMedia`), rileva un soffio o un rumore forte; chiesto solo quando ti avvicini alle candele e spento quando ti allontani | tocco sulle fiamme |
| Torcia | faretto virtuale che segue il telefono + esposizione più alta; su Android Chrome prova anche il LED fisico (chiede la fotocamera) | solo virtuale (iPhone) |
| Carillon | telefono portato all'orecchio (verticale e inclinato di lato) alza il volume | pulsante «Tieni premuto per ascoltare» |
| Messaggio | disegno con il dito su canvas; resta sul foglio 3D e in `localStorage` | – |

Nessun audio viene registrato o inviato: il microfono serve solo a misurare il volume in locale.

## Struttura

- `src/main.js` – regia: scene, punti d'interesse, interfaccia, ciclo di rendering
- `src/exterior.js`, `src/corridor.js`, `src/study.js` – le tre scene
- `src/props.js` – candele, candelabri, mobili
- `src/textures.js` – texture procedurali su canvas (nessun asset esterno)
- `src/controls.js` – giroscopio / trascinamento, posa «all'orecchio»
- `src/audio.js` – audio sintetizzato, microfono, torcia LED

Prestazioni: pixel ratio limitato a 2 (e ridotto automaticamente se il frame rate cala), nessuna ombra dinamica, poche luci puntiformi per scena.
