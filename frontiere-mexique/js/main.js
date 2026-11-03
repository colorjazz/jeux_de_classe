// Enchaînement des séquences : avertissement → sas → désert → témoignages → fin.
// Paramètres d'URL utiles pour l'enseignant ou les tests :
//   ?scene=desert        commencer directement au mur
//   ?scene=desert&t=160  … la marche à 160 s (halte) ; t=270 fausse alerte ; t=345 l'espoir
//   ?scene=reve          commencer à la rupture onirique
//   ?scene=temoignages   aller directement aux témoignages

(function () {
  const C = window.CONTENU;
  const A = window.Audio3D;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  // ---------- Pause ----------
  // Bouton, touche P, ou Échap pendant le désert. Le temps, le son et les voix s'arrêtent.
  const Pause = (window.Pause = {
    actif: false,
    disponible: false,
    activer() {
      if (this.actif || !this.disponible) return;
      this.actif = true;
      A.pause();
      if (document.exitPointerLock) document.exitPointerLock();
      montrer("pause");
      $("btn-reprendre").focus();
    },
    reprendre() {
      if (!this.actif) return;
      this.actif = false;
      A.reprise();
      cacher("pause");
      const cv = $("scene3d");
      if (cv && cv.requestPointerLock && cv.style.display !== "none") cv.requestPointerLock();
    },
    basculer() { this.actif ? this.reprendre() : this.activer(); },
  });
  function pauseDisponible(oui) {
    Pause.disponible = oui;
    $("btn-pause").classList.toggle("visible", oui);
  }
  $("btn-pause").addEventListener("click", () => Pause.activer());
  $("btn-reprendre").addEventListener("click", () => Pause.reprendre());
  $("btn-quitter").addEventListener("click", () => { location.href = location.pathname; });
  window.addEventListener("keydown", (e) => { if (e.code === "KeyP") Pause.basculer(); });

  // Attente qui s'arrête pendant la pause.
  function attendre(ms) {
    return new Promise((r) => {
      let reste = ms, avant = performance.now();
      const tic = () => {
        const n = performance.now();
        if (!Pause.actif) reste -= n - avant;
        avant = n;
        if (reste <= 0) r(); else setTimeout(tic, Math.min(100, reste));
      };
      setTimeout(tic, Math.min(100, ms));
    });
  }

  function montrer(id) { $(id).classList.add("visible"); }
  function cacher(id) { $(id).classList.remove("visible"); }

  async function sas() {
    cacher("accueil");
    pauseDisponible(true);
    await attendre(1500);
    montrer("sas");
    A.sasDebut();
    const el = $("sas-texte");
    for (const fragment of C.sas) {
      el.innerHTML = fragment;
      el.classList.add("visible");
      await attendre(4200 + fragment.length * 35);
      el.classList.remove("visible");
      await attendre(2000);
    }
    A.sasFin();
    cacher("sas");
    await attendre(2000);
    desert();
  }

  function desert(options) {
    const acc = parseFloat(params.get("acc")) || 1;
    window.Desert.lancer(Object.assign({ fin: temoignages, acceleration: acc, qualite: params.get("qualite") }, options || {}));
  }

  async function temoignages() {
    pauseDisponible(false);
    $("voile").style.opacity = "0";
    montrer("temoignages");
    const portrait = $("portrait");
    const bouton = $("btn-suivant");
    // Les personnes du groupe, puis le guide en dernier.
    const ordre = C.personnages.slice(1).concat(C.personnages[0]);
    for (const p of ordre) {
      $("p-detail").textContent = p.detail;
      $("p-nom").textContent = p.nom;
      $("p-recit").textContent = p.recit;
      $("p-apres").textContent = p.apres;
      await attendre(600);
      portrait.classList.add("visible");
      await attendre(3500);
      bouton.classList.add("visible");
      await new Promise((r) => (bouton.onclick = r));
      bouton.classList.remove("visible");
      portrait.classList.remove("visible");
      await attendre(1700);
    }
    cacher("temoignages");
    await attendre(1500);
    fin();
  }

  async function fin() {
    montrer("fin");
    const zone = $("fin-texte");
    zone.innerHTML = "";
    for (const ligne of C.fin) {
      const p = document.createElement("p");
      p.textContent = ligne;
      zone.appendChild(p);
      await attendre(100);
      p.classList.add("visible");
      await attendre(2800 + ligne.length * 30);
    }
    document.querySelector(".mention").classList.add("visible");
    await attendre(3000);
    $("btn-recommencer").classList.add("visible");
  }

  $("btn-recommencer").addEventListener("click", () => { location.href = location.pathname; });

  // Langue des sous-titres : ?st=en, sinon le dernier choix, sinon le français.
  let langue = params.get("st");
  try { langue = langue || localStorage.getItem("sable-sous-titres"); } catch (e) {}
  if (langue !== "en") langue = "fr";
  window.LANGUE_SOUS_TITRES = langue;
  document.querySelectorAll('input[name="st"]').forEach((r) => {
    r.checked = r.value === langue;
    r.addEventListener("change", () => {
      window.LANGUE_SOUS_TITRES = r.value;
      try { localStorage.setItem("sable-sous-titres", r.value); } catch (e) {}
    });
  });

  // Écran tactile (téléphone, tablette) : commandes à l'écran.
  if (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) document.body.classList.add("tactile");

  const scene = params.get("scene");
  if (scene) $("btn-entrer").textContent = "Commencer (" + scene + ")";

  $("btn-entrer").addEventListener("click", () => {
    A.demarrer();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        // Sur téléphone, on bascule à l'horizontale quand c'est possible.
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
      }).catch(() => {});
    }
    if (!scene) return sas();
    // Accès direct à une séquence
    cacher("accueil");
    pauseDisponible(scene !== "temoignages");
    if (scene === "desert") desert({ temps: params.has("t") ? parseFloat(params.get("t")) || 0 : null });
    else if (scene === "reve") desert({ reve: true });
    else if (scene === "temoignages") temoignages();
  });
})();
