// Comando «osserva»: descrizioni brevi degli oggetti di ogni scena.
// Ogni voce: nome, posizione, distanza massima da cui si può osservare, testo.
// Il testo può essere una funzione (ctx) => stringa, per descrizioni che cambiano.
import * as THREE from 'three';
import { L } from './i18n.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// le stanze del piano di sopra (x0, x1, z0, z1)
const HALL = [-4, 4, -8, 2], BED = [-9, -4.3, -8, -2.4], ATELIER = [-4, 4, -15.5, -8.3];

export const OBSERVABLES = {
  exterior: [
    { name: L('La villa', 'The villa'), pos: V(0, 5, -1), range: 30, size: 6,
      text: L('Una villa di pietra a tre piani, con le persiane verde scuro. L’edera rossa sale fino al balcone. Alcune finestre sono accese, altre no: qualcuno è in casa, o lo è stato fino a poco fa.', 'A three-storey stone villa with dark green shutters. Red ivy climbs up to the balcony. Some windows are lit, others are not: someone is home, or was until a moment ago.') },
    { name: L('Il portone', 'The front door'), pos: V(0, 1.9, 0.4), range: 12, size: 1.2,
      text: L('Un portone ad arco in legno massiccio, spalancato. Dentro si vede un corridoio illuminato dalle candele. Nessuno è venuto ad accoglierti.', 'An arched door of solid wood, wide open. Inside you can see a corridor lit by candles. Nobody has come to greet you.') },
    { name: L('La lanterna', 'The lantern'), pos: V(0, 4, 0.75), range: 10, size: 0.4,
      text: L('Una lanterna di ferro battuto sopra l’ingresso. La fiamma è stata accesa da poco: il vetro non è ancora annerito.', 'A wrought-iron lantern above the entrance. The flame was lit recently: the glass hasn’t blackened yet.') },
    { name: L('Il balcone', 'The balcony'), pos: V(0, 5.3, 0.6), range: 14, size: 1.6,
      text: L('Un balcone con la ringhiera di ferro. La portafinestra dietro è illuminata, ma le tende sono tirate.', 'A balcony with an iron railing. The French window behind it is lit, but the curtains are drawn.') },
    { name: L('I vasi di terracotta', 'The terracotta pots'), pos: V(2.75, 1.5, 1.3), range: 7, size: 0.8,
      text: L('Grandi orci di terracotta, consumati dal tempo. Qualcuno continua a curare le piante: la terra è ancora umida.', 'Large terracotta jars, worn by time. Someone still tends the plants: the soil is still damp.') },
    { name: L('I vasi di terracotta', 'The terracotta pots'), pos: V(-2.75, 1.5, 1.3), range: 7, size: 0.8,
      text: L('Grandi orci di terracotta, consumati dal tempo. Qualcuno continua a curare le piante: la terra è ancora umida.', 'Large terracotta jars, worn by time. Someone still tends the plants: the soil is still damp.') },
    { name: L('I cipressi', 'The cypresses'), pos: V(-10.5, 6, 1), range: 25, size: 3,
      text: L('Cipressi alti e scuri, quasi neri contro il cielo. Segnano il confine del giardino come sentinelle.', 'Tall, dark cypresses, almost black against the sky. They mark the edge of the garden like sentinels.') },
    { name: L('Il tramonto', 'The sunset'), pos: V(-110, 20, 110), range: 400, size: 30,
      text: L('Il sole scende dietro le colline. Il cielo passa dall’arancio al rosso scuro. Tra poco sarà buio.', 'The sun sinks behind the hills. The sky turns from orange to deep red. Soon it will be dark.') },
    { name: L('L’acero rosso', 'The red maple'), pos: V(3.5, 7, 14), range: 14, size: 4,
      text: L('Un acero dalle foglie rosso scuro. Il vento ne stacca qualcuna e la porta verso la casa.', 'A maple with dark red leaves. The wind tears a few away and carries them towards the house.') },
    { name: L('Il belvedere', 'The terrace'), pos: V(-2.5, 0.8, 24.2), range: 14, size: 2,
      text: (c) => (c.scope
        ? L('Una terrazza rotonda di pietra, affacciata sulla valle. Le due lanterne adesso sono accese.', 'A round stone terrace overlooking the valley. The two lanterns are now lit.')
        : L('Una piccola terrazza rotonda di pietra, affacciata sulla valle. Le lanterne sono spente.', 'A small round stone terrace overlooking the valley. The lanterns are out.')) },
    { name: L('Il cannocchiale', 'The telescope'), pos: V(-2.5, 1.62, 24.4), range: 5, size: 0.3,
      text: (c) => (c.scope
        ? L('Un cannocchiale d’ottone sul treppiede, puntato verso la valle. Il coperchio è stato tolto. Avvicina l’occhio, e osserva bene.', 'A brass telescope on a tripod, pointed at the valley. The cap has been removed. Bring your eye close, and look carefully.')
        : L('Un cannocchiale d’ottone sul treppiede, puntato verso la valle. La lente è chiusa da un coperchio di legno.', 'A brass telescope on a tripod, pointed at the valley. The lens is closed with a wooden cap.')) },
    { name: L('Il binocolo', 'The binoculars'), pos: V(-7.7, 1.3, 10.5), range: 6, size: 0.3,
      text: (c) => (c.bino
        ? L('Un binocolo d’ottone su un piedistallo di ferro, rivolto a ponente. «Guarda con due occhi», diceva la lettera.', 'Brass binoculars on an iron stand, facing west. “Look with two eyes”, the letter said.')
        : L('Un vecchio binocolo d’ottone su un piedistallo, rivolto verso il tramonto. Gli oculari sono appannati.', 'Old brass binoculars on a stand, facing the sunset. The eyepieces are fogged up.')) },
    { name: L('Il muretto', 'The low wall'), pos: V(-10, 0.7, 10), range: 9, size: 2.5,
      text: L('Un muretto di pietra a secco, coperto di muschio. Da qui si vede tutta la valle.', 'A dry-stone wall covered in moss. From here you can see the whole valley.') },
    { name: L('L’ala laterale', 'The side wing'), pos: V(10, 2.3, -1.2), range: 18, size: 2.5,
      text: (c) => (c.unlocked
        ? L('L’ala più bassa della villa. La piccola porta adesso è aperta: dentro brilla la luce di un camino, e si sente della musica. È l’altro ingresso.', 'The lower wing of the villa. The small door is now open: inside glows the light of a fireplace, and you can hear music. It’s the other entrance.')
        : L('Un’ala più bassa della villa, con una piccola porta buia. È chiusa a chiave.', 'A lower wing of the villa, with a small dark door. It’s locked.')) },
  ],
  corridor: [
    { name: L('Il candelabro', 'The candelabra'), pos: V(-1.44, 1.3, -0.75), range: 4.5, size: 0.3,
      text: L('Un candelabro di bronzo a tre bracci, con candele di cera chiara. Le fiamme tremano appena, come se qualcuno fosse passato da poco.', 'A three-armed bronze candelabra with pale wax candles. The flames barely flicker, as if someone had just walked by.') },
    { name: L('Il dipinto', 'The painting'), pos: V(-1.76, 2.25, -1.4), range: 6, size: 1,
      text: L('Un paesaggio a olio in una pesante cornice dorata: una torre su una collina, sotto un cielo scuro. La torre somiglia a qualcosa che hai già visto.', 'An oil landscape in a heavy gilded frame: a tower on a hill under a dark sky. The tower looks like something you’ve seen before.') },
    { name: L('Il vaso di fiori secchi', 'The vase of dried flowers'), pos: V(-1.46, 1.4, -1.6), range: 4, size: 0.35,
      text: L('Un vaso di bronzo con un mazzo di ortensie secche. Erano rosse, molto tempo fa.', 'A bronze vase with a bunch of dried hydrangeas. They were red, a long time ago.') },
    { name: L('Il busto di terracotta', 'The terracotta bust'), pos: V(-1.46, 1.2, -2.35), range: 4, size: 0.25,
      text: L('Un piccolo busto di terracotta: un giovane dai capelli ricci. È girato verso la porta, come se aspettasse qualcuno.', 'A small terracotta bust: a young man with curly hair. It faces the door, as if waiting for someone.') },
    { name: L('La credenza', 'The sideboard'), pos: V(-1.5, 0.6, -1.5), range: 3.5, size: 0.8,
      text: L('Una credenza in noce scuro, intagliata a mano. I cassetti sono chiusi a chiave.', 'A hand-carved dark walnut sideboard. The drawers are locked.') },
    { name: L('Il trofeo di cervo', 'The deer trophy'), pos: V(-1.72, 2.7, -7.95), range: 6, size: 0.45,
      text: L('Un cranio di cervo con i palchi, appeso al muro. È lì da così tanto che la polvere l’ha reso grigio.', 'A deer skull with antlers, hanging on the wall. It has been there so long the dust has turned it grey.') },
    { name: L('L’armadio', 'The wardrobe'), pos: V(-1.47, 1.3, -5.4), range: 4.5, size: 0.8,
      text: (c) => (c.wardrobe
        ? L('Le ante sono aperte. Dentro, su un ripiano, la fotografia di una donna e una lettera piegata in due.', 'The doors are open. Inside, on a shelf, there’s a photograph of a woman and a letter folded in two.')
        : L('Un alto armadio a due ante, chiuso da un lucchetto a combinazione: tre rotelle d’ottone.', 'A tall two-door wardrobe, closed with a combination padlock: three brass wheels.')) },
    { name: L('Il lucchetto', 'The padlock'), pos: V(-1.1, 1.27, -5.4), range: 3, size: 0.12,
      text: (c) => (c.wardrobe
        ? L('Il lucchetto aperto pende dall’occhiello.', 'The open padlock hangs from the hasp.')
        : c.code
          ? L('Tre rotelle, tre cifre. Quelle che hai visto nella valle potrebbero essere la chiave.', 'Three wheels, three digits. The ones you saw in the valley could be the key.')
          : L('Un lucchetto d’ottone con tre rotelle numerate. Servono tre cifre: qui intorno non c’è scritto niente.', 'A brass padlock with three numbered wheels. Three digits are needed: nothing is written anywhere around here.')) },
    { name: L('Il lampadario', 'The chandelier'), pos: V(0, 3.55, -6.6), range: 8, size: 0.6,
      text: L('Un lampadario di ferro con otto candele accese. Oscilla appena, anche se non c’è vento.', 'An iron chandelier with eight lit candles. It sways slightly, even though there’s no wind.') },
    { name: L('La biblioteca', 'The library'), pos: V(3.6, 1.4, -3.5), range: 6, size: 1.5,
      text: (c) => (c.library
        ? L('La doppia porta adesso è aperta. Dentro: scaffali fino al soffitto, una poltrona di velluto rosso, un leggio con un vecchio libro aperto e un dipinto enorme della valle. Qui c’è il libro che amavano entrambi.', 'The double door is open now. Inside: shelves up to the ceiling, a red velvet armchair, a lectern with an old open book, and a huge painting of the valley. The book they both loved is somewhere here.')
        : L('Una biblioteca, dietro una doppia porta chiusa. Dalle fessure filtra la luce di una lampada. È sbarrata: da qui, per ora, non si entra.', 'A library, behind a closed double door. Lamplight seeps through the cracks. It is barred: for now, there’s no way in.')) },
    { name: L('Un libro dal dorso dorato', 'A book with a gilded spine'), pos: V(5.82, 1.45, -2.4), range: 3.5, size: 0.15,
      text: (c) => (c.novelRead
        ? L('«Il Custode delle Lanterne», di M. Ashcombe. Sul margine dell’ultima pagina c’è un indovinello scritto a matita.', '“The Lantern Keeper”, by M. Ashcombe. In the margin of the last page there is a riddle written in pencil.')
        : L('Un solo libro sporge dagli scaffali, e il suo dorso dorato si legge benissimo: «Il Custode delle Lanterne», M. Ashcombe, 1831.', 'A single book sticks out from the shelves, and its gilded spine is easy to read: “The Lantern Keeper”, M. Ashcombe, 1831.')) },
    { name: L('Lo scaffale con la targhetta', 'The shelf with the brass plate'), pos: V(3.6, 1.35, -6.05), range: 4.5, size: 0.6,
      text: (c) => (c.shelfSolved
        ? L('Lo scaffale si è aperto in due. Nella nicchia, su un piccolo leggio, c’è un grande libro antico.', 'The shelf has split in two. In the niche, on a small stand, lies a large ancient book.')
        : L('Otto libri con una lettera dorata sul dorso. Sotto i primi quattro, una targhetta d’ottone senza scritte. I libri si possono spostare.', 'Eight books with a gilded letter on the spine. Under the first four, a blank brass plate. The books can be moved.')) },
    { name: L('Il leggio', 'The lectern'), pos: V(4.7, 1.1, -1.5), range: 3.5, size: 0.3,
      text: L('Un leggio di legno, girato verso la porta come se aspettasse qualcuno. Sopra c’è un libro antico aperto: un’incisione con delle figure incappucciate che portano lanterne verso un altare.', 'A wooden lectern, turned towards the door as if waiting for someone. On it lies an old open book: an engraving of hooded figures carrying lanterns towards an altar.') },
    { name: L('Il grande dipinto', 'The great painting'), pos: V(4.0, 2.1, -0.65), range: 7, size: 1.6,
      text: L('Un dipinto enorme, quasi tutta la parete: un lago al tramonto fra pareti di roccia, un paese di legno sulla riva, una lanterna gigantesca che galleggia sull’acqua. Ovunque, piccole luci. La villa c’è, ma bisogna cercarla.', 'A huge painting, almost the whole wall: a lake at sunset between walls of rock, a wooden village on the shore, a gigantic lantern floating on the water. Small lights everywhere. The villa is there, but you have to look for it.') },
    { name: L('La poltrona', 'The armchair'), pos: V(4.1, 0.7, -4.3), range: 4, size: 0.5,
      text: L('Una poltrona di velluto rosso, consumata sui braccioli. Accanto, la lampada a stelo è accesa, come se qualcuno stesse per tornare a leggere.', 'A red velvet armchair, worn on the arms. Beside it the floor lamp is lit, as if someone were about to come back and read.') },
    { name: L('Il busto scuro', 'The dark bust'), pos: V(1.5, 1.6, -6.3), range: 4.5, size: 0.35,
      text: L('Un busto di pietra scura su un piedistallo di legno: un uomo anziano, lo sguardo severo. Sembra seguirti mentre passi.', 'A dark stone bust on a wooden pedestal: an old man with a stern gaze. He seems to follow you as you pass.') },
    { name: L('Il ritratto', 'The portrait'), pos: V(1.76, 2.2, -8.2), range: 5.5, size: 0.6,
      text: L('Il ritratto di una donna vestita di scuro. Il volto è quasi cancellato dal tempo, ma gli occhi si vedono ancora bene.', 'The portrait of a woman dressed in black. Time has almost erased her face, but her eyes can still be seen clearly.') },
    { name: L('Il carillon', 'The music box'), pos: V(1.46, 0.92, -10.6), range: 4, size: 0.2,
      text: L('Un carillon di legno con il coperchio aperto e un cilindro d’ottone. Non è carico, eppure ogni tanto suona da solo.', 'A wooden music box with an open lid and a brass cylinder. It isn’t wound, and yet now and then it plays by itself.') },
    { name: L('La porta in fondo', 'The door at the end'), pos: V(0, 1.35, -15), range: 9, size: 0.9,
      text: L('Una porta ad arco aperta su una stanza più buia. Si intravedono una scrivania e due candele.', 'An arched door opening onto a darker room. You can make out a desk and two candles.') },
    { name: L('Il portone d’ingresso', 'The front door'), pos: V(0, 1.45, 2.9), range: 6, size: 0.9,
      text: L('Il portone da cui sei entrato. Fuori il cielo è ancora rosso.', 'The door you came in through. Outside, the sky is still red.') },
    { name: L('Il tappeto', 'The carpet'), pos: V(0, 0, -6), range: 3, size: 0.8,
      text: L('Un lungo tappeto persiano, rosso e blu. Al centro è consumato: qualcuno ci è passato migliaia di volte.', 'A long red and blue Persian runner. It’s worn in the middle: someone has walked it thousands of times.') },
  ],
  dining: [
    { name: L('Il camino', 'The fireplace'), pos: V(-3.6, 0.8, -3), range: 8, size: 1.1,
      text: L('Un grande camino di marmo scuro. Il fuoco è stato acceso da poco: la legna non è ancora consumata. Qualcuno sapeva che saresti arrivato.', 'A large dark marble fireplace. The fire was lit recently: the wood isn’t burnt down yet. Someone knew you were coming.') },
    { name: L('Il dipinto sopra il camino', 'The painting above the fireplace'), pos: V(-3.96, 2.45, -3), range: 7, size: 0.8,
      text: L('Un paesaggio al tramonto: una villa di pietra tra i cipressi. È questa villa, dipinta molti anni fa, quando l’edera arrivava solo alle finestre.', 'A landscape at sunset: a stone villa among cypresses. It’s this villa, painted many years ago, when the ivy only reached the windows.') },
    { name: L('Il grammofono', 'The gramophone'), pos: V(3.68, 1.1, -2.3), range: 5, size: 0.4,
      text: (c) => (c.gramophone
        ? L('Un grammofono con la tromba d’ottone. Il disco gira: un valzer per violino, un po’ graffiato. Nessuno ha sollevato la puntina, eppure ricomincia ogni volta da capo.', 'A gramophone with a brass horn. The record spins: a waltz for violin, a little scratched. Nobody has lifted the needle, yet it starts over every time.')
        : L('Un grammofono con la tromba d’ottone. Il disco è fermo, la puntina sollevata.', 'A gramophone with a brass horn. The record has stopped, the needle lifted.')) },
    { name: L('La tavola', 'The table'), pos: V(0.4, 0.8, -3.2), range: 5, size: 1.2,
      text: L('Una lunga tavola apparecchiata per sei, con piatti di porcellana e bicchieri vuoti. Una sedia, a capotavola, è scostata: come se qualcuno si fosse appena alzato.', 'A long table set for six, with porcelain plates and empty glasses. One chair, at the head, is pushed back: as if someone had just stood up.') },
    { name: L('Il candelabro', 'The candelabra'), pos: V(0.4, 1.15, -3.2), range: 4.5, size: 0.3,
      text: L('Cinque candele accese al centro della tavola. La cera è colata sul runner rosso.', 'Five lit candles in the middle of the table. The wax has dripped onto the red runner.') },
    { name: L('Il ritratto con la barba', 'The bearded portrait'), pos: V(-3.96, 2.2, 0.8), range: 6, size: 0.6,
      text: L('Un uomo con la barba bianca, una mano appoggiata su un mappamondo. Sulla cornice, una targhetta d’ottone con una sola lettera: «E.»', 'A man with a white beard, one hand resting on a globe. On the frame, a brass plate with a single letter: “E.”') },
    { name: L('Il ritratto con il violino', 'The portrait with the violin'), pos: V(3.96, 2.25, -2.3), range: 6, size: 0.6,
      text: L('Una donna con un violino appoggiato alla spalla. È la stessa donna dei ritratti nel corridoio e nello studio.', 'A woman with a violin resting on her shoulder. She is the same woman as in the portraits in the corridor and the study.') },
    { name: L('Il busto di marmo', 'The marble bust'), pos: V(-3.58, 1.5, -7.9), range: 5, size: 0.4,
      text: L('Un busto di marmo chiaro su una colonna. Il viso è girato verso la porta in fondo, come per indicarla.', 'A pale marble bust on a column. Its face is turned towards the door at the end, as if pointing to it.') },
    { name: L('La pendola', 'The grandfather clock'), pos: V(3.73, 1.4, -7.8), range: 6, size: 0.6,
      text: L('Un orologio a pendolo alto quasi due metri. Il pendolo oscilla, ma le lancette sono ferme alle sette meno cinque.', 'A pendulum clock almost two metres tall. The pendulum swings, but the hands are stuck at five to seven.') },
    { name: L('La finestra', 'The window'), pos: V(3.98, 1.75, 0.7), range: 6, size: 0.7,
      text: L('Fuori ormai è sera. Nel vetro si riflette il fuoco del camino.', 'Outside, evening has fallen. The fire is reflected in the glass.') },
    { name: L('La finestra', 'The window'), pos: V(3.98, 1.75, -5.6), range: 6, size: 0.7,
      text: L('Fuori ormai è sera. Nel vetro si riflette il fuoco del camino.', 'Outside, evening has fallen. The fire is reflected in the glass.') },
    { name: L('La porta in fondo', 'The door at the end'), pos: V(0, 1.3, -9), range: 10, size: 0.8,
      text: L('Un passaggio più stretto, aperto su un piccolo studio. Una lampada a olio è accesa sulla scrivania.', 'A narrower passage, opening onto a small study. An oil lamp is lit on the desk.') },
    { name: L('Il mappamondo', 'The globe'), pos: V(-0.5, 1.11, -12.42), range: 3.5, size: 0.2,
      text: L('Un mappamondo antico, con i continenti color seppia. Su un’isola senza nome qualcuno ha fatto un piccolo segno a inchiostro.', 'An antique globe with sepia continents. On a nameless island someone has made a small ink mark.') },
    { name: L('La lente d’ingrandimento', 'The magnifying glass'), pos: V(0.27, 0.8, -12.1), range: 3, size: 0.12,
      text: L('Una lente d’ingrandimento con il manico d’osso, lasciata proprio accanto al manoscritto. Come un invito.', 'A magnifying glass with a bone handle, left right next to the manuscript. Like an invitation.') },
    { name: L('Il manoscritto', 'The manuscript'), pos: V(0, 0.79, -12.18), range: 3.2, size: 0.2,
      text: (c) => (c.read
        ? L('Il manoscritto di E. Ora sai cosa c’è scritto in fondo, nelle righe minuscole.', 'E.’s manuscript. Now you know what is written at the bottom, in the tiny lines.')
        : L('Un foglio scritto a mano, con una calligrafia elegante. In fondo le righe diventano minuscole: a occhio nudo non si leggono. Serve la lente.', 'A handwritten page in elegant script. At the bottom the lines become tiny: you can’t read them with the naked eye. You need the magnifying glass.')) },
    { name: L('La lampada a olio', 'The oil lamp'), pos: V(0.55, 1.05, -12.45), range: 3.5, size: 0.15,
      text: L('Una lampada a olio con il vetro affumicato. Fa una luce bassa e calda, giusta per leggere.', 'An oil lamp with smoked glass. It gives a low, warm light, just right for reading.') },
    { name: L('La mappa', 'The map'), pos: V(1.97, 1.75, -11), range: 4, size: 0.6,
      text: L('Una mappa antica. Una linea rossa tratteggiata attraversa le montagne e finisce in un cerchio, accanto alla scritta «Terra incognita».', 'An old map. A dashed red line crosses the mountains and ends in a circle, next to the words “Terra incognita”.') },
    { name: L('La libreria', 'The bookcase'), pos: V(-1.97, 1.3, -11), range: 4, size: 1.2,
      text: L('Atlanti, diari di viaggio, carte arrotolate. Sul dorso di un quaderno rosso c’è scritto soltanto «1887».', 'Atlases, travel diaries, rolled-up maps. On the spine of a red notebook there is only “1887”.') },
  ],
  // il piano di sopra: «area» limita ogni voce alla sua stanza (salone, camera, atelier), perché le pareti non nascondono le descrizioni
  upper: [
    { name: L('Il salone', 'The great hall'), pos: V(0, 2.4, -3.5), range: 9, size: 3, area: HALL,
      text: L('Il salone dei ricevimenti. Le poltrone sono rivolte verso il centro, come se aspettassero ancora gli ospiti. Sotto la polvere, sul parquet, si indovinano i segni di molti passi di danza.', 'The reception hall. The armchairs face the middle, as if still waiting for guests. Under the dust, on the parquet, you can make out the marks of many dance steps.') },
    { name: L('Il pianoforte', 'The piano'), pos: V(2.4, 0.9, -4.6), range: 5, size: 0.9, area: HALL,
      text: L('Un pianoforte a coda, chiuso. Sul leggio c’è uno spartito a quattro mani: una parte è fitta di annotazioni a matita, l’altra è intatta, come se nessuno l’avesse mai suonata.', 'A grand piano, closed. On the stand, a piece for four hands: one part is full of pencil notes, the other untouched, as if no one had ever played it.') },
    { name: L('Le finestre', 'The windows'), pos: V(4, 2.3, -3.4), range: 9, size: 2.2, area: HALL,
      text: L('Tre finestre alte, accese dal tramonto. Da quassù si vede tutto il lago, il paese di legno con il campanile bianco sulla riva e, in alto sulla roccia, il vecchio altare.', 'Three tall windows, lit by the sunset. From up here you can see the whole lake, the wooden village with its white bell tower on the shore and, high on the rock, the old altar.') },
    { name: L('La lanterna', 'The lantern'), pos: V(-3.75, 1.05, -0.8), range: 4, size: 0.25, area: HALL,
      text: L('Una lanterna d’ottone su una consolle, spenta da molto tempo. Sul vetro qualcuno ha inciso una sola lettera, piccola: L.', 'A brass lantern on a console table, out for a long time. On the glass someone has scratched a single small letter: L.') },
    { name: L('I ritratti', 'The portraits'), pos: V(-4, 2.3, -3.2), range: 7, size: 2.4, area: HALL,
      text: L('Ritratti di famiglia, scuriti dal tempo. Uno manca: resta un chiodo e un rettangolo più chiaro sulla carta da parati, dove per anni non è arrivata la luce.', 'Family portraits, darkened by time. One is missing: a nail is left, and a paler rectangle on the wallpaper where the light never reached for years.') },
    { name: L('La porta chiusa', 'The closed door'), pos: V(2.6, 1.2, 1.9), range: 5, size: 0.7, area: HALL,
      text: L('Una porta chiusa a chiave. Alla maniglia è legato un nastro rosso, sbiadito. Il genere di nastro che si lega a un regalo.', 'A locked door. A faded red ribbon is tied to the handle: the kind of ribbon you tie around a present.') },
    { name: L('Il letto', 'The bed'), pos: V(-6.4, 0.6, -6.9), range: 5, size: 1, area: BED,
      text: L('Un letto rifatto con cura, senza una piega. Uno dei due cuscini non ha mai preso la forma di una testa.', 'A carefully made bed, without a crease. One of the two pillows has never taken the shape of a head.') },
    { name: L('La fotografia sul comodino', 'The photograph on the nightstand'), pos: V(-7.4, 0.72, -7.58), range: 3, size: 0.15, area: BED,
      text: L('Una cornice d’argento: la ragazza della fotografia nell’armadio, ma più giovane, forse diciassette anni. Tiene in mano una lanterna e guarda qualcuno fuori dall’inquadratura.', 'A silver frame: the girl from the photograph in the wardrobe, but younger, perhaps seventeen. She holds a lantern and looks at someone outside the picture.') },
    { name: L('La finestra della camera', 'The bedroom window'), pos: V(-9, 2, -5.2), range: 6, size: 1.2, area: BED,
      text: L('La finestra dà sulla strada che costeggia il lago e scende verso la ferrovia. All’incrocio, un vecchio cartello consumato: il nome della capitale non si legge più, resta solo una freccia.', 'The window looks over the road that follows the lake down to the railway. At the crossroads, an old worn sign: the name of the capital can no longer be read, only an arrow remains.') },
    { name: L('Il cappotto', 'The coat'), pos: V(-8.2, 0.9, -3.4), range: 4, size: 0.5, area: BED,
      text: L('Un cappotto di lana sullo schienale, come se qualcuno dovesse uscire da un momento all’altro. In tasca, un biglietto del treno per la capitale, mai obliterato.', 'A wool coat over the back of the chair, as if someone were about to go out. In the pocket, a train ticket to the capital, never stamped.') },
    { name: L('La vetrata', 'The great window'), pos: V(0, 2.1, -15.5), range: 9, size: 3.6, area: ATELIER,
      text: L('Il lago al tramonto, lo stesso del grande dipinto della biblioteca: stesso punto, stessa ora, stessa luce. È da qui che è stato dipinto. Stasera però, sull’acqua, non galleggia nessuna lanterna.', 'The lake at sunset, the same as in the great painting in the library: same spot, same hour, same light. This is where it was painted from. Tonight, though, no lantern floats on the water.') },
    { name: L('La tela incompiuta', 'The unfinished canvas'), pos: V(-1.6, 1.25, -12.1), range: 4, size: 0.5, area: ATELIER,
      text: L('Una tela appena abbozzata: una ragazza di spalle, i capelli raccolti. Poi più niente. Il pennello è ancora appoggiato al cavalletto, la pittura secca da anni.', 'A canvas barely sketched: a girl seen from behind, her hair pinned up. Then nothing more. The brush still rests on the easel, the paint dry for years.') },
    { name: L('Il quadro coperto', 'The covered painting'), pos: V(2.3, 1.2, -11.3), range: 4, size: 0.55, area: ATELIER,
      text: L('Un quadro coperto da un telo, fermato con delle puntine. Chi l’ha coperto non voleva che qualcuno lo guardasse. Forse nemmeno lui.', 'A painting covered by a cloth, pinned down. Whoever covered it didn’t want anyone to look at it. Perhaps not even himself.') },
    { name: L('Le lettere', 'The letters'), pos: V(-3.1, 0.86, -9.75), range: 3.5, size: 0.25, area: ATELIER,
      text: L('Un fascio di lettere legate con un nastro rosso. Francobolli stranieri, sbiaditi; il timbro è sempre quello della capitale. La calligrafia è sempre la stessa, rotonda e gentile. Il nastro non è mai stato sciolto.', 'A bundle of letters tied with a red ribbon. Faded foreign stamps; the postmark is always from the capital. Always the same handwriting, round and kind. The ribbon has never been untied.') },
    { name: L('Gli schizzi', 'The sketches'), pos: V(-4, 1.9, -12.4), range: 5, size: 1.4, area: ATELIER,
      text: L('Schizzi a matita appuntati al muro: mani, lanterne, una finestra al tramonto. E sempre la stessa ragazza, sempre di spalle, come se lui non avesse mai avuto il coraggio di disegnarle il viso.', 'Pencil sketches pinned to the wall: hands, lanterns, a window at sunset. And always the same girl, always from behind, as if he never had the courage to draw her face.') },
  ],
  study: [
    { name: L('La macchina da scrivere', 'The typewriter'), pos: V(0.42, 0.95, -3.75), range: 4, size: 0.25,
      text: L('Una vecchia macchina da scrivere nera, con i tasti tondi color avorio. C’è un foglio infilato nel rullo.', 'An old black typewriter with round ivory keys. There is a sheet of paper in the roller.'),
      extra: (c) => (c.typed ? L(' Sopra ci sono parole battute da poco. Nessuno le ha scritte davanti a te.', ' On it are freshly typed words. Nobody typed them in front of you.') : L(' È bianco.', ' It’s blank.')) },
    { name: L('Il foglio', 'The sheet'), pos: V(-0.12, 0.83, -3.5), range: 3.5, size: 0.2,
      text: (c) => (c.hasInk
        ? L('Il foglio su cui hai scritto il tuo messaggio. L’inchiostro è ancora fresco.', 'The sheet on which you wrote your message. The ink is still fresh.')
        : L('Un foglio di carta spessa, ingiallito ai bordi, accanto a una penna e a un calamaio. È bianco: sembra aspettare che qualcuno ci scriva.', 'A sheet of thick paper, yellowed at the edges, next to a pen and an inkwell. It’s blank: it seems to be waiting for someone to write on it.')) },
    { name: L('Le candele', 'The candles'), pos: V(-0.62, 1.1, -3.88), range: 3.5, size: 0.2,
      text: L('Un candelabro a due bracci sulla scrivania. È l’unica luce vera della stanza.', 'A two-armed candelabra on the desk. It’s the only real light in the room.') },
    { name: L('I libri', 'The books'), pos: V(-0.2, 0.9, -3.92), range: 3, size: 0.2,
      text: L('Tre libri impilati, con le copertine di tela consumate. Nessun titolo sul dorso.', 'Three stacked books with worn cloth covers. No title on the spine.') },
    { name: L('La scrivania', 'The desk'), pos: V(0, 0.6, -3.7), range: 3.5, size: 0.9,
      text: L('Una scrivania di legno scuro, con il piano lucido e graffiato. Qui qualcuno ha scritto per anni.', 'A dark wooden desk with a polished, scratched top. Someone wrote here for years.') },
    { name: L('Il ritratto', 'The portrait'), pos: V(-0.2, 2, -6.95), range: 8, size: 0.6,
      text: L('Un altro ritratto, nella penombra. È la stessa donna del corridoio, ma qui sorride.', 'Another portrait, in the half-light. It’s the same woman as in the corridor, but here she smiles.') },
    { name: L('La finestra', 'The window'), pos: V(1.9, 1.8, -6.95), range: 8, size: 0.8,
      text: L('Fuori c’è l’ultima luce del tramonto. Il vetro è appannato, come se qualcuno ci avesse respirato sopra.', 'Outside is the last light of sunset. The glass is misted, as if someone had breathed on it.') },
    { name: L('La libreria', 'The bookcase'), pos: V(-2.95, 1.3, -3.6), range: 4.5, size: 1.5,
      text: L('Una parete di libri dal pavimento quasi al soffitto. Uno scaffale è vuoto: manca un solo volume.', 'A wall of books from floor almost to ceiling. One shelf is empty: a single volume is missing.') },
    { name: L('Il muro', 'The wall'), pos: V(2.98, 1.9, -2.6), range: 5, size: 1,
      text: (c) => (c.torch
        ? L('Alla luce della torcia si legge una scritta a mano: «Chi lascia parole non se ne va mai del tutto.»', 'In the torchlight you can read handwriting: “Those who leave words never truly go away.”')
        : L('Il muro è troppo buio. Sembra esserci qualcosa scritto. Prova con la torcia.', 'The wall is too dark. Something seems to be written on it. Try the torch.')) },
    { name: L('La sedia', 'The chair'), pos: V(0.95, 0.5, -2.55), range: 3, size: 0.4,
      text: L('Una sedia imbottita di velluto, spostata di lato. Chi era seduto qui si è alzato in fretta.', 'A padded velvet chair, pushed to one side. Whoever sat here got up in a hurry.') },
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
  const c = camera.position;
  for (const it of list) {
    if (it.area && !(c.x >= it.area[0] && c.x <= it.area[1] && c.z >= it.area[2] && c.z <= it.area[3])) continue; // un'altra stanza
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
