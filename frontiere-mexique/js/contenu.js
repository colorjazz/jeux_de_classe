// Contenu textuel de l'expérience : répliques, sas, témoignages.
// Tous les personnages sont FICTIFS : ce sont des personnages composites inspirés
// de récits de migrants documentés (presse, recherche, associations).
// Les répliques du désert restent en espagnol, volontairement non traduites.

window.CONTENU = {
  // Fragments affichés dans le sas d'entrée (la « hielera », la cellule froide).
  sas: [
    "Novembre. Désert de Sonora. Quelque part entre le Mexique et l'Arizona.",
    "La nuit, il fait 4 °C. Le jour, le sable dépasse 40 °C.",
    "Sur le sol, ce que d'autres ont laissé : une chaussure d'enfant, une bouteille peinte en noir pour ne pas briller sous la lune, un chapelet.",
    "Vous ne jouez pas un rôle.<br>Vous marchez avec eux.",
  ],

  // Répliques en espagnol. "qui" = identifiant du personnage qui parle.
  repliques: {
    depart:      { qui: "guia",    texte: "Sin luces. Sin hablar. Caminen detrás de mí." },
    rythme:      { qui: "guia",    texte: "Rápido. Antes de que salga el sol." },
    enfant:      { qui: "mateo",   texte: "Mami… ¿falta mucho?" },
    mere:        { qui: "rosa",    texte: "Ya casi, mijo. Ya casi." },
    attendre:    { qui: "julio",   texte: "¡Oye! ¡Apúrate!" },
    attendre2:   { qui: "rosa",    texte: "No te quedes atrás…" },
    perdu:       { qui: "yesenia", texte: "¿Dónde estás? Por aquí…" },
    soif:        { qui: "ernesto", texte: "Agua… ¿queda agua?" },
    chute:       { qui: "ernesto", texte: "Ay… no puedo… mis piernas…" },
    aide:        { qui: "ernesto", texte: "Gracias, hijo. Dios te lo pague." },
    aideAutre:   { qui: "julio",   texte: "Arriba, don Ernesto. Arriba." },
    alerte:      { qui: "guia",    texte: "¡Escóndanse! ¡Al suelo! ¡Ya!" },
    panique:     { qui: "rosa",    texte: "¡Mateo! ¡Mateo, ven aquí!" },
    priere:      { qui: "yesenia", texte: "Dios mío, Dios mío…" },
    // Les agents parlent anglais.
    agent1:      { qui: "agent",   texte: "Border Patrol! Get down! Get down!" },
    agent2:      { qui: "agent",   texte: "Hands up! Show me your hands!" },
    agent3:      { qui: "agent",   texte: "Don't move! On your knees!" },
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
