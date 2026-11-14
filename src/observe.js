// Comando «osserva»: descrizioni brevi degli oggetti di ogni scena.
// Ogni voce: nome, posizione, distanza massima da cui si può osservare, testo.
// Il testo può essere una funzione (ctx) => stringa, per descrizioni che cambiano.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const OBSERVABLES = {
  exterior: [
    { name: 'La villa', pos: V(0, 5, -1), range: 30, size: 6,
      text: 'Una villa di pietra a tre piani, con le persiane verde scuro. L’edera rossa sale fino al balcone. Alcune finestre sono accese, altre no: qualcuno è in casa, o lo è stato fino a poco fa.' },
    { name: 'Il portone', pos: V(0, 1.9, 0.4), range: 12, size: 1.2,
      text: 'Un portone ad arco in legno massiccio, spalancato. Dentro si vede un corridoio illuminato dalle candele. Nessuno è venuto ad accoglierti.' },
    { name: 'La lanterna', pos: V(0, 4, 0.75), range: 10, size: 0.4,
      text: 'Una lanterna di ferro battuto sopra l’ingresso. La fiamma è stata accesa da poco: il vetro non è ancora annerito.' },
    { name: 'Il balcone', pos: V(0, 5.3, 0.6), range: 14, size: 1.6,
      text: 'Un balcone con la ringhiera di ferro. La portafinestra dietro è illuminata, ma le tende sono tirate.' },
    { name: 'I vasi di terracotta', pos: V(2.75, 1.5, 1.3), range: 7, size: 0.8,
      text: 'Grandi orci di terracotta, consumati dal tempo. Qualcuno continua a curare le piante: la terra è ancora umida.' },
    { name: 'I vasi di terracotta', pos: V(-2.75, 1.5, 1.3), range: 7, size: 0.8,
      text: 'Grandi orci di terracotta, consumati dal tempo. Qualcuno continua a curare le piante: la terra è ancora umida.' },
    { name: 'I cipressi', pos: V(-10.5, 6, 1), range: 25, size: 3,
      text: 'Cipressi alti e scuri, quasi neri contro il cielo. Segnano il confine del giardino come sentinelle.' },
    { name: 'Il tramonto', pos: V(-110, 20, 110), range: 400, size: 30,
      text: 'Il sole scende dietro le colline. Il cielo passa dall’arancio al rosso scuro. Tra poco sarà buio.' },
    { name: 'L’acero rosso', pos: V(3.5, 7, 14), range: 14, size: 4,
      text: 'Un acero dalle foglie rosso scuro. Il vento ne stacca qualcuna e la porta verso la casa.' },
    { name: 'Il muretto', pos: V(-10, 0.7, 10), range: 9, size: 2.5,
      text: 'Un muretto di pietra a secco, coperto di muschio. Da qui si vede tutta la valle.' },
    { name: 'L’ala laterale', pos: V(10, 2.3, -1.2), range: 18, size: 2.5,
      text: (c) => (c.unlocked
        ? 'L’ala più bassa della villa. La piccola porta adesso è aperta: dentro brilla la luce di un camino, e si sente della musica. È l’altro ingresso.'
        : 'Un’ala più bassa della villa, con una piccola porta buia. È chiusa a chiave.') },
  ],
  corridor: [
    { name: 'Il candelabro', pos: V(-1.44, 1.3, -0.75), range: 4.5, size: 0.3,
      text: 'Un candelabro di bronzo a tre bracci, con candele di cera chiara. Le fiamme tremano appena, come se qualcuno fosse passato da poco.' },
    { name: 'Il dipinto', pos: V(-1.76, 2.25, -1.4), range: 6, size: 1,
      text: 'Un paesaggio a olio in una pesante cornice dorata: una torre su una collina, sotto un cielo scuro. La torre somiglia a qualcosa che hai già visto.' },
    { name: 'Il vaso di fiori secchi', pos: V(-1.46, 1.4, -1.6), range: 4, size: 0.35,
      text: 'Un vaso di bronzo con un mazzo di ortensie secche. Erano rosse, molto tempo fa.' },
    { name: 'Il busto di terracotta', pos: V(-1.46, 1.2, -2.35), range: 4, size: 0.25,
      text: 'Un piccolo busto di terracotta: un giovane dai capelli ricci. È girato verso la porta, come se aspettasse qualcuno.' },
    { name: 'La credenza', pos: V(-1.5, 0.6, -1.5), range: 3.5, size: 0.8,
      text: 'Una credenza in noce scuro, intagliata a mano. I cassetti sono chiusi a chiave.' },
    { name: 'Il trofeo di cervo', pos: V(-1.72, 2.85, -3.6), range: 6, size: 0.45,
      text: 'Un cranio di cervo con i palchi, appeso al muro. È lì da così tanto che la polvere l’ha reso grigio.' },
    { name: 'L’armadio', pos: V(-1.47, 1.3, -5.4), range: 4.5, size: 0.8,
      text: 'Un alto armadio a due ante. Sopra c’è un vaso di ceramica. Le ante sono socchiuse, ma dentro è troppo buio per vedere.' },
    { name: 'Il lampadario', pos: V(0, 3.55, -6.6), range: 8, size: 0.6,
      text: 'Un lampadario di ferro con otto candele accese. Oscilla appena, anche se non c’è vento.' },
    { name: 'La stanza a destra', pos: V(3.6, 1.4, -3.5), range: 6, size: 1.5,
      text: 'Una biblioteca: scaffali pieni di libri, una lampada accesa e una poltrona di velluto rosso. Ma la soglia è sbarrata: da qui non si entra.' },
    { name: 'Il busto scuro', pos: V(1.5, 1.6, -6.3), range: 4.5, size: 0.35,
      text: 'Un busto di pietra scura su un piedistallo di legno: un uomo anziano, lo sguardo severo. Sembra seguirti mentre passi.' },
    { name: 'Il ritratto', pos: V(1.76, 2.2, -8.2), range: 5.5, size: 0.6,
      text: 'Il ritratto di una donna vestita di scuro. Il volto è quasi cancellato dal tempo, ma gli occhi si vedono ancora bene.' },
    { name: 'Il carillon', pos: V(1.46, 0.92, -10.6), range: 4, size: 0.2,
      text: 'Un carillon di legno con il coperchio aperto e un cilindro d’ottone. Non è carico, eppure ogni tanto suona da solo.' },
    { name: 'La porta in fondo', pos: V(0, 1.35, -15), range: 9, size: 0.9,
      text: 'Una porta ad arco aperta su una stanza più buia. Si intravedono una scrivania e due candele.' },
    { name: 'Il portone d’ingresso', pos: V(0, 1.45, 2.9), range: 6, size: 0.9,
      text: 'Il portone da cui sei entrato. Fuori il cielo è ancora rosso.' },
    { name: 'Il tappeto', pos: V(0, 0, -6), range: 3, size: 0.8,
      text: 'Un lungo tappeto persiano, rosso e blu. Al centro è consumato: qualcuno ci è passato migliaia di volte.' },
  ],
  dining: [
    { name: 'Il camino', pos: V(-3.6, 0.8, -3), range: 8, size: 1.1,
      text: 'Un grande camino di marmo scuro. Il fuoco è stato acceso da poco: la legna non è ancora consumata. Qualcuno sapeva che saresti arrivato.' },
    { name: 'Il dipinto sopra il camino', pos: V(-3.96, 2.45, -3), range: 7, size: 0.8,
      text: 'Un paesaggio al tramonto: una villa di pietra tra i cipressi. È questa villa, dipinta molti anni fa, quando l’edera arrivava solo alle finestre.' },
    { name: 'Il grammofono', pos: V(3.68, 1.1, -2.3), range: 5, size: 0.4,
      text: (c) => (c.gramophone
        ? 'Un grammofono con la tromba d’ottone. Il disco gira: un valzer per violino, un po’ graffiato. Nessuno ha sollevato la puntina, eppure ricomincia ogni volta da capo.'
        : 'Un grammofono con la tromba d’ottone. Il disco è fermo, la puntina sollevata.') },
    { name: 'La tavola', pos: V(0.4, 0.8, -3.2), range: 5, size: 1.2,
      text: 'Una lunga tavola apparecchiata per sei, con piatti di porcellana e bicchieri vuoti. Una sedia, a capotavola, è scostata: come se qualcuno si fosse appena alzato.' },
    { name: 'Il candelabro', pos: V(0.4, 1.15, -3.2), range: 4.5, size: 0.3,
      text: 'Cinque candele accese al centro della tavola. La cera è colata sul runner rosso.' },
    { name: 'Il ritratto con la barba', pos: V(-3.96, 2.2, 0.8), range: 6, size: 0.6,
      text: 'Un uomo con la barba bianca, una mano appoggiata su un mappamondo. Sulla cornice, una targhetta d’ottone con una sola lettera: «E.»' },
    { name: 'Il ritratto con il violino', pos: V(3.96, 2.25, -2.3), range: 6, size: 0.6,
      text: 'Una donna con un violino appoggiato alla spalla. È la stessa donna dei ritratti nel corridoio e nello studio.' },
    { name: 'Il busto di marmo', pos: V(-3.58, 1.5, -7.9), range: 5, size: 0.4,
      text: 'Un busto di marmo chiaro su una colonna. Il viso è girato verso la porta in fondo, come per indicarla.' },
    { name: 'La pendola', pos: V(3.73, 1.4, -7.8), range: 6, size: 0.6,
      text: 'Un orologio a pendolo alto quasi due metri. Il pendolo oscilla, ma le lancette sono ferme alle sette meno cinque.' },
    { name: 'La finestra', pos: V(3.98, 1.75, 0.7), range: 6, size: 0.7,
      text: 'Fuori ormai è sera. Nel vetro si riflette il fuoco del camino.' },
    { name: 'La finestra', pos: V(3.98, 1.75, -5.6), range: 6, size: 0.7,
      text: 'Fuori ormai è sera. Nel vetro si riflette il fuoco del camino.' },
    { name: 'La porta in fondo', pos: V(0, 1.3, -9), range: 10, size: 0.8,
      text: 'Un passaggio più stretto, aperto su un piccolo studio. Una lampada a olio è accesa sulla scrivania.' },
    { name: 'Il mappamondo', pos: V(-0.5, 1.11, -12.42), range: 3.5, size: 0.2,
      text: 'Un mappamondo antico, con i continenti color seppia. Su un’isola senza nome qualcuno ha fatto un piccolo segno a inchiostro.' },
    { name: 'La lente d’ingrandimento', pos: V(0.27, 0.8, -12.1), range: 3, size: 0.12,
      text: 'Una lente d’ingrandimento con il manico d’osso, lasciata proprio accanto al manoscritto. Come un invito.' },
    { name: 'Il manoscritto', pos: V(0, 0.79, -12.18), range: 3.2, size: 0.2,
      text: (c) => (c.read
        ? 'Il manoscritto di E. Ora sai cosa c’è scritto in fondo, nelle righe minuscole.'
        : 'Un foglio scritto a mano, con una calligrafia elegante. In fondo le righe diventano minuscole: a occhio nudo non si leggono. Serve la lente.') },
    { name: 'La lampada a olio', pos: V(0.55, 1.05, -12.45), range: 3.5, size: 0.15,
      text: 'Una lampada a olio con il vetro affumicato. Fa una luce bassa e calda, giusta per leggere.' },
    { name: 'La mappa', pos: V(1.97, 1.75, -11), range: 4, size: 0.6,
      text: 'Una mappa antica. Una linea rossa tratteggiata attraversa le montagne e finisce in un cerchio, accanto alla scritta «Terra incognita».' },
    { name: 'La libreria', pos: V(-1.97, 1.3, -11), range: 4, size: 1.2,
      text: 'Atlanti, diari di viaggio, carte arrotolate. Sul dorso di un quaderno rosso c’è scritto soltanto «1887».' },
  ],
  study: [
    { name: 'La macchina da scrivere', pos: V(0.42, 0.95, -3.75), range: 4, size: 0.25,
      text: 'Una vecchia macchina da scrivere nera, con i tasti tondi color avorio. C’è un foglio infilato nel rullo.',
      extra: (c) => (c.typed ? ' Sopra ci sono parole battute da poco. Nessuno le ha scritte davanti a te.' : ' È bianco.') },
    { name: 'Il foglio', pos: V(-0.12, 0.83, -3.5), range: 3.5, size: 0.2,
      text: (c) => (c.hasInk
        ? 'Il foglio su cui hai scritto il tuo messaggio. L’inchiostro è ancora fresco.'
        : 'Un foglio di carta spessa, ingiallito ai bordi, accanto a una penna e a un calamaio. È bianco: sembra aspettare che qualcuno ci scriva.') },
    { name: 'Le candele', pos: V(-0.62, 1.1, -3.88), range: 3.5, size: 0.2,
      text: 'Un candelabro a due bracci sulla scrivania. È l’unica luce vera della stanza.' },
    { name: 'I libri', pos: V(-0.2, 0.9, -3.92), range: 3, size: 0.2,
      text: 'Tre libri impilati, con le copertine di tela consumate. Nessun titolo sul dorso.' },
    { name: 'La scrivania', pos: V(0, 0.6, -3.7), range: 3.5, size: 0.9,
      text: 'Una scrivania di legno scuro, con il piano lucido e graffiato. Qui qualcuno ha scritto per anni.' },
    { name: 'Il ritratto', pos: V(-0.2, 2, -6.95), range: 8, size: 0.6,
      text: 'Un altro ritratto, nella penombra. È la stessa donna del corridoio, ma qui sorride.' },
    { name: 'La finestra', pos: V(1.9, 1.8, -6.95), range: 8, size: 0.8,
      text: 'Fuori c’è l’ultima luce del tramonto. Il vetro è appannato, come se qualcuno ci avesse respirato sopra.' },
    { name: 'La libreria', pos: V(-2.95, 1.3, -3.6), range: 4.5, size: 1.5,
      text: 'Una parete di libri dal pavimento quasi al soffitto. Uno scaffale è vuoto: manca un solo volume.' },
    { name: 'Il muro', pos: V(2.98, 1.9, -2.6), range: 5, size: 1,
      text: (c) => (c.torch
        ? 'Alla luce della torcia si legge una scritta a mano: «Chi lascia parole non se ne va mai del tutto.»'
        : 'Il muro è troppo buio. Sembra esserci qualcosa scritto. Prova con la torcia.') },
    { name: 'La sedia', pos: V(0.95, 0.5, -2.55), range: 3, size: 0.4,
      text: 'Una sedia imbottita di velluto, spostata di lato. Chi era seduto qui si è alzato in fretta.' },
  ],
};

const f = new THREE.Vector3(), d = new THREE.Vector3();

/**
 * Trova l'oggetto che stai guardando. Ritorna { item, far } dove far=true se è
 * nella direzione dello sguardo ma troppo lontano per osservarlo bene.
 */
export function findObserved(scene, camera) {
  const list = OBSERVABLES[scene] || [];
  f.set(0, 0, -1).applyQuaternion(camera.quaternion);
  let best = null, bestScore = Infinity;
  for (const it of list) {
    d.copy(it.pos).sub(camera.position);
    const dist = d.length();
    const angle = f.angleTo(d.normalize());
    // tolleranza: l'ampiezza apparente dell'oggetto più un margine
    const tol = Math.atan2(it.size, dist) + 0.22;
    if (angle > tol) continue;
    // vince l'oggetto più al centro dello sguardo; a parità, il più vicino
    const score = angle / tol + dist * 0.02;
    if (score < bestScore) { best = it; bestScore = score; }
  }
  if (!best) return null;
  return { item: best, far: camera.position.distanceTo(best.pos) > best.range };
}

export function describe(item, ctx) {
  const base = typeof item.text === 'function' ? item.text(ctx) : item.text;
  return base + (item.extra ? item.extra(ctx) : '');
}
