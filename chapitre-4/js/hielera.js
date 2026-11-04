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
      p.x = l.x - Math.cos(l.cap) * p.suivre.cote; p.z = l.z + Math.sin(l.cap) * p.suivre.cote;
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

  // ---------- Le comptoir de l'enregistrement (séquences 1 et 4) ----------
  function salleComptoir() {
    ambiance();
    piece(-4.5, 4.5, -5.5, 3.5);
    neons([[-2.2, -1.5], [2.2, -1.5], [0, 1.5]]);
    // Le comptoir, sa vitre, l'écran, le lecteur d'empreintes
    boite(5.4, 1.05, 0.7, 0x7a7e7a, 0, 0.525, -3.1);
    boite(5.6, 0.05, 0.8, 0xb0b4b0, 0, 1.075, -3.1);
    const vitre = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.9), new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2 }));
    vitre.position.set(0, 1.55, -3.3); groupe.add(vitre);
    boite(0.5, 0.34, 0.04, 0x1a1c1e, 0.9, 1.35, -3.32);
    const ecran = emissif(new THREE.PlaneGeometry(0.44, 0.28), 0x8ab0e8, 1.3, groupe, 0.9, 1.35, -3.298); ecran.rotation.y = Math.PI;
    boite(0.22, 0.08, 0.18, 0x2a2c2e, -0.7, 1.14, -2.95);
    const vertLecteur = emissif(new THREE.PlaneGeometry(0.14, 0.1), 0x40ff80, 1.4, groupe, -0.7, 1.185, -2.95); vertLecteur.rotation.x = -Math.PI / 2;
    // Bacs de sacs, derrière le comptoir ; caméra au mur
    boite(1.2, 0.5, 0.6, 0x3a5a8a, -2.6, 0.25, -4.6); boite(1.2, 0.5, 0.6, 0x3a5a8a, -1.2, 0.25, -4.6);
    boite(0.16, 0.12, 0.24, 0x2a2a2a, 3.6, 2.6, -5.35);
    emissif(new THREE.SphereGeometry(0.015, 6, 6), 0xff2020, 3, groupe, 3.6, 2.6, -5.22);
    // Panneau
    const panneau = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: texte2D(["U.S. BORDER PATROL · PROCESSING"], { l: 1024, h: 128, couleur: "#1a2a4a", fond: "#e8e8e0", police: "bold 54px system-ui, sans-serif" }) }));
    panneau.position.set(-1.6, 2.4, -5.46); groupe.add(panneau);
    // La ligne jaune
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.1), new THREE.MeshBasicMaterial({ color: Rendu.lumineux(0xe0b020, 0.9) }));
    ligne.rotation.x = -Math.PI / 2; ligne.position.set(0, 0.004, -1.55); groupe.add(ligne);
    return { vertLecteur, ecran };
  }

  // ---------- La hielera (séquences 2, 3 et 5) ----------
  // Cellule des femmes et des enfants (x -3.6 → 1.6) ; à droite, derrière le grillage, celle des hommes (1.6 → 5.2).
  function salleCellule() {
    ambiance();
    piece(-3.6, 5.2, -3.6, 2.4, ["avant"]);
    // Le couloir derrière les barreaux
    piece(-3.6, 5.2, 2.4, 5.6, ["fond"]);
    neons([[-1.0, -1.0, Math.PI / 2], [3.4, -1.0, Math.PI / 2], [0.8, 4.0, Math.PI / 2]]);
    const porteF = barreaux(-3.6, 1.6, 2.4, [-1.3, 0.9]);
    const porteH = barreaux(1.6, 5.2, 2.4, [3.3, 0.9]);
    grillage(1.6, -3.6, 2.4);
    banc(-1.0, -3.3, 5.0); banc(-3.35, -0.8, 3.4, Math.PI / 2);
    banc(3.4, -3.3, 3.4);
    toilette(-3.1, -3.0); toilette(4.7, -3.05);
    // Les autres détenus
    dormeur(-2.0, -1.2, 0.3); dormeur(-0.9, 0.2, -1.4, 0x8a6448); dormeur(0.4, -1.6, 1.2, 0x6e4a33);
    dormeur(3.1, 0.6, 1.6); dormeur(4.3, -1.4, 0.2, 0x5a3a26); dormeur(3.6, 1.5, -1.6, 0x8a6448);
    [[-3.5, -2.4], [0.9, 1.2], [4.9, 0.4], [-2.6, 1.6], [2.1, -2.9]].forEach(([x, z]) => mylarPlie(x, 0.03, z));
    // Une caméra au plafond, et l'horloge… qu'on ne voit pas : il n'y en a pas.
    boite(0.16, 0.12, 0.24, 0x2a2a2a, -3.4, 2.7, 2.2);
    emissif(new THREE.SphereGeometry(0.015, 6, 6), 0xff2020, 3, groupe, -3.33, 2.7, 2.08);
    return { porteF, porteH };
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

  // =====================================================================
  //  Séquence 1 : l'enregistrement
  // =====================================================================
  async function sequence1() {
    viderTableau(); ilotCourant = "seq1";
    solY = () => 0;
    const s = salleComptoir();
    const agent = personnage("agent_bureau", 0.4, -3.75, 0, "debout");
    const z = -1.45;
    const g = {
      julio: personnage("julio", -2.3, z, Math.PI), yesenia: personnage("yesenia", -1.5, z, Math.PI),
      rosa: personnage("rosa", -0.55, z, Math.PI), mateo: personnage("mateo", -0.05, z, Math.PI),
      valeria: personnage("valeria", 0.85, z, Math.PI), joseph: personnage("joseph", 1.7, z, Math.PI),
      ernesto: personnage("ernesto", 2.55, z, Math.PI),
    };
    g.ernesto.cible = "tete_basse"; g.yesenia.cible = "tete_basse";
    // Sur le comptoir : le sac à dos de Mateo, le sac plastique des effets
    const sacMateo = new THREE.Group(); sacMateo.position.set(0.1, 1.27, -2.95); groupe.add(sacMateo);
    boite(0.3, 0.36, 0.16, 0x6a3030, 0, 0, 0, sacMateo); boite(0.22, 0.14, 0.05, 0x5a2828, 0, -0.06, 0.1, sacMateo);
    const effets = new THREE.Mesh(froisser(new THREE.BoxGeometry(0.34, 0.12, 0.26, 3, 2, 3), 0.03), new THREE.MeshStandardMaterial({ color: 0xe8eef0, transparent: true, opacity: 0.55, roughness: 0.2 }));
    effets.position.set(-1.6, 1.16, -2.9); groupe.add(effets);
    boite(0.18, 0.02, 0.12, 0x1a1a1a, -1.62, 1.13, -2.88); // un téléphone dedans
    objet("sac_effets", effets, -1.6, 1.2, -2.9);
    const cahier = boite(0.22, 0.015, 0.16, 0x3a6a8a, 0.42, 1.11, -2.85); cahier.rotation.y = 0.3;
    placerJoueur(0.35, 0.9, 0.0, -0.12, 1.5);
    A.reinitialiser();
    sonsCentre(0.8);
    const tube = A.neon(0, 2.9, -1.5);
    majTableau = () => {
      if (g.mateo.cible !== "marche") mainDansLaMain(g.rosa, g.mateo);
      s.ecran.material.color.setScalar(1.2 + Math.sin(temps * 0.7) * 0.05);
    };
    await fondu(false, 2);
    await carte("seq1");
    await attendre(0.8);
    agent.regardeJoueur = false;
    await dire("agentBureau1", 0.4);
    // L'agent prend le sac de Mateo et le jette dans un bac.
    const t0 = temps;
    await new Promise((r) => { const pas = () => { const u = Math.min(1, (temps - t0) / 1.4); sacMateo.position.set(0.1 - u * 1.5, 1.27 + Math.sin(u * Math.PI) * 0.3 - u * 0.75, -2.95 - u * 1.6); sacMateo.rotation.z = u * 1.2; if (u < 1) attendre(0.02).then(pas); else r(); }; pas(); });
    objet("cahier_mateo", cahier, 0.42, 1.12, -2.85);
    tourner(g.mateo, g.rosa.x, g.rosa.z - 1);
    await dire("mateoSac", 0.3);
    tourner(g.rosa, g.mateo.x, g.mateo.z); g.rosa.cible = "accroupi";
    await dire("rosaCalme", 1.2);
    g.rosa.cible = "debout"; tourner(g.rosa, g.rosa.x, g.rosa.z - 2); tourner(g.mateo, g.mateo.x, g.mateo.z - 2);
    // Julio au lecteur d'empreintes.
    await allerVers(g.julio, -0.7, -2.55, 0.8);
    tourner(g.julio, -0.7, -3.2); g.julio.cible = "travaille";
    await attendre(0.8);
    for (let i = 0; i < 3; i++) { A.bip(-0.7, 1.2, -2.95); s.vertLecteur.visible = false; await attendre(0.25); s.vertLecteur.visible = true; await attendre(0.55); }
    g.julio.cible = "debout";
    await dire("agentJulio", 0.6);
    await allerVers(g.julio, -3.4, -2.2, 0.7);
    tourner(g.julio, -3.4, -4); g.julio.cible = "tete_basse";
    await dire("julioEmpreintes", 2);
    await attendre(5);
    tube.arreter(2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Séquence 2 : la hielera
  // =====================================================================
  async function sequence2() {
    viderTableau(); ilotCourant = "seq2";
    solY = () => 0;
    salleCellule();
    const g = {
      rosa: personnage("rosa", -1.25, -3.15, 0, "chaise"), mateo: personnage("mateo", -0.65, -3.15, 0, "chaise"),
      valeria: personnage("valeria", 0.2, -3.15, 0, "chaise"), yesenia: personnage("yesenia", -3.28, -0.4, Math.PI / 2, "chaise"),
      ernesto: personnage("ernesto", 2.5, -0.9, -Math.PI / 2, "assis"), joseph: personnage("joseph", 3.2, -3.15, 0, "chaise"),
    };
    ["rosa", "valeria", "yesenia", "ernesto", "joseph"].forEach((k) => envelopper(g[k]));
    figurant(-3.28, -1.6, Math.PI / 2, "dort", true); figurant(0.9, -3.15, 0, "chaise", true); figurant(4.1, -3.15, 0, "dort");
    const plie = mylarPlie(-0.4, 0.03, -0.3);
    objet("couverture_mylar", plie, -0.4, 0.08, -0.3);
    placerJoueur(-0.6, 1.3, regarder(-0.6, 1.3, -0.6, -3), -0.15, 1.7);
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq2");
    // Mateo grelotte.
    majTableau = () => {
      g.mateo.haut.rotation.z += Math.sin(temps * 38) * 0.012;
      g.rosa.haut.rotation.z += Math.sin(temps * 31 + 1) * 0.006;
    };
    await fondu(false, 2.5);
    await carte("seq2");
    await attendre(2.5);
    A.froissement(g.ernesto.x, 0.6, g.ernesto.z, 1.4);
    tourner(g.ernesto, -0.6, -1.5);
    await dire("ernestoFroid", 1.0);
    await dire("josephFroid", 1.4);
    // Valeria se rapproche et ouvre sa couverture sur Mateo.
    g.valeria.cible = "debout";
    await attendre(0.8);
    await allerVers(g.valeria, -0.3, -2.75, 0.5);
    tourner(g.valeria, -0.65, -3.3);
    g.valeria.cible = "accroupi";
    A.froissement(-0.5, 0.5, -2.9, 1.6);
    await dire("valeriaMateo", 0.6);
    // Mateo se blottit : la couverture de Valeria passe sur lui.
    g.valeria.mylar.parent.remove(g.valeria.mylar);
    envelopper(g.mateo);
    g.mateo.cible = "dort";
    await allerVers(g.valeria, 0.0, -3.0, 0.4);
    g.valeria.cible = "chaise"; g.valeria.cap = 0; g.valeria.capVise = 0;
    await attendre(8);
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
    const agent = personnage("agent_bureau", -0.5, 3.6, Math.PI, "debout");
    const agente = personnage("agente", 0.6, 4.4, Math.PI, "debout");
    // La planchette, accrochée aux barreaux à côté de la porte
    const planche = new THREE.Group(); planche.position.set(-1.9, 1.4, 2.36); groupe.add(planche);
    boite(0.24, 0.32, 0.015, 0x6a4a2a, 0, 0, 0, planche);
    const feuille = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshBasicMaterial({ map: texte2D(["884-B  ☐ C", "884-C  ☐ 4", "885-A  ☐ C", "885-D  ☐ 4", "886-B  ☐ C"], { l: 256, h: 320, couleur: "#222", fond: "#f2f0e8", police: "26px monospace" }) }));
    feuille.position.z = -0.01; feuille.rotation.y = Math.PI; planche.add(feuille);
    objet("liste_dossiers", planche, -1.9, 1.4, 2.3);
    placerJoueur(-2.4, -0.6, regarder(-2.4, -0.6, -0.9, 2.4), -0.05, 1.9);
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq3");
    let rosaAuxBarreaux = false, mainsLiees = false;
    majTableau = () => {
      if (rosaAuxBarreaux) mainsAuxBarreaux(g.rosa, 2.36);
      if (mainsLiees) mainDansLaMain(agente, g.mateo);
    };
    await fondu(false, 2.5);
    await carte("seq3");
    await attendre(1.5);
    // L'agent arrive devant la porte, la déverrouille.
    await allerVers(agent, -0.85, 2.85, 1.0);
    tourner(agent, -0.85, 0);
    A.claquement(-0.85, 1.1, 2.4);
    await bougerPorte(c.porteF, -1.6, 1.2);
    agent.cible = "travaille";
    await dire("agentSep1", 0.6);
    // Rosa se lève, serre Mateo contre elle.
    g.rosa.cible = "debout"; g.mateo.cible = "debout";
    await attendre(0.6);
    g.rosa.mylar.visible = false; // la couverture glisse
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
    allerVers(agente, -0.9, 1.2, 0.9).then(() => allerVers(agente, -0.9, 3.4, 0.9)).then(() => allerVers(agente, 2.0, 4.6, 1.0)).then(() => allerVers(agente, 5.5, 5.0, 1.0));
    await attendre(1.2);
    await dire("mateoPleurs", 0.2);
    // Rosa veut suivre : l'agent referme la porte devant elle.
    allerVers(g.rosa, -0.9, 1.9, 1.3);
    await attendre(2.6);
    await bougerPorte(c.porteF, 0, 0.7);
    A.claquement(-0.85, 1.1, 2.4);
    allerVers(agent, 0.9, 3.5, 0.8).then(() => tourner(agent, -0.9, 2.4));
    await attendre(0.5);
    tourner(g.rosa, -0.9, 3); rosaAuxBarreaux = true;
    await dire("rosaCriCell", 1.5);
    allerVers(agent, 2.0, 4.8, 0.9);
    await attendre(3);
    rosaAuxBarreaux = false; g.rosa.cible = "agenouille";
    await attendre(7);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Séquence 4 : les papiers
  // =====================================================================
  async function sequence4() {
    viderTableau(); ilotCourant = "seq4";
    solY = () => 0;
    salleComptoir();
    const agent = personnage("agent_bureau", -0.2, -3.75, 0, "debout");
    const g = {
      yesenia: personnage("yesenia", -0.2, -2.55, Math.PI, "debout"),
      joseph: personnage("joseph", 0.9, z0(), Math.PI, "debout"), valeria: personnage("valeria", 1.8, z0(), Math.PI, "debout"),
    };
    function z0() { return -1.45; }
    envelopper(g.yesenia); envelopper(g.joseph); envelopper(g.valeria);
    // Le formulaire et un stylo attaché à une chaînette
    const feuille = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), new THREE.MeshBasicMaterial({ map: texte2D(["I-826", "NOTICE OF RIGHTS", "AND REQUEST", "FOR DISPOSITION", "", "☐ I request a hearing", "☒ I give up my right", "   to a hearing", "", "Sign: ________"], { l: 256, h: 360, couleur: "#1a1a1a", fond: "#f4f2ea", police: "18px Georgia, serif" }) }));
    feuille.rotation.x = -Math.PI / 2; feuille.position.set(-0.2, 1.104, -2.9); groupe.add(feuille);
    const stylo = P.maille(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), 0x1a2a5a, groupe, -0.05, 1.11, -2.88); stylo.rotation.z = Math.PI / 2;
    objet("formulaire_expulsion", feuille, -0.2, 1.12, -2.9);
    placerJoueur(-1.6, -0.6, regarder(-1.6, -0.6, -0.2, -2.9), -0.22, 1.6);
    A.reinitialiser();
    sonsCentre(0.8);
    const tube = A.neon(0, 2.9, -1.5);
    let signe = 0;
    majTableau = () => {
      if (signe > 0) { _m.set(-0.2 + Math.sin(temps * 12) * 0.04, 1.14, -2.85); P.pointerBras(g.yesenia, 1, _m, 0.8); }
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
    signe = 1; stylo.visible = false;
    await attendre(3);
    signe = 0; stylo.visible = true;
    await allerVers(g.yesenia, -2.6, -1.9, 0.6);
    g.yesenia.cible = "tete_basse"; tourner(g.yesenia, -2.6, -4);
    await allerVers(g.joseph, -0.2, -2.55, 0.8);
    tourner(g.joseph, -0.2, -3.5);
    agent.cible = "debout";
    await dire("josephInterprete", 2.0);
    agent.cible = "travaille";
    await attendre(1.8);
    await allerVers(g.joseph, 0.9, -2.2, 0.6);
    await allerVers(g.valeria, 0.3, -2.55, 0.8);
    tourner(g.valeria, 0.3, -3.5);
    await attendre(0.8);
    await dire("valeriaAsile", 2.5);
    agent.cible = "debout";
    await attendre(5);
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
      ernesto: personnage("ernesto", 2.6, -2.9, 0, "chaise"), joseph: personnage("joseph", 3.6, -3.15, 0, "dort"),
    };
    Object.values(g).forEach((p) => envelopper(p));
    figurant(-3.28, -1.6, Math.PI / 2, "dort", true); figurant(4.4, -3.15, 0, "chaise");
    const agent = personnage("agent_bureau", 4.8, 4.2, Math.PI, "debout");
    placerJoueur(-0.2, 0.9, regarder(-0.2, 0.9, 1.6, -1.6), -0.12, 1.6);
    A.reinitialiser();
    sonsCentre(1.1);
    crepitements("seq5");
    majTableau = () => {};
    await fondu(false, 2.5);
    await carte("seq5");
    await attendre(2);
    await allerVers(agent, 3.75, 2.9, 1.0);
    tourner(agent, 3.75, 0);
    A.claquement(3.6, 1.1, 2.4);
    await bougerPorte(c.porteH, -1.6, 1.0);
    await dire("agentAube", 0.8);
    // Don Ernesto se lève, plie sa couverture et va jusqu'au grillage, près de Rosa.
    g.ernesto.cible = "debout";
    await attendre(1.2);
    g.ernesto.mylar.visible = false; A.froissement(g.ernesto.x, 0.8, g.ernesto.z, 1.6);
    const plie = mylarPlie(2.6, 0.48, -3.3);
    await allerVers(g.ernesto, 1.85, -2.4, 0.6);
    tourner(g.ernesto, -1.25, -3.0);
    g.rosa.cible = "chaise";
    await attendre(1.2);
    tourner(g.rosa, 1.6, -2.4);
    await dire("ernestoAdieu", 1.2);
    await allerVers(g.ernesto, 3.6, 1.6, 0.6);
    await allerVers(g.ernesto, 3.75, 3.6, 0.6);
    allerVers(g.ernesto, 6, 4.4, 0.6);
    allerVers(agent, 6.2, 4.0, 0.8);
    await attendre(1.5);
    await bougerPorte(c.porteH, 0, 0.7);
    A.claquement(3.6, 1.1, 2.4);
    await attendre(2);
    g.rosa.cible = "dort";
    plie.visible = true;
    // Le froid, la lumière blanche, le bourdonnement. Personne ne sait l'heure.
    await attendre(9);
    voile.style.transition = "opacity 5s ease"; voile.style.background = "#e8eef6"; voile.style.opacity = "1";
    await attendre(5.5);
    if (sonClim) { sonClim.arreter(3); sonClim = null; }
    A.toutCouper(3);
    voile.style.transition = "opacity 2.5s ease"; voile.style.background = "#000";
    await attendre(3);
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
    const pas = Math.hypot(nx - joueur.x, nz - joueur.z);
    joueur.x = nx; joueur.z = nz;
    joueur.distPas += pas; joueur.balance += pas * 5.5;
    if (joueur.distPas > 0.72) { joueur.distPas = 0; A.pas(0.18); }
    camera.position.set(joueur.x, solY(joueur.x, joueur.z) + joueur.yeux + Math.sin(joueur.balance) * 0.025, joueur.z);
    camera.rotation.set(K.etat.tangage, l, 0, "YXZ");
  }

  const _dir = new THREE.Vector3(), _versObj = new THREE.Vector3();
  let objetVise = null;
  function majObjets() {
    objetVise = null;
    if (ficheOuverte) { if (temps > ficheFin) fermerFiche(); K.montrerInvite(""); return; }
    camera.getWorldDirection(_dir);
    for (const o of objets) {
      _versObj.set(o.x - camera.position.x, o.y - camera.position.y, o.z - camera.position.z);
      const d = _versObj.length();
      if (d < 2.6 && _versObj.normalize().dot(_dir) > 0.82) { objetVise = o; break; }
    }
    objets.forEach((o) => { o.lueur.intensity = o === objetVise ? 0.6 : o.vu ? 0 : 0.25; });
    K.montrerInvite(objetVise ? "[E] Regarder : " + objetVise.def.nom : "");
  }
  function action() {
    if (ficheOuverte) return fermerFiche();
    if (!objetVise) return;
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
  };
})();
