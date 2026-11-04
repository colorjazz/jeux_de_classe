// Chapitre 4 : « La Hielera » — contenu.
// Texte d'origine fourni par l'auteur du projet (centre de détention, couvertures Mylar, séparation).
// Changements pour la cohérence avec les chapitres 1 à 3 :
//   - mêmes voix qu'aux chapitres précédents pour les personnages déjà connus ;
//   - hommes et femmes sont dans deux cellules voisines, séparées par un grillage (Don Ernesto parle à travers) ;
//   - Julio, Valeria et Joseph, qui étaient dans le groupe du désert, ont aussi quelques répliques
//     (marquées « ajout ») qui rejoignent ce que disent leurs témoignages du chapitre 1 ;
//   - l'épilogue n'est pas dit par une voix : il s'écrit à l'écran, comme la fin des autres chapitres.
// Tous les personnages sont FICTIFS.

window.CONTENU_CH4 = {
  sas: [
    "Centre de traitement de l'immigration, secteur de Tucson, Arizona.",
    "Les migrants l'appellent « la hielera » — la glacière — à cause de la climatisation poussée au maximum.",
    "Ici, il n'y a ni jour ni nuit. Les néons blancs restent allumés vingt-quatre heures sur vingt-quatre.",
    "Les noms disparaissent. Les personnes deviennent des numéros de dossier.",
  ],

  repliques: {
    // SÉQUENCE 1 : L'ENREGISTREMENT
    agentBureau1:  { qui: "agent_bureau", ton: "froid", direction: "Say in American English with a cold, mechanical, bored administrative tone, an officer who repeats this a hundred times a night: ", texte: "Belt, shoelaces, phones, backpacks in the plastic bag. Step on the yellow line.", fr: "Ceinture, lacets, téléphones, sacs à dos dans le sac plastique. Placez-vous sur la ligne jaune." },
    mateoSac:      { qui: "mateo", ton: "peur", direction: "Say in Spanish like a scared 9-year-old boy about to cry, watching an officer take his backpack: ", texte: "Mami, se llevaron mi mochila… mi cuaderno de dibujo está adentro.", fr: "Maman, ils ont pris mon sac à dos… mon cahier de dessin est dedans.", en: "Mom, they took my backpack… my drawing book is inside." },
    rosaCalme:     { qui: "rosa", ton: "tendre", direction: "Say softly in Honduran Spanish with a trembling but reassuring maternal voice, holding back her own fear: ", texte: "No llores, mi amor. Nos lo van a devolver. Respira conmigo.", fr: "Ne pleure pas, mon amour. Ils vont nous le rendre. Respire avec moi.", en: "Don't cry, my love. They'll give it back to us. Breathe with me." },
    // ajout : Julio (déjà expulsé une fois, chapitre 1)
    agentJulio:    { qui: "agent_bureau", ton: "froid", direction: "Say in American English, flat and cold, reading a computer screen after a fingerprint scan: ", texte: "Your fingerprints are already in the system. Removed in twenty nineteen. Step aside.", fr: "Vos empreintes sont déjà dans le système. Expulsé en 2019. Mettez-vous sur le côté." },
    julioEmpreintes: { qui: "julio", ton: "triste", direction: "Say quietly in Salvadoran Spanish, a man who knows exactly what this means, tired and ashamed, almost to himself: ", texte: "Ya está. Ahora me van a encerrar. Mi hija me va a esperar otra vez.", fr: "Voilà. Maintenant, ils vont m'enfermer. Ma fille va encore m'attendre.", en: "That's it. Now they'll lock me up. My daughter will wait for me again." },

    // SÉQUENCE 2 : LA HIELERA
    ernestoFroid:  { qui: "ernesto", ton: "fatigue", direction: "Say in Mexican Spanish with an exhausted, shivering 61-year-old man's voice, through a wire fence: ", texte: "Hace más frío aquí adentro que en el desierto… este plástico brillante no calienta nada.", fr: "Il fait plus froid ici que dans le désert… ce plastique brillant ne réchauffe rien du tout.", en: "It's colder in here than in the desert… this shiny plastic doesn't warm you at all." },
    // ajout : Joseph
    josephFroid:   { qui: "joseph", ton: "triste", langue: "ht", direction: "Say slowly in native Haitian Creole, a deep, weary voice, shivering, bitter: ", texte: "Fè twò frèt isit la… Yo fè sa espre.", fr: "[En créole] Il fait beaucoup trop froid ici… Ils le font exprès.", en: "[In Creole] It's far too cold in here… They do it on purpose." },
    // ajout : Valeria
    valeriaMateo:  { qui: "valeria", ton: "tendre", direction: "Whisper in Venezuelan Spanish, a gentle nurse wrapping a cold child in a survival blanket: ", texte: "Ven, Mateo, métete aquí entre las dos. Juntos se pasa menos frío.", fr: "Viens, Mateo, mets-toi là entre nous deux. Serrés, on a moins froid.", en: "Come, Mateo, get in here between the two of us. Close together, it's less cold." },

    // SÉQUENCE 3 : LA SÉPARATION
    agentSep1:     { qui: "agent_bureau", ton: "froid", direction: "Say in American English with cold official protocol, reading from a clipboard at a cell door: ", texte: "File 884-B. Adult females to Wing C. Unaccompanied or separated minors to Sector 4.", fr: "Dossier 884-B. Femmes adultes vers l'aile C. Mineurs non accompagnés ou séparés vers le secteur 4." },
    rosaPanique:   { qui: "rosa", ton: "cri", direction: "Cry out in Honduran Spanish with maternal terror and disbelief, pleading with an officer: ", texte: "¿Qué dice? Señor, él es mi hijo, tiene nueve años. ¡Tengo su partida de nacimiento!", fr: "Qu'est-ce qu'il dit ? Monsieur, c'est mon fils, il a neuf ans. J'ai son acte de naissance !", en: "What is he saying? Sir, he's my son, he's nine years old. I have his birth certificate!" },
    agenteMateo:   { qui: "agente", ton: "froid", direction: "Say in American English, a female officer, firm and impatient, not unkind but not listening: ", texte: "Come on, buddy. Let's go. You'll be fine.", fr: "Allez, mon grand. On y va. Ça va bien se passer." },
    mateoPleurs:   { qui: "mateo", ton: "cri", direction: "Cry out desperately in Spanish, a 9-year-old boy reaching for his mother as he is led away: ", texte: "¡Mami! ¡No me sueltes, mami!", fr: "Maman ! Ne me lâche pas, maman !", en: "Mommy! Don't let go of me, mommy!" },
    rosaCriCell:   { qui: "rosa", ton: "cri", direction: "Shout in Honduran Spanish with a broken, agonizing mother's cry through the bars as her son disappears: ", texte: "¡Mateo! ¡Acuérdate del número de tu tía! ¡Lo tienes escrito en el brazo! ¡Te amo!", fr: "Mateo ! Souviens-toi du numéro de ta tante ! Il est écrit sur ton bras ! Je t'aime !", en: "Mateo! Remember your aunt's number! It's written on your arm! I love you!" },

    // SÉQUENCE 4 : LES PAPIERS
    agentSigne:    { qui: "agent_bureau", ton: "froid", direction: "Say in American English, quick and dismissive, pushing a form across a counter: ", texte: "Sign here. And here. It's just to process your file.", fr: "Signez ici. Et ici. C'est juste pour traiter votre dossier." },
    yeseniaConfuse: { qui: "yesenia", ton: "peur", direction: "Say slowly in Spanish with a strong indigenous Guatemalan accent, confused and frightened, a 19-year-old who speaks Mam better than Spanish: ", texte: "No entiendo… ¿qué dice el papel? No hablo bien español, necesito hablar en mi idioma…", fr: "Je ne comprends pas… qu'est-ce qui est écrit sur le papier ? Je ne parle pas bien espagnol, j'ai besoin de parler dans ma langue…", en: "I don't understand… what does the paper say? I don't speak Spanish well, I need to speak in my language…" },
    // ajout : Joseph
    josephInterprete: { qui: "joseph", ton: "triste", direction: "Say in Spanish with a strong Haitian Creole accent, calm and dignified, ending with Haitian Creole words: ", texte: "Yo no entiendo inglés. ¿Hay alguien que hable kreyòl? Mwen bezwen yon entèprèt.", fr: "Je ne comprends pas l'anglais. Il y a quelqu'un qui parle créole ? [En créole] J'ai besoin d'un interprète.", en: "I don't understand English. Is there anyone who speaks Creole? [In Creole] I need an interpreter." },
    // ajout : Valeria (elle attend son audience d'asile, chapitre 1)
    valeriaAsile:  { qui: "valeria", ton: "triste", direction: "Say in Venezuelan Spanish, steady and determined despite fear, refusing to sign a paper: ", texte: "No voy a firmar. Tengo miedo de volver a mi país. Quiero pedir asilo.", fr: "Je ne signerai pas. J'ai peur de retourner dans mon pays. Je veux demander l'asile.", en: "I won't sign. I'm afraid to go back to my country. I want to ask for asylum." },

    // SÉQUENCE 5 : LE DÉPART DE DON ERNESTO
    agentAube:     { qui: "agent_bureau", ton: "froid", direction: "Call out in American English, loud and routine, at the door of a holding cell: ", texte: "Mexican nationals, line up by the door. Bus to Nogales.", fr: "Les ressortissants mexicains, en rang près de la porte. Bus pour Nogales." },
    ernestoAdieu:  { qui: "ernesto", ton: "tendre", direction: "Say softly in Mexican Spanish, an old man saying goodbye through a wire fence, tender and broken: ", texte: "Cuídese, Rosa. Su niño va a volver. Que Dios la acompañe.", fr: "Prenez soin de vous, Rosa. Votre petit va revenir. Que Dieu vous accompagne.", en: "Take care, Rosa. Your boy will come back. God be with you." },
  },

  objetsInteractifs: [
    { id: "sac_effets", nom: "Le sac des effets personnels",
      texte: "Un sac plastique transparent, un numéro au feutre. Dedans : une ceinture, des lacets, un téléphone sans batterie, un chapelet, une photo pliée. Les lacets sont retirés « pour la sécurité ».",
      contexte: "DIGNITÉ ET DROITS : Des organismes de défense des droits ont documenté que des effets personnels (papiers d'identité, argent, médicaments, téléphones) ne sont pas toujours rendus aux personnes expulsées." },
    { id: "cahier_mateo", nom: "Le cahier de dessin de Mateo",
      texte: "Le même cahier qu'à San Pedro Sula. Sur la dernière page, une maison sous la neige : celle de sa tante. Il est maintenant au fond d'un sac numéroté.",
      contexte: "" },
    { id: "couverture_mylar", nom: "Couverture de survie en Mylar",
      texte: "Une feuille fine de plastique métallisé, distribuée pour lutter contre la climatisation glaciale. Elle crépite au moindre mouvement. Les détenus l'appellent, avec ironie, « la couverture spatiale ».",
      contexte: "DROITS HUMAINS ET CONDITIONS DE DÉTENTION : Les températures glaciales des cellules de la Patrouille frontalière américaine, surnommées « hieleras », ont été dénoncées par de nombreux organismes de défense des droits de la personne." },
    { id: "liste_dossiers", nom: "La liste des dossiers",
      texte: "Une feuille sur une planchette : des numéros, des cases cochées, des flèches vers « Wing C » et « Sector 4 ». Aucun prénom.",
      contexte: "SÉPARATION DES FAMILLES : En 2018, la politique dite de « tolérance zéro » a conduit à séparer plus de 5 000 enfants de leurs parents à la frontière. Des années plus tard, certaines familles n'avaient toujours pas été réunies." },
    { id: "formulaire_expulsion", nom: "Formulaire de départ volontaire",
      texte: "Un document officiel en anglais, tendu à des personnes qui parlent espagnol, mam ou créole. En le signant, on peut renoncer à voir un juge et accepter d'être renvoyé très vite.",
      contexte: "DROIT D'ASILE : La Convention de 1951 relative au statut des réfugiés et son Protocole de 1967, auquel les États-Unis ont adhéré, interdisent de renvoyer une personne vers un pays où sa vie ou sa liberté serait menacée (principe de non-refoulement)." },
  ],

  // ---------- Mise en scène ----------
  voixGemini: {
    // Mêmes voix qu'aux chapitres 1 à 3 pour les personnages déjà connus.
    rosa: "Aoede", mateo: "Leda", julio: "Orus", yesenia: "Achernar", ernesto: "Sadaltager", valeria: "Kore", joseph: "Alnilam",
    agent_bureau: "Rasalgethi", agente: "Pulcherrima",
  },
  noms: {
    agent_bureau: "Agent de l'immigration", agente: "Agente de l'immigration", rosa: "Rosa", mateo: "Mateo", julio: "Julio",
    yesenia: "Yesenia", ernesto: "Don Ernesto", valeria: "Valeria", joseph: "Joseph",
  },
  nomsEn: { agent_bureau: "Immigration officer", agente: "Immigration officer" },
  lieux: {
    seq1: { lieu: "Centre de traitement · Tucson, Arizona", moment: "Nuit 1 · 3 h 40 · L'enregistrement" },
    seq2: { lieu: "La hielera", moment: "Nuit 1 · 14 °C" },
    seq3: { lieu: "La hielera", moment: "Jour 1 · La séparation" },
    seq4: { lieu: "Le comptoir", moment: "Jour 2 · Les papiers" },
    seq5: { lieu: "La hielera", moment: "Jour 2 · Le départ" },
  },
  corps: {
    rosa:    { taille: 1.58, haut: 0x5a3b44, bas: 0x2c3140, peau: 0x8a6448, cheveux: "longs", chale: 0x6e4a3a },
    mateo:   { taille: 1.30, haut: 0x3a5054, bas: 0x2c3a4f, peau: 0x8a6448, chaussures: 0x3d3d48 },
    julio:   { taille: 1.72, haut: 0x33404a, bas: 0x2c3a4f, peau: 0x6b4a36 },
    yesenia: { taille: 1.50, haut: 0x5e3550, bas: 0x2a2224, jupe: 0x3a2a5a, peau: 0x6e4a33, cheveux: "tresse", chale: 0x7a3a3a },
    ernesto: { taille: 1.66, haut: 0x5a5240, bas: 0x3a3228, peau: 0x6e4c34, couleurCheveux: 0x9a958c, manches: "courtes" },
    valeria: { taille: 1.63, haut: 0x2b5b6c, bas: 0x1f2937, peau: 0x9c7254, cheveux: "attaches", couleurCheveux: 0x1a1412, chaussures: 0x6a5a4a },
    joseph:  { taille: 1.81, haut: 0x4a453e, bas: 0x2b3548, peau: 0x3b2618, chaussures: 0x5c4028 },
    agent_bureau: { taille: 1.82, haut: 0x4a5a3a, bas: 0x3a4430, peau: 0xc49a7a, coiffe: "casquette", couleurCoiffe: 0x2f3a28, chaussures: 0x111111 },
    agente:  { taille: 1.68, haut: 0x4a5a3a, bas: 0x3a4430, peau: 0x8a6448, cheveux: "attaches", couleurCheveux: 0x2a1e16, chaussures: 0x111111 },
  },

  fin: [
    "Entre les causes du départ — la violence, le climat, la pauvreté — et les lois des États, des millions de vies restent suspendues.",
    "La frontière n'est plus seulement une ligne sur une carte.",
    "Rosa, Mateo, Julio, Yesenia, Don Ernesto, Valeria et Joseph n'existent pas. Ce qu'ils vivent, des milliers de personnes le vivent chaque année.",
    "Vous pouvez retirer vos écouteurs.",
  ],
};
