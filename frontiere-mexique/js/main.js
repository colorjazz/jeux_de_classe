// Enchaînement des séquences : avertissement → sas → désert → témoignages → fin.
// Paramètres d'URL utiles pour l'enseignant ou les tests :
//   ?scene=desert        commencer directement dans le désert
//   ?scene=desert&t=145  … juste avant l'arrivée de l'hélicoptère
//   ?scene=reve          commencer à la rupture onirique
//   ?scene=temoignages   aller directement aux témoignages

(function () {
  const C = window.CONTENU;
  const A = window.Audio3D;
  const $ = (id) => document.getElementById(id);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const params = new URLSearchParams(location.search);

  function montrer(id) { $(id).classList.add("visible"); }
  function cacher(id) { $(id).classList.remove("visible"); }

  async function sas() {
    cacher("accueil");
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
    window.Desert.lancer(Object.assign({ fin: temoignages, acceleration: acc }, options || {}));
  }

  async function temoignages() {
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

  const scene = params.get("scene");
  if (scene) $("btn-entrer").textContent = "Commencer (" + scene + ")";

  $("btn-entrer").addEventListener("click", () => {
    A.demarrer();
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!scene) return sas();
    // Accès direct à une séquence
    cacher("accueil");
    if (scene === "desert") desert({ temps: parseFloat(params.get("t")) || 0 });
    else if (scene === "reve") desert({ reve: true });
    else if (scene === "temoignages") temoignages();
  });
})();
