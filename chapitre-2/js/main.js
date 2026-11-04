// Chapitre 2 : avertissement → sas → tableaux → fin.
// Paramètres d'URL (enseignant, tests) :
//   ?ilot=ilot1 | ilot2a | ilot2b | ilot3 | final   commencer à un tableau (saute le sas)
//   &st=en   sous-titres en anglais      &qualite=legere|haute      &acc=3 (tests : temps accéléré)

(function () {
  const C = window.CONTENU_CH2;
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

  async function sas() {
    cacher("accueil");
    await attendre(1500);
    montrer("sas");
    A.sasDebut();
    const el = $("sas-texte");
    for (const fragment of C.sas) {
      el.innerHTML = fragment; el.classList.add("visible");
      await attendre(4200 + fragment.length * 35);
      el.classList.remove("visible");
      await attendre(2000);
    }
    A.sasFin();
    cacher("sas");
    await attendre(1500);
    tableaux();
  }

  function tableaux(ilot) {
    $("voile").style.opacity = "1";
    window.Chapitre2.lancer({
      fin, ilot, qualite: params.get("qualite"), acceleration: parseFloat(params.get("acc")) || 1,
    });
  }

  async function fin() {
    pauseDisponible(false);
    $("voile").style.transition = "opacity 2s"; $("voile").style.opacity = "0";
    montrer("fin");
    const zone = $("fin-texte"); zone.innerHTML = "";
    for (const ligne of C.fin) {
      const p = document.createElement("p"); p.textContent = ligne; zone.appendChild(p);
      await attendre(100); p.classList.add("visible");
      await attendre(3000 + ligne.length * 30);
    }
    $("lien-ch1").classList.add("visible"); $("btn-recommencer").classList.add("visible");
  }
  $("btn-recommencer").addEventListener("click", () => { location.href = location.pathname; });

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
