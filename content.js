/*
 * ─────────────────────────────────────────────────────────────
 *  MODIFIEZ CE FICHIER pour personnaliser votre portfolio.
 *  Tout le contenu du site (nom, présentation, projets, contact)
 *  vient d'ici — inutile de toucher à index.html, styles.css ou app.js.
 * ─────────────────────────────────────────────────────────────
 *
 *  Projets :
 *   - « image » est facultatif. Placez vos fichiers dans assets/img/
 *     et écrivez "assets/img/mon-jeu.png". Sans image, une couverture
 *     colorée est générée automatiquement.
 *   - « accent » choisit la couleur de cette couverture.
 *   - « tags » créent automatiquement les boutons de filtre.
 *   - « featured: true » affiche la carte en double largeur.
 *   - « links » peut contenir autant de boutons { label, url } que voulu.
 */
window.SITE = {
  name: "Votre Nom",
  role: "Conceptrice de jeux éducatifs",
  tagline:
    "Je crée des expériences d’apprentissage ludiques — des jeux de classe qui transforment les leçons en moments dont les élèves se souviennent.",
  location: "Montréal, QC",
  available: true, // affiche le badge « Disponible pour des projets »
  email: "bonjour@exemple.com",

  socials: [
    { label: "GitHub", url: "https://github.com/colorjazz" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
    { label: "itch.io", url: "https://itch.io/" },
  ],

  about: [
    "Je conçois des jeux pour la classe : rapides à installer, faciles à comprendre et ancrés dans ce que les enseignants ont réellement besoin d’enseigner.",
    "Mon travail couvre les jeux de cartes et de plateau à imprimer, les jeux en ligne et les activités pour tableau interactif. Chaque projet part d’un objectif d’apprentissage et est testé avec de vrais élèves avant sa sortie.",
  ],

  stats: [
    { value: "12+", label: "Jeux publiés" },
    { value: "40", label: "Classes testées" },
    { value: "3", label: "Langues offertes" },
  ],

  skills: [
    { title: "Conception de jeux", items: ["Mécaniques et boucles de jeu", "Tests avec les joueurs", "Équilibrage", "Rédaction des règles"] },
    { title: "Pédagogie", items: ["Arrimage au programme", "Différenciation", "Évaluation formative"] },
    { title: "Réalisation", items: ["HTML / CSS / JavaScript", "Mise en page pour l’impression", "Illustration"] },
  ],

  projects: [
    {
      title: "Verbes en Course",
      year: 2026,
      summary: "Un jeu de cartes de course rapide pour pratiquer la conjugaison.",
      description:
        "Les équipes avancent sur une piste en conjuguant correctement des verbes, contre la montre. Les cartes vont du présent au passé composé : un seul paquet sert toute l’année.",
      tags: ["Jeu de cartes", "Français"],
      role: "Conception, illustration, mise en page",
      accent: "#e4572e",
      featured: true,
      links: [{ label: "Télécharger le PDF", url: "#" }],
    },
    {
      title: "Fractions en Folie",
      year: 2026,
      summary: "Un jeu en ligne où les élèves coupent des pizzas pour obtenir la bonne fraction.",
      description:
        "Conçu pour le tableau interactif et la tablette. Comprend un mode enseignant pour créer ses propres manches et un classement en direct pour la classe.",
      tags: ["Numérique", "Mathématiques"],
      role: "Conception et développement",
      accent: "#2a9d8f",
      featured: true,
      links: [
        { label: "Jouer", url: "#" },
        { label: "Code source", url: "https://github.com/colorjazz" },
      ],
    },
    {
      title: "Carte au Trésor",
      year: 2025,
      summary: "Un jeu d’évasion coopératif en géographie pour toute la classe.",
      description:
        "En petits groupes, les élèves résolvent des énigmes de lecture de cartes pour débloquer l’indice suivant. Se joue en une période de 45 minutes, avec du matériel imprimé seulement.",
      tags: ["Jeu d’évasion", "Géographie"],
      role: "Concept, énigmes, tests",
      accent: "#3a86ff",
      links: [{ label: "Guide de l’enseignant", url: "#" }],
    },
    {
      title: "Loto du Labo",
      year: 2025,
      summary: "Un bingo de vocabulaire scientifique avec cartes images et définitions.",
      description:
        "Un jeu de révision style bingo sur les états de la matière, les écosystèmes et les machines simples. Un générateur crée une grille unique pour chaque élève.",
      tags: ["Jeu de cartes", "Sciences"],
      role: "Conception et générateur de grilles",
      accent: "#8338ec",
      links: [],
    },
    {
      title: "Duel des Dates",
      year: 2024,
      summary: "Placez les événements historiques dans l’ordre avant l’autre équipe.",
      description:
        "Un jeu de table qui amène les élèves à débattre de la chronologie. Des extensions couvrent l’Antiquité, le Moyen Âge et l’époque moderne.",
      tags: ["Jeu de plateau", "Histoire"],
      role: "Conception et recherche",
      accent: "#ffb703",
      links: [],
    },
    {
      title: "Tisseurs de Mots",
      year: 2024,
      summary: "Une application d’écriture collaborative pour les jeunes lecteurs.",
      description:
        "Chacun leur tour, les élèves ajoutent des mots et des images pour bâtir une histoire de classe, qu’on peut ensuite imprimer sous forme de livre.",
      tags: ["Numérique", "Français"],
      role: "Design UX et développement",
      accent: "#fb5607",
      links: [{ label: "Démo", url: "#" }],
    },
  ],
};
