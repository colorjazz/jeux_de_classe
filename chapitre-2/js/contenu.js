// Chapitre 2 : contenu (textes, répliques, personnages, objets).
// Répliques, sas et objets : texte d'origine fourni par l'auteur du projet.
// Ajouts : « ton » (voix du navigateur), « direction » (indication d'acteur pour les voix
// générées, en anglais comme le modèle l'attend), « telephone » (voix filtrée comme un combiné),
// voixGemini, noms affichés, lieux, apparence des personnages, fin.
// Tous les personnages sont FICTIFS (personnages composites, voir le chapitre 1).

window.CONTENU_CH2 = {
  // Sas de transition : Du froid aveuglant des phares (fin Ch.1) à la chaleur du foyer.
  sas: [
    "Personne ne quitte sa terre par envie d'aventure.",
    "Avant d'être des ombres dans le désert d'Arizona, ils avaient un toit, un métier, un voisinage.",
    "San Pedro Sula, les hautes terres du Guatemala, les collines du Guerrero.",
    "Voici le jour où rester est devenu plus dangereux que partir.",
  ],

  repliques: {
    // ÎLOT 1 : San Pedro Sula (Honduras) — Le commerce de Rosa et Mateo
    // Ambiance : Fin d'après-midi, bruit de plaque chauffante (comal), rue animée qui se tait soudainement.
    rosa1:        { qui: "rosa", ton: "tendre", direction: "Say warmly in Honduran Spanish, a mother busy at her small tortilla stall at the end of the afternoon, gently hurrying her son: ", texte: "Termina tu dibujo, Mateo. Ya casi cierro.", fr: "Finis ton dessin, Mateo. Je ferme bientôt.", en: "Finish your drawing, Mateo. I'm closing soon." },
    mateo1:       { qui: "mateo", ton: "joie", direction: "Say proudly and excitedly in Spanish, a 9-year-old boy showing his drawing to his mother: ", texte: "Mira, mami. Dibujé la casa de la tía con nieve.", fr: "Regarde, maman. J'ai dessiné la maison de ma tante avec de la neige.", en: "Look, mom. I drew auntie's house with snow." },
    // Approche de motos au loin (son spatialisé 3D)
    marero1:      { qui: "marero", ton: "froid", direction: "Say in Spanish, a young man speaking with false politeness, calm, slow and cold, standing too close: ", texte: "Buenas tardes, doña Rosa. Es viernes. Aumento la cuota.", fr: "Bonsoir, doña Rosa. On est vendredi. Le tarif a augmenté.", en: "Good evening, Doña Rosa. It's Friday. The fee went up." },
    rosa2:        { qui: "rosa", ton: "peur", direction: "Say in Spanish with a trembling, pleading, fearful voice, a mother trying to stay calm: ", texte: "No tengo más. Esta semana no vendí nada, se lo juro.", fr: "Je n'ai rien de plus. Cette semaine je n'ai rien vendu, je vous le jure.", en: "I don't have any more. I sold nothing this week, I swear." },
    marero2:      { qui: "marero", ton: "froid", direction: "Say in Spanish, slowly and quietly, a soft voice that makes it worse, looking at the child: ", texte: "Qué lástima. El niño ya tiene edad para vigilar la esquina, ¿verdad?", fr: "Quel dommage. Le petit a l'âge de faire le guet au coin de la rue, non ?", en: "What a shame. The boy is old enough to work as a lookout on the corner, right?" },
    marero3:      { qui: "marero", ton: "froid", direction: "Say in Spanish, calmly, almost casually, as he turns to leave: ", texte: "Pasamos mañana por el dinero. O por él.", fr: "On repasse demain pour l'argent. Ou pour lui.", en: "We'll come back tomorrow for the money. Or for him." },
    rosaDepart:   { qui: "rosa", ton: "presse", direction: "Whisper urgently and breathlessly in Spanish to her son, holding back panic: ", texte: "Mateo… guarda tus colores en la mochila. No hagas ruido. Nos vamos ya.", fr: "Mateo… range tes crayons dans ton sac. Ne fais pas de bruit. On part tout de suite.", en: "Mateo… put your crayons in your backpack. Don't make a sound. We're leaving now." },

    // ÎLOT 2 : Hautes terres (Guatemala) & Guerrero (Mexique) — La terre qui meurt et la dette
    // Ambiance : Vent sec dans les feuilles de maïs desséchées.
    ernesto1:     { qui: "ernesto", ton: "triste", direction: "Say slowly in Mexican Spanish, an old farmer from Guerrero looking at his dead cornfield under the midday sun, bitter and tired: ", texte: "Mira la milpa. Tres años sin lluvia buena. La tierra es pura ceniza.", fr: "Regarde le champ. Trois ans sans une bonne pluie. La terre n'est plus que de la cendre.", en: "Look at the cornfield. Three years without good rain. The earth is pure ash." },
    ernesto2:     { qui: "ernesto", ton: "triste", direction: "Say in Mexican Spanish, low and resigned, an old farmer explaining a hard truth to a young listener: ", texte: "Y en el camino al mercado, los hombres armados cobran por cada saco que pasas.", fr: "Et sur la route du marché, les hommes armés font payer chaque sac que tu transportes.", en: "And on the road to market, armed men charge for every sack you carry." },
    pereYesenia:  { qui: "pere_yesenia", ton: "triste", direction: "Say quietly in Spanish with an indigenous Guatemalan accent, a tired father, ashamed and gentle, speaking to his daughter at dawn: ", texte: "Firmé los papeles, Yesenia. La escritura de la casa está con el prestamista.", fr: "J'ai signé les papiers, Yesenia. L'acte de la maison est chez le prêteur.", en: "I signed the papers, Yesenia. The deed to the house is with the moneylender." },
    yesenia1:     { qui: "yesenia", ton: "tendre", direction: "Say softly in Spanish, a shy 19-year-old Guatemalan girl, determined but scared, holding back tears: ", texte: "Voy a trabajar duro allá, papá. Les voy a mandar cada dólar.", fr: "Je vais travailler dur là-bas, papa. Je vous enverrai chaque dollar.", en: "I will work hard over there, Dad. I'll send you every dollar." },
    pereYesenia2: { qui: "pere_yesenia", ton: "triste", direction: "Say slowly in Spanish, a worried father blessing his daughter as she leaves, his voice breaking: ", texte: "Si no pagamos en seis meses, nos quedamos en la calle. Ve con Dios, hija.", fr: "Si on ne paie pas dans six mois, on est à la rue. Va avec Dieu, ma fille.", en: "If we don't pay in six months, we'll be on the street. Go with God, daughter." },

    // ÎLOT 3 : San Salvador — L'exil inversé de Julio
    // Ambiance : Cabine téléphonique ou chambre vide, lumière de néon blafarde.
    voixFille:    { qui: "fille_julio", ton: "triste", telephone: true, direction: "Say in Spanish as a sad little 5-year-old girl on the phone, small voice, a little reproachful: ", texte: "Papi… ¿por qué no viniste por mí a la escuela?", fr: "Papa… pourquoi tu n'es pas venu me chercher à l'école ?", en: "Daddy… why didn't you pick me up from school?" },
    julio1:       { qui: "julio", ton: "tendre", direction: "Say tenderly in Spanish, a father on the phone with his little daughter, smiling through sadness, hiding his pain: ", texte: "Estoy lejos, mi amor. Pero ya voy en camino. Te lo prometo.", fr: "Je suis loin, mon amour. Mais je suis en route. Je te le promets.", en: "I'm far away, my love. But I'm on my way. I promise you." },
    julioSeul:    { qui: "julio", ton: "triste", direction: "Say in Spanish, a young man alone in an empty room at night, bitter and exhausted, his anger turning into despair: ", texte: "Ocho años en Los Ángeles… y me tiran aquí como si fuera un extraño. Aquí me matan o me muero de hambre.", fr: "Huit ans à Los Angeles… et ils me jettent ici comme un étranger. Ici, on me tue ou je crève de faim.", en: "Eight years in Los Angeles… and they dump me here like a stranger. Here they'll kill me or I'll starve." },

    // Transition finale du chapitre : L'appel au passeur
    coyoteVoix:   { qui: "guia", ton: "froid", telephone: true, direction: "Say in Mexican Spanish over the phone, a stern guide giving practical instructions, flat and businesslike: ", texte: "Son siete mil dólares. Mitad ahora, mitad cuando crucen. Mañana a las cuatro, en la terminal.", fr: "C'est sept mille dollars. Moitié maintenant, moitié après avoir traversé. Demain à quatre heures, au terminal.", en: "It's seven thousand dollars. Half now, half when you cross. Tomorrow at four, at the terminal." },
  },

  objetsInteractifs: [
    {
      id: "cahier_mateo",
      nom: "Le cahier de dessin de Mateo",
      texte: "Sur la page de gauche, une maison sous des palmiers. Sur la page de droite, des silhouettes noires à moto barrées au crayon rouge.",
    },
    {
      id: "acte_propriete",
      nom: "Contrat d'hypothèque (Quetzaltenango)",
      texte: "Un prêt de 65 000 quetzales (environ 8 500 $ US) à un taux d'intérêt de 10 % par mois. La terre familiale est mise en garantie.",
    },
    {
      id: "epi_mais",
      nom: "Épi de maïs séché",
      texte: "Dans le Couloir sec d'Amérique centrale et le sud du Mexique, les sécheresses prolongées ont détruit jusqu'à 70 % des récoltes de subsistance.",
    },
  ],

  // ---------- Ajouts pour la mise en scène ----------

  // Timbres des voix générées (Gemini TTS). Mêmes voix qu'au chapitre 1 pour les personnages communs.
  voixGemini: {
    rosa: "Aoede", mateo: "Leda", julio: "Orus", yesenia: "Achernar", ernesto: "Sadaltager", guia: "Algenib",
    marero: "Algieba",        // lisse, froide
    pere_yesenia: "Enceladus", // soufflée, fatiguée
    fille_julio: "Zephyr",     // claire, enfantine
  },

  // Nom affiché dans les sous-titres.
  noms: {
    rosa: "Rosa", mateo: "Mateo", marero: "L'homme à moto", ernesto: "Don Ernesto",
    pere_yesenia: "Le père de Yesenia", yesenia: "Yesenia", fille_julio: "La fille de Julio, au téléphone",
    julio: "Julio", guia: "Le guide, au téléphone",
  },
  nomsEn: {
    marero: "The man on the motorbike", pere_yesenia: "Yesenia's father", fille_julio: "Julio's daughter, on the phone", guia: "The guide, on the phone",
  },

  // Carte qui ouvre chaque tableau.
  lieux: {
    ilot1: { lieu: "San Pedro Sula, Honduras", moment: "Un vendredi, fin d'après-midi" },
    ilot2a: { lieu: "Tierra Caliente, Guerrero, Mexique", moment: "Midi" },
    ilot2b: { lieu: "Hautes terres de Quetzaltenango, Guatemala", moment: "À l'aube" },
    ilot3: { lieu: "San Salvador, Salvador", moment: "La nuit" },
  },

  // Apparence (même système que le chapitre 1). Quelques semaines avant la traversée.
  corps: {
    rosa:    { taille: 1.58, haut: 0x7a4a52, bas: 0x2c3140, peau: 0x8a6448, cheveux: "longs", tablier: 0xd9cfb8 },
    mateo:   { taille: 1.30, haut: 0x3f6a70, bas: 0x2c3a4f, peau: 0x8a6448, chaussures: 0x3d3d48, sac: "ecole", couleurSac: 0x8a3a3a },
    marero:  { taille: 1.76, haut: 0x1c1c1e, bas: 0x23272e, peau: 0x7a563e, coiffe: "casquette", couleurCoiffe: 0x101012, manches: "courtes" },
    complice:{ taille: 1.74, haut: 0x2a2d33, bas: 0x1f2227, peau: 0x6b4a36, coiffe: "capuche" },
    ernesto: { taille: 1.66, haut: 0xcfc4a8, bas: 0x4a4032, peau: 0x6e4c34, couleurCheveux: 0x9a958c, coiffe: "sombrero", manches: "courtes", objet: "baton" },
    pere_yesenia: { taille: 1.60, haut: 0x6a5a48, bas: 0x2f2a24, peau: 0x6a4630, couleurCheveux: 0x2a2724, chale: 0x7a3434 },
    yesenia: { taille: 1.50, haut: 0x8a4a78, bas: 0x2a2224, jupe: 0x3a2a6a, peau: 0x6e4a33, cheveux: "tresse", chale: 0xa04848, sac: "petit", couleurSac: 0x3d3326 },
    julio:   { taille: 1.72, haut: 0x3a4a56, bas: 0x2c3a4f, peau: 0x6b4a36 },
    voisin:  { taille: 1.70, haut: 0xd8d0c0, bas: 0x3a3a3a, peau: 0x7a563e, coiffe: "casquette", couleurCoiffe: 0x2a4a8a, manches: "courtes" },
    voisine: { taille: 1.60, haut: 0xc84a5a, bas: 0x2a2a3a, peau: 0x8a6448, cheveux: "longs", objet: "sac" },
  },

  fin: [
    "Ils ne se connaissent pas encore.",
    "Dans quelques semaines, ils marcheront ensemble dans le désert de Sonora.",
  ],
};
