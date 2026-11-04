// Chapitre 4 : « La Hielera » — le centre de détention, après l'arrestation du chapitre 1.
//   1. L'enregistrement.   2. La glacière (couvertures de survie).   3. La séparation de Rosa et Mateo.
//   4. Les papiers.   5. Le départ de Don Ernesto.
// Même moteur de tableaux que les chapitres 2 et 3 (témoin invisible, objets à examiner avec E).

window.Chapitre4 = (function () {
  const C = window.CONTENU_CH4;
  const A = window.Audio3D;

  // ---------- État ----------
  let R, scene, camera, P, K, horloge, onFin;
  let temps = 0, acceleration = 1;
  let groupe = null;           // décor du tableau courant
  let persos = [];             // personnages du tableau courant
  let objets = [];             // objets examinables du tableau courant
  let majTableau = null;       // mise à jour propre au tableau
  let limite = { x: 0, z: 0, r: 4 };
  let zone = null;               // rectangle où l'élève peut marcher (x0, x1, z0, z1)
  let solY = () => 0;
  let ilotCourant = "", debutIlot = 0;
  const attentes = [];
  const joueur = { x: 0, z: 0, yeux: 1.62, vx: 0, vz: 0, balance: 0, distPas: 0 };
  let voile, sousTitre, aide, fiche, carteLieu;
  let ficheOuverte = null, ficheFin = 0, sousTitreTimer = null;
  let graine = 7654321;
  function alea() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }

  // ---------- Temps (s'arrête pendant la pause) ----------
  function attendre(s) { return new Promise((r) => attentes.push({ t: temps + s, r })); }
  function resoudreAttentes() {
    for (let i = attentes.length - 1; i >= 0; i--) if (attentes[i].t <= temps) attentes.splice(i, 1)[0].r();
  }
  const enPause = () => window.Pause && window.Pause.actif;

  // ---------- Fondus et cartes ----------
  function fondu(noir, duree) {
    voile.style.transition = "opacity " + duree + "s ease";
    voile.style.background = "#000";
    voile.style.opacity = noir ? "1" : "0";
    return attendre(duree);
  }
  async function carte(cle) {
    const l = C.lieux[cle];
    carteLieu.querySelector(".lieu").textContent = l.lieu;
    carteLieu.querySelector(".moment").textContent = l.moment;
    carteLieu.classList.add("visible");
    await attendre(3.6);
    carteLieu.classList.remove("visible");
  }

  // ---------- Répliques ----------
  function trouverPerso(qui) { return persos.find((p) => p.qui === qui); }
  async function dire(cle, apres) {
    const r = C.repliques[cle];
    const p = trouverPerso(r.qui);
    const pos = p ? { x: p.x, y: solY(p.x, p.z), z: p.z } : (r.telephone && C._posTelephone) || null;
    const duree = A.parler(r.qui, r.texte, r.ton, cle, pos, { telephone: r.telephone, langue: r.langue }) || 2.5;
    if (p) { p.parleJusqua = temps + duree; p.regardeJoueur = false; }
    const langue = window.LANGUE_SOUS_TITRES || "fr";
    const nom = (langue === "en" && C.nomsEn[r.qui]) || C.noms[r.qui] || "";
    sousTitre.querySelector(".st-nom").textContent = nom;
    // Seulement la traduction (ou la réplique telle quelle si elle est déjà dans la langue choisie).
    sousTitre.querySelector(".st-original").textContent = r[langue] || r.texte;
    sousTitre.querySelector(".st-trad").textContent = "";
    sousTitre.className = "visible" + (r.telephone ? " telephone" : "");
    clearTimeout(sousTitreTimer);
    sousTitreTimer = setTimeout(() => { sousTitre.className = ""; }, Math.max(3400, duree * 1000 + 1500));
    await attendre(duree + (apres === undefined ? 0.6 : apres));
  }

  // ---------- Construction ----------
  // Les personnages s'ajoutent au décor du tableau courant (retiré d'un coup ensuite).
  const env = {
    scene: { add: (o) => groupe.add(o) },
    hauteur: (x, z) => solY(x, z),
    alea, temps: () => temps, joueur: () => joueur, haute: true,
  };
  function boite(w, h, d, couleur, x, y, z, parent) {
    return P.maille(new THREE.BoxGeometry(w, h, d), couleur, parent || groupe, x, y, z);
  }
  function emissif(geo, couleur, force, parent, x, y, z) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: Rendu.lumineux(couleur, force) }));
    m.position.set(x || 0, y || 0, z || 0);
    (parent || groupe).add(m);
    return m;
  }
  function texte2D(lignes, opts) {
    opts = opts || {};
    const cv = document.createElement("canvas"); cv.width = opts.l || 512; cv.height = opts.h || 128;
    const c = cv.getContext("2d");
    c.fillStyle = opts.fond || "rgba(0,0,0,0)"; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = opts.couleur || "#222"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = opts.police || "bold 64px Georgia, serif";
    [].concat(lignes).forEach((l, i, t) => c.fillText(l, cv.width / 2, cv.height / (t.length + 1) * (i + 1)));
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function cielDegrade(haut, bas) {
    const cv = document.createElement("canvas"); cv.width = 2; cv.height = 256;
    const c = cv.getContext("2d"); const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, haut); g.addColorStop(1, bas); c.fillStyle = g; c.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function soleil(couleur, intensite, dir, rayon) {
    const l = new THREE.DirectionalLight(couleur, intensite);
    l.position.set(dir[0], dir[1], dir[2]);
    if (R.haute) {
      l.castShadow = true; l.shadow.mapSize.set(2048, 2048);
      const o = l.shadow.camera; o.left = o.bottom = -rayon; o.right = o.top = rayon; o.near = 1; o.far = 200;
      l.shadow.bias = -0.0006; l.shadow.normalBias = 0.03;
    }
    groupe.add(l, l.target);
    return l;
  }
  function personnage(qui, x, z, cap, cible) {
    const p = P.creer(C.corps[qui] || C.corps.julio);
    p.qui = qui; p.x = x; p.z = z; p.cap = cap || 0; p.cible = cible || "debout";
    p.pose = Object.assign({}, P.POSES[p.cible]);
    persos.push(p);
    return p;
  }
  // Déplacement d'un personnage vers un point (renvoie une promesse).
  function allerVers(p, x, z, v) {
    return new Promise((r) => { p.but = { x, z, v: v || 1.1, r }; p.cible = "marche"; p.capVise = undefined; });
  }
  function deplacer(p, dt) {
    if (p.suivre) {
      // Marcher à côté de quelqu'un (Mateo à côté de sa mère).
      const l = p.suivre.leader;
      const recul = p.suivre.recul || 0; // derrière lui (pour passer une porte)
      p.x = l.x - Math.cos(l.cap) * p.suivre.cote - Math.sin(l.cap) * recul; p.z = l.z + Math.sin(l.cap) * p.suivre.cote - Math.cos(l.cap) * recul;
      p.cap = l.cap; p.vitesse = l.vitesse; p.cible = l.vitesse > 0.05 ? "marche" : "debout";
      return;
    }
    if (!p.but) { p.vitesse = 0; return; }
    const dx = p.but.x - p.x, dz = p.but.z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.08) { const r = p.but.r; p.but = null; p.vitesse = 0; p.cible = p.cibleArrivee || "debout"; r(); return; }
    const v = Math.min(p.but.v, d * 2.5);
    p.x += dx / d * v * dt; p.z += dz / d * v * dt;
    let c = Math.atan2(dx, dz) - p.cap; while (c > Math.PI) c -= 2 * Math.PI; while (c < -Math.PI) c += 2 * Math.PI;
    p.cap += c * Math.min(1, dt * 6);
    p.vitesse = v;
  }
  function tourner(p, x, z) { p.capVise = Math.atan2(x - p.x, z - p.z); }
  function objet(id, mesh, x, y, z) {
    const def = C.objetsInteractifs.find((o) => o.id === id);
    const o = { id, def, x, y, z, mesh, vu: false };
    // Une très légère lueur pour qu'on le remarque.
    const l = new THREE.PointLight(0xfff0d0, 0.25, 1.2, 2); l.position.set(x, y + 0.35, z); groupe.add(l);
    o.lueur = l;
    objets.push(o);
    return o;
  }
  function viderTableau() {
    debutIlot = temps;
    if (groupe) {
      groupe.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      scene.remove(groupe);
    }
    groupe = new THREE.Group(); scene.add(groupe);
    persos = []; objets = []; majTableau = null;
    zone = null; passages.length = 0; retirerMylarJoueur(); objectif("");
    // Les matériaux partagés des personnages ont été libérés : on repart d'une fabrique neuve.
    P = Personnages(env);
  }
  function placerJoueur(x, z, lacet, tangage, r) {
    joueur.x = x; joueur.z = z; joueur.vx = joueur.vz = 0;
    K.etat.lacet = lacet; K.etat.tangage = tangage || 0;
    limite = { x, z, r: r || 4 };
  }

  // Rosa tient la main de Mateo.
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Vector3();
  function mainDansLaMain(rosa, mateo) {
    rosa.racine.updateMatrixWorld(true); mateo.racine.updateMatrixWorld(true);
    rosa.bras[0].epaule.getWorldPosition(_a); mateo.bras[1].epaule.getWorldPosition(_b);
    _m.lerpVectors(_a, _b, 0.48); _m.y = solY(_m.x, _m.z) + 0.84;
    P.pointerBras(rosa, 0, _m, 0.1); P.pointerBras(mateo, 1, _m, 0.05);
  }

  // =====================================================================
  //  Le centre : textures, néons, couvertures de survie
  // =====================================================================
  const H_PLAFOND = 3.0;
  function textureBeton() {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = "#8c8f8e"; c.fillRect(0, 0, T, T);
    for (let i = 0; i < 5000; i++) {
      const g = 110 + Math.random() * 60;
      c.fillStyle = `rgba(${g},${g + 2},${g + 2},0.35)`;
      c.fillRect(Math.random() * T, Math.random() * T, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 14; i++) { // taches, traces de pas
      c.fillStyle = "rgba(60,62,60,0.12)";
      c.beginPath(); c.ellipse(Math.random() * T, Math.random() * T, 10 + Math.random() * 30, 6 + Math.random() * 14, Math.random() * 3, 0, 7); c.fill();
    }
    c.strokeStyle = "rgba(50,52,52,0.5)"; c.lineWidth = 1.5; // joints de dalle
    c.beginPath(); c.moveTo(0, T - 1); c.lineTo(T, T - 1); c.moveTo(T - 1, 0); c.lineTo(T - 1, T); c.stroke();
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function texturePaprings() {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = "#c9ccc6"; c.fillRect(0, 0, T, T); // peinture beige-gris, froide
    for (let i = 0; i < 2500; i++) { const g = 185 + Math.random() * 40; c.fillStyle = `rgba(${g},${g + 2},${g - 2},0.3)`; c.fillRect(Math.random() * T, Math.random() * T, 2, 2); }
    c.strokeStyle = "rgba(120,124,118,0.75)"; c.lineWidth = 3;
    for (let r = 0; r < 4; r++) {
      const y = r * 64; c.beginPath(); c.moveTo(0, y); c.lineTo(T, y); c.stroke();
      for (let k = 0; k < 2; k++) { const x = k * 128 + (r % 2) * 64; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 64); c.stroke(); }
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function textureGrillage() {
    const T = 128, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.clearRect(0, 0, T, T);
    c.strokeStyle = "#c8ccd0"; c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(T, T); c.moveTo(T, 0); c.lineTo(0, T);
    c.moveTo(-T / 2, T / 2); c.lineTo(T / 2, -T / 2); c.moveTo(T / 2, T * 1.5); c.lineTo(T * 1.5, T / 2); c.stroke();
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function materiau(couleur, opts) {
    opts = opts || {};
    return R.haute
      ? new THREE.MeshStandardMaterial(Object.assign({ color: couleur, roughness: 0.85, metalness: 0 }, opts))
      : new THREE.MeshLambertMaterial(Object.assign({ color: couleur }, opts.map ? { map: opts.map } : {}, opts.transparent ? { transparent: true, alphaTest: opts.alphaTest, side: opts.side } : {}));
  }
  function plan(w, h, mat, x, y, z, rx, ry) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0);
    if (R.haute) m.receiveShadow = true;
    groupe.add(m); return m;
  }

  // Reflets de la couverture de survie : un petit environnement de néons, calculé une fois par tableau.
  let matMylar = null;
  function creerMylar() {
    if (!R.haute) {
      matMylar = new THREE.MeshLambertMaterial({ color: 0xb9bfc8, emissive: 0x2a2e34, flatShading: true, side: THREE.DoubleSide });
      return;
    }
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: 0x6a6e74, side: THREE.BackSide })));
    for (let i = -1; i <= 1; i++) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tube.position.set(i * 2.5, 2.9, 0); env.add(tube);
    }
    const sol = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0x9a9ea2 }));
    sol.rotation.x = -Math.PI / 2; sol.position.y = -2.9; env.add(sol);
    const pm = new THREE.PMREMGenerator(R.renderer);
    const tex = pm.fromScene(env, 0.02).texture; pm.dispose();
    matMylar = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 0.9, roughness: 0.24, envMap: tex, envMapIntensity: 1.2, flatShading: true, side: THREE.DoubleSide });
  }
  function froisser(geo, force) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) + (alea() - 0.5) * force, p.getY(i) + (alea() - 0.5) * force, p.getZ(i) + (alea() - 0.5) * force);
    }
    geo.computeVertexNormals();
    return geo;
  }
  // Une couverture posée sur les épaules d'un personnage (elle suit ses mouvements).
  function envelopper(p) {
    const cape = new THREE.Group(); p.haut.add(cape);
    const epaules = new THREE.Mesh(froisser(new THREE.SphereGeometry(0.3, 22, 7, 0, Math.PI * 2, 0.95, 0.65), 0.05), matMylar);
    epaules.position.y = 0.42; cape.add(epaules);
    const pan = new THREE.Mesh(froisser(new THREE.CylinderGeometry(0.3, 0.4, 0.66, 24, 8, true), 0.07), matMylar);
    pan.position.y = 0.12; cape.add(pan);
    if (R.haute) { epaules.castShadow = pan.castShadow = true; }
    p.mylar = cape;
    return cape;
  }
  // Une silhouette allongée sous une couverture (les autres détenus, endormis au sol).
  function dormeur(x, z, cap, peau) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = cap; groupe.add(g);
    const geo = new THREE.PlaneGeometry(0.85, 1.55, 14, 24); geo.rotateX(-Math.PI / 2);
    const pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const u = pp.getX(i) / 0.42, v = pp.getZ(i) / 0.78; // -1..1
      const bosse = Math.max(0, 1 - u * u) * (0.2 + 0.06 * Math.cos(v * 3)) * Math.max(0, 1 - Math.pow(Math.max(0, v - 0.6) * 2.5, 2));
      pp.setY(i, 0.02 + bosse + (alea() - 0.5) * 0.05);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, matMylar); g.add(m);
    if (R.haute) m.castShadow = true;
    P.maille(new THREE.SphereGeometry(0.1, 10, 8), 0x1c1612, g, 0, 0.1, -0.86); // cheveux
    P.maille(new THREE.SphereGeometry(0.085, 10, 8), peau || 0x7a5a40, g, 0, 0.08, -0.93);
    return g;
  }
  // Une couverture pliée, encore dans son emballage froissé.
  function mylarPlie(x, y, z) {
    const m = new THREE.Mesh(froisser(new THREE.BoxGeometry(0.32, 0.05, 0.24, 4, 1, 4), 0.02), matMylar);
    m.position.set(x, y, z); m.rotation.y = alea(); groupe.add(m);
    return m;
  }

  // Néons au plafond : tubes qui brillent (halo) + lumière froide.
  function neons(liste) {
    liste.forEach(([x, z, rot]) => {
      const boitier = boite(0.32, 0.06, 1.3, 0x9a9e9e, x, H_PLAFOND - 0.04, z); boitier.rotation.y = rot || 0;
      const tube = emissif(new THREE.BoxGeometry(0.22, 0.03, 1.2), 0xeef4ff, 3.2, groupe, x, H_PLAFOND - 0.085, z); tube.rotation.y = rot || 0;
      const l = new THREE.PointLight(0xe6eeff, R.haute ? 5 : 4, 9, 1.3); l.position.set(x, H_PLAFOND - 0.25, z); groupe.add(l);
    });
  }
  function ambiance() {
    scene.background = new THREE.Color(0x1a1d21);
    scene.fog = new THREE.FogExp2(0x1a1d21, 0.02);
    R.renderer.toneMappingExposure = 1.25;
    groupe.add(new THREE.HemisphereLight(0xdce6f4, 0x4a4c50, 1.1));
    const l = new THREE.DirectionalLight(0xe8eeff, 0.7); l.position.set(1, 10, 2);
    if (R.haute) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); const o = l.shadow.camera; o.left = o.bottom = -7; o.right = o.top = 7; o.near = 1; o.far = 20; l.shadow.bias = -0.0005; l.shadow.normalBias = 0.03; }
    groupe.add(l, l.target);
    creerMylar();
  }
  // Une pièce fermée : sol, plafond, murs de parpaings (x0..x1, z0..z1), sauf les côtés listés dans « ouverts ».
  function piece(x0, x1, z0, z1, ouverts) {
    ouverts = ouverts || [];
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const tb = textureBeton(); tb.repeat.set(w / 2, d / 2);
    plan(w, d, materiau(0xffffff, { map: tb, roughness: 0.6 }), cx, 0, cz, -Math.PI / 2);
    plan(w, d, materiau(0xd4d6d4), cx, H_PLAFOND, cz, Math.PI / 2);
    const mur = (long, x, z, ry) => {
      const t = texturePaprings(); t.repeat.set(long / 1.6, H_PLAFOND / 0.8);
      plan(long, H_PLAFOND, materiau(0xffffff, { map: t, roughness: 0.9 }), x, H_PLAFOND / 2, z, 0, ry);
      // Plinthe grise, plus sale
      plan(long, 0.5, materiau(0x6e7270), x + Math.sin(ry) * 0.005, 0.25, z + Math.cos(ry) * 0.005, 0, ry);
    };
    if (!ouverts.includes("fond")) mur(w, cx, z0, 0);
    if (!ouverts.includes("avant")) mur(w, cx, z1, Math.PI);
    if (!ouverts.includes("gauche")) mur(d, x0, cz, Math.PI / 2);
    if (!ouverts.includes("droite")) mur(d, x1, cz, -Math.PI / 2);
  }
  // Une rangée de barreaux (axe x), avec une porte optionnelle qui pivote.
  function barreaux(x0, x1, z, porte) {
    const mat = materiau(0x8a9094, { metalness: 0.6, roughness: 0.4 });
    const ajouter = (x, parent, px) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, H_PLAFOND, 8), mat); b.position.set(px === undefined ? x : px, H_PLAFOND / 2, parent === groupe ? z : 0); parent.add(b); if (R.haute) b.castShadow = true; };
    let p = null;
    if (porte) {
      p = new THREE.Group(); p.position.set(porte[0], 0, z); groupe.add(p);
      for (let x = 0.06; x < porte[1]; x += 0.16) ajouter(0, p, x);
      [0.1, 1.05, 2.1].forEach((y) => { const tr = new THREE.Mesh(new THREE.BoxGeometry(porte[1], 0.05, 0.04), mat); tr.position.set(porte[1] / 2, y, 0); p.add(tr); });
      const serrure = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.08), materiau(0x3a3e42, { metalness: 0.5 })); serrure.position.set(porte[1] - 0.08, 1.05, 0); p.add(serrure);
    }
    for (let x = x0; x <= x1 + 0.001; x += 0.16) {
      if (porte && x > porte[0] - 0.02 && x < porte[0] + porte[1] + 0.02) continue;
      ajouter(x, groupe);
    }
    // Traverses fixes : interrompues au niveau de la porte (sinon elles barrent l'ouverture
    // quand la porte pivote) ; seul le rail du plafond reste continu.
    const traverse = (a, b, y) => { if (b - a > 0.01) boite(b - a, 0.05, 0.04, 0x8a9094, (a + b) / 2, y, z); };
    [0.1, 1.05, 2.1].forEach((y) => {
      if (porte) { traverse(x0, porte[0], y); traverse(porte[0] + porte[1], x1, y); }
      else traverse(x0, x1, y);
    });
    traverse(x0, x1, H_PLAFOND - 0.05);
    return p;
  }
  // Grillage entre deux cellules (axe z, à x fixe).
  function grillage(x, z0, z1) {
    const t = textureGrillage(); t.repeat.set((z1 - z0) / 0.12, H_PLAFOND / 0.12);
    const m = R.haute
      ? new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.4 })
      : new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
    plan(z1 - z0, H_PLAFOND, m, x, H_PLAFOND / 2, (z0 + z1) / 2, 0, Math.PI / 2);
    [z0, z1, (z0 + z1) / 2].forEach((z) => P.maille(new THREE.CylinderGeometry(0.03, 0.03, H_PLAFOND, 8), 0x8a9094, groupe, x, H_PLAFOND / 2, z));
  }
  function banc(x, z, long, ry) {
    const b = boite(long, 0.45, 0.45, 0xa8aaa6, x, 0.225, z); b.rotation.y = ry || 0; return b;
  }
  function toilette(x, z) {
    boite(0.9, 1.0, 0.06, 0x9a9c98, x + 0.45, 0.5, z + 0.55); // muret bas, sans porte
    const c = P.maille(new THREE.CylinderGeometry(0.2, 0.17, 0.42, 14), 0xb8bcc0, groupe, x, 0.21, z); c.material = materiau(0xb8bcc0, { metalness: 0.8, roughness: 0.3 });
    boite(0.42, 0.35, 0.16, 0xb8bcc0, x, 0.6, z - 0.2);
  }
  const regarder = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));

  // Quelques autres détenus, assis sous une couverture.
  const TENUES = [[0x4a4a56, 0x2a2c34], [0x6a3a3a, 0x2a2224], [0x3a5a4a, 0x2a2c34], [0x5a4a3a, 0x30302c], [0x3a3a3a, 0x24262a], [0x7a6a4a, 0x2a2a30]];
  function figurant(x, z, cap, pose, femme) {
    const t = TENUES[Math.floor(alea() * TENUES.length)];
    C.corps["_fig"] = { taille: femme ? 1.5 + alea() * 0.12 : 1.64 + alea() * 0.14, haut: t[0], bas: t[1], peau: [0x6e4a33, 0x8a6448, 0x7a5a40, 0x5a3a26][Math.floor(alea() * 4)], cheveux: femme ? (alea() < 0.5 ? "longs" : "tresse") : undefined };
    const p = personnage("_fig", x, z, cap, pose || "assis");
    p.qui = "figurant";
    envelopper(p);
    return p;
  }

  // Ouvrir / fermer une porte de barreaux (rotation sur ses gonds, en douceur).
  function bougerPorte(porte, angle, duree) {
    const a0 = porte.rotation.y, t0 = temps;
    return new Promise((r) => {
      const pas = () => {
        const u = Math.min(1, (temps - t0) / duree);
        porte.rotation.y = a0 + (angle - a0) * (1 - Math.pow(1 - u, 3));
        if (u < 1) attendre(0.02).then(pas); else r();
      };
      pas();
    });
  }
  // Mains sur les barreaux (Rosa, à la porte).
  function mainsAuxBarreaux(p, z) {
    _m.set(p.x - 0.22, 1.45, z); P.pointerBras(p, 0, _m, 0.5);
    _m.set(p.x + 0.22, 1.45, z); P.pointerBras(p, 1, _m, 0.5);
  }

  let sonClim = null;
  function sonsCentre(force) {
    if (!sonClim) sonClim = A.clim();
    sonClim.force(force || 1, 1.5);
  }
  // Crépitements de couverture, ici et là, de temps en temps.
  function crepitements(ilot) {
    const un = () => {
      if (ilotCourant !== ilot) return;
      if (!enPause()) A.froissement(-3 + Math.random() * 8, 0.4, -3 + Math.random() * 4, 0.4 + Math.random());
      setTimeout(un, 2500 + Math.random() * 5000);
    };
    setTimeout(un, 1500);
  }

  // ---------- Portes métalliques (avec gâche électrique) ----------
  // Posée contre un mur : (x, z) au milieu du seuil, ry tourne la face vers l'intérieur de la pièce.
  // Ouverte, elle laisse voir un passage sombre ; un personnage qui le franchit disparaît.
  function porteMetal(x, z, ry, etiquette) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; groupe.add(g);
    const fond = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 2.12), new THREE.MeshBasicMaterial({ color: 0x17191b }));
    fond.position.set(0, 1.06, 0.006); g.add(fond);
    const cadre = 0x5e666c;
    boite(0.08, 2.2, 0.08, cadre, -0.52, 1.1, 0.03, g); boite(0.08, 2.2, 0.08, cadre, 0.52, 1.1, 0.03, g); boite(1.12, 0.08, 0.08, cadre, 0, 2.18, 0.03, g);
    const gond = new THREE.Group(); gond.position.set(-0.48, 0, 0.03); g.add(gond);
    const vantail = new THREE.Group(); gond.add(vantail);
    boite(0.95, 2.1, 0.05, 0x7c858b, 0.475, 1.06, 0, vantail);
    boite(0.95, 0.25, 0.052, 0x6a7278, 0.475, 0.14, 0, vantail); // plaque de propreté
    const hublot = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.3), new THREE.MeshStandardMaterial({ color: 0x9fb0b8, roughness: 0.1, metalness: 0.3 }));
    hublot.position.set(0.475, 1.55, 0.028); vantail.add(hublot);
    boite(0.04, 0.16, 0.06, 0x2a2c2e, 0.84, 1.02, 0.05, vantail); // poignée
    const voyant = emissif(new THREE.BoxGeometry(0.06, 0.04, 0.02), 0xff2a1a, 3, g, 0.7, 2.32, 0.04);
    if (etiquette) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), new THREE.MeshBasicMaterial({ map: texte2D([etiquette], { l: 512, h: 112, couleur: "#e8e8e0", fond: "#1e3a5a", police: "bold 50px system-ui, sans-serif" }) }));
      t.position.set(0, 2.5, 0.01); g.add(t);
    }
    const p = {
      g, ouverte: false,
      ouvrir() { if (!p._ouv) p._ouv = p._ouvrir().then(() => { p._ouv = null; }); return p._ouv; },
      async _ouvrir() {
        const w = g.localToWorld(new THREE.Vector3(0, 1.2, 0));
        A.gache(w.x, w.y, w.z); voyant.material.color.copy(Rendu.lumineux(0x30ff60, 3));
        await attendre(0.5);
        p.ouverte = true; await bougerPorte(gond, -1.7, 1.1);
      },
      async fermer() {
        if (!p.ouverte) return;
        await bougerPorte(gond, 0, 0.8);
        const w = g.localToWorld(new THREE.Vector3(0, 1.2, 0));
        A.claquement(w.x, w.y, w.z); voyant.material.color.copy(Rendu.lumineux(0xff2a1a, 3)); p.ouverte = false;
      },
      // Points devant et derrière la porte (coordonnées du monde)
      devant: (d) => g.localToWorld(new THREE.Vector3(0, 0, d || 0.8)),
      derriere: () => g.localToWorld(new THREE.Vector3(0, 0, -0.9)),
    };
    return p;
  }
  // Faire sortir quelqu'un (ou plusieurs) par une porte, puis la refermer.
  const passages = [];
  function majPassages() {
    for (const s of passages) {
      s.p.racine.visible = s.porte.g.worldToLocal(_m.set(s.p.x, 0, s.p.z)).z > -0.05;
    }
  }
  async function sortirPar(porte, qui, suiveurs, v) {
    suiveurs = suiveurs || [];
    [qui, ...suiveurs].forEach((p) => passages.push({ p, porte }));
    suiveurs.forEach((p, k) => { p.suivre = { leader: qui, cote: 0, recul: 0.7 * (k + 1) }; });
    if (!porte.ouverte) await porte.ouvrir();
    const a = porte.devant(), b = porte.derriere();
    await allerVers(qui, a.x, a.z, v || 1);
    await allerVers(qui, b.x, b.z, v || 1);
    await attendre(0.8);
    qui.but = null; qui.vitesse = 0;
    porte.fermer();
  }
  async function entrerPar(porte, qui, x, z, v, garderOuverte) {
    passages.push({ p: qui, porte });
    const b = porte.derriere(), a = porte.devant();
    qui.x = b.x; qui.z = b.z;
    if (!porte.ouverte) await porte.ouvrir();
    await allerVers(qui, a.x, a.z, v || 1);
    passages.splice(passages.findIndex((s) => s.p === qui), 1); qui.racine.visible = true;
    if (!garderOuverte) porte.fermer();
    await allerVers(qui, x, z, v || 1);
  }

  // ---------- Affiches, graffitis, petits objets ----------
  function affiche(lignes, x, y, z, ry, opts) {
    opts = opts || {};
    const w = opts.w || 1.2, h = opts.h || 0.6;
    const t = Object.assign({ couleur: "#1a2a3a", fond: "#efede4", police: "bold 46px system-ui, sans-serif" }, opts, { l: 1024, h: Math.round(1024 * h / w) }); // l, h : taille de l'image, en pixels
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texte2D(lignes, t) }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; groupe.add(m);
    return m;
  }
  function textureGraffitis() {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
    const c = cv.getContext("2d");
    const ecrire = (t, x, y, taille, rot) => {
      c.save(); c.translate(x, y); c.rotate(rot || 0);
      c.font = `italic ${taille}px Georgia, serif`; c.lineWidth = 1.6;
      c.strokeStyle = "rgba(70,72,70,0.75)"; c.strokeText(t, 0, 0);
      c.fillStyle = "rgba(250,250,245,0.25)"; c.fillText(t, 1.5, 1.5);
      c.restore();
    };
    ecrire("DIOS ME AMA", 60, 90, 54, -0.05); ecrire("Mami te amo", 520, 70, 44, 0.04);
    ecrire("Yuli  14 / 3", 90, 200, 40, 0.02); ecrire("HONDURAS", 620, 190, 50, -0.03);
    ecrire("3 días sin ver el sol", 260, 300, 36, 0.01); ecrire("San Pedro Sula", 80, 420, 38, -0.04);
    ecrire("Fe", 840, 330, 70, 0.1); ecrire("Kenbe fèm", 600, 450, 40, -0.02);
    // Des bâtons pour compter les jours
    c.strokeStyle = "rgba(60,62,60,0.8)"; c.lineWidth = 3;
    for (let k = 0; k < 13; k++) { const x = 470 + k * 14 + Math.floor(k / 5) * 18; c.beginPath(); c.moveTo(x, 370); c.lineTo(x + 3, 410); c.stroke(); }
    [0, 1].forEach((b) => { c.beginPath(); c.moveTo(462 + b * 88, 395); c.lineTo(540 + b * 88, 380); c.stroke(); });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function graffitis(x, y, z, ry) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: textureGraffitis(), transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; groupe.add(m); return m;
  }
  function fontaine(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); groupe.add(g);
    boite(0.36, 0.78, 0.36, 0xb8bcc0, 0, 0.39, 0, g);
    P.maille(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 16), 0xd8701a, g, 0, 1.0, 0);
    P.maille(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 16), 0xf2f2ee, g, 0, 1.23, 0);
    boite(0.05, 0.05, 0.06, 0x2a2a2a, 0, 0.9, 0.19, g);
    for (let i = 0; i < 6; i++) P.maille(new THREE.CylinderGeometry(0.035, 0.028, 0.08, 10), 0xf0ece0, g, 0.24, 0.82 + i * 0.012, 0.05);
    return g;
  }
  function repas(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); groupe.add(g);
    const sand = new THREE.Mesh(froisser(new THREE.BoxGeometry(0.14, 0.04, 0.12, 2, 1, 2), 0.01), new THREE.MeshStandardMaterial({ color: 0xe6dcc0, transparent: true, opacity: 0.85, roughness: 0.3 }));
    sand.position.set(0, 0.02, 0); g.add(sand);
    boite(0.05, 0.09, 0.035, 0xd8b030, 0.12, 0.045, 0.02, g); // brique de jus
    boite(0.07, 0.015, 0.05, 0xa04a2a, -0.12, 0.008, 0.03, g); // biscuits
    return g;
  }
  function lacetsBac(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); groupe.add(g);
    boite(0.6, 0.35, 0.4, 0x3a5a8a, 0, 0.175, 0, g);
    const couleurs = [0xf2f2ee, 0x1a1a1a, 0xc02020, 0x2a5aa8, 0xd8b030, 0x7a5a3a, 0x3a8a4a];
    for (let i = 0; i < 46; i++) {
      const l = P.maille(new THREE.CylinderGeometry(0.004, 0.004, 0.35 + alea() * 0.3, 4), couleurs[i % couleurs.length], g, (alea() - 0.5) * 0.5, 0.33 + alea() * 0.05, (alea() - 0.5) * 0.3);
      l.rotation.set(Math.PI / 2 + (alea() - 0.5) * 0.8, alea() * 3, (alea() - 0.5) * 0.6);
    }
    return g;
  }

  // ---------- Actions de l'élève ----------
  // Une interaction : quand on vise le point et qu'on appuie sur E, « agir » est appelé (une seule fois).
  function interaction(x, y, z, invite, agir) {
    const o = { id: "action", def: { nom: invite }, x, y, z, agir };
    objets.push(o);
    return o;
  }
  function retirerInteraction(o) { const i = objets.indexOf(o); if (i >= 0) objets.splice(i, 1); }
  let objectifEl = null;
  function objectif(texte) {
    if (!objectifEl) return;
    objectifEl.textContent = texte || "";
    objectifEl.classList.toggle("visible", !!texte);
  }
  // Attendre qu'une condition soit vraie (ou un délai maximal, pour que la classe n'attende jamais).
  function attendreQue(cond, max) {
    const t0 = temps;
    return new Promise((r) => { const tic = () => { if (cond() || temps - t0 > max) r(cond()); else attendre(0.15).then(tic); }; tic(); });
  }
  function zoneJoueur(x0, x1, z0, z1) { zone = { x0, x1, z0, z1 }; limite.r = 999; }
  const pres = (x, z, r) => Math.hypot(joueur.x - x, joueur.z - z) < r;

  // La couverture de l'élève : on la voit en bas du champ de vision, elle crépite quand on marche.
  const recit = { couverture: false, signe: null, donneeARosa: false };
  let mylarJoueur = null;
  function donnerMylarJoueur() {
    retirerMylarJoueur();
    const geo = froisser(new THREE.PlaneGeometry(1.1, 0.5, 16, 8), 0.04);
    mylarJoueur = new THREE.Mesh(geo, matMylar);
    mylarJoueur.position.set(0, -0.46, -0.42); mylarJoueur.rotation.set(-1.15, 0, 0);
    camera.add(mylarJoueur);
  }
  function retirerMylarJoueur() { if (mylarJoueur) { camera.remove(mylarJoueur); mylarJoueur = null; } }

  // Un choix : deux boutons à l'écran (souris ou doigt). Renvoie l'indice choisi.
  function choisir(question, options, max) {
    const el = document.getElementById("choix");
    el.querySelector(".question").textContent = question;
    const zoneB = el.querySelector(".options"); zoneB.innerHTML = "";
    fermerFiche(); K.montrerInvite("");
    if (document.exitPointerLock) document.exitPointerLock();
    return new Promise((r) => {
      let fini = false;
      const finir = (i) => {
        if (fini) return; fini = true;
        el.classList.remove("visible");
        const cv = R.renderer.domElement;
        if (cv.requestPointerLock && !document.body.classList.contains("tactile")) { try { cv.requestPointerLock(); } catch (e) {} }
        r(i);
      };
      options.forEach((t, i) => {
        const b = document.createElement("button"); b.textContent = t;
        b.addEventListener("click", () => finir(i)); zoneB.appendChild(b);
      });
      el.classList.add("visible");
      if (max) attendre(max).then(() => finir(-1));
    });
  }
  function flash(force) {
    voile.style.transition = "none"; voile.style.background = "#fff"; voile.style.opacity = String(force || 0.85);
    requestAnimationFrame(() => requestAnimationFrame(() => { voile.style.transition = "opacity 0.9s ease"; voile.style.opacity = "0"; }));
  }

  // ---------- Le comptoir de l'enregistrement (séquences 1 et 4) ----------
  function salleComptoir() {
    ambiance();
    piece(-4.5, 4.5, -5.5, 3.5);
    neons([[-2.2, -1.5], [2.2, -1.5], [0, 1.5], [-3.2, 1.8]]);
    // Le comptoir, sa vitre, l'écran, le lecteur d'empreintes
    boite(5.4, 1.05, 0.7, 0x7a7e7a, 0, 0.525, -3.1);
    boite(5.6, 0.05, 0.8, 0xb0b4b0, 0, 1.075, -3.1);
    const vitre = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.9), new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2 }));
    vitre.position.set(0, 1.55, -3.3); groupe.add(vitre);
    boite(0.5, 0.34, 0.04, 0x4a4e52, 0.9, 1.35, -3.32); P.maille(new THREE.CylinderGeometry(0.02, 0.06, 0.24, 8), 0x3a3e42, groupe, 0.9, 1.2, -3.36);
    const ecran = emissif(new THREE.PlaneGeometry(0.44, 0.28), 0x8ab0e8, 1.3, groupe, 0.9, 1.35, -3.298); ecran.rotation.y = Math.PI;
    boite(0.5, 0.34, 0.04, 0x4a4e52, -1.9, 1.35, -3.32); P.maille(new THREE.CylinderGeometry(0.02, 0.06, 0.24, 8), 0x3a3e42, groupe, -1.9, 1.2, -3.36);
    emissif(new THREE.PlaneGeometry(0.44, 0.28), 0x8ab0e8, 1.1, groupe, -1.9, 1.35, -3.298).rotation.y = Math.PI;
    boite(0.22, 0.08, 0.18, 0x2a2c2e, -0.7, 1.14, -2.95);
    const vertLecteur = emissif(new THREE.PlaneGeometry(0.14, 0.1), 0x40ff80, 1.4, groupe, -0.7, 1.185, -2.95); vertLecteur.rotation.x = -Math.PI / 2;
    // Imprimante à bracelets, tampon, piles de formulaires
    boite(0.3, 0.18, 0.26, 0xd8d8d0, 2.1, 1.19, -3.2); boite(0.22, 0.02, 0.3, 0xf2f0e8, -1.3, 1.11, -3.0); boite(0.22, 0.03, 0.3, 0xf2f0e8, -1.28, 1.13, -3.02);
    // Derrière le comptoir : bacs de sacs, étagères de sacs numérotés
    boite(1.2, 0.5, 0.6, 0x3a5a8a, -2.6, 0.25, -4.6); boite(1.2, 0.5, 0.6, 0x3a5a8a, -1.2, 0.25, -4.6);
    for (let e = 0; e < 3; e++) {
      boite(2.2, 0.03, 0.45, 0x8a8e90, 1.4, 0.6 + e * 0.6, -5.25);
      for (let k = 0; k < 7; k++) boite(0.24, 0.3, 0.3, 0xdfe6ea, 0.5 + k * 0.3, 0.77 + e * 0.6, -5.25);
    }
    // Caméras au plafond
    [[3.6, -5.35, 0], [-4.35, 3.0, Math.PI / 2]].forEach(([x, z, r]) => { const c = boite(0.16, 0.12, 0.24, 0x2a2a2a, x, 2.6, z); c.rotation.y = r; emissif(new THREE.SphereGeometry(0.015, 6, 6), 0xff2020, 3, groupe, x, 2.6, z + 0.13); });
    // Panneaux
    affiche(["U.S. BORDER PATROL · PROCESSING"], -1.6, 2.4, -5.46, 0, { w: 1.6, h: 0.4, couleur: "#1a2a4a", fond: "#e8e8e0", police: "bold 54px system-ui, sans-serif" });
    affiche(["ALL PERSONAL PROPERTY WILL BE INVENTORIED", "TODAS SUS PERTENENCIAS SERÁN INVENTARIADAS"], 4.46, 1.9, -0.6, -Math.PI / 2, { w: 1.5, h: 0.42, police: "bold 36px system-ui, sans-serif" });
    affiche(["STAY BEHIND THE YELLOW LINE", "QUÉDESE DETRÁS DE LA LÍNEA AMARILLA"], 4.46, 1.9, 1.4, -Math.PI / 2, { w: 1.5, h: 0.42, police: "bold 38px system-ui, sans-serif", fond: "#f2d24a" });
    // La ligne jaune
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.1), new THREE.MeshBasicMaterial({ color: Rendu.lumineux(0xe0b020, 0.9) }));
    ligne.rotation.x = -Math.PI / 2; ligne.position.set(0, 0.004, -1.55); groupe.add(ligne);
    // Le poste de photo : toise au mur, marque au sol, appareil sur pied
    const toise = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), new THREE.MeshBasicMaterial({ map: texte2D(["6'6  —————", "6'0  —————", "5'6  —————", "5'0  —————", "4'6  —————"], { l: 256, h: 400, couleur: "#333", fond: "#e6e8e8", police: "bold 30px monospace" }) }));
    toise.position.set(-4.48, 1.35, 1.9); toise.rotation.y = Math.PI / 2; groupe.add(toise);
    const marque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ color: Rendu.lumineux(0xe0b020, 0.8) }));
    marque.rotation.x = -Math.PI / 2; marque.position.set(-4.0, 0.005, 1.9); groupe.add(marque);
    const pied = new THREE.Group(); pied.position.set(-2.1, 0, 1.9); groupe.add(pied);
    [0, 2.1, 4.2].forEach((a) => { const j = P.maille(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 5), 0x222222, pied, Math.cos(a) * 0.18, 0.7, Math.sin(a) * 0.18); j.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); });
    boite(0.16, 0.11, 0.1, 0x1a1a1a, 0, 1.45, 0, pied);
    P.maille(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12), 0x0a0a0a, pied, -0.1, 1.45, 0).rotation.z = Math.PI / 2;
    // Bac à lacets, poubelle, banc d'attente
    const bac = lacetsBac(2.9, -2.4);
    P.maille(new THREE.CylinderGeometry(0.2, 0.18, 0.6, 14), 0x2a3a2a, groupe, 3.9, 0.3, -2.4);
    banc(4.15, 2.0, 2.2, Math.PI / 2);
    // Portes : l'entrée (derrière l'élève), les cellules (à gauche), le bureau (derrière le comptoir)
    const entree = porteMetal(0, 3.5, Math.PI, "SALLY PORT");
    const cellules = porteMetal(-4.5, -0.6, Math.PI / 2, "HOLDING");
    const bureau = porteMetal(3.4, -5.5, 0, "STAFF ONLY");
    return { vertLecteur, ecran, entree, cellules, bureau, bac };
  }

  // ---------- La hielera (séquences 2, 3 et 5) ----------
  // Cellule des femmes et des enfants (x -3.6 → 1.6) ; à droite, derrière le grillage, celle des hommes (1.6 → 5.2).
  // Devant, le couloir, fermé par deux portes : l'aile C à gauche, le secteur 4 et les transports à droite.
  function salleCellule() {
    ambiance();
    piece(-3.6, 5.2, -3.6, 2.4, ["avant"]);
    piece(-3.6, 5.2, 2.4, 5.6, ["fond"]);
    neons([[-1.0, -1.0, Math.PI / 2], [3.4, -1.0, Math.PI / 2], [0.8, 4.0, Math.PI / 2], [-2.4, 4.0, Math.PI / 2]]);
    const porteF = barreaux(-3.6, 1.6, 2.4, [-1.3, 0.9]);
    const porteH = barreaux(1.6, 5.2, 2.4, [3.3, 0.9]);
    grillage(1.6, -3.6, 2.4);
    banc(-1.0, -3.3, 5.0); banc(-3.35, -0.8, 3.4, Math.PI / 2);
    banc(3.4, -3.3, 3.4);
    toilette(-3.1, -3.0); toilette(4.7, -3.05);
    // Les autres détenus
    dormeur(-2.0, -1.2, 0.3); dormeur(-0.9, 0.2, -1.4, 0x8a6448); dormeur(0.4, -1.6, 1.2, 0x6e4a33);
    dormeur(3.1, 0.6, 1.6); dormeur(4.3, -1.4, 0.2, 0x5a3a26); dormeur(3.6, 1.5, -1.6, 0x8a6448);
    [[-3.5, -2.4], [4.9, 0.4], [-2.6, 1.6], [2.1, -2.9]].forEach(([x, z]) => mylarPlie(x, 0.03, z));
    // Détails de la cellule : graffitis, fontaine, repas, rouleau de papier, bonde au sol
    graffitis(-3.58, 1.25, 1.55, Math.PI / 2);
    fontaine(1.2, 1.9);
    repas(-2.4, 0.46, -3.3); repas(0.6, 0.46, -3.35);
    P.maille(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10), 0xf2f2ee, groupe, -2.55, 0.05, -3.4).rotation.z = Math.PI / 2;
    P.maille(new THREE.CylinderGeometry(0.08, 0.08, 0.005, 14), 0x4a4c4e, groupe, -1.0, 0.003, -0.6);
    // Le couloir : poste de garde, panneaux, portes
    boite(1.6, 0.8, 0.6, 0x6a6e70, 0.4, 0.4, 5.1); boite(1.7, 0.04, 0.7, 0x9a9ea0, 0.4, 0.82, 5.1);
    boite(0.45, 0.3, 0.04, 0x1a1c1e, 0.4, 1.05, 5.25);
    emissif(new THREE.PlaneGeometry(0.4, 0.25), 0x8ab0e8, 1.1, groupe, 0.4, 1.05, 5.228).rotation.y = Math.PI;
    affiche(["← WING C  ·  ADULT FEMALES", "SECTOR 4  ·  MINORS →"], 0.4, 2.15, 5.58, Math.PI, { w: 2.0, h: 0.5, police: "bold 52px system-ui, sans-serif" });
    affiche(["HOLD ROOM 3"], -1.0, 2.75, 2.42, 0, { w: 0.7, h: 0.18, couleur: "#e8e8e0", fond: "#1e3a5a", police: "bold 70px system-ui, sans-serif" });
    affiche(["HOLD ROOM 4"], 3.4, 2.75, 2.42, 0, { w: 0.7, h: 0.18, couleur: "#e8e8e0", fond: "#1e3a5a", police: "bold 70px system-ui, sans-serif" });
    const aileC = porteMetal(-3.6, 4.0, Math.PI / 2, "WING C");
    const secteur4 = porteMetal(5.2, 4.0, -Math.PI / 2, "SECTOR 4");
    boite(0.16, 0.12, 0.24, 0x2a2a2a, -3.4, 2.7, 2.2);
    emissif(new THREE.SphereGeometry(0.015, 6, 6), 0xff2020, 3, groupe, -3.33, 2.7, 2.08);
    // Objets à regarder, dans la cellule des femmes
    objet("graffiti_mur", null, -3.5, 1.25, 1.55);
    objet("fontaine", null, 1.2, 1.1, 1.9);
    objet("repas", null, -2.4, 0.5, -3.3);
    objet("toilettes", null, -2.9, 0.8, -2.7);
    return { porteF, porteH, aileC, secteur4 };
  }
  const ZONE_CELLULE = [-3.25, 1.35, -2.95, 2.15];

  // L'élève garde sa couverture d'une séquence à l'autre.
  function reprendreCouverture() { if (recit.couverture && !recit.donneeARosa) donnerMylarJoueur(); }

  // =====================================================================
  //  Séquence 1 : l'enregistrement (l'élève fait partie du groupe)
  // =====================================================================
  async function sequence1() {
    viderTableau(); ilotCourant = "seq1";
    solY = () => 0;
    const s = salleComptoir();
    const agent = personnage("agent_bureau", 0.4, -3.75, 0, "debout");
    const agent2 = personnage("agente", 3.8, -0.4, -Math.PI / 2, "debout"); // surveille la file
    const z = -1.45;
    const g = {
      julio: personnage("julio", -2.3, z, Math.PI), yesenia: personnage("yesenia", -1.5, z, Math.PI),
      rosa: personnage("rosa", -0.75, z, Math.PI), mateo: personnage("mateo", -0.25, z, Math.PI),
      valeria: personnage("valeria", 1.25, z, Math.PI), joseph: personnage("joseph", 2.0, z, Math.PI),
      ernesto: personnage("ernesto", 2.75, z, Math.PI),
    };
    g.ernesto.cible = "tete_basse"; g.yesenia.cible = "tete_basse";
    // Sur le comptoir : le sac à dos de Mateo, les sacs plastiques des effets
    const sacMateo = new THREE.Group(); sacMateo.position.set(-0.1, 1.27, -2.95); groupe.add(sacMateo);
    boite(0.3, 0.36, 0.16, 0x6a3030, 0, 0, 0, sacMateo); boite(0.22, 0.14, 0.05, 0x5a2828, 0, -0.06, 0.1, sacMateo);
    const sachet = () => new THREE.Mesh(froisser(new THREE.BoxGeometry(0.34, 0.12, 0.26, 3, 2, 3), 0.03), new THREE.MeshStandardMaterial({ color: 0xe8eef0, transparent: true, opacity: 0.55, roughness: 0.2 }));
    const effets = sachet(); effets.position.set(-1.6, 1.16, -2.9); groupe.add(effets);
    boite(0.18, 0.02, 0.12, 0x1a1a1a, -1.62, 1.13, -2.88);
    objet("sac_effets", effets, -1.6, 1.2, -2.9);
    const sacJoueur = sachet(); sacJoueur.position.set(1.4, 1.16, -2.85); groupe.add(sacJoueur);
    const cahier = boite(0.22, 0.015, 0.16, 0x3a6a8a, 0.22, 1.11, -2.85); cahier.rotation.y = 0.3;
    objet("lacets_bac", s.bac, 2.9, 0.45, -2.4);
    placerJoueur(0.4, 2.2, 0.0, -0.1, 1);
    zoneJoueur(-4.1, 4.1, -2.6, 3.0);
    A.reinitialiser();
    sonsCentre(0.8);
    const tube = A.neon(0, 2.9, -1.5);
    majTableau = () => {
      if (g.mateo.cible !== "marche") mainDansLaMain(g.rosa, g.mateo);
      s.ecran.material.color.setScalar(1.2 + Math.sin(temps * 0.7) * 0.05);
    };
    await fondu(false, 2);
    A.claquement(0, 1.2, 3.5); // la porte de l'entrée vient de se refermer derrière vous
    await carte("seq1");
    await attendre(0.5);
    await dire("agentBureau1", 0.4);
    // 1. Se placer sur la ligne jaune, avec les autres
    objectif("Placez-vous sur la ligne jaune, avec les autres.");
    await attendreQue(() => Math.abs(joueur.z - (-1.5)) < 0.45, 25);
    objectif("");
    // L'agent prend le sac de Mateo et le jette dans un bac.
    const t0 = temps;
    await new Promise((r) => { const pas = () => { const u = Math.min(1, (temps - t0) / 1.4); sacMateo.position.set(-0.1 - u * 1.3, 1.27 + Math.sin(u * Math.PI) * 0.3 - u * 0.75, -2.95 - u * 1.6); sacMateo.rotation.z = u * 1.2; if (u < 1) attendre(0.02).then(pas); else r(); }; pas(); });
    objet("cahier_mateo", cahier, 0.22, 1.12, -2.85);
    tourner(g.mateo, g.rosa.x, g.rosa.z - 1);
    await dire("mateoSac", 0.3);
    tourner(g.rosa, g.mateo.x, g.mateo.z); g.rosa.cible = "accroupi";
    await dire("rosaCalme", 1.0);
    g.rosa.cible = "debout"; tourner(g.rosa, g.rosa.x, g.rosa.z - 2); tourner(g.mateo, g.mateo.x, g.mateo.z - 2);
    // 2. Votre tour : ceinture et lacets
    tourner(agent, joueur.x, joueur.z);
    await dire("agentToi", 0.3);
    objectif("Avancez jusqu'au comptoir et déposez votre ceinture et vos lacets dans le sac (E).");
    let fait = false;
    interaction(1.4, 1.2, -2.85, "Déposer votre ceinture et vos lacets", () => { fait = true; A.froissement(1.4, 1.2, -2.85, 1.2); A.bip(1.4, 1.2, -2.85); });
    await attendreQue(() => fait, 35);
    sacJoueur.scale.set(1, 1.4, 1);
    objectif("");
    await attendre(0.6);
    // 3. Les empreintes
    tourner(agent, -0.7, -2.6);
    await dire("agentDoigts", 0.2);
    objectif("Posez vos doigts sur le lecteur d'empreintes (E).");
    fait = false;
    interaction(-0.7, 1.2, -2.95, "Poser vos doigts sur le lecteur", () => { fait = true; });
    await attendreQue(() => fait, 35);
    objectif("");
    for (let i = 0; i < 3; i++) { A.bip(-0.7, 1.2, -2.95); s.vertLecteur.visible = false; await attendre(0.25); s.vertLecteur.visible = true; await attendre(0.5); }
    // 4. La photo
    await dire("agentPhoto", 0.2);
    objectif("Allez sur la marque jaune, dos au mur, face à l'appareil.");
    await attendreQue(() => pres(-4.0, 1.9, 0.45), 35);
    objectif("");
    if (!pres(-4.0, 1.9, 0.45)) { joueur.x = -4.0; joueur.z = 1.9; }
    K.etat.lacet = regarder(-4.0, 1.9, -2.1, 1.9); K.etat.tangage = 0;
    await attendre(1.2);
    A.bip(-2.1, 1.45, 1.9); flash(0.9);
    await attendre(1.5);
    // 5. Julio : ses empreintes sont déjà dans le système. On l'emmène.
    await allerVers(g.julio, -0.7, -2.55, 0.8);
    tourner(g.julio, -0.7, -3.2); g.julio.cible = "travaille";
    await attendre(0.6);
    for (let i = 0; i < 3; i++) { A.bip(-0.7, 1.2, -2.95); s.vertLecteur.visible = false; await attendre(0.25); s.vertLecteur.visible = true; await attendre(0.5); }
    g.julio.cible = "debout";
    await dire("agentJulio", 0.4);
    await allerVers(agent2, -3.2, -1.0, 1.1);
    tourner(agent2, g.julio.x, g.julio.z);
    await allerVers(g.julio, -3.4, -1.6, 0.7);
    g.julio.cible = "tete_basse";
    await dire("julioEmpreintes", 0.8);
    g.julio.suivre = { leader: agent2, cote: -0.5 };
    await sortirPar(s.cellules, agent2, [g.julio], 0.8);
    await attendre(3);
    tube.arreter(2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Séquence 2 : la hielera (on explore la cellule)
  // =====================================================================
  async function sequence2() {
    viderTableau(); ilotCourant = "seq2";
    solY = () => 0;
    const c = salleCellule();
    const g = {
      rosa: personnage("rosa", -1.25, -3.15, 0, "chaise"), mateo: personnage("mateo", -0.65, -3.15, 0, "chaise"),
      valeria: personnage("valeria", 0.2, -3.15, 0, "chaise"), yesenia: personnage("yesenia", -3.28, -0.4, Math.PI / 2, "chaise"),
      ernesto: personnage("ernesto", 2.5, -0.9, -Math.PI / 2, "assis"), joseph: personnage("joseph", 3.2, -3.15, 0, "chaise"),
    };
    ["rosa", "valeria", "yesenia", "ernesto", "joseph"].forEach((k) => envelopper(g[k]));
    figurant(-3.28, -1.6, Math.PI / 2, "dort", true); figurant(0.9, -3.15, 0, "chaise", true); figurant(4.1, -3.15, 0, "dort");
    const agent = personnage("agent_bureau", -0.85, 3.0, Math.PI, "debout");
    // La pile de couvertures, juste derrière la porte
    const pile = new THREE.Group(); groupe.add(pile);
    for (let i = 0; i < 5; i++) pile.add(mylarPlie(-0.4, 0.03 + i * 0.05, 1.95));
    placerJoueur(-0.85, 0.5, Math.PI * 0.97, -0.4, 1);
    zoneJoueur(...ZONE_CELLULE);
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq2");
    majTableau = () => {
      g.mateo.haut.rotation.z += Math.sin(temps * 38) * 0.012; // Mateo grelotte
      g.rosa.haut.rotation.z += Math.sin(temps * 31 + 1) * 0.006;
    };
    await fondu(false, 2.5);
    // On vient de vous enfermer : la porte claque, l'agent s'en va.
    A.claquement(-0.85, 1.1, 2.4);
    await carte("seq2");
    allerVers(agent, 0.4, 4.4, 0.9).then(() => sortirPar(c.secteur4, agent, [], 0.9));
    // 1. Prendre une couverture
    objectif("Il fait 14 °C. Prenez une couverture de survie (E).");
    let prise = false;
    interaction(-0.4, 0.2, 1.95, "Prendre une couverture de survie", () => {
      prise = true; recit.couverture = true; donnerMylarJoueur(); A.froissement(joueur.x, 1, joueur.z, 1.6);
      pile.children[pile.children.length - 1].visible = false;
      const def = C.objetsInteractifs.find((o) => o.id === "couverture_mylar");
      ficheOuverte = { def }; ficheFin = temps + 20;
      fiche.querySelector(".nom").textContent = def.nom; fiche.querySelector(".texte").textContent = def.texte; fiche.querySelector(".contexte").textContent = def.contexte;
      fiche.classList.add("visible");
    });
    await attendreQue(() => prise, 40);
    if (!prise) { recit.couverture = true; donnerMylarJoueur(); }
    await attendre(2);
    // 2. Explorer, écouter les autres
    objectif("Trouvez une place. Approchez-vous des autres pour les écouter (E). Regardez autour de vous.");
    let ernestoEcoute = false, valeriaEcoute = false;
    const parlerErnesto = async () => {
      A.froissement(g.ernesto.x, 0.6, g.ernesto.z, 1.4);
      tourner(g.ernesto, joueur.x, joueur.z); g.ernesto.regardeJoueur = true;
      await dire("ernestoFroid", 1.0);
      await dire("josephFroid", 1.0);
      ernestoEcoute = true;
    };
    const parlerValeria = async () => {
      g.valeria.cible = "debout";
      await attendre(0.8);
      await allerVers(g.valeria, -0.3, -2.8, 0.5);
      tourner(g.valeria, -0.65, -3.3); g.valeria.cible = "accroupi";
      A.froissement(-0.5, 0.5, -2.9, 1.6);
      await dire("valeriaMateo", 0.6);
      g.valeria.mylar.parent.remove(g.valeria.mylar);
      envelopper(g.mateo); g.mateo.cible = "dort";
      await allerVers(g.valeria, 0.0, -3.15, 0.4);
      g.valeria.cible = "chaise"; g.valeria.cap = 0; g.valeria.capVise = 0;
      valeriaEcoute = true;
    };
    const iE = interaction(1.45, 1.0, -0.9, "Écouter Don Ernesto, de l'autre côté du grillage", () => { parlerErnesto(); });
    const iV = interaction(-0.4, 0.9, -2.9, "S'approcher de Valeria et de Mateo", () => { parlerValeria(); });
    await attendreQue(() => ernestoEcoute && valeriaEcoute, 110);
    // Si l'élève n'est pas allé les voir, les scènes se jouent quand même.
    if (!ernestoEcoute && objets.includes(iE)) { retirerInteraction(iE); await parlerErnesto(); }
    await attendreQue(() => ernestoEcoute, 20);
    if (!valeriaEcoute && objets.includes(iV)) { retirerInteraction(iV); await parlerValeria(); }
    await attendreQue(() => valeriaEcoute, 20);
    objectif("");
    await attendre(10);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Séquence 3 : la séparation
  // =====================================================================
  async function sequence3() {
    viderTableau(); ilotCourant = "seq3";
    solY = () => 0;
    const c = salleCellule();
    const g = {
      rosa: personnage("rosa", -1.25, -3.15, 0, "chaise"), mateo: personnage("mateo", -0.65, -3.15, 0, "chaise"),
      valeria: personnage("valeria", 0.2, -3.15, 0, "chaise"), yesenia: personnage("yesenia", -3.28, -0.4, Math.PI / 2, "chaise"),
      ernesto: personnage("ernesto", 2.5, -0.9, -Math.PI / 2, "assis"), joseph: personnage("joseph", 3.2, -3.15, 0, "chaise"),
    };
    ["rosa", "valeria", "yesenia", "ernesto", "joseph", "mateo"].forEach((k) => envelopper(g[k]));
    figurant(-3.28, -1.6, Math.PI / 2, "dort", true); figurant(0.9, -3.15, 0, "chaise", true);
    const agent = personnage("agent_bureau", -0.5, 3.6, Math.PI, "debout"); agent.racine.visible = false;
    const agente = personnage("agente", 0.6, 4.4, Math.PI, "debout"); agente.racine.visible = false;
    // La planchette, accrochée aux barreaux à côté de la porte
    const planche = new THREE.Group(); planche.position.set(-1.9, 1.4, 2.36); groupe.add(planche);
    boite(0.24, 0.32, 0.015, 0x6a4a2a, 0, 0, 0, planche);
    const feuille = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshBasicMaterial({ map: texte2D(["884-B  ☐ C", "884-C  ☐ 4", "885-A  ☐ C", "885-D  ☐ 4", "886-B  ☐ C"], { l: 256, h: 320, couleur: "#222", fond: "#f2f0e8", police: "26px monospace" }) }));
    feuille.position.z = -0.01; feuille.rotation.y = Math.PI; planche.add(feuille);
    objet("liste_dossiers", planche, -1.9, 1.4, 2.3);
    placerJoueur(-2.4, -0.6, regarder(-2.4, -0.6, -0.9, 2.4), -0.05, 1);
    zoneJoueur(...ZONE_CELLULE);
    reprendreCouverture();
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq3");
    let rosaAuxBarreaux = false, mainsLiees = false, porteOuverte = false, avertie = false;
    majTableau = () => {
      if (rosaAuxBarreaux) mainsAuxBarreaux(g.rosa, 2.36);
      if (mainsLiees) mainDansLaMain(agente, g.mateo);
      // Si l'élève s'approche de la porte ouverte, l'agent le repousse.
      if (porteOuverte && !avertie && pres(-0.85, 2.3, 1.1)) { avertie = true; tourner(agent, joueur.x, joueur.z); dire("agentRecule", 0.2); }
      if (porteOuverte && zone) zone.z1 = pres(-0.85, 2.3, 1.6) ? 1.7 : ZONE_CELLULE[3];
    };
    await fondu(false, 2.5);
    await carte("seq3");
    await attendre(1.0);
    // Les agents arrivent par la porte du secteur 4.
    entrerPar(c.secteur4, agente, 0.2, 4.4, 1.0, true);
    await attendre(2.6);
    await entrerPar(c.secteur4, agent, -0.85, 2.85, 1.0);
    tourner(agent, -0.85, 0);
    A.gache(-0.85, 1.1, 2.4);
    await attendre(0.4);
    porteOuverte = true;
    await bougerPorte(c.porteF, -1.6, 1.2);
    agent.cible = "travaille";
    await dire("agentSep1", 0.6);
    g.rosa.cible = "debout"; g.mateo.cible = "debout";
    await attendre(0.6);
    g.rosa.mylar.visible = false;
    A.froissement(g.rosa.x, 0.6, g.rosa.z, 1.2);
    await allerVers(g.rosa, -1.0, -1.6, 0.9);
    tourner(g.rosa, agent.x, agent.z);
    await dire("rosaPanique", 0.2);
    // L'agente entre et prend Mateo par la main.
    await allerVers(agente, -0.9, 1.6, 1.1);
    await allerVers(agente, -0.4, -2.3, 1.1);
    tourner(agente, g.mateo.x, g.mateo.z);
    await dire("agenteMateo", 0.3);
    mainsLiees = true;
    g.mateo.mylar.visible = false;
    A.froissement(g.mateo.x, 0.4, g.mateo.z, 1);
    g.mateo.suivre = { leader: agente, cote: 0.42 };
    const depart = (async () => {
      await allerVers(agente, -0.9, 1.2, 0.9); await allerVers(agente, -0.9, 3.4, 0.9); await allerVers(agente, 3.8, 4.1, 1.0);
      mainsLiees = false;
      await sortirPar(c.secteur4, agente, [g.mateo], 1.0);
    })();
    await attendre(1.2);
    await dire("mateoPleurs", 0.2);
    // Rosa veut suivre : l'agent referme la porte devant elle.
    allerVers(g.rosa, -0.9, 1.9, 1.3);
    await attendre(2.6);
    await bougerPorte(c.porteF, 0, 0.7);
    porteOuverte = false; zone.z1 = ZONE_CELLULE[3];
    A.claquement(-0.85, 1.1, 2.4);
    allerVers(agent, 0.9, 3.5, 0.8).then(() => tourner(agent, -0.9, 2.4));
    await attendre(0.5);
    tourner(g.rosa, -0.9, 3); rosaAuxBarreaux = true;
    await dire("rosaCriCell", 1.5);
    await depart;
    await allerVers(agent, 3.8, 4.1, 0.9);
    sortirPar(c.secteur4, agent, [], 0.9);
    await attendre(3);
    rosaAuxBarreaux = false; g.rosa.cible = "agenouille";
    await attendre(8);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Séquence 4 : les papiers (et le choix de l'élève)
  // =====================================================================
  async function sequence4() {
    viderTableau(); ilotCourant = "seq4";
    solY = () => 0;
    const s = salleComptoir();
    const agent = personnage("agent_bureau", -0.2, -3.75, 0, "debout");
    const zl = -1.45;
    const g = {
      yesenia: personnage("yesenia", -0.2, -2.55, Math.PI, "debout"),
      joseph: personnage("joseph", 0.6, zl, Math.PI, "debout"), valeria: personnage("valeria", 1.4, zl, Math.PI, "debout"),
    };
    envelopper(g.yesenia); envelopper(g.joseph); envelopper(g.valeria);
    const feuille = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), new THREE.MeshBasicMaterial({ map: texte2D(["I-826", "NOTICE OF RIGHTS", "AND REQUEST", "FOR DISPOSITION", "", "☐ I request a hearing", "☒ I give up my right", "   to a hearing", "", "Sign: ________"], { l: 256, h: 360, couleur: "#1a1a1a", fond: "#f4f2ea", police: "18px Georgia, serif" }) }));
    feuille.rotation.x = -Math.PI / 2; feuille.position.set(-0.2, 1.104, -2.9); groupe.add(feuille);
    const stylo = P.maille(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), 0x1a2a5a, groupe, -0.05, 1.11, -2.88); stylo.rotation.z = Math.PI / 2;
    objet("formulaire_expulsion", feuille, -0.2, 1.12, -2.9);
    placerJoueur(2.3, zl + 0.1, regarder(2.3, zl, -0.2, -2.9), -0.18, 1);
    zoneJoueur(-4.1, 4.1, -2.6, 3.0);
    reprendreCouverture();
    A.reinitialiser();
    sonsCentre(0.8);
    const tube = A.neon(0, 2.9, -1.5);
    let signe = null;
    majTableau = () => {
      if (signe) { _m.set(signe.x + Math.sin(temps * 12) * 0.04, 1.14, -2.85); P.pointerBras(signe.p, 1, _m, 0.8); }
    };
    await fondu(false, 2);
    await carte("seq4");
    await attendre(1);
    agent.cible = "travaille";
    await dire("agentSigne", 0.6);
    g.yesenia.cible = "tete_basse";
    await dire("yeseniaConfuse", 2.2);
    // Personne ne lui répond. Elle finit par signer.
    await attendre(1.5);
    signe = { p: g.yesenia, x: -0.2 }; stylo.visible = false;
    await attendre(3);
    signe = null; stylo.visible = true; A.claquement(-0.2, 1.1, -2.9);
    await allerVers(g.yesenia, -2.6, -1.9, 0.6);
    g.yesenia.cible = "tete_basse"; tourner(g.yesenia, -2.6, -4);
    await dire("agentSuivant", 0.4);
    await allerVers(g.joseph, -0.2, -2.55, 0.8);
    tourner(g.joseph, -0.2, -3.5);
    agent.cible = "debout";
    await dire("josephInterprete", 2.0);
    agent.cible = "travaille";
    await attendre(1.8);
    await allerVers(g.joseph, -1.3, -2.0, 0.6);
    await dire("agentSuivant", 0.4);
    await allerVers(g.valeria, -0.2, -2.55, 0.8);
    tourner(g.valeria, -0.2, -3.5);
    await attendre(0.8);
    await dire("valeriaAsile", 2.0);
    agent.cible = "debout";
    await attendre(1.5);
    await allerVers(g.valeria, 1.2, -2.1, 0.6);
    // Votre tour.
    tourner(agent, joueur.x, joueur.z);
    await dire("agentSuivant", 0.4);
    objectif("C'est votre tour. Avancez jusqu'au comptoir.");
    await attendreQue(() => pres(-0.2, -2.5, 0.9), 30);
    objectif("");
    if (!pres(-0.2, -2.5, 0.9)) { joueur.x = -0.2; joueur.z = -2.4; }
    K.etat.lacet = regarder(joueur.x, joueur.z, -0.2, -2.9); K.etat.tangage = -0.55;
    await dire("agentSigne", 0.3);
    const i = await choisir("Le formulaire est en anglais. Vous ne pouvez pas le lire. L'agent attend, le stylo tendu.", ["Signer", "Ne pas signer"], 45);
    if (i === 0) {
      recit.signe = true;
      stylo.visible = false; A.froissement(-0.2, 1.1, -2.9, 0.6);
      await attendre(1.2); stylo.visible = true; A.claquement(-0.2, 1.1, -2.9);
      await dire("agentSuivant", 1.5);
    } else {
      recit.signe = i === 1 ? false : null;
      await attendre(1.5);
      await dire("agentRefus", 1.5);
    }
    await attendre(3);
    tube.arreter(2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Séquence 5 : le départ de Don Ernesto
  // =====================================================================
  async function sequence5() {
    viderTableau(); ilotCourant = "seq5";
    solY = () => 0;
    const c = salleCellule();
    const g = {
      rosa: personnage("rosa", -1.25, -3.15, 0, "dort"),
      valeria: personnage("valeria", 0.2, -3.15, 0, "chaise"), yesenia: personnage("yesenia", -3.28, -0.4, Math.PI / 2, "dort"),
      ernesto: personnage("ernesto", 2.6, -3.15, 0, "chaise"), joseph: personnage("joseph", 3.6, -3.15, 0, "dort"),
    };
    ["valeria", "yesenia", "ernesto", "joseph"].forEach((k) => envelopper(g[k])); // Rosa n'a plus de couverture
    figurant(-3.28, -1.6, Math.PI / 2, "dort", true); figurant(4.4, -3.15, 0, "chaise");
    const agent = personnage("agent_bureau", 4.8, 4.2, Math.PI, "debout"); agent.racine.visible = false;
    placerJoueur(-0.2, 0.9, regarder(-0.2, 0.9, 1.6, -1.6), -0.12, 1);
    zoneJoueur(...ZONE_CELLULE);
    reprendreCouverture();
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq5");
    majTableau = () => { g.rosa.haut.rotation.z += Math.sin(temps * 33) * 0.01; }; // Rosa grelotte
    await fondu(false, 2.5);
    await carte("seq5");
    // Rosa, sans couverture : l'élève peut lui donner la sienne.
    let donnee = false;
    const iR = recit.couverture ? interaction(-1.25, 0.9, -2.9, "Donner votre couverture à Rosa", () => {
      donnee = true; recit.donneeARosa = true; retirerMylarJoueur(); envelopper(g.rosa); A.froissement(-1.25, 0.7, -3.0, 1.8);
      g.rosa.regardeJoueur = true; g.rosa.parleJusqua = temps + 2.5; g.rosa.cible = "chaise";
    }) : null;
    if (iR) objectif("Rosa grelotte. Elle n'a plus de couverture.");
    await attendre(5);
    await entrerPar(c.secteur4, agent, 3.75, 2.9, 1.0);
    tourner(agent, 3.75, 0);
    A.gache(3.6, 1.1, 2.4);
    await attendre(0.4);
    await bougerPorte(c.porteH, -1.6, 1.0);
    await dire("agentAube", 0.8);
    // Don Ernesto se lève, plie sa couverture et va jusqu'au grillage, près de Rosa.
    g.ernesto.cible = "debout";
    await attendre(1.2);
    g.ernesto.mylar.visible = false; A.froissement(g.ernesto.x, 0.8, g.ernesto.z, 1.6);
    mylarPlie(2.6, 0.48, -3.3);
    await allerVers(g.ernesto, 1.85, -2.4, 0.6);
    tourner(g.ernesto, -1.25, -3.0);
    if (g.rosa.cible !== "chaise") g.rosa.cible = "chaise";
    await attendre(1.2);
    tourner(g.rosa, 1.6, -2.4);
    await dire("ernestoAdieu", 1.2);
    await allerVers(g.ernesto, 3.6, 1.6, 0.6);
    await allerVers(g.ernesto, 3.75, 3.4, 0.6);
    allerVers(agent, 3.75, 3.9, 0.8);
    await attendre(1.0);
    await bougerPorte(c.porteH, 0, 0.7);
    A.claquement(3.6, 1.1, 2.4);
    g.ernesto.suivre = { leader: agent, cote: 0.5 };
    await allerVers(agent, 4.2, 4.0, 0.8);
    await sortirPar(c.secteur4, agent, [g.ernesto], 0.8);
    // Le froid, la lumière blanche, le bourdonnement. Personne ne sait l'heure.
    await attendreQue(() => donnee, 14);
    objectif("");
    if (iR) retirerInteraction(iR);
    if (!donnee) g.rosa.cible = "dort";
    await attendre(7);
    voile.style.transition = "opacity 5s ease"; voile.style.background = "#e8eef6"; voile.style.opacity = "1";
    await attendre(5.5);
    if (sonClim) { sonClim.arreter(3); sonClim = null; }
    A.toutCouper(3);
    voile.style.transition = "opacity 2.5s ease"; voile.style.background = "#000";
    await attendre(3);
  }

  // Ce que l'élève a fait, pour la fin du chapitre.
  function lignesRecit() {
    const l = [];
    if (recit.signe === true) l.push("Vous avez signé un papier que vous ne pouviez pas lire. Beaucoup de personnes renvoyées racontent la même chose.");
    if (recit.signe === false) l.push("Vous n'avez pas signé. Pour vous, l'attente commence : des jours, peut-être des semaines, avant qu'on écoute votre peur.");
    if (recit.donneeARosa) l.push("Vous avez donné votre couverture à Rosa.");
    return l;
  }

  // =====================================================================
  //  Joueur, objets, boucle
  // =====================================================================
  function majJoueur(dt) {
    const { av, lat } = K.deplacement(dt);
    const l = K.etat.lacet;
    const fx = -Math.sin(l), fz = -Math.cos(l), rx = Math.cos(l), rz = -Math.sin(l);
    const vMax = 1.3, kv = 1 - Math.exp(-dt * (av || lat ? 4 : 6));
    joueur.vx += ((fx * av + rx * lat) * vMax - joueur.vx) * kv;
    joueur.vz += ((fz * av + rz * lat) * vMax - joueur.vz) * kv;
    let nx = joueur.x + joueur.vx * dt, nz = joueur.z + joueur.vz * dt;
    const d = Math.hypot(nx - limite.x, nz - limite.z);
    if (d > limite.r) { nx = limite.x + (nx - limite.x) / d * limite.r; nz = limite.z + (nz - limite.z) / d * limite.r; }
    if (zone) { nx = Math.max(zone.x0, Math.min(zone.x1, nx)); nz = Math.max(zone.z0, Math.min(zone.z1, nz)); }
    const pas = Math.hypot(nx - joueur.x, nz - joueur.z);
    joueur.x = nx; joueur.z = nz;
    joueur.distPas += pas; joueur.balance += pas * 5.5;
    if (joueur.distPas > 0.72) { joueur.distPas = 0; A.pas(0.18); if (mylarJoueur) A.froissement(joueur.x, 1.0, joueur.z, 0.35); }
    camera.position.set(joueur.x, solY(joueur.x, joueur.z) + joueur.yeux + Math.sin(joueur.balance) * 0.025, joueur.z);
    camera.rotation.set(K.etat.tangage, l, 0, "YXZ");
  }

  const _dir = new THREE.Vector3(), _versObj = new THREE.Vector3();
  let objetVise = null;
  function majObjets() {
    objetVise = null;
    if (ficheOuverte) { if (temps > ficheFin) fermerFiche(); K.montrerInvite(""); return; }
    camera.getWorldDirection(_dir);
    // L'objet le plus au centre du regard ; les gestes (prendre, donner, écouter) passent avant les fiches.
    let meilleur = 0;
    for (const o of objets) {
      _versObj.set(o.x - camera.position.x, o.y - camera.position.y, o.z - camera.position.z);
      const d = _versObj.length();
      const vise = _versObj.normalize().dot(_dir);
      const score = vise + (o.agir ? 0.05 : 0);
      if (d < 2.6 && vise > 0.82 && score > meilleur) { objetVise = o; meilleur = score; }
    }
    objets.forEach((o) => { if (o.lueur) o.lueur.intensity = o === objetVise ? 0.6 : o.vu ? 0 : 0.25; });
    K.montrerInvite(objetVise ? (objetVise.agir ? "[E] " + objetVise.def.nom : "[E] Regarder : " + objetVise.def.nom) : "");
  }
  function action() {
    if (ficheOuverte) return fermerFiche();
    if (!objetVise) return;
    if (objetVise.agir) { const o = objetVise; retirerInteraction(o); objetVise = null; o.agir(); return; }
    ficheOuverte = objetVise; objetVise.vu = true; ficheFin = temps + (objetVise.def.contexte ? 22 : 14);
    fiche.querySelector(".nom").textContent = objetVise.def.nom;
    fiche.querySelector(".texte").textContent = objetVise.def.texte;
    fiche.querySelector(".contexte").textContent = objetVise.def.contexte || "";
    fiche.classList.add("visible");
  }
  function fermerFiche() { ficheOuverte = null; fiche.classList.remove("visible"); }

  function persosMaj(dt) {
    persos.forEach((p) => {
      deplacer(p, dt);
      if (p.capVise !== undefined && !p.but) {
        let c = p.capVise - p.cap; while (c > Math.PI) c -= 2 * Math.PI; while (c < -Math.PI) c += 2 * Math.PI;
        p.cap += c * Math.min(1, dt * 3);
      }
      P.animer(p, dt);
    });
  }

  const _avant = new THREE.Vector3();
  function boucle() {
    const dtReel = horloge.getDelta();
    const dt = Math.min(0.05, dtReel) * acceleration;
    if (enPause()) { R.rendre(); return; }
    temps += dt;
    resoudreAttentes();
    majJoueur(dt);
    persosMaj(dt);
    if (majTableau) majTableau(dt);
    majPassages();
    majObjets();
    A.auditeur(camera.position, _avant.set(0, 0, -1).applyQuaternion(camera.quaternion));
    R.surveiller(dtReel);
    R.rendre();
  }

  // =====================================================================
  //  Lancement
  // =====================================================================
  async function lancer(options) {
    onFin = options.fin;
    acceleration = options.acceleration || 1;
    voile = document.getElementById("voile");
    sousTitre = document.getElementById("sous-titre");
    aide = document.getElementById("aide");
    fiche = document.getElementById("fiche");
    carteLieu = document.getElementById("carte-lieu");
    R = Rendu.creer({ qualite: options.qualite, exposition: 1.3 });
    scene = R.scene; camera = R.camera; env.haute = R.haute;
    if (!camera.parent) scene.add(camera); // pour voir la couverture que l'élève tient
    objectifEl = document.getElementById("objectif");
    K = Controles.creer({ canvas: R.renderer.domElement, action, actif: () => ilotCourant !== "fin" });
    fiche.addEventListener("click", fermerFiche);
    aide.classList.add("visible", "controles");
    setTimeout(() => aide.classList.remove("controles"), 15000);
    horloge = new THREE.Clock();
    R.renderer.setAnimationLoop(boucle);
    A.prechargerVoix();


    const ordre = [["seq1", sequence1], ["seq2", sequence2], ["seq3", sequence3], ["seq4", sequence4], ["seq5", sequence5]];
    const depart = Math.max(0, ordre.findIndex(([n]) => n === options.ilot));
    for (const [, f] of ordre.slice(depart)) await f();

    ilotCourant = "fin";
    objectif("");
    K.liberer();
    aide.classList.remove("visible");
    if (sonClim) { sonClim.arreter(1); sonClim = null; }
    R.detruire();
    if (onFin) onFin();
  }

  return {
    lancer,
    _etat: () => ({ ilot: ilotCourant, temps, t: temps - debutIlot, brume: scene && scene.fog ? [scene.fog.density, scene.fog.color.getHexString(), scene.background.getHexString ? scene.background.getHexString() : "tex"] : null, joueur: { x: joueur.x, z: joueur.z }, objets: objets.map((o) => o.id), persos: persos.map((p) => [p.qui, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, p.cible]), qualite: R && R.etat() }),
    _placer: (x, z, l, t) => { joueur.x = x; joueur.z = z; K.etat.lacet = l; K.etat.tangage = t || 0; limite.r = 99; },
    _action: action,
    _scene: () => scene, // tests
    lignesRecit,
    _recit: () => recit,
  };
})();
