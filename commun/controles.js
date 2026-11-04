// Commandes partagées : clavier (ZQSD, WASD, flèches), souris (capturée au clic),
// tactile (joystick, regard au doigt, bouton « Agir »), touche E, pause sur Échap.
// Usage : const K = Controles.creer({ canvas, action: () => {...}, actif: () => true });
//         chaque image : const { av, lat } = K.deplacement();  K.lacet, K.tangage (modifiables)

window.Controles = (function () {
  function enPause() { return window.Pause && window.Pause.actif; }

  function creer(o) {
    const touches = {};
    const etat = { lacet: 0, tangage: 0, verrouille: false };
    const joy = { id: null, x: 0, y: 0 };
    const tactile = document.body.classList.contains("tactile");
    const aide = document.getElementById("aide");
    const btnAction = document.getElementById("btn-action");
    const limiter = () => { etat.tangage = Math.max(-1.2, Math.min(1.2, etat.tangage)); };

    window.addEventListener("keydown", (e) => {
      touches[e.code] = true;
      if ((e.code === "KeyE" || e.code === "Space") && !enPause() && o.action) o.action();
    });
    window.addEventListener("keyup", (e) => { touches[e.code] = false; });

    // Souris
    o.canvas.addEventListener("click", () => {
      if (!tactile && !etat.verrouille && o.canvas.requestPointerLock) o.canvas.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => {
      const avant = etat.verrouille;
      etat.verrouille = document.pointerLockElement === o.canvas;
      if (aide) aide.classList.toggle("visible", !etat.verrouille && (!o.actif || o.actif()));
      if (avant && !etat.verrouille && (!o.actif || o.actif()) && window.Pause) window.Pause.activer();
    });
    document.addEventListener("mousemove", (e) => {
      if (!etat.verrouille || enPause()) return;
      etat.lacet -= e.movementX * 0.0022;
      etat.tangage -= e.movementY * 0.0022;
      limiter();
    });

    // Tactile
    if (tactile) {
      document.getElementById("tactile").classList.add("actif");
      const base = document.getElementById("joystick"), bouton = document.getElementById("joystick-bouton");
      const RAYON = 52;
      const majJoy = (t) => {
        const r = base.getBoundingClientRect();
        let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d > RAYON) { dx *= RAYON / d; dy *= RAYON / d; }
        joy.x = dx / RAYON; joy.y = dy / RAYON;
        bouton.style.transform = "translate(" + dx + "px," + dy + "px)";
      };
      base.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.changedTouches[0]; joy.id = t.identifier; majJoy(t); }, { passive: false });
      const regards = {};
      window.addEventListener("touchstart", (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id || t.target.closest("button, #joystick, .ecran.visible, .fiche.visible")) continue;
          regards[t.identifier] = { x: t.clientX, y: t.clientY };
        }
      }, { passive: true });
      window.addEventListener("touchmove", (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id) { majJoy(t); continue; }
          const r = regards[t.identifier];
          if (!r || enPause()) continue;
          etat.lacet -= (t.clientX - r.x) * 0.006;
          etat.tangage -= (t.clientY - r.y) * 0.006;
          limiter();
          r.x = t.clientX; r.y = t.clientY;
        }
        if (e.cancelable && (!o.actif || o.actif())) e.preventDefault();
      }, { passive: false });
      const fin = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; bouton.style.transform = ""; }
          delete regards[t.identifier];
        }
      };
      window.addEventListener("touchend", fin);
      window.addEventListener("touchcancel", fin);
      btnAction.addEventListener("touchstart", (e) => { e.preventDefault(); if (o.action) o.action(); }, { passive: false });
      btnAction.addEventListener("click", () => { if (o.action) o.action(); });
    }

    const enfoncee = (...codes) => codes.some((c) => touches[c]);
    function deplacement(dt) {
      if (enfoncee("ArrowLeft")) etat.lacet += 1.6 * dt;
      if (enfoncee("ArrowRight")) etat.lacet -= 1.6 * dt;
      let av = 0, lat = 0;
      if (enfoncee("KeyW", "KeyZ", "ArrowUp")) av += 1;
      if (enfoncee("KeyS", "ArrowDown")) av -= 1;
      if (enfoncee("KeyA", "KeyQ")) lat -= 1;
      if (enfoncee("KeyD")) lat += 1;
      if (joy.id !== null && Math.hypot(joy.x, joy.y) > 0.15) { av += -joy.y; lat += joy.x; }
      const n = Math.max(1, Math.hypot(av, lat));
      return { av: av / n, lat: lat / n };
    }

    // « [E] Regarder » au clavier ; sur écran tactile, le texte seul et le bouton « Agir ».
    const invite = document.getElementById("invite");
    function montrerInvite(t) {
      const texte = tactile && t ? t.replace(/^\[E\]\s*/, "") : t;
      if (invite.textContent !== (texte || "")) invite.textContent = texte || "";
      invite.classList.toggle("visible", !!t);
      if (btnAction) btnAction.classList.toggle("visible", !!t && /^\[E\]/.test(t));
    }

    return { etat, deplacement, montrerInvite, tactile, liberer() { if (document.exitPointerLock) document.exitPointerLock(); } };
  }

  return { creer };
})();
