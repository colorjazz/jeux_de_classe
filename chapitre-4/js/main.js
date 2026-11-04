// Chapitre 4 : avertissement → sas → séquences du centre de détention → fin.
// Paramètres d'URL (enseignant, tests) :
//   ?ilot=seq1 | seq2 | seq3 | seq4 | seq5   commencer à une séquence (saute le sas)
//   &st=en   sous-titres en anglais      &qualite=legere|haute      &acc=3 (tests : temps accéléré)

(function () {
  const C = window.CONTENU_CH4;
  const A = window.Audio3D;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const montrer = (id) => $(id).classList.add("visible");
  const cacher = (id) => $(id).classList.remove("visible");

  // ---------- Pause (même fonctionnement qu'au chapitre 1) ----------
  const Pause = (window.Pause = {
    actif: false, disponible: false,
    activer() {
      if (this.actif || !this.disponible) return;
      this.actif = true; A.pause();
      if (document.exitPointerLock) document.exitPointerLock();
      montrer("pause"); $("btn-reprendre").focus();
    },
    reprendre() {
      if (!this.actif) return;
      this.actif = false; A.reprise(); cacher("pause");
      const cv = $("scene3d");
      if (cv && cv.requestPointerLock && !document.body.classList.contains("tactile")) cv.requestPointerLock();
    },
    basculer() { this.actif ? this.reprendre() : this.activer(); },
  });
  const pauseDisponible = (oui) => { Pause.disponible = oui; $("btn-pause").classList.toggle("visible", oui); };
  $("btn-pause").addEventListener("click", () => Pause.activer());
  $("btn-reprendre").addEventListener("click", () => Pause.reprendre());
  $("btn-quitter").addEventListener("click", () => { location.href = location.pathname; });
  window.addEventListener("keydown", (e) => { if (e.code === "KeyP") Pause.basculer(); });

  function attendre(ms) {
    return new Promise((r) => {
      let reste = ms, avant = performance.now();
      const tic = () => { const n = performance.now(); if (!Pause.actif) reste -= n - avant; avant = n; if (reste <= 0) r(); else setTimeout(tic, Math.min(100, reste)); };
      setTimeout(tic, Math.min(100, ms));
    });
  }

  // Pas de petit mot seul en fin de ligne (« Le », « la », « de »…) : il reste attaché au mot suivant.
  function insecables(t) {
    return t.replace(/(?<=^|[\s(«])(le|la|les|un|une|des|de|du|à|au|aux|et|en|ou|ni|ce|ces|cet|cette|son|sa|ses|sur|par|pour|sans|dans|qui|que|ne|se|on|il|elle|y|mon|ma|mes) +/gi, "$1\u00a0")
            .replace(/ +([:;!?»])/g, "\u00a0$1").replace(/« +/g, "«\u00a0");
  }

  async function sas() {
    cacher("accueil");
    await attendre(1500);
    montrer("sas");
    A.sasDebut();
    const climSas = A.clim(); climSas.force(0.45, 3);
    const el = $("sas-texte");
    for (const fragment of C.sas) {
      el.innerHTML = insecables(fragment); el.classList.add("visible");
      await attendre(4200 + fragment.length * 35);
      el.classList.remove("visible");
      await attendre(2000);
    }
    A.sasFin(); climSas.arreter(2);
    cacher("sas");
    await attendre(1500);
    tableaux();
  }

  function tableaux(ilot) {
    $("voile").style.opacity = "1";
    window.Chapitre4.lancer({
      fin, ilot, qualite: params.get("qualite"), acceleration: parseFloat(params.get("acc")) || 1,
    });
  }

  async function fin() {
    try { localStorage.setItem("traversees-chapitre-4", "fini"); } catch (e) {}
    pauseDisponible(false);
    $("voile").style.transition = "opacity 2s"; $("voile").style.opacity = "0";
    montrer("fin");
    const zone = $("fin-texte"); zone.innerHTML = "";
    // Ce que l'élève a fait (signer ou non, donner sa couverture), avant la dernière phrase.
    const lignes = C.fin.slice(0, -1).concat(window.Chapitre4.lignesRecit ? window.Chapitre4.lignesRecit() : [], C.fin.slice(-1));
    for (const ligne of lignes) {
      const p = document.createElement("p"); p.textContent = ligne; zone.appendChild(p);
      await attendre(100); p.classList.add("visible");
      await attendre(3000 + ligne.length * 30);
    }
    $("lien-ch1").classList.add("visible"); $("btn-recommencer").classList.add("visible");
  }
  $("btn-recommencer").addEventListener("click", () => { location.href = location.pathname; });

  // Liens vers d'autres pages (« Tous les chapitres », chapitre suivant) : sortie en fondu.
  document.querySelectorAll("a.retour-chapitres, #lien-suivant, #lien-ch1").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    document.body.classList.add("sortie");
    setTimeout(() => { location.href = a.href; }, 900);
  }));
  window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("sortie"); });

  // ---------- Langue des sous-titres (partagée avec le chapitre 1) ----------
  let langue = params.get("st");
  try { langue = langue || localStorage.getItem("sable-sous-titres"); } catch (e) {}
  if (langue !== "en") langue = "fr";
  window.LANGUE_SOUS_TITRES = langue;
  document.querySelectorAll('input[name="st"]').forEach((r) => {
    r.checked = r.value === langue;
    r.addEventListener("change", () => { window.LANGUE_SOUS_TITRES = r.value; try { localStorage.setItem("sable-sous-titres", r.value); } catch (e) {} });
  });

  if (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) document.body.classList.add("tactile");

  const ilot = params.get("ilot");
  if (ilot) $("btn-entrer").textContent = "Commencer (" + ilot + ")";
  $("btn-entrer").addEventListener("click", () => {
    A.demarrer();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
      }).catch(() => {});
    }
    pauseDisponible(true);
    if (!ilot) return sas();
    cacher("accueil");
    tableaux(ilot);
  });
})();
