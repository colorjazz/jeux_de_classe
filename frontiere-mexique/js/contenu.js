// Contenu textuel de l'expérience : répliques, sas, témoignages.
// Tous les personnages sont FICTIFS : ce sont des personnages composites inspirés
// de récits de migrants documentés (presse, recherche, associations).
// Les voix parlent espagnol (migrants) et anglais (agents). Les sous-titres sont
// en français (fr) ou en anglais (en) ; sans « en », le texte original est déjà anglais.

window.CONTENU = {
  // Fragments affichés dans le sas d'entrée (la « hielera », la cellule froide).
  sas: [
    "Novembre. Désert de Sonora. Quelque part entre le Mexique et l'Arizona.",
    "La nuit, il fait 4 °C. Le jour, le sable dépasse 40 °C.",
    "Sur le sol, ce que d'autres ont laissé : une chaussure d'enfant, une bouteille peinte en noir pour ne pas briller sous la lune, un chapelet.",
    "Vous ne jouez pas un rôle.<br>Vous marchez avec eux.",
  ],

  // "qui" = personnage qui parle ; "ton" = intention de jeu pour la synthèse du navigateur ;
  // "direction" = indication d'acteur pour les voix générées (en anglais, comme le modèle l'attend) ;
  // "texte" = ce qui est dit ; "fr" / "en" = sous-titres.
  // Une voix enregistrée peut remplacer la synthèse : voir docs/script-enregistrement.md.
  repliques: {
    // Le mur
    murAttente:    { qui: "guia", ton: "chuchote", direction: "Whisper tensely in Spanish, a stern Mexican guide giving orders at night, low and gravelly: ", texte: "Uno por uno. Rápido y sin ruido.", fr: "Un par un. Vite, et sans bruit.", en: "One at a time. Fast, and no noise." },
    murMateo:      { qui: "rosa", ton: "tendre", direction: "Whisper tenderly in Spanish, a frightened mother reassuring her 9-year-old son as he climbs, voice gentle but shaking: ", texte: "Agárrate fuerte, mijo. No mires abajo.", fr: "Tiens-toi bien, mon chéri. Ne regarde pas en bas.", en: "Hold on tight, sweetie. Don't look down." },
    murJoueur:     { qui: "julio", ton: "presse", direction: "Whisper urgently in Spanish, a young Salvadoran man hurrying a companion, half-whisper, half-hiss: ", texte: "¡Sube! ¡Te toca!", fr: "Monte ! C'est ton tour !", en: "Climb! It's your turn!" },
    murApres:      { qui: "guia", ton: "chuchote", direction: "Whisper in Spanish, slightly out of breath after climbing a wall, grim and serious: ", texte: "Ya estamos del otro lado. Ahora empieza lo difícil.", fr: "On est de l'autre côté. Maintenant, le plus dur commence.", en: "We're on the other side. Now the hard part begins." },
    // Première marche : le calme, les présentations
    depart:        { qui: "guia", ton: "chuchote", direction: "Whisper firmly in Spanish, a stern guide giving strict instructions in the dark, cold and controlled: ", texte: "Sin luces. Sin hablar. Caminen detrás de mí.", fr: "Pas de lumière. Pas un mot. Marchez derrière moi.", en: "No lights. No talking. Walk behind me." },
    enfant:        { qui: "mateo", ton: "fatigue", direction: "Say in Spanish as a tired 9-year-old boy, small whiny voice, walking for hours at night: ", texte: "Mami… ¿falta mucho?", fr: "Maman… c'est encore loin ?", en: "Mom… is it much farther?" },
    mere:          { qui: "rosa", ton: "tendre", direction: "Whisper softly in Spanish to her little boy, warm, comforting, hiding her own worry: ", texte: "Ya casi, mijo. Ya casi.", fr: "Presque, mon chéri. Presque.", en: "Almost there, sweetie. Almost." },
    yesenia1:      { qui: "yesenia", ton: "tendre", direction: "Whisper shyly in Spanish, a 19-year-old indigenous Guatemalan girl, Spanish is not her first language, hesitant and gentle: ", texte: "Me llamo Yesenia. ¿Y tú?", fr: "Je m'appelle Yesenia. Et toi ?", en: "My name is Yesenia. And you?" },
    yesenia2:      { qui: "yesenia", ton: "tendre", direction: "Whisper in Spanish with a small sad smile, shy and soft, a little embarrassed: ", texte: "…No hablas mucho. Yo tampoco.", fr: "… Tu ne parles pas beaucoup. Moi non plus.", en: "…You don't talk much. Me neither." },
    julio1:        { qui: "julio", ton: "triste", direction: "Say quietly in Spanish, a 27-year-old father missing his daughter, voice catching with emotion, holding back tears: ", texte: "Mi hija tiene cinco años. Está en Los Ángeles. Ya ni se acuerda de mi cara.", fr: "Ma fille a cinq ans. Elle est à Los Angeles. Elle ne se souvient même plus de mon visage.", en: "My daughter is five. She's in Los Angeles. She doesn't even remember my face anymore." },
    coyoteEnfant:  { qui: "mateo", ton: "peur", direction: "Whisper in Spanish as a scared 9-year-old boy hearing howls in the dark, trembling voice: ", texte: "Mami, ¿qué es eso?", fr: "Maman, c'est quoi ça ?", en: "Mom, what's that?" },
    coyoteMere:    { qui: "rosa", ton: "chuchote", direction: "Whisper in Spanish, a mother calming her son while she is scared too, tight, quick, protective: ", texte: "Coyotes. No me sueltes la mano.", fr: "Des coyotes. Ne lâche pas ma main.", en: "Coyotes. Don't let go of my hand." },
    cruz1:         { qui: "yesenia", ton: "triste", direction: "Whisper in Spanish, stopping in front of a roadside cross in the desert, hushed and shaken: ", texte: "Aquí murió alguien.", fr: "Quelqu'un est mort ici.", en: "Someone died here." },
    cruz2:         { qui: "rosa", ton: "triste", direction: "Murmur a short prayer in Spanish, slow, reverent, sorrowful: ", texte: "Que Dios lo tenga en su gloria.", fr: "Que Dieu l'accueille.", en: "May God rest their soul." },
    // La halte
    halte:         { qui: "guia", ton: "chuchote", direction: "Whisper in Spanish, a tired guide allowing a short rest, curt but low: ", texte: "Descansen. Cinco minutos. Nada más.", fr: "Reposez-vous. Cinq minutes. Pas plus.", en: "Rest. Five minutes. No more." },
    eau:           { qui: "julio", ton: "tendre", direction: "Say softly in Spanish, a young man offering a little water to a companion, kind and careful: ", texte: "Toma. Poquito, ¿eh? Hay que guardar.", fr: "Tiens. Juste un peu, hein ? Il faut en garder.", en: "Here. Just a little, okay? We have to save it." },
    eauMerci:      { qui: "julio", ton: "tendre", direction: "Murmur gently in Spanish, encouraging someone to drink slowly, warm: ", texte: "Así. Despacito.", fr: "Voilà. Doucement.", en: "That's it. Slowly." },
    berceuse:      { qui: "rosa", ton: "berceuse", direction: "Sing very softly in Spanish, a gentle lullaby hummed by an exhausted mother to her sleeping child, fragile, almost a whisper: ", texte: "Duérmete, mi niño, duérmete ya…", fr: "Dors, mon petit, dors maintenant…", en: "Sleep, my little one, go to sleep…" },
    ernestoHalte:  { qui: "ernesto", ton: "triste", direction: "Say slowly in Spanish, a 61-year-old Mexican farmer, tired, nostalgic and tender, speaking about his son: ", texte: "Mi hijo me espera en Phoenix. Hace nueve años que no lo veo.", fr: "Mon fils m'attend à Phoenix. Ça fait neuf ans que je ne l'ai pas vu.", en: "My son is waiting for me in Phoenix. I haven't seen him in nine years." },
    repart:        { qui: "guia", ton: "presse", direction: "Whisper urgently in Spanish, a guide getting the group back on their feet, impatient: ", texte: "Vámonos. Arriba, arriba.", fr: "On y va. Debout, debout.", en: "Let's go. Up, up." },
    // Deuxième marche : la fatigue, la peur
    rythme:        { qui: "guia", ton: "presse", direction: "Whisper sharply in Spanish, pressing the group to walk faster, tense: ", texte: "Rápido. Antes de que salga el sol.", fr: "Plus vite. Avant que le soleil se lève.", en: "Faster. Before the sun comes up." },
    froid:         { qui: "mateo", ton: "fatigue", direction: "Say in Spanish as a 9-year-old boy shivering with cold, teeth chattering, small voice: ", texte: "Mami, tengo frío.", fr: "Maman, j'ai froid.", en: "Mom, I'm cold." },
    soif:          { qui: "ernesto", ton: "fatigue", direction: "Say in Spanish, an exhausted old man with a dry throat, hoarse, weak, out of breath: ", texte: "Agua… ¿queda agua?", fr: "De l'eau… il reste de l'eau ?", en: "Water… is there any water left?" },
    soifReponse:   { qui: "julio", ton: "triste", direction: "Say quietly in Spanish, a young man sadly telling an old man there is no water left, gentle and sorry: ", texte: "Ya no queda, don Ernesto. Aguante.", fr: "Il n'en reste plus, don Ernesto. Tenez bon.", en: "There's none left, Don Ernesto. Hang on." },
    fausseAlerte:  { qui: "guia", ton: "presse", direction: "Hiss urgently in Spanish, a sudden whispered warning, sharp and frightened: ", texte: "¡Quietos! ¡Abajo! No se muevan.", fr: "Stop ! À terre ! Ne bougez plus.", en: "Freeze! Get down! Don't move." },
    fausseFin:     { qui: "guia", ton: "chuchote", direction: "Whisper in Spanish with relief, exhaling, still tense: ", texte: "Ya pasó. Era la carretera. Vámonos.", fr: "C'est passé. C'était la route. On y va.", en: "It's gone. It was the road. Let's go." },
    attendre:      { qui: "julio", ton: "presse", direction: "Call out in a loud whisper in Spanish to someone falling behind, impatient and worried: ", texte: "¡Oye! ¡Apúrate!", fr: "Hé ! Dépêche-toi !", en: "Hey! Hurry up!" },
    attendre2:     { qui: "rosa", ton: "presse", direction: "Whisper in Spanish, a mother worried about a companion falling behind, gentle but urgent: ", texte: "No te quedes atrás…", fr: "Ne reste pas derrière…", en: "Don't fall behind…" },
    perdu:         { qui: "yesenia", ton: "peur", direction: "Call in a frightened whisper in Spanish, searching for someone in the dark: ", texte: "¿Dónde estás? Por aquí…", fr: "Où es-tu ? Par ici…", en: "Where are you? Over here…" },
    chute:         { qui: "ernesto", ton: "douleur", direction: "Say in Spanish, an old man collapsing from exhaustion, groaning in pain, breathless: ", texte: "Ay… no puedo… mis piernas…", fr: "Aïe… je ne peux plus… mes jambes…", en: "Oh… I can't… my legs…" },
    aide:          { qui: "ernesto", ton: "tendre", direction: "Say in Spanish, an old man being helped up, breathless, deeply grateful, moved: ", texte: "Gracias, hijo. Dios te lo pague.", fr: "Merci, mon fils. Que Dieu te le rende.", en: "Thank you, son. God bless you." },
    aideAutre:     { qui: "julio", ton: "presse", direction: "Say in Spanish, a young man lifting an old man, straining with effort, encouraging: ", texte: "Arriba, don Ernesto. Arriba.", fr: "Debout, don Ernesto. Debout.", en: "Up you get, Don Ernesto. Up." },
    // L'espoir
    espoir1:       { qui: "guia", ton: "joie", direction: "Whisper in Spanish with growing excitement and relief, pointing at distant city lights, almost smiling: ", texte: "¿Ven esas luces? Allá es. Ya casi llegamos.", fr: "Vous voyez ces lumières ? C'est là. On y est presque.", en: "See those lights? That's it. We're almost there." },
    espoir2:       { qui: "rosa", ton: "joie", direction: "Whisper in Spanish to her son, overwhelmed with hope, voice trembling with joy: ", texte: "Mira, mijo… mira.", fr: "Regarde, mon chéri… regarde.", en: "Look, sweetie… look." },
    espoir3:       { qui: "mateo", ton: "joie", direction: "Ask in Spanish as a 9-year-old boy, suddenly hopeful and excited, in a whisper: ", texte: "¿Allá vive mi tía?", fr: "C'est là qu'habite ma tante ?", en: "Is that where my aunt lives?" },
    espoir4:       { qui: "rosa", ton: "tendre", direction: "Whisper in Spanish, a mother answering her son with tears of joy, tender: ", texte: "Sí, mi amor. Allá.", fr: "Oui, mon amour. Là-bas.", en: "Yes, my love. Over there." },
    // Le choc
    chut:          { qui: "guia", ton: "presse", direction: "Whisper sharply in Spanish, freezing in place, hearing a distant helicopter, alarmed: ", texte: "Shhh… ¡Esperen!", fr: "Chut… Attendez !", en: "Shhh… Wait!" },
    alerte:        { qui: "guia", ton: "cri", direction: "Shout in a panicked half-whisper in Spanish, ordering everyone to hide and lie flat: ", texte: "¡Escóndanse! ¡Al suelo! ¡Ya!", fr: "Cachez-vous ! À plat ventre ! Vite !", en: "Hide! Get down flat! Now!" },
    panique:       { qui: "rosa", ton: "cri", direction: "Cry out in Spanish, a terrified mother calling her son, desperate, breaking voice: ", texte: "¡Mateo! ¡Mateo, no te muevas!", fr: "Mateo ! Mateo, ne bouge pas !", en: "Mateo! Mateo, don't move!" },
    priere:        { qui: "yesenia", ton: "peur", direction: "Pray in Spanish, whispering fast, terrified, trembling: ", texte: "Dios mío, Dios mío…", fr: "Mon Dieu, mon Dieu…", en: "Dear God, dear God…" },
    // Les agents parlent anglais.
    agent1:        { qui: "agent", ton: "cri", direction: "Shout loudly in English, an American Border Patrol agent, aggressive and commanding: ", texte: "Border Patrol! Stay down! Stay down!", fr: "Police des frontières ! Restez à terre ! À terre !" },
    agent2:        { qui: "agent", ton: "cri", direction: "Shout in English, a tense Border Patrol agent pointing a flashlight, harsh and urgent: ", texte: "Show me your hands! Hands!", fr: "Montrez vos mains ! Les mains !" },
    agent3:        { qui: "agent", ton: "cri", direction: "Shout in English, a Border Patrol agent barking orders, loud, fast, no hesitation: ", texte: "Get up on your knees! Hands up! Now!", fr: "À genoux ! Les mains en l'air ! Tout de suite !" },
  },


  // Timbres des voix générées (modèle Gemini TTS), un par personnage. Voir outils/generer-voix.mjs.
  voixGemini: {
    guia: "Algenib",       // grave, rauque
    julio: "Orus",         // posé, ferme
    rosa: "Aoede",         // chaleureuse
    mateo: "Leda",         // jeune, aiguë
    yesenia: "Achernar",   // douce, timide
    ernesto: "Sadaltager", // mûre, fatiguée
    agent: "Fenrir",       // sec, autoritaire
  },

  // Personnages du groupe (ordre de marche), leur apparence et leur témoignage final.
  personnages: [
    {
      id: "guia",
      corps: { taille: 1.78, haut: 0x2f2b26, bas: 0x24262a, peau: 0x7a563e, coiffe: "casquette", couleurCoiffe: 0x1c1b19, sac: "petit", objet: "bidon" },
      nom: "Le guide",
      detail: "Âge inconnu",
      recit: "Personne ne connaît son nom. Les migrants l'appellent « el guía », d'autres disent « coyote » ou « pollero ». Il était payé par un réseau à qui chacun devait plusieurs milliers de dollars. Quand l'hélicoptère est arrivé, il a couru. On ne l'a pas revu.",
      apres: "",
    },
    {
      id: "julio",
      corps: { taille: 1.72, haut: 0x33404a, bas: 0x2c3a4f, peau: 0x6b4a36, coiffe: "capuche", sac: "grand", couleurSac: 0x2a2a26, objet: "bidon" },
      nom: "Julio",
      detail: "27 ans · El Salvador",
      recit: "« J'ai vécu huit ans à Los Angeles. J'y ai rencontré ma femme, ma fille y est née. Un matin, j'ai été contrôlé en allant au travail et renvoyé dans un pays où je ne connaissais plus personne. Ma fille a cinq ans. Elle me demande au téléphone quand je rentre. »",
      apres: "Arrêté pour la deuxième fois, Julio a été poursuivi pour entrée illégale répétée, incarcéré, puis expulsé vers le Salvador.",
    },
    {
      id: "rosa",
      corps: { taille: 1.58, haut: 0x5a3b44, bas: 0x2c3140, peau: 0x8a6448, cheveux: "longs", chale: 0x6e4a3a, sac: "grand", couleurSac: 0x332c26, objet: "sac" },
      nom: "Rosa",
      detail: "34 ans · Honduras",
      recit: "« J'avais un petit commerce de tortillas à San Pedro Sula. Le gang me faisait payer la renta chaque semaine. Quand je n'ai plus pu payer, ils ont dit qu'ils prendraient Mateo pour qu'il travaille pour eux. On est partis le soir même, avec un sac. »",
      apres: "Rosa a demandé l'asile. Pendant sa détention, elle a été séparée de Mateo pendant plusieurs semaines. Son dossier est toujours en attente.",
    },
    {
      id: "mateo",
      corps: { taille: 1.30, haut: 0x3a5054, bas: 0x2c3a4f, peau: 0x8a6448, chaussures: 0x3d3d48, sac: "ecole", couleurSac: 0x6a3030 },
      nom: "Mateo",
      detail: "9 ans · Honduras",
      recit: "« Ma maman m'a dit qu'on allait voir ma tante, qu'il y avait la neige là-bas. Dans le désert j'avais froid. J'ai gardé mon sac à dos de l'école, avec mon cahier de dessin. »",
      apres: "Mateo a été placé dans un centre pour mineurs, puis rendu à sa mère. Il ne veut plus dormir dans le noir.",
    },
    {
      id: "yesenia",
      corps: { taille: 1.50, haut: 0x5e3550, bas: 0x2a2224, jupe: 0x3a2a5a, peau: 0x6e4a33, cheveux: "tresse", chale: 0x7a3a3a, sac: "petit", couleurSac: 0x3d3326 },
      nom: "Yesenia",
      detail: "19 ans · Guatemala",
      recit: "« Ma langue, c'est le mam. L'espagnol, je le parle un peu. Ma famille a hypothéqué sa terre pour payer mon voyage. Si je n'arrive pas à travailler là-bas, ils perdront la maison. Je ne peux pas rentrer les mains vides. »",
      apres: "Yesenia a été expulsée vers le Guatemala onze jours plus tard. La dette de sa famille n'a pas disparu. Elle dit qu'elle réessaiera.",
    },
    {
      id: "ernesto",
      corps: { taille: 1.66, haut: 0x5a5240, bas: 0x3a3228, peau: 0x6e4c34, couleurCheveux: 0x9a958c, coiffe: "sombrero", manches: "courtes", sac: "petit", objet: "baton" },
      nom: "Don Ernesto",
      detail: "61 ans · Guerrero, Mexique",
      recit: "« J'ai cultivé le maïs toute ma vie. Il ne pleut plus comme avant, et les hommes armés ont pris la route du marché. Mon fils travaille dans les toitures en Arizona. Je voulais juste être près de lui. Je n'avais pas imaginé que le désert serait si long à mon âge. »",
      apres: "Don Ernesto a été renvoyé au Mexique le lendemain, à Nogales. Il a passé une nuit dans un refuge tenu par des bénévoles.",
    },
  ],

  fin: [
    "Ces six personnes n'existent pas.",
    "Leurs histoires, si.",
    "Elles sont composées à partir de récits de migrants recueillis par des journalistes, des chercheurs et des associations.",
    "Chaque année, des personnes meurent de chaleur, de froid ou de soif en tentant de traverser ce désert. Beaucoup ne sont jamais identifiées.",
  ],
};
