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

  // "qui" = personnage qui parle ; "texte" = ce qui est dit ; "fr" / "en" = sous-titres.
  repliques: {
    depart:      { qui: "guia",    texte: "Sin luces. Sin hablar. Caminen detrás de mí.", fr: "Pas de lumière. Pas un mot. Marchez derrière moi.", en: "No lights. No talking. Walk behind me." },
    rythme:      { qui: "guia",    texte: "Rápido. Antes de que salga el sol.", fr: "Plus vite. Avant que le soleil se lève.", en: "Faster. Before the sun comes up." },
    enfant:      { qui: "mateo",   texte: "Mami… ¿falta mucho?", fr: "Maman… c'est encore loin ?", en: "Mom… is it much farther?" },
    mere:        { qui: "rosa",    texte: "Ya casi, mijo. Ya casi.", fr: "Presque, mon chéri. Presque.", en: "Almost there, sweetie. Almost." },
    attendre:    { qui: "julio",   texte: "¡Oye! ¡Apúrate!", fr: "Hé ! Dépêche-toi !", en: "Hey! Hurry up!" },
    attendre2:   { qui: "rosa",    texte: "No te quedes atrás…", fr: "Ne reste pas derrière…", en: "Don't fall behind…" },
    perdu:       { qui: "yesenia", texte: "¿Dónde estás? Por aquí…", fr: "Où es-tu ? Par ici…", en: "Where are you? Over here…" },
    soif:        { qui: "ernesto", texte: "Agua… ¿queda agua?", fr: "De l'eau… il reste de l'eau ?", en: "Water… is there any water left?" },
    chute:       { qui: "ernesto", texte: "Ay… no puedo… mis piernas…", fr: "Aïe… je ne peux plus… mes jambes…", en: "Oh… I can't… my legs…" },
    aide:        { qui: "ernesto", texte: "Gracias, hijo. Dios te lo pague.", fr: "Merci, mon fils. Que Dieu te le rende.", en: "Thank you, son. God bless you." },
    aideAutre:   { qui: "julio",   texte: "Arriba, don Ernesto. Arriba.", fr: "Debout, don Ernesto. Debout.", en: "Up you get, Don Ernesto. Up." },
    alerte:      { qui: "guia",    texte: "¡Escóndanse! ¡Al suelo! ¡Ya!", fr: "Cachez-vous ! À terre ! Vite !", en: "Hide! Get down! Now!" },
    panique:     { qui: "rosa",    texte: "¡Mateo! ¡Mateo, ven aquí!", fr: "Mateo ! Mateo, viens ici !", en: "Mateo! Mateo, come here!" },
    priere:      { qui: "yesenia", texte: "Dios mío, Dios mío…", fr: "Mon Dieu, mon Dieu…", en: "Dear God, dear God…" },
    // Les agents parlent anglais.
    agent1:      { qui: "agent",   texte: "Border Patrol! Get down! Get down!", fr: "Police des frontières ! À terre ! À terre !" },
    agent2:      { qui: "agent",   texte: "Hands up! Show me your hands!", fr: "Les mains en l'air ! Montrez vos mains !" },
    agent3:      { qui: "agent",   texte: "Don't move! On your knees!", fr: "Ne bougez pas ! À genoux !" },
  },

  // Personnages du groupe (ordre de marche) et leur témoignage final.
  personnages: [
    {
      id: "guia",
      nom: "Le guide",
      detail: "Âge inconnu",
      couleur: 0x2a2622,
      taille: 1.78,
      recit: "Personne ne connaît son nom. Les migrants l'appellent « el guía », d'autres disent « coyote » ou « pollero ». Il était payé par un réseau à qui chacun devait plusieurs milliers de dollars. Quand l'hélicoptère est arrivé, il a couru. On ne l'a pas revu.",
      apres: "",
    },
    {
      id: "julio",
      nom: "Julio",
      detail: "27 ans · El Salvador",
      couleur: 0x262b30,
      taille: 1.72,
      recit: "« J'ai vécu huit ans à Los Angeles. J'y ai rencontré ma femme, ma fille y est née. Un matin, j'ai été contrôlé en allant au travail et renvoyé dans un pays où je ne connaissais plus personne. Ma fille a cinq ans. Elle me demande au téléphone quand je rentre. »",
      apres: "Arrêté pour la deuxième fois, Julio a été poursuivi pour entrée illégale répétée, incarcéré, puis expulsé vers le Salvador.",
    },
    {
      id: "rosa",
      nom: "Rosa",
      detail: "34 ans · Honduras",
      couleur: 0x3a2a2e,
      taille: 1.58,
      recit: "« J'avais un petit commerce de tortillas à San Pedro Sula. Le gang me faisait payer la renta chaque semaine. Quand je n'ai plus pu payer, ils ont dit qu'ils prendraient Mateo pour qu'il travaille pour eux. On est partis le soir même, avec un sac. »",
      apres: "Rosa a demandé l'asile. Pendant sa détention, elle a été séparée de Mateo pendant plusieurs semaines. Son dossier est toujours en attente.",
    },
    {
      id: "mateo",
      nom: "Mateo",
      detail: "9 ans · Honduras",
      couleur: 0x2c3a3a,
      taille: 1.30,
      recit: "« Ma maman m'a dit qu'on allait voir ma tante, qu'il y avait la neige là-bas. Dans le désert j'avais froid. J'ai gardé mon sac à dos de l'école, avec mon cahier de dessin. »",
      apres: "Mateo a été placé dans un centre pour mineurs, puis rendu à sa mère. Il ne veut plus dormir dans le noir.",
    },
    {
      id: "yesenia",
      nom: "Yesenia",
      detail: "19 ans · Guatemala",
      couleur: 0x3b2f24,
      taille: 1.52,
      recit: "« Ma langue, c'est le mam. L'espagnol, je le parle un peu. Ma famille a hypothéqué sa terre pour payer mon voyage. Si je n'arrive pas à travailler là-bas, ils perdront la maison. Je ne peux pas rentrer les mains vides. »",
      apres: "Yesenia a été expulsée vers le Guatemala onze jours plus tard. La dette de sa famille n'a pas disparu. Elle dit qu'elle réessaiera.",
    },
    {
      id: "ernesto",
      nom: "Don Ernesto",
      detail: "61 ans · Guerrero, Mexique",
      couleur: 0x33302a,
      taille: 1.66,
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
