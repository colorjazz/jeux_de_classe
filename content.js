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
    "Je conçois des jeux pour la classe : faciles à lancer, faciles à comprendre, et pensés pour que les élèves aient envie d’apprendre.",
    "On trouve ici des jeux pédagogiques, des jeux pour s’amuser entre élèves, ainsi que mes services de correction et de tutorat.",
  ],

  stats: [
    { value: "8", label: "Jeux créés" },
    { value: "3", label: "Jeux pédagogiques" },
    { value: "2", label: "Services en ligne" },
  ],

  skills: [
    { title: "Conception de jeux", items: ["Énigmes et jeux d’évasion", "Jeux d’équipe", "Rédaction des règles"] },
    { title: "Pédagogie", items: ["Géographie et culture", "Correction", "Tutorat"] },
    { title: "Réalisation", items: ["Sites web", "Jeux en ligne", "Google Sites"] },
  ],

  /* Catégories : "Jeux pédagogiques", "Jeux amusants", "Sites personnels" */
  projects: [
    {
      title: "Traversées",
      summary: "Un jeu pédagogique sur les parcours migratoires.",
      description: "Les élèves suivent des parcours de migration et découvrent les choix, les obstacles et les réalités vécues en chemin.",
      tags: ["Jeux pédagogiques"],
      accent: "#2a9d8f",
      featured: true,
      links: [{ label: "Jouer", url: "https://matteomigrants.netlify.app/" }],
    },
    {
      title: "Montréal - Énigmes",
      summary: "Des énigmes pour explorer Montréal.",
      description: "Une série d’énigmes qui fait découvrir les lieux, l’histoire et la culture de Montréal.",
      tags: ["Jeux pédagogiques"],
      accent: "#3a86ff",
      links: [{ label: "Jouer", url: "https://enigmemtl.netlify.app/" }],
    },
    {
      title: "Géo-clash",
      summary: "Un affrontement de géographie entre équipes.",
      description: "Les équipes s’affrontent sur des questions de géographie pour remporter la manche.",
      tags: ["Jeux pédagogiques"],
      accent: "#8338ec",
      links: [{ label: "Jouer", url: "https://sites.google.com/view/geoclash/2" }],
    },
    {
      title: "Panique au Manoir",
      summary: "Huit joueurs, un manoir : sois le dernier debout.",
      description: "Un jeu d’action en 3D dans le navigateur. Fouille les pièces du manoir pour trouver des objets — poêle à frire, chandelier, oreiller… — et reste le dernier debout. Se joue au clavier et à la souris ou sur écran tactile.",
      tags: ["Jeux amusants"],
      accent: "#7a2e3b",
      featured: true,
      links: [{ label: "Jouer", url: "https://claude.ai/artifact/AEHFNYX8E3UUjGSVtvodps" }],
    },
    {
      title: "La Bombe",
      summary: "Un jeu plein de suspense pour la classe.",
      description: "Travaillez ensemble et faites vite : le temps est compté !",
      tags: ["Jeux amusants"],
      accent: "#e4572e",
      links: [{ label: "Jouer", url: "https://sites.google.com/view/bombe-vbcb/accueil" }],
    },
    {
      title: "La Nuit à ST-EX",
      summary: "Une aventure qui se déroule la nuit à St-Ex.",
      description: "Les élèves vivent une aventure nocturne dans les couloirs de St-Ex.",
      tags: ["Jeux amusants"],
      accent: "#1d3557",
      links: [{ label: "Jouer", url: "https://silly-lamington-029630.netlify.app/" }],
    },
    {
      title: "Le Tricheur",
      summary: "Saurez-vous démasquer le tricheur ?",
      description: "Un jeu de bluff et de déduction : observez, questionnez et trouvez qui triche.",
      tags: ["Jeux amusants"],
      accent: "#ffb703",
      links: [{ label: "Jouer", url: "https://sites.google.com/view/tricheur/accueil" }],
    },
    {
      title: "SOS-Tempêtes",
      summary: "Affrontez la tempête et sauvez la situation !",
      description: "Une mission pleine de rebondissements où les élèves doivent faire face aux tempêtes.",
      tags: ["Jeux amusants"],
      accent: "#457b9d",
      links: [{ label: "Jouer", url: "https://tangerine-cat-1c9462.netlify.app/" }],
    },
    {
      title: "Brûle la Pile",
      summary: "Service de correction.",
      description: "Un service de correction en ligne.",
      tags: ["Sites personnels"],
      accent: "#fb5607",
      links: [{ label: "Visiter brulelapile.ca", url: "https://brulelapile.ca" }],
    },
    {
      title: "Corrige Moi",
      summary: "Service de tutorat.",
      description: "Un service de tutorat en ligne.",
      tags: ["Sites personnels"],
      accent: "#2bb673",
      links: [{ label: "Visiter corrige.moi", url: "https://corrige.moi" }],
    },
  ],
};
