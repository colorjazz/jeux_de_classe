/*
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to make the portfolio yours.
 *  Everything on the site (name, bio, projects, contact) comes
 *  from here — no need to touch index.html, styles.css or app.js.
 * ─────────────────────────────────────────────────────────────
 *
 *  Projects:
 *   - "image" is optional. Put files in assets/img/ and use
 *     "assets/img/my-game.png". Without one, a generated cover is shown.
 *   - "accent" picks the cover colour when there's no image.
 *   - "tags" feed the filter buttons automatically.
 *   - "links" can hold any number of { label, url } buttons.
 */
window.SITE = {
  name: "Your Name",
  role: "Educational Game Designer",
  tagline:
    "I design playful learning experiences — classroom games that turn lessons into moments students remember.",
  location: "Montréal, QC",
  available: true, // shows the "Available for projects" badge
  email: "hello@example.com",

  socials: [
    { label: "GitHub", url: "https://github.com/colorjazz" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
    { label: "itch.io", url: "https://itch.io/" },
  ],

  about: [
    "I build games for classrooms: quick to set up, easy to understand, and grounded in what teachers actually need to teach.",
    "My work spans printable card and board games, browser games and interactive whiteboard activities. Every project starts with a learning goal and gets tested with real students before it ships.",
  ],

  stats: [
    { value: "12+", label: "Games published" },
    { value: "40", label: "Classrooms playtested" },
    { value: "3", label: "Languages supported" },
  ],

  skills: [
    { title: "Game design", items: ["Core loops & mechanics", "Playtesting", "Balancing", "Rules writing"] },
    { title: "Learning design", items: ["Curriculum alignment", "Differentiation", "Formative assessment"] },
    { title: "Build", items: ["HTML / CSS / JavaScript", "Print & layout", "Illustration"] },
  ],

  projects: [
    {
      title: "Verbes en Course",
      year: 2026,
      summary: "A fast-paced racing card game for practising French verb conjugation.",
      description:
        "Teams race around a track by conjugating verbs correctly under time pressure. Cards scale from present tense to passé composé, so one deck lasts the whole year.",
      tags: ["Card game", "Languages"],
      role: "Design, illustration, print layout",
      accent: "#e4572e",
      featured: true,
      links: [{ label: "Download PDF", url: "#" }],
    },
    {
      title: "Fraction Frenzy",
      year: 2026,
      summary: "A browser game where students slice pizzas to match target fractions.",
      description:
        "Built for interactive whiteboards and tablets. Includes a teacher mode with custom rounds and a live class leaderboard.",
      tags: ["Digital", "Math"],
      role: "Design & development",
      accent: "#2a9d8f",
      featured: true,
      links: [
        { label: "Play", url: "#" },
        { label: "Source", url: "https://github.com/colorjazz" },
      ],
    },
    {
      title: "Carte au Trésor",
      year: 2025,
      summary: "A cooperative geography escape game for the whole class.",
      description:
        "Small groups solve map-reading puzzles to unlock the next clue. Runs in a single 45-minute period with printable materials only.",
      tags: ["Escape game", "Geography"],
      role: "Concept, puzzles, playtesting",
      accent: "#3a86ff",
      links: [{ label: "Teacher guide", url: "#" }],
    },
    {
      title: "Lab Lotto",
      year: 2025,
      summary: "Science vocabulary bingo with picture and definition cards.",
      description:
        "Bingo-style review game covering states of matter, ecosystems and simple machines. Generator creates unique boards for every student.",
      tags: ["Card game", "Science"],
      role: "Design & board generator",
      accent: "#8338ec",
      links: [],
    },
    {
      title: "Timeline Tussle",
      year: 2024,
      summary: "Place historical events in order before the other team does.",
      description:
        "A tabletop history game that gets students debating chronology. Expansion packs cover ancient, medieval and modern periods.",
      tags: ["Board game", "History"],
      role: "Design & research",
      accent: "#ffb703",
      links: [],
    },
    {
      title: "Word Weavers",
      year: 2024,
      summary: "A collaborative storytelling app for early readers.",
      description:
        "Students take turns adding words and pictures to build a class story, which can be exported as a printable book.",
      tags: ["Digital", "Languages"],
      role: "UX design & front-end",
      accent: "#fb5607",
      links: [{ label: "Demo", url: "#" }],
    },
  ],
};
