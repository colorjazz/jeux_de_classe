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
    "San Pedro Sula, les hautes terres du Guatemala, les collines du Guerrero, Maracaibo, Santiago du Chili.",
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

    // TABLEAU A : Maracaibo (Venezuela) — Valeria, l'hôpital dans le noir (texte fourni par l'auteur)
    valeria1:       { qui: "valeria", ton: "fatigue", direction: "Say in Spanish with an exhausted, compassionate Venezuelan accent, trying to stay calm in a hospital emergency: ", texte: "Señora, ya revisé todo el almacén. No nos queda ni una ampolla de antibiótico, ni suero fisiológico.", fr: "Madame, j'ai vérifié toute la réserve. Il ne nous reste pas une seule ampoule d'antibiotique, ni de sérum physiologique.", en: "Ma'am, I checked the whole storage room. We don't have a single vial of antibiotics left, nor saline solution." },
    merePatient1:   { qui: "mere_patient", ton: "peur", direction: "Say in Spanish with a desperate, crying mother's voice: ", texte: "¡Pero el niño está hirviendo en fiebre, enfermera! ¡Se fue la luz otra vez!", fr: "Mais le petit brûle de fièvre, infirmière ! Et le courant vient encore de couper !", en: "But the boy is burning up with fever, nurse! And the power just went out again!" },
    valeria2:       { qui: "valeria", ton: "triste", direction: "Say in Spanish in a hushed, heartbroken, helpless tone in the dark: ", texte: "Alumbre con mi teléfono… Si no compra la medicina afuera en dólares, aquí no tenemos con qué bajarle la fiebre.", fr: "Éclairez avec mon téléphone… Si vous n'achetez pas le médicament dehors en dollars, ici on n'a plus rien pour faire baisser sa fièvre.", en: "Shine my phone's light… If you don't buy the medicine outside in dollars, we have nothing here to bring his fever down." },
    mereValeria:    { qui: "mere_valeria", ton: "tendre", direction: "Say in Spanish like an elderly, weak mother speaking softly: ", texte: "Valeria, hija… ¿trajiste algo de comer? Tus zapatos de hospital ya tienen la suela rota.", fr: "Valeria, ma fille… tu as rapporté quelque chose à manger ? Tes chaussures d'hôpital ont déjà la semelle trouée.", en: "Valeria, daughter… did you bring anything to eat? Your hospital shoes already have holes in the soles." },
    valeria3:       { qui: "valeria", ton: "triste", direction: "Say in Spanish with a voice breaking with frustration and sorrow: ", texte: "Me pagaron el mes entero hoy, mamá. Alcanzó para un cartón de huevos y una harina. Ni siquiera pude comprar tus pastillas para la tensión.", fr: "On m'a payé mon mois entier aujourd'hui, maman. Ça a suffi pour une boîte d'œufs et un paquet de farine. Je n'ai même pas pu acheter tes pilules pour la tension.", en: "They paid me my whole month's salary today, mom. It was enough for a carton of eggs and a bag of flour. I couldn't even buy your blood pressure pills." },
    valeriaDepart:  { qui: "valeria", ton: "chuchote", direction: "Say in Spanish with quiet determination and controlled tears: ", texte: "Con mi título de enfermera aquí nos morimos de hambre. Mañana salgo para la frontera con Colombia. Voy a cruzar por la selva.", fr: "Avec mon diplôme d'infirmière, ici, on meurt de faim. Demain je pars vers la frontière colombienne. Je vais traverser par la jungle.", en: "With my nursing degree here, we're starving to death. Tomorrow I'm leaving for the Colombian border. I'm going to cross through the jungle." },

    // TABLEAU B : Santiago du Chili — Joseph, la double migration (texte fourni par l'auteur)
    contremaitre1:  { qui: "contremaitre", ton: "froid", direction: "Say in Spanish with a fast Chilean accent, pragmatic and cold boss on a construction site: ", texte: "Joseph, mira… sin la definitiva al día no te puedo renovar el contrato. La inspección del trabajo viene el lunes y las multas son altísimas.", fr: "Joseph, écoute… sans ta résidence permanente à jour, je ne peux pas renouveler ton contrat. L'inspection du travail passe lundi et les amendes sont énormes.", en: "Joseph, look… without your permanent residency up to date, I can't renew your contract. The labor inspector comes Monday and the fines are huge." },
    joseph1:        { qui: "joseph", ton: "tendre", direction: "Say in Spanish with a strong, unmistakable Haitian Creole accent (soft French-like 'r', rhythmic Haitian cadence), polite, dignified, and worried: ", texte: "Pero jefe, llevo siete años levantando edificios aquí en Santiago. Solicité el papel hace dos años y en extranjería me rechazaron todo.", fr: "Mais chef, ça fait sept ans que je construis des immeubles ici à Santiago. J'ai demandé le papier il y a deux ans et au bureau de l'immigration, ils ont tout rejeté.", en: "But boss, I've been building high-rises here in Santiago for seven years. I applied for the paper two years ago and immigration rejected everything." },
    contremaitre2:  { qui: "contremaitre", ton: "froid", direction: "Say in Spanish with a resigned, indifferent tone: ", texte: "Lo siento, Joseph. Deja el casco y el chaleco en la bodega. Te pago la semana en efectivo y hasta ahí llegamos.", fr: "Désolé, Joseph. Laisse le casque et le gilet dans la remise. Je te paie ta semaine en liquide et ça s'arrête là.", en: "Sorry, Joseph. Leave the hard hat and vest in the shed. I'll pay your week in cash and that's as far as we go." },
    josephCreole1:  { qui: "joseph", ton: "triste", langue: "ht", direction: "Speak in native Haitian Creole with a deep, weary, emotional voice recording a voice message to his sister: ", texte: "Mwen pa kapab retounen Ayiti, ti sè m. Pòtoprens se nan men gang yo li ye. E isit nan Chili, yo fèmen tout pòt sou nou.", fr: "[En créole] Je ne peux pas retourner en Haïti, petite sœur. Port-au-Prince est aux mains des gangs. Et ici au Chili, ils ont fermé toutes les portes devant nous.", en: "[In Creole] I can't go back to Haiti, little sister. Port-au-Prince is in the hands of the gangs. And here in Chile, they closed every door on us." },
    joseph2:        { qui: "joseph", ton: "triste", direction: "Say in Spanish with a strong Haitian Creole accent, then switch to native Haitian Creole at the end, quiet, exhausted but resolute: ", texte: "Perdí mi casa en el terremoto del 2010. Trabajé en Brasil, trabajé en Chile… Diez fronteras hasta el norte. Nou pral mache ankò.", fr: "J'ai perdu ma maison dans le séisme de 2010. J'ai travaillé au Brésil, j'ai travaillé au Chili… Dix frontières jusqu'au nord. [En créole] On va marcher encore.", en: "I lost my house in the 2010 earthquake. I worked in Brazil, I worked in Chile… Ten borders to the north. [In Creole] We are going to walk again." },

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
    {
      id: "etagere_pharmacie",
      nom: "L'armoire à pharmacie vide de l'hôpital",
      texte: "Sur les tablettes métalliques, il ne reste que deux rouleaux de gaze et des boîtes vides. Les patients doivent apporter leurs propres seringues, gants et antibiotiques.",
      contexte: "EFFONDREMENT DES SERVICES PUBLICS : Au Venezuela, la crise économique et politique a provoqué une pénurie de plus de 70 % des médicaments essentiels et le départ de dizaines de milliers de médecins et d'infirmières.",
    },
    {
      id: "liasse_bolivars",
      nom: "Liasse de billets en bolívars et diplôme d'infirmière",
      texte: "Une épaisse liasse de billets dévalués posée à côté du diplôme universitaire encadré de Valeria. Cinq années d'études supérieures qui ne permettent plus d'acheter un repas par jour.",
      contexte: "HYPERINFLATION & EXODE DES COMPÉTENCES : Plus de 7,7 millions de Vénézuéliens ont quitté leur pays depuis 2015, formant l'un des plus grands déplacements de population de l'histoire récente de l'hémisphère occidental.",
    },
    {
      id: "dossier_extranjeria",
      nom: "Avis de refus de visa (« Rechazo de Permanencia Definitiva »)",
      texte: "Une chemise cartonnée au nom de Joseph contenant sept ans de fiches de paie, un passeport haïtien et une lettre officielle chilienne refusant le renouvellement du titre de séjour.",
      contexte: "LA MIGRATION EN ÉTAPES (DOUBLE DÉPLACEMENT) : Après le séisme de 2010 en Haïti, près de 200 000 Haïtiens se sont installés au Brésil et au Chili. À partir de 2018-2021, le durcissement des lois migratoires et le racisme les ont poussés à reprendre la route vers l'Amérique du Nord en traversant le Darién.",
    },
    {
      id: "casque_bottes",
      nom: "Casque de chantier et bottes à embout d'acier",
      texte: "Le casque blanc que Joseph doit rendre au chantier. Il gardera ses lourdes bottes de construction pour traverser le désert d'Atacama, les Andes, puis les marécages du Darién.",
      contexte: "PRÉCARITÉ DU STATUT MIGRATOIRE : Sans papiers valides, les travailleurs migrants basculent du jour au lendemain dans l'économie souterraine, perdant l'accès au bail de logement, à la santé et à la protection du travail.",
    },
  ],

  // ---------- Ajouts pour la mise en scène ----------

  // Timbres des voix générées (Gemini TTS). Mêmes voix qu'au chapitre 1 pour les personnages communs.
  voixGemini: {
    rosa: "Aoede", mateo: "Leda", julio: "Orus", yesenia: "Achernar", ernesto: "Sadaltager", guia: "Algenib",
    marero: "Algieba",        // lisse, froide
    pere_yesenia: "Enceladus", // soufflée, fatiguée
    fille_julio: "Zephyr",     // claire, enfantine
    valeria: "Kore",           // posée, professionnelle, épuisée
    mere_patient: "Sulafat",   // (proposé : Aoede, déjà la voix de Rosa dans ce chapitre)
    mere_valeria: "Vindemiatrix",
    contremaitre: "Charon",    // sèche, pressée
    joseph: "Alnilam",         // (proposé : Orus, déjà la voix de Julio) grave, digne
  },

  // Nom affiché dans les sous-titres.
  noms: {
    rosa: "Rosa", mateo: "Mateo", marero: "L'homme à moto", ernesto: "Don Ernesto",
    pere_yesenia: "Le père de Yesenia", yesenia: "Yesenia", fille_julio: "La fille de Julio, au téléphone",
    julio: "Julio", guia: "Le guide, au téléphone",
    valeria: "Valeria", mere_patient: "La mère d'un patient", mere_valeria: "La mère de Valeria",
    contremaitre: "Le contremaître", joseph: "Joseph",
  },
  nomsEn: {
    marero: "The man on the motorbike", pere_yesenia: "Yesenia's father", fille_julio: "Julio's daughter, on the phone", guia: "The guide, on the phone",
    mere_patient: "A patient's mother", mere_valeria: "Valeria's mother", contremaitre: "The foreman",
  },

  // Carte qui ouvre chaque tableau.
  lieux: {
    ilot1: { lieu: "San Pedro Sula, Honduras", moment: "Un vendredi, fin d'après-midi" },
    ilot2a: { lieu: "Tierra Caliente, Guerrero, Mexique", moment: "Midi" },
    ilot2b: { lieu: "Hautes terres de Quetzaltenango, Guatemala", moment: "À l'aube" },
    ilot3: { lieu: "San Salvador, Salvador", moment: "La nuit" },
    ilot4: { lieu: "Maracaibo, État de Zulia, Venezuela", moment: "Urgences pédiatriques · 22 h 40" },
    ilot4b: { lieu: "Maracaibo, chez Valeria", moment: "Plus tard, la même nuit" },
    ilot5: { lieu: "Santiago du Chili · Quilicura", moment: "Chantier de construction · Juin, l'hiver austral" },
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
    valeria: { taille: 1.63, haut: 0x2b5b6c, bas: 0x1f2937, peau: 0x9c7254, cheveux: "attaches", couleurCheveux: 0x1a1412, chaussures: 0xd1d5db, sac: "petit", couleurSac: 0x374151, objet: "trousse" },
    joseph:  { taille: 1.81, haut: 0x4a453e, giletChantier: 0xd97706, bas: 0x2b3548, peau: 0x3b2618, chaussures: 0x5c4028, sac: "grand", couleurSac: 0x1f2421, coiffe: "casque" },
    contremaitre: { taille: 1.74, haut: 0x5a6a7a, giletChantier: 0xe8c020, bas: 0x2a2f38, peau: 0xb08a70, coiffe: "casque", couleurCoiffe: 0xe8e050, chaussures: 0x3a2a1a },
    mere_patient: { taille: 1.58, haut: 0x8a6a8a, bas: 0x2a2a3a, peau: 0x8a6448, cheveux: "longs" },
    mere_valeria: { taille: 1.55, haut: 0x6a5a7a, bas: 0x3a3438, peau: 0x9c7254, couleurCheveux: 0x8a8580, chale: 0x5a4a5a },
    voisin:  { taille: 1.70, haut: 0xd8d0c0, bas: 0x3a3a3a, peau: 0x7a563e, coiffe: "casquette", couleurCoiffe: 0x2a4a8a, manches: "courtes" },
    voisine: { taille: 1.60, haut: 0xc84a5a, bas: 0x2a2a3a, peau: 0x8a6448, cheveux: "longs", objet: "sac" },
  },

  fin: [
    "Ils ne se connaissent pas encore.",
    "Dans quelques semaines, ou quelques mois, ils marcheront ensemble dans le désert de Sonora.",
  ],
};
