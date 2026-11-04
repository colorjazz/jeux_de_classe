// Chapitre 3 : « L'Entonnoir » — contenu.
// Texte d'origine fourni par l'auteur du projet. Seul changement : les répliques que le script
// donnait à Rosa, Mateo, Yesenia, Julio et Don Ernesto (qui ne passent pas par le Darién) sont
// confiées à de nouveaux migrants venus du sud (Carolina, Ángel, Mishel, Wilmer, Don Aurelio).
// Les Centraméricains n'apparaissent qu'à la bascule finale vers le désert (raccord avec le chapitre 1).
// Tous les personnages sont FICTIFS.

window.CONTENU_CH3 = {
  sas: [
    "Frontière entre la Colombie et le Panama. Le bouchon du Darién.",
    "Cent kilomètres de montagne, de boue et de rivières sans aucune route.",
    "Ici, le continent se resserre comme un entonnoir : ceux qui viennent du Venezuela, d'Haïti ou du Chili marchent dans les mêmes pas.",
    "Puis la route remonte vers le nord, rejoint le Honduras, le Guatemala et le Mexique… jusqu'à la nuit du désert.",
  ],

  repliques: {
    // SÉQUENCE 1 : LA BOUE ET LES SACS BLEUS
    guideDarien1:     { qui: "guia_darien", ton: "presse", direction: "Say in Spanish with a harsh, commanding, breathless voice over heavy rain: ", texte: "No se detengan por nadie. Si alguien se cae en el lodo, sigue caminando. Antes de las cuatro sube el río.", fr: "Ne vous arrêtez pour personne. Si quelqu'un tombe dans la boue, continuez à marcher. Avant quatre heures, la rivière monte.", en: "Don't stop for anyone. If someone falls in the mud, keep walking. Before four o'clock, the river rises." },
    angelChaussure:   { qui: "angel", ton: "peur", direction: "Cry out in Spanish like a frightened 8-year-old boy stuck in deep mud in the rain: ", texte: "¡Mami, mi zapato! ¡Se hundió en el barro, no puedo sacar el pie!", fr: "Maman, ma chaussure ! Elle s'est enfoncée dans la boue, je n'arrive plus à sortir mon pied !", en: "Mom, my shoe! It sank in the mud, I can't pull my foot out!" },
    carolinaBoue:     { qui: "carolina", ton: "fatigue", direction: "Say in Spanish with a breathless, exhausted, desperate Venezuelan mother's voice: ", texte: "Agárrate de mi cuello, mijo… espérame, ya te saco…", fr: "Accroche-toi à mon cou, mon chéri… attends-moi, je vais te sortir de là…", en: "Hold onto my neck, sweetie… wait for me, I'll get you out…" },
    josephEpaules:    { qui: "joseph", ton: "presse", direction: "Say in Spanish with a strong Haitian Creole accent (soft French 'r', Haitian rhythm), protective and out of breath in the rain, ending in native Haitian Creole: ", texte: "Dame al niño, hermana. Súbelo a mis hombros. Con mis botas de obra yo aguanto el lodo. Kenbe fò sou tèt mwen, ti gason.", fr: "Donne-moi le petit, ma sœur. Monte-le sur mes épaules. Avec mes bottes de chantier, je tiens dans la boue. [En créole] Tiens-toi bien sur ma tête, petit gars.", en: "Give me the boy, sister. Put him on my shoulders. With my work boots I can handle the mud. [In Creole] Hold on tight to my head, little boy." },
    mishelSacsBleus:  { qui: "mishel", ton: "peur", direction: "Say in Spanish with an Ecuadorian accent in a fearful, hushed voice looking at the trees: ", texte: "Miren las ramas… hay bolsas plásticas azules amarradas en los árboles.", fr: "Regardez les branches… il y a des sacs plastiques bleus attachés dans les arbres.", en: "Look at the branches… there are blue plastic bags tied to the trees." },
    valeriaSacsBleus: { qui: "valeria", ton: "triste", direction: "Say in Spanish with a tired, solemn Venezuelan voice: ", texte: "Son las marcas que dejan los que pasaron antes para que no nos perdamos en el barranco. Sigan el plástico azul.", fr: "Ce sont les repères que laissent ceux qui sont passés avant nous pour qu'on ne se perde pas dans le ravin. Suivez le plastique bleu.", en: "Those are the markers left by those who passed before so we don't get lost in the ravine. Follow the blue plastic." },

    // SÉQUENCE 2 : LA HALTE SOUS LA BÂCHE (LES SOINS DE VALERIA)
    valeriaSoin1:     { qui: "valeria", ton: "tendre", direction: "Say in Spanish with a caring, urgent nurse's tone while kneeling in the mud: ", texte: "Siéntese en esta raíz, don Aurelio. Tiene los pies en carne viva por la humedad. Me queda una venda limpia de mi hospital en Maracaibo.", fr: "Asseyez-vous sur cette racine, don Aurelio. Vos pieds sont à vif à cause de l'humidité. Il me reste un bandage propre de mon hôpital à Maracaibo.", en: "Sit on this root, Don Aurelio. Your feet are raw from the humidity. I have one clean bandage left from my hospital in Maracaibo." },
    aurelioSoin:      { qui: "aurelio", ton: "douleur", direction: "Say in Spanish like an exhausted 64-year-old Venezuelan man in pain, grateful: ", texte: "Gracias, doctora… En mi tierra nos moríamos por falta de agua, y aquí el agua nos está pudriendo los huesos.", fr: "Merci, docteure… Sur ma terre, on mourait par manque d'eau, et ici l'eau nous pourrit les os.", en: "Thank you, doctor… In my homeland we were dying from lack of water, and here the water is rotting our bones." },

    // SÉQUENCE 3 : LA RIVIÈRE EN CRUE (LA CHAÎNE HUMAINE)
    wilmerCorde:      { qui: "wilmer", ton: "cri", direction: "Shout in Spanish with a Colombian accent over the roaring river water, urgent and protective: ", texte: "¡Viene la creciente! ¡Agárrense todos de la soga! ¡Hagan cadena con los brazos, no se suelten!", fr: "La crue arrive ! Accrochez-vous tous à la corde ! Faites une chaîne avec vos bras, ne vous lâchez pas !", en: "The flash flood is coming! Everyone grab the rope! Make a chain with your arms, don't let go!" },
    mishelCourant:    { qui: "mishel", ton: "cri", direction: "Scream in Spanish in panic as the river current sweeps her feet: ", texte: "¡Me lleva el agua! ¡No toco el fondo, Wilmer!", fr: "L'eau m'emporte ! Je ne touche plus le fond, Wilmer !", en: "The water is sweeping me away! I can't touch the bottom, Wilmer!" },
    josephRiviere:    { qui: "joseph", ton: "cri", direction: "Shout in Spanish with a strong Haitian Creole accent over roaring water, straining with effort, ending in Haitian Creole: ", texte: "¡La tengo, Wilmer! ¡Agarra mi cinturón, muchacha! Bondye mwen, pa lage men m!", fr: "Je la tiens, Wilmer ! Attrape ma ceinture, jeune fille ! [En créole] Mon Dieu, ne lâche pas ma main !", en: "I've got her, Wilmer! Grab my belt, girl! [In Creole] My God, don't let go of my hand!" },

    // SÉQUENCE 4 : LE PÉAGE HUMAIN (L'EXTORSION SUR LA ROUTE)
    hommeArme1:       { qui: "arme", ton: "froid", direction: "Say in Spanish with a cold, threatening, authoritarian tone: ", texte: "Alto ahí. Nadie sube la loma sin pagar el sello del grupo. Cien dólares por cabeza. Los niños también pagan.", fr: "Halte là. Personne ne monte la colline sans payer le cachet du groupe. Cent dollars par tête. Les enfants paient aussi.", en: "Stop right there. Nobody climbs the hill without paying the group's stamp. One hundred dollars a head. Kids pay too." },
    valeriaPeage:     { qui: "valeria", ton: "peur", direction: "Say in Spanish with a trembling, pleading voice: ", texte: "Ya pagamos en Acandí, señor… Solo me quedan estos cuarenta dólares cosidos en el forro de la mochila.", fr: "On a déjà payé à Acandí, monsieur… Il ne me reste que ces quarante dollars cousus dans la doublure de mon sac.", en: "We already paid in Acandí, sir… I only have these forty dollars sewn into the lining of my backpack." },
    hommeArme2:       { qui: "arme", ton: "froid", direction: "Say in Spanish with a menacing, impatient bark: ", texte: "Dámelos. Y el reloj del viejo también. ¡Caminen rápido antes de que me arrepienta!", fr: "Donne-les-moi. Et la montre du vieux aussi. Marchez vite avant que je change d'avis !", en: "Give them to me. And the old man's watch too. Walk fast before I change my mind!" },

    // SÉQUENCE 5 : LA CRÊTE DE BROUILLARD → RACCORD AVEC LE CHAPITRE 1
    guideSommet:      { qui: "guia_darien", ton: "chuchote", direction: "Whisper in Spanish, exhausted, breathless at the top of the ridge: ", texte: "Suban… ya casi coronamos la loma. Detrás de esta niebla están las luces.", fr: "Montez… on arrive presque au sommet de la colline. Derrière ce brouillard, ce sont les lumières.", en: "Climb… we're almost at the top of the hill. Behind this fog are the lights." },
    mateoTransition:  { qui: "mateo", ton: "tendre", direction: "Ask softly in Spanish like a freezing, exhausted child: ", texte: "Mami… ¿allá vive mi tía?", fr: "Maman… c'est là qu'habite ma tante ?", en: "Mom… is that where my aunt lives?" },
    alerteDesert:     { qui: "guia", ton: "cri", direction: "Shout in Spanish in sudden terror as the helicopter spotlight hits: ", texte: "¡Escóndanse! ¡Al suelo! ¡Es la migra! ¡Al suelo ya!", fr: "Cachez-vous ! À plat ventre ! C'est la police des frontières ! À terre tout de suite !", en: "Hide! Get down flat! It's Border Patrol! On the ground now!" },
    rosaCriFinal:     { qui: "rosa", ton: "cri", direction: "Scream in Spanish in absolute maternal panic under the helicopter rotor noise: ", texte: "¡Mateo! ¡No me sueltes la mano, Mateo!", fr: "Mateo ! Ne lâche pas ma main, Mateo !", en: "Mateo! Don't let go of my hand, Mateo!" },
    agentFinal:       { qui: "agent", ton: "cri", direction: "Shout in American English through a megaphone, commanding and loud: ", texte: "Border Patrol! Stay down! Put your hands on your head! Do not move!", fr: "Police des frontières ! Restez à terre ! Mettez vos mains sur la tête ! Ne bougez plus !" },
  },

  objetsInteractifs: [
    { id: "sac_bleu_arbre", nom: "Sac plastique bleu noué à une branche",
      texte: "En l'absence de tout sentier officiel dans le Darién, les migrants attachent des lambeaux de sacs plastiques bleus aux branches pour indiquer le chemin et éviter les falaises.",
      contexte: "GÉOGRAPHIE DES FLUX MIGRATOIRES : Plus de 520 000 personnes ont traversé la jungle du Darién en une seule année (dont un quart d'enfants), faisant de ce corridor sans route l'un des passages les plus dangereux au monde." },
    { id: "chaussure_boue", nom: "Chaussure d'enfant prisonnière de la boue",
      texte: "Une petite basket trempée abandonnée dans l'argile. Marcher pieds nus ou avec des chaussures déchirées dans la jungle expose aux infections graves, aux morsures et aux parasites.",
      contexte: "VULNÉRABILITÉ DES MINEURS : Selon l'UNICEF, des dizaines de milliers d'enfants de moins de 11 ans traversent le Darién chaque année, souvent portés à bout de bras par leurs parents ou d'autres migrants." },
    { id: "trousse_valeria", nom: "La trousse d'infirmière de Valeria (Maracaibo)",
      texte: "Une pochette imperméabilisée avec un sac plastique contenant un stéthoscope, du fil de suture et un dernier rouleau de gaze.",
      contexte: "SOLIDARITÉ TRANSNATIONALE : Dans le Darién, en l'absence d'État et de secours sur la majeure partie du parcours, la survie dépend de l'entraide directe entre migrants de nationalités différentes." },
    { id: "bracelet_passage", nom: "Bracelet de péage (« Sello » du cartel)",
      texte: "Un bracelet en plastique coloré remis contre paiement de plusieurs centaines de dollars. Sans ce « laisser-passer » imposé par les groupes armés, impossible d'avancer.",
      contexte: "ÉCONOMIE CRIMINELLE DES FRONTIÈRES : La fermeture des voies légales de migration transforme le passage frontalier en une industrie lucrative de plusieurs centaines de millions de dollars pour les cartels." },
  ],

  // ---------- Mise en scène ----------
  voixGemini: {
    // Mêmes voix qu'aux chapitres 1 et 2 pour les personnages déjà connus.
    valeria: "Kore", joseph: "Alnilam", rosa: "Aoede", mateo: "Leda", guia: "Algenib", agent: "Fenrir",
    guia_darien: "Schedar",   // un autre guide que celui du désert
    carolina: "Despina", angel: "Laomedeia", mishel: "Erinome", wilmer: "Sadachbia", aurelio: "Iapetus",
    arme: "Zubenelgenubi",
  },
  noms: {
    guia_darien: "Le guide du Darién", angel: "Ángel, 8 ans", carolina: "Carolina", joseph: "Joseph", mishel: "Mishel",
    valeria: "Valeria", aurelio: "Don Aurelio", wilmer: "Wilmer", arme: "Homme armé du barrage",
    guia: "Le guide", mateo: "Mateo", rosa: "Rosa", agent: "Border Patrol",
  },
  nomsEn: { guia_darien: "The Darién guide", angel: "Ángel, 8", arme: "Armed man at the checkpoint", guia: "The guide", agent: "Border Patrol" },
  lieux: {
    seq1: { lieu: "Le bouchon du Darién · Panama", moment: "Jour 2 · La boue" },
    seq2: { lieu: "Le bouchon du Darién", moment: "Jour 2 · La halte sous la bâche" },
    seq3: { lieu: "Río Turquesa", moment: "Jour 3 · La crue" },
    seq4: { lieu: "Sortie de la jungle", moment: "Jour 4 · Le péage" },
    seq5: { lieu: "Le Darién", moment: "Jour 5 · La dernière crête" },
  },
  corps: {
    valeria: { taille: 1.63, haut: 0x2b5b6c, bas: 0x1f2937, peau: 0x9c7254, cheveux: "attaches", couleurCheveux: 0x1a1412, chaussures: 0x6a5a4a, sac: "petit", couleurSac: 0x374151 },
    joseph:  { taille: 1.81, haut: 0x4a453e, bas: 0x2b3548, peau: 0x3b2618, chaussures: 0x5c4028, sac: "grand", couleurSac: 0x1f2421 },
    guia_darien: { taille: 1.74, haut: 0x2a3424, bas: 0x23261e, peau: 0x7a5a40, coiffe: "casquette", couleurCoiffe: 0x2a2a20, chaussures: 0x111111, objet: "baton" },
    carolina: { taille: 1.60, haut: 0xb04a4a, bas: 0x2a2f3e, peau: 0xa07a5a, cheveux: "longs", sac: "grand", couleurSac: 0x2a3a5a },
    angel:   { taille: 1.25, haut: 0xd8b030, bas: 0x2c3a4f, peau: 0xa07a5a, chaussures: 0xe0e0e0 },
    mishel:  { taille: 1.56, haut: 0x6a8a4a, bas: 0x2a2224, peau: 0x8a6448, cheveux: "tresse", sac: "petit", couleurSac: 0x4a3a2a },
    wilmer:  { taille: 1.75, haut: 0x2a5a8a, bas: 0x2a2a2a, peau: 0x7a5a40, coiffe: "casquette", couleurCoiffe: 0xc02020, sac: "grand", couleurSac: 0x1a1a1a },
    aurelio: { taille: 1.64, haut: 0x8a7a5a, bas: 0x3a3228, peau: 0x8a6448, couleurCheveux: 0xb8b4aa, coiffe: "sombrero", manches: "courtes", sac: "petit" },
    arme:    { taille: 1.78, haut: 0x3a4430, bas: 0x2a3022, peau: 0x7a5a40, coiffe: "casquette", couleurCoiffe: 0x2a3022, chaussures: 0x111111, manches: "courtes" },
    arme2:   { taille: 1.72, haut: 0x22261e, bas: 0x2a3022, peau: 0x6b4a36, coiffe: "capuche", chaussures: 0x111111 },
    // Le groupe du désert (chapitre 1), pour la bascule finale
    guia:    { taille: 1.78, haut: 0x2f2b26, bas: 0x24262a, peau: 0x7a563e, coiffe: "casquette", couleurCoiffe: 0x1c1b19, sac: "petit" },
    julio:   { taille: 1.72, haut: 0x33404a, bas: 0x2c3a4f, peau: 0x6b4a36, coiffe: "capuche", sac: "grand", couleurSac: 0x2a2a26 },
    rosa:    { taille: 1.58, haut: 0x5a3b44, bas: 0x2c3140, peau: 0x8a6448, cheveux: "longs", chale: 0x6e4a3a, sac: "grand", couleurSac: 0x332c26 },
    mateo:   { taille: 1.30, haut: 0x3a5054, bas: 0x2c3a4f, peau: 0x8a6448, chaussures: 0x3d3d48, sac: "ecole", couleurSac: 0x6a3030 },
    yesenia: { taille: 1.50, haut: 0x5e3550, bas: 0x2a2224, jupe: 0x3a2a5a, peau: 0x6e4a33, cheveux: "tresse", chale: 0x7a3a3a, sac: "petit", couleurSac: 0x3d3326 },
    ernesto: { taille: 1.66, haut: 0x5a5240, bas: 0x3a3228, peau: 0x6e4c34, couleurCheveux: 0x9a958c, coiffe: "sombrero", manches: "courtes", sac: "petit" },
  },

  fin: [
    "Des mois plus tard, à l'autre bout du continent, leurs routes se sont rejointes.",
    "La suite, vous l'avez vécue : c'est la nuit du chapitre 1.",
  ],
};
