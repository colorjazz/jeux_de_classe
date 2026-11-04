// Chapitre 2 : quatre tableaux (« îlots »), joués l'un après l'autre.
//   1. San Pedro Sula : le commerce de Rosa, les motos, le départ.
//   2a. Guerrero : la milpa desséchée de Don Ernesto.
//   2b. Guatemala : la maison de Yesenia, l'hypothèque.
//   3. San Salvador : Julio, le téléphone, la chambre vide.
//   Final : l'appel au guide, sur écran noir.
// Le joueur est un témoin invisible : il peut marcher un peu, regarder, examiner des objets (E).

window.Chapitre2 = (function () {
  const C = window.CONTENU_CH2;
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
  //  Tableau 1 : San Pedro Sula
  // =====================================================================
  function dessinCahier() {
    // Page de gauche : une maison sous les palmiers ; page de droite : des motos barrées de rouge.
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256;
    const c = cv.getContext("2d");
    c.fillStyle = "#f4f0e4"; c.fillRect(0, 0, 512, 256);
    c.strokeStyle = "#cfc8b4"; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 256); c.stroke();
    c.lineWidth = 4; c.lineCap = "round";
    c.strokeStyle = "#c0392b"; c.fillStyle = "#f1c40f"; c.fillRect(70, 120, 110, 80); c.strokeRect(70, 120, 110, 80);
    c.beginPath(); c.moveTo(60, 122); c.lineTo(125, 70); c.lineTo(190, 122); c.stroke();
    c.fillStyle = "#6e4b2a"; c.fillRect(112, 160, 26, 40);
    c.strokeStyle = "#27ae60"; [[30, 200], [215, 200]].forEach(([x, y]) => {
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 90); c.stroke();
      for (let a = -2; a <= 2; a++) { c.beginPath(); c.moveTo(x + 6, y - 90); c.quadraticCurveTo(x + 6 + a * 14, y - 112, x + 6 + a * 22, y - 80); c.stroke(); }
    });
    c.fillStyle = "#e8f4ff"; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(20 + Math.random() * 220, 10 + Math.random() * 110, 3, 0, 7); c.fill(); }
    c.fillStyle = "#111"; c.strokeStyle = "#111";
    [[320, 160], [420, 170]].forEach(([x, y]) => {
      c.beginPath(); c.arc(x - 25, y + 30, 14, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 25, y + 30, 14, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(x - 25, y + 30); c.lineTo(x, y + 10); c.lineTo(x + 25, y + 30); c.stroke();
      c.beginPath(); c.arc(x, y - 18, 9, 0, 7); c.fill(); c.fillRect(x - 6, y - 10, 12, 22);
    });
    c.strokeStyle = "#e3242b"; c.lineWidth = 7;
    c.beginPath(); c.moveTo(280, 110); c.lineTo(480, 230); c.moveTo(480, 110); c.lineTo(280, 230); c.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  async function tableau1() {
    viderTableau(); ilotCourant = "ilot1";
    solY = () => 0;
    R.renderer.toneMappingExposure = 1.25;
    scene.background = cielDegrade("#6d86b8", "#f2b27a");
    scene.fog = new THREE.Fog(0xe6a878, 18, 70);
    const ciel = new THREE.HemisphereLight(0xffd2a0, 0x4a3a2c, 1.4); groupe.add(ciel);
    const sol = soleil(0xffb070, 2.6, [-30, 12, 8], 16);

    // Rue et trottoirs
    boite(80, 0.1, 9, 0x4a4540, 0, -0.05, 2.5);
    boite(80, 0.18, 2.2, 0x8c8478, 0, 0.04, -2.2);
    boite(80, 0.18, 2.2, 0x8c8478, 0, 0.04, 7.2);
    // Maisons colorées des deux côtés
    const couleurs = [0xd9a066, 0x6fb3a8, 0xe08a8a, 0xe6d28a, 0x8fa6c9, 0xc9a2c9, 0xa8c98f];
    [-1, 1].forEach((cote) => {
      for (let i = -6; i <= 6; i++) {
        const l = 4.6 + alea() * 1.4, h = 3 + alea() * 1.6, x = i * 5.4;
        const z = cote < 0 ? -5.4 : 10.4;
        boite(l, h, 4, couleurs[(i + 6 + (cote > 0 ? 3 : 0)) % couleurs.length], x, h / 2, z);
        boite(l + 0.3, 0.12, 4.4, 0x6a6a6a, x, h + 0.06, z); // toit de tôle
        const face = cote < 0 ? -3.39 : 8.39;
        boite(0.9, 2.1, 0.06, 0x3a2e24, x - 0.8, 1.05, face);               // porte
        boite(1.0, 0.9, 0.06, 0x20262a, x + 1.0, 1.6, face);                // fenêtre
        for (let b = 0; b < 4; b++) boite(0.03, 0.9, 0.08, 0x2a2a2a, x + 0.62 + b * 0.25, 1.6, face + (cote < 0 ? 0.03 : -0.03)); // barreaux
      }
    });
    // Poteaux et fils électriques
    const fils = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
    for (let i = -4; i <= 4; i++) {
      P.maille(new THREE.CylinderGeometry(0.1, 0.12, 7, 6), 0x6a5a48, groupe, i * 9 + 4.5, 3.5, -3.0);
      if (i < 4) [6.4, 6.8].forEach((y) => {
        const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push(new THREE.Vector3(i * 9 + 4.5 + u * 9, y - Math.sin(u * Math.PI) * 0.5, -3.0)); }
        groupe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), fils));
      });
    }
    // L'enseigne de Rosa
    const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshStandardMaterial({
      map: texte2D(["TORTILLAS DOÑA ROSA"], { fond: "#f3e6c8", couleur: "#9a2a1a", police: "bold 54px Georgia, serif", l: 1024, h: 220 }), roughness: 0.9 }));
    enseigne.position.set(0, 2.75, -3.36); groupe.add(enseigne);

    // Le comal sur son brasero
    boite(1.3, 0.06, 0.8, 0x6b4a30, 0, 0.78, -2.1);                     // plateau
    [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([x, z]) => boite(0.05, 0.76, 0.05, 0x4a3420, x, 0.38, -2.1 + z));
    P.maille(new THREE.CylinderGeometry(0.34, 0.3, 0.05, 20), 0x1a1715, groupe, -0.25, 0.84, -2.1); // comal
    emissif(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 16), 0xff5a10, 2.5, groupe, -0.25, 0.8, -2.1); // braises
    const braise = new THREE.PointLight(0xff7a30, 2.2, 4, 1.6); braise.position.set(-0.25, 0.7, -2.0); groupe.add(braise);
    for (let i = 0; i < 9; i++) P.maille(new THREE.CylinderGeometry(0.11, 0.11, 0.008, 16), 0xe8d39a, groupe, 0.35, 0.82 + i * 0.009, -2.15);
    [[1.8, -1.6, 0xd03030], [2.4, -2.4, 0x3070d0]].forEach(([x, z, c]) => {      // chaises en plastique
      boite(0.45, 0.04, 0.45, c, x, 0.45, z); boite(0.45, 0.45, 0.04, c, x, 0.67, z - 0.22);
      [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => boite(0.03, 0.45, 0.03, c, x + a, 0.22, z + b));
    });
    // La petite table de Mateo, son cahier et ses crayons
    boite(0.7, 0.04, 0.5, 0x9aa8a0, 1.8, 0.6, -0.9);
    [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].forEach(([a, b]) => boite(0.03, 0.6, 0.03, 0x9aa8a0, 1.8 + a, 0.3, -0.9 + b));
    const cahier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.22), [
      new THREE.MeshStandardMaterial({ color: 0xf4f0e4 }), new THREE.MeshStandardMaterial({ color: 0xf4f0e4 }),
      new THREE.MeshStandardMaterial({ map: dessinCahier(), roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0xf4f0e4 }),
      new THREE.MeshStandardMaterial({ color: 0xf4f0e4 }), new THREE.MeshStandardMaterial({ color: 0xf4f0e4 })]);
    cahier.position.set(1.75, 0.628, -0.82); cahier.rotation.y = 0.15; groupe.add(cahier);
    const crayons = new THREE.Group(); crayons.position.set(1.98, 0.63, -1.0); groupe.add(crayons);
    [0xe3242b, 0x27ae60, 0x2f6fd0, 0xf1c40f, 0x111111].forEach((c, i) => {
      const k = P.maille(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), c, crayons, i * 0.02, 0, 0); k.rotation.z = Math.PI / 2;
    });
    objet("cahier_mateo", cahier, 1.75, 0.63, -0.82);

    // Personnages
    const rosa = personnage("rosa", -0.2, -2.75, 0, "travaille");
    const mateo = personnage("mateo", 1.8, -1.45, 0, "dessine");
    mateo.yExtra = 0.1; // sa chaise est à sa taille
    const passants = [
      personnage("voisin", -14, 1.2, Math.PI / 2, "marche"), personnage("voisine", 12, 3.6, -Math.PI / 2, "marche"),
    ];
    passants.forEach((p) => allerVers(p, p.x < 0 ? 14 : -14, p.z, 1.0));

    placerJoueur(0.6, 3.2, 0.1, -0.12, 3.5);
    A.reinitialiser();
    const sonRue = A.rue(), sonComal = A.comal(-0.25, 0.85, -2.1);

    // Rosa retourne les tortillas
    let gesteComal = true;
    majTableau = (dt) => {
      if (gesteComal && rosa.cible === "travaille") {
        _m.set(-0.25 + Math.sin(temps * 1.3) * 0.12, 0.92, -2.1 + Math.cos(temps * 1.3) * 0.08);
        P.pointerBras(rosa, 1, _m, 0.5);
      }
      if (mateo.leveCahier) { _m.set(rosa.x, 1.25, rosa.z); P.pointerBras(mateo, 1, _m, 0.4); }
      if (rosa.mainMateo) mainDansLaMain(rosa, mateo);
    };

    await fondu(false, 2);
    await carte("ilot1");
    await dire("rosa1");
    mateo.leveCahier = true; mateo.regardeJoueur = false; tourner(mateo, rosa.x, rosa.z);
    await dire("mateo1", 0.4);
    mateo.leveCahier = false;
    rosa.parleJusqua = temps + 1.2; // un sourire, un hochement de tête
    await attendre(5);

    // La rue se tait. Les motos arrivent.
    // Avec le bruitage enregistré, l'image est calée sur le son : elles s'arrêtent
    // à 11 s, les moteurs se coupent à 13,7 s. Sinon, moteurs générés.
    sonRue.arreter(5);
    const motos = [creerMoto(-60, 1.2), creerMoto(-64, 2.6)];
    const enregistre = A.sonPret("moto-arrivee") && A.sonPret("moto-depart");
    let sonSuivi = enregistre ? A.jouerSon("moto-arrivee", { x: -62, y: 1, z: 1.9 }, 1) : null;
    const sonMotos = enregistre ? [] : motos.map((m) => A.moto(m.x, m.z));
    passants.forEach((p) => allerVers(p, p.x, p.z < 3 ? -3.0 : 8.0, 1.4).then(() => { p.racine.visible = false; }));
    let crepuscule = 0;
    const majAvant = majTableau;
    majTableau = (dt) => {
      majAvant(dt);
      // Le jour baisse pendant toute la scène.
      crepuscule = Math.min(1, crepuscule + dt / 70);
      sol.intensity = 2.6 * (1 - crepuscule * 0.85); ciel.intensity = 1.4 * (1 - crepuscule * 0.6);
      motos.forEach((m, i) => { m.maj(dt); if (sonMotos[i]) { sonMotos[i].position(m.x, m.z); sonMotos[i].regime(m.v / 8); } });
      if (sonSuivi) sonSuivi.position((motos[0].x + motos[1].x) / 2, (motos[0].z + motos[1].z) / 2);
    };
    await attendre(2);
    gesteComal = false; rosa.cible = "debout"; tourner(rosa, -10, 1);
    mateo.cible = "chaise"; tourner(mateo, -10, 1);
    if (enregistre) {
      await Promise.all([motos[0].arriverEn(-3.2, 9), motos[1].arriverEn(-5.4, 9.4)]); // ≈ 11 s après le début du son
      await attendre(3);                                                               // ralenti, puis moteurs coupés (13,7 s)
    } else {
      await Promise.all([motos[0].arriver(-3.2, 1.2), motos[1].arriver(-5.4, 2.4)]);
      await attendre(1.2);
      sonMotos.forEach((s) => s.arreter(0.6));   // moteurs coupés : silence
      await attendre(1.5);
    }

    // L'homme descend et s'approche.
    const marero = personnage("marero", -3.2, 0.7, Math.PI / 2, "debout");
    const complice = personnage("complice", -5.4, 2.4, Math.PI / 2, "chaise");
    complice.yExtra = 0.35;
    motos[0].pilote.visible = false; motos[1].pilote.visible = false;
    await allerVers(marero, -1.2, -1.3, 0.9);
    tourner(marero, rosa.x, rosa.z); tourner(rosa, marero.x, marero.z);
    await dire("marero1", 0.8);
    await dire("rosa2", 0.6);
    tourner(marero, mateo.x, mateo.z);
    await dire("marero2", 0.2);
    // Rosa se met entre lui et son fils.
    rosa.cibleArrivee = "debout";
    await allerVers(rosa, 0.9, -1.55, 1.4);
    tourner(rosa, marero.x, marero.z);
    await attendre(2);
    tourner(marero, rosa.x, rosa.z);
    await dire("marero3", 0.8);
    await allerVers(marero, -3.2, 0.7, 1.0);
    marero.racine.visible = false; complice.racine.visible = false;
    motos[0].pilote.visible = true; motos[1].pilote.visible = true;
    if (enregistre) {
      // Démarrage et coups d'accélérateur sur place, puis elles s'éloignent (à 7 s).
      sonSuivi = A.jouerSon("moto-depart", { x: -4.3, y: 1, z: 1.8 }, 1);
      await attendre(6.6);
      motos[0].partir(60); motos[1].partir(64);
      await attendre(6);
    } else {
      const sonDepart = motos.map((m) => A.moto(m.x, m.z));
      sonMotos.length = 0; sonDepart.forEach((s) => sonMotos.push(s));
      motos[0].partir(60); motos[1].partir(64);
      await attendre(6);
      sonDepart.forEach((s) => s.arreter(3));
    }

    // Le silence. Seul le comal grésille encore.
    await attendre(3);
    tourner(rosa, mateo.x, mateo.z);
    rosa.cible = "agenouille";
    await attendre(1.2);
    await dire("rosaDepart", 0.5);
    cahier.visible = false; crayons.visible = false;
    objets = objets.filter((o) => o.id !== "cahier_mateo");
    await attendre(1);
    mateo.cible = "debout"; rosa.cible = "debout";
    await attendre(1);
    // Ils partent, main dans la main. Le comal reste allumé sur l'étal vide.
    rosa.mainMateo = true;
    mateo.suivre = { leader: rosa, cote: 0.92 };
    allerVers(rosa, -16, 0.9, 1.05);
    await attendre(9);
    sonComal.arreter(4);
    await fondu(true, 3);
  }

  function creerMoto(x, z) {
    const g = new THREE.Group(); groupe.add(g);
    [-0.55, 0.55].forEach((dx) => {
      const r = P.maille(new THREE.TorusGeometry(0.28, 0.07, 8, 18), 0x111111, g, dx, 0.33, 0); r.rotation.y = 0;
    });
    boite(1.1, 0.25, 0.25, 0x8a1c1c, 0, 0.62, 0, g);
    boite(0.5, 0.12, 0.28, 0x111111, -0.15, 0.82, 0, g);
    P.maille(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), 0x777777, g, 0.5, 0.95, 0).rotation.x = Math.PI / 2;
    emissif(new THREE.SphereGeometry(0.07, 8, 6), 0xfff4d8, 4, g, 0.62, 0.8, 0);
    const phare = new THREE.SpotLight(0xfff0d0, 3, 30, 0.45, 0.6, 1.2); phare.position.set(0.65, 0.8, 0); phare.target.position.set(6, 0, 0);
    g.add(phare, phare.target);
    // Le pilote (silhouette simple, remplacée par un vrai personnage quand il descend)
    const pilote = new THREE.Group(); g.add(pilote);
    P.maille(new THREE.CapsuleGeometry(0.17, 0.35, 4, 8), 0x1c1c1e, pilote, -0.1, 1.2, 0);
    P.maille(new THREE.SphereGeometry(0.11, 10, 8), 0x1a1a1a, pilote, -0.05, 1.62, 0);
    const m = { g, pilote, x, z, v: 0, but: null };
    g.position.set(x, 0, z);
    m.arriver = (bx) => new Promise((r) => { m.but = { x: bx, r }; m.v = 8; });
    m.partir = (bx) => { m.but = { x: bx, r: () => {} }; m.v = 0.5; m.depart = true; m.cale = null; };
    // Arrivée en une durée donnée, avec un freinage progressif.
    m.arriverEn = (bx, duree) => new Promise((r) => { m.cale = { x0: m.x, bx, duree, t: 0, r }; });
    m.maj = (dt) => {
      if (m.cale) {
        const c = m.cale; c.t += dt;
        const u = Math.min(1, c.t / c.duree), e = 1 - Math.pow(1 - u, 2.4);
        const avant = m.x; m.x = c.x0 + (c.bx - c.x0) * e; m.v = Math.abs(m.x - avant) / Math.max(dt, 1e-4);
        g.position.x = m.x; g.rotation.y = 0;
        g.children.forEach((k) => { if (k.geometry && k.geometry.type === "TorusGeometry") k.rotation.z -= m.v * dt * 3; });
        if (u >= 1) { m.cale = null; m.v = 0; c.r(); }
        return;
      }
      if (!m.but) return;
      const d = m.but.x - m.x;
      if (m.depart) m.v = Math.min(11, m.v + dt * 5);
      else m.v = Math.max(1.2, Math.min(8, Math.abs(d) * 1.4));
      m.x += Math.sign(d) * Math.min(Math.abs(d), m.v * dt);
      g.position.x = m.x; g.rotation.y = d >= 0 ? 0 : Math.PI;
      g.children.forEach((c) => { if (c.geometry && c.geometry.type === "TorusGeometry") c.rotation.z -= m.v * dt * 3; });
      if (Math.abs(d) < 0.05) { const r = m.but.r; m.but = null; m.v = 0; r(); }
    };
    return m;
  }

  // =====================================================================
  //  Tableau 2a : la milpa de Don Ernesto (Guerrero)
  // =====================================================================
  function textureTerreCraquelee() {
    const T = 512, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = "#b08a5e"; c.fillRect(0, 0, T, T);
    for (let i = 0; i < 9000; i++) { const g = 140 + Math.random() * 60; c.fillStyle = `rgba(${g},${g * 0.8},${g * 0.58},0.25)`; c.fillRect(Math.random() * T, Math.random() * T, 2, 2); }
    c.strokeStyle = "rgba(60,40,24,0.75)"; c.lineWidth = 2;
    // Réseau de fissures : marches aléatoires
    for (let k = 0; k < 70; k++) {
      let x = Math.random() * T, y = Math.random() * T, a = Math.random() * 7;
      c.beginPath(); c.moveTo(x, y);
      for (let s = 0; s < 14; s++) { a += (Math.random() - 0.5) * 1.3; x += Math.cos(a) * 14; y += Math.sin(a) * 14; c.lineTo(x, y); }
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  async function tableau2a() {
    viderTableau(); ilotCourant = "ilot2a";
    solY = (x, z) => 0.35 * Math.sin(x * 0.05) * Math.cos(z * 0.04) + (Math.abs(z + 40) > 30 ? (Math.abs(z + 40) - 30) * 0.25 : 0);
    R.renderer.toneMappingExposure = 1.05;
    scene.background = cielDegrade("#a9c2d8", "#f4ece0");
    scene.fog = new THREE.Fog(0xefe6d6, 25, 140);
    groupe.add(new THREE.HemisphereLight(0xfff6e8, 0x7a5a3a, 1.2));
    soleil(0xfff2dc, 4.2, [8, 40, 6], 18);

    const geo = new THREE.PlaneGeometry(300, 300, 120, 120); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, solY(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const tex = textureTerreCraquelee();
    const terre = new THREE.Mesh(geo, R.haute ? new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.5, roughness: 1 }) : new THREE.MeshLambertMaterial({ map: tex }));
    terre.receiveShadow = R.haute; groupe.add(terre);

    // Rangs de maïs desséché
    const nb = 1400;
    const tiges = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.028, 1, 5), P.mat(0xa88a5a), nb);
    const geoF = new THREE.BoxGeometry(0.07, 0.004, 0.6); geoF.translate(0, 0, 0.3); // la feuille part de la tige
    const feuilles = new THREE.InstancedMesh(geoF, P.mat(0xb89a68), nb * 3);
    const o = new THREE.Object3D();
    let n = 0, nf = 0;
    for (let rang = -14; rang <= 14 && n < nb; rang++) {
      for (let k = -24; k <= 24 && n < nb; k++) {
        const x = k * 0.9 + (alea() - 0.5) * 0.3, z = rang * 1.1 - 4 + (alea() - 0.5) * 0.2;
        if (Math.abs(z + 2.9) < 1.25) continue; // l'allée où marche Ernesto (et où se tient le joueur)
        const h = 1.2 + alea() * 0.9, pench = (alea() - 0.5) * 0.4;
        o.position.set(x, solY(x, z) + h / 2, z); o.rotation.set(pench, 0, (alea() - 0.5) * 0.3); o.scale.set(1, h, 1); o.updateMatrix();
        tiges.setMatrixAt(n++, o.matrix);
        for (let f = 0; f < 3; f++) {
          const y = solY(x, z) + h * (0.35 + f * 0.2);
          // Feuilles desséchées : elles retombent le long de la tige.
          o.position.set(x, y, z);
          o.rotation.set(0.9 + alea() * 0.6, f * 2.1 + alea() * 1.2, 0, "YXZ"); o.scale.set(1, 1, 0.7 + alea() * 0.5); o.updateMatrix();
          feuilles.setMatrixAt(nf++, o.matrix);
        }
      }
    }
    tiges.count = n; feuilles.count = nf;
    tiges.castShadow = feuilles.castShadow = R.haute;
    groupe.add(tiges, feuilles);
    // Collines au loin
    for (let i = 0; i < 9; i++) {
      const m = P.maille(new THREE.SphereGeometry(30 + alea() * 25, 16, 10), 0x9a8460, groupe, -120 + i * 30, -18, -110 - alea() * 30);
      m.scale.y = 0.45;
    }

    // L'épi de maïs séché, au bord de l'allée
    const epi = new THREE.Group(); epi.position.set(2.0, solY(2.0, -2.2) + 0.04, -2.2); epi.rotation.set(0, 0.7, Math.PI / 2); groupe.add(epi);
    P.maille(new THREE.CylinderGeometry(0.035, 0.022, 0.2, 10), 0xc9a24a, epi);
    [0, 2.1, 4.2].forEach((a) => { const f = P.maille(new THREE.BoxGeometry(0.05, 0.22, 0.005), 0xb5a07a, epi, Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035); f.rotation.y = a; });
    objet("epi_mais", epi, 2.0, epi.position.y, -2.2);

    const ernesto = personnage("ernesto", -14, -2.9, Math.PI / 2, "marche");
    placerJoueur(3.2, -2.9, Math.PI / 2 - 0.08, -0.08, 2.5);
    A.reinitialiser();
    const sonVent = A.ventSec();

    await fondu(false, 2);
    await carte("ilot2a");
    await allerVers(ernesto, -1.5, -2.9, 0.75);
    tourner(ernesto, -6, -8);
    await attendre(1);
    ernesto.cible = "accroupi";
    await attendre(1.6);
    // Il prend une poignée de terre ; elle s'envole en poussière.
    const poussiere = nuagePoussiere(ernesto.x + 0.3, solY(ernesto.x, ernesto.z) + 0.6, ernesto.z);
    await dire("ernesto1", 0.8);
    ernesto.cible = "debout";
    await attendre(1.2);
    tourner(ernesto, joueur.x, joueur.z);
    ernesto.regardeJoueur = true;
    await dire("ernesto2", 0.6);
    ernesto.regardeJoueur = false;
    await attendre(3);
    tourner(ernesto, -40, -2.9);
    allerVers(ernesto, -30, -2.9, 0.7);
    await attendre(5);
    sonVent.arreter(3);
    await fondu(true, 2.5);
    poussiere.arreter();
  }

  function nuagePoussiere(x, y, z) {
    const n = 160, p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; v.push([(Math.random() - 0.3) * 0.5, -0.2 - Math.random() * 0.4, (Math.random() - 0.5) * 0.3]); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc9a77a, size: 0.025, transparent: true, opacity: 0.8 }));
    groupe.add(pts);
    let vie = 0, actif = true;
    const maj = (dt) => {
      if (!actif) return;
      vie += dt;
      const a = g.attributes.position;
      for (let i = 0; i < n; i++) {
        if (vie * 1.5 < i / n * 2) continue; // la terre s'échappe peu à peu des doigts
        a.setXYZ(i, a.getX(i) + (v[i][0] + 0.25) * dt, Math.max(solY(x, z), a.getY(i) + v[i][1] * dt), a.getZ(i) + v[i][2] * dt);
      }
      a.needsUpdate = true;
      pts.material.opacity = Math.max(0, 0.8 - vie * 0.08);
    };
    const avant = majTableau;
    majTableau = (dt) => { if (avant) avant(dt); maj(dt); };
    return { arreter() { actif = false; } };
  }

  // =====================================================================
  //  Tableau 2b : la maison de Yesenia (hautes terres du Guatemala)
  // =====================================================================
  function textureTissage() {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 512;
    const c = cv.getContext("2d");
    const cs = ["#b3262e", "#1f4e9c", "#e0a321", "#2f8a4a", "#6a2a7a", "#f2efe6"];
    for (let y = 0; y < 512; y += 16) {
      c.fillStyle = cs[(y / 16) % cs.length]; c.fillRect(0, y, 256, 16);
      if ((y / 16) % 3 === 0) for (let x = 0; x < 256; x += 24) { c.fillStyle = cs[(x / 24 + y / 16 + 2) % cs.length]; c.beginPath(); c.moveTo(x, y + 16); c.lineTo(x + 12, y); c.lineTo(x + 24, y + 16); c.fill(); }
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function textureActe() {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 340;
    const c = cv.getContext("2d");
    c.fillStyle = "#efe8d4"; c.fillRect(0, 0, 256, 340);
    c.fillStyle = "#2a2a2a"; c.font = "bold 20px Georgia, serif"; c.textAlign = "center";
    c.fillText("ESCRITURA DE HIPOTECA", 128, 34);
    c.font = "11px Georgia, serif"; c.fillText("Quetzaltenango", 128, 54);
    c.fillStyle = "#6a6a6a"; for (let y = 76; y < 290; y += 11) c.fillRect(22, y, 212 - (y % 33 === 0 ? 60 : 0), 2);
    c.strokeStyle = "#7a1a6a"; c.lineWidth = 3; c.beginPath(); c.arc(190, 290, 26, 0, 7); c.stroke();
    c.fillStyle = "#7a1a6a"; c.font = "bold 10px sans-serif"; c.fillText("SELLO", 190, 294);
    c.strokeStyle = "#1a2a6a"; c.lineWidth = 2; c.beginPath(); c.moveTo(30, 300); c.bezierCurveTo(50, 280, 70, 320, 110, 296); c.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  async function tableau2b() {
    viderTableau(); ilotCourant = "ilot2b";
    solY = () => 0;
    R.renderer.toneMappingExposure = 1.6;
    scene.background = new THREE.Color(0x9fb1c4);
    scene.fog = new THREE.Fog(0xaebdcc, 6, 40);
    groupe.add(new THREE.HemisphereLight(0x8aa0c0, 0x3a2a1e, 1.0));
    const porte = new THREE.PointLight(0xa8bcd8, 3, 6, 1.4); porte.position.set(2.6, 1.5, 0); groupe.add(porte); // le jour qui entre par la porte

    // La pièce : murs d'adobe, sol de terre battue, poutres
    const adobe = 0x9a7656;
    boite(6, 0.05, 5, 0x5a4432, 0, -0.025, 0);
    boite(6, 2.8, 0.25, adobe, 0, 1.4, -2.5);                                   // fond
    boite(0.25, 2.8, 5, adobe, -3, 1.4, 0);                                     // gauche
    boite(0.25, 2.8, 1.9, adobe, 3, 1.4, -1.55); boite(0.25, 2.8, 1.9, adobe, 3, 1.4, 1.55); // droite, avec la porte
    boite(0.25, 0.7, 1.2, adobe, 3, 2.45, 0);
    boite(6.4, 0.08, 5.4, 0x4a3a2c, 0, 2.84, 0);                                // toit
    for (let i = -2; i <= 2; i++) boite(0.12, 0.12, 5, 0x3a2a1c, i * 1.3, 2.72, 0); // poutres
    // Fenêtre : la lumière froide de l'aube
    emissif(new THREE.PlaneGeometry(0.8, 0.6), 0xcfe0f4, 1.6, groupe, -1.2, 1.7, -2.36);
    [[0, 0.33, 0.9, 0.06], [0, -0.33, 0.9, 0.06], [-0.43, 0, 0.06, 0.72], [0.43, 0, 0.06, 0.72], [0, 0, 0.04, 0.6]].forEach(([dx, dy, w, h]) => boite(w, h, 0.05, 0x2a2018, -1.2 + dx, 1.7 + dy, -2.34));
    const aube = new THREE.SpotLight(0xbcd2f0, 9, 10, 0.75, 0.8, 1.1); aube.position.set(-1.2, 1.8, -2.2); aube.target.position.set(0.3, 0.4, 0.6);
    if (R.haute) { aube.castShadow = true; aube.shadow.mapSize.set(1024, 1024); }
    groupe.add(aube, aube.target);
    // Par la porte : les collines de pins dans la brume
    for (let i = 0; i < 14; i++) {
      const x = 8 + alea() * 18, z = -10 + alea() * 20;
      P.maille(new THREE.ConeGeometry(0.9, 4 + alea() * 3, 7), 0x3a5a4a, groupe, x, 2.5, z);
    }
    boite(60, 0.05, 60, 0x5a6a4a, 30, -0.03, 0);
    // Le tissage au mur, la table, la bougie, les chaises
    const tissu = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshStandardMaterial({ map: textureTissage(), roughness: 1 }));
    tissu.position.set(-2.86, 1.5, 0.6); tissu.rotation.y = Math.PI / 2; groupe.add(tissu);
    boite(1.4, 0.06, 0.8, 0x5e4630, 0, 0.75, -0.9);
    [[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]].forEach(([x, z]) => boite(0.06, 0.75, 0.06, 0x4a3624, x, 0.37, -0.9 + z));
    [[-0.3, -1.6], [0.55, -0.1]].forEach(([x, z]) => { boite(0.42, 0.04, 0.42, 0x5e4630, x, 0.45, z); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => boite(0.04, 0.45, 0.04, 0x4a3624, x + a, 0.22, z + b)); });
    P.maille(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), 0xeae0c8, groupe, 0.5, 0.84, -1.1);
    const flamme = emissif(new THREE.SphereGeometry(0.014, 6, 6), 0xffb060, 5, groupe, 0.5, 0.92, -1.1);
    const bougie = new THREE.PointLight(0xff9a40, 1.6, 4, 1.5); bougie.position.set(0.5, 1.0, -1.1); groupe.add(bougie);
    // L'acte d'hypothèque, sur la table
    const acte = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.34), new THREE.MeshStandardMaterial({ map: textureActe(), roughness: 0.95 }));
    acte.rotation.set(-Math.PI / 2, 0, 0.25); acte.position.set(-0.15, 0.785, -0.8); groupe.add(acte);
    objet("acte_propriete", acte, -0.15, 0.79, -0.8);

    const pere = personnage("pere_yesenia", -0.3, -1.6, 0, "chaise");
    const yesenia = personnage("yesenia", 1.6, 0.4, -Math.PI / 2 - 0.4, "debout");
    placerJoueur(1.9, 1.9, 0.55, -0.15, 1.3);
    A.reinitialiser();
    const sonVent = A.ventSec(); sonVent.g.gain.value = 0.015;
    majTableau = () => {
      const f = 0.85 + Math.sin(temps * 11) * 0.08 + Math.sin(temps * 6.7) * 0.07;
      flamme.scale.setScalar(f); bougie.intensity = 1.6 * f;
      if (pere.mainEpaule) { _m.set(yesenia.x, 1.25, yesenia.z); P.pointerBras(pere, 1, _m, 0.2); }
    };

    await fondu(false, 2);
    await carte("ilot2b");
    tourner(pere, yesenia.x, yesenia.z);
    await attendre(1);
    await dire("pereYesenia", 1);
    tourner(yesenia, pere.x, pere.z);
    await dire("yesenia1", 0.8);
    pere.cible = "debout";
    await attendre(1.2);
    await allerVers(pere, 1.0, -0.15, 0.6);
    tourner(pere, yesenia.x, yesenia.z); tourner(yesenia, pere.x, pere.z);
    pere.mainEpaule = true;
    await dire("pereYesenia2", 1.5);
    pere.mainEpaule = false;
    // Elle part par la porte, dans la brume.
    await allerVers(yesenia, 2.6, 0.1, 0.9);
    allerVers(yesenia, 9, 0.6, 0.9);
    await attendre(5);
    pere.cible = "tete_basse";
    await attendre(2);
    sonVent.arreter(2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Tableau 3 : Julio à San Salvador
  // =====================================================================
  async function tableau3() {
    viderTableau(); ilotCourant = "ilot3";
    solY = () => 0;
    R.renderer.toneMappingExposure = 1.5;
    scene.background = new THREE.Color(0x05060a);
    scene.fog = null;
    groupe.add(new THREE.HemisphereLight(0x2a3040, 0x101010, 0.6));

    const mur = 0x7a8478;
    boite(4, 0.05, 3.6, 0x55524c, 0, -0.025, 0);
    boite(4, 2.6, 0.15, mur, 0, 1.3, -1.8);
    boite(0.15, 2.6, 3.6, mur, -2, 1.3, 0);
    boite(0.15, 2.6, 1.3, mur, 2, 1.3, -1.15); boite(0.15, 2.6, 1.3, mur, 2, 1.3, 1.15);
    boite(0.15, 0.9, 1.0, mur, 2, 0.45, 0); boite(0.15, 0.6, 1.0, mur, 2, 2.3, 0);   // fenêtre
    boite(4.2, 0.1, 3.8, 0x4a4a46, 0, 2.62, 0);
    boite(4, 2.6, 0.15, mur, 0, 1.3, 1.8);
    // Le lit, une chaise, un sac
    boite(1.9, 0.3, 0.9, 0x3a3428, -0.9, 0.15, -1.25);
    boite(1.85, 0.12, 0.85, 0x8a8a9a, -0.9, 0.36, -1.25);
    boite(0.4, 0.12, 0.6, 0xd8d8e0, -1.65, 0.46, -1.25);
    P.maille(new THREE.BoxGeometry(0.4, 0.5, 0.22), 0x2a2a26, groupe, 1.2, 0.25, -1.4);
    // Une ampoule nue, éteinte
    P.maille(new THREE.CylinderGeometry(0.005, 0.005, 0.4, 4), 0x111111, groupe, 0, 2.4, 0);
    P.maille(new THREE.SphereGeometry(0.05, 8, 6), 0x9a9a8a, groupe, 0, 2.18, 0);
    // Le néon dehors : il clignote et colore la pièce
    const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), new THREE.MeshBasicMaterial({
      map: texte2D(["HOTEL"], { couleur: "#ffffff", police: "bold 110px sans-serif", l: 512, h: 160 }), transparent: true, color: Rendu.lumineux(0xff4fa8, 3) }));
    enseigne.position.set(4.5, 2.2, 0.2); enseigne.rotation.y = -Math.PI / 2; groupe.add(enseigne);
    const rose = new THREE.PointLight(0xff4fa8, 9, 9, 1.4); rose.position.set(3.2, 1.8, 0); groupe.add(rose);
    const bleu = new THREE.PointLight(0x6fb8ff, 4.5, 7, 1.5); bleu.position.set(2.6, 1.2, -0.3); groupe.add(bleu); // lampadaire de la rue

    const julio = personnage("julio", -0.9, -0.75, Math.PI, "chaise");
    julio.yExtra = 0.0;
    // Le téléphone dans sa main, écran allumé
    const tel = new THREE.Group(); julio.bras[1].poignet.add(tel);
    P.maille(new THREE.BoxGeometry(0.07, 0.14, 0.012), 0x111111, tel, 0, -0.06, 0.03);
    const ecran = emissif(new THREE.PlaneGeometry(0.06, 0.12), 0xbfd8ff, 2, tel, 0, -0.06, 0.037);
    const lueurTel = new THREE.PointLight(0xa8c8ff, 0.6, 1.2, 2); tel.add(lueurTel); lueurTel.position.set(0, -0.06, 0.1);
    placerJoueur(-1.3, 1.25, -0.7, -0.12, 0.6);
    A.reinitialiser();
    const sonNeon = A.neon(3.2, 2, 0);
    let auTelephone = true;
    const _tete = new THREE.Vector3();
    majTableau = () => {
      // Grésillement irrégulier du néon
      const pann = Math.sin(temps * 23) > 0.93 || Math.sin(temps * 3.7 + 1) > 0.985;
      rose.intensity = pann ? 1.5 : 9; enseigne.material.opacity = pann ? 0.3 : 1;
      if (auTelephone) {
        julio.tete.getWorldPosition(_tete);
        _tete.x += Math.cos(julio.cap) * 0.12; _tete.z -= Math.sin(julio.cap) * 0.12; _tete.y -= 0.02;
        P.pointerBras(julio, 1, _tete, 2.2);
      }
      julio.tete.getWorldPosition(_tete); C._posTelephone = { x: _tete.x, y: _tete.y - 1.5, z: _tete.z };
    };

    await fondu(false, 2);
    await carte("ilot3");
    await attendre(1);
    await dire("voixFille", 1);
    await dire("julio1", 1.5);
    // Il raccroche. L'écran s'éteint.
    auTelephone = false; ecran.visible = false; lueurTel.intensity = 0;
    await attendre(3);
    julio.cible = "debout";
    await attendre(1.2);
    await allerVers(julio, 1.4, 0.1, 0.6);
    tourner(julio, 5, 0.1);
    await attendre(1.5);
    await dire("julioSeul", 2);
    sonNeon.arreter(2);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Tableau 4 : Valeria à Maracaibo (l'hôpital dans le noir, puis la cuisine)
  // =====================================================================
  function textureCarrelage(couleur, joint, n, fissures) {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = joint; c.fillRect(0, 0, T, T);
    const k = T / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      c.fillStyle = couleur; c.fillRect(i * k + 1.5, j * k + 1.5, k - 3, k - 3);
      c.fillStyle = "rgba(0,0,0," + (Math.random() * 0.08).toFixed(3) + ")"; c.fillRect(i * k + 1.5, j * k + 1.5, k - 3, k - 3); // usure inégale
    }
    c.strokeStyle = "rgba(40,50,45,0.6)"; c.lineWidth = 1.2;
    for (let f = 0; f < fissures; f++) {
      let x = Math.random() * T, y = Math.random() * T; c.beginPath(); c.moveTo(x, y);
      for (let s2 = 0; s2 < 6; s2++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.3) * 30; c.lineTo(x, y); }
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function textureDiplome() {
    const cv = document.createElement("canvas"); cv.width = 320; cv.height = 240;
    const c = cv.getContext("2d");
    c.fillStyle = "#f3eedc"; c.fillRect(0, 0, 320, 240);
    c.strokeStyle = "#8a6a2a"; c.lineWidth = 4; c.strokeRect(10, 10, 300, 220);
    c.fillStyle = "#3a2a1a"; c.textAlign = "center";
    c.font = "bold 17px Georgia, serif"; c.fillText("UNIVERSIDAD DEL ZULIA", 160, 52);
    c.font = "13px Georgia, serif"; c.fillText("confiere el título de", 160, 86);
    c.font = "italic bold 20px Georgia, serif"; c.fillText("Licenciada en Enfermería", 160, 118);
    c.font = "15px Georgia, serif"; c.fillText("Valeria", 160, 150);
    c.strokeStyle = "#3a2a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(60, 196); c.lineTo(140, 196); c.moveTo(180, 196); c.lineTo(260, 196); c.stroke();
    c.fillStyle = "#b03030"; c.beginPath(); c.arc(160, 196, 14, 0, 7); c.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  async function tableau4() {
    viderTableau(); ilotCourant = "ilot4";
    solY = () => 0;
    R.renderer.toneMappingExposure = 1.4;
    scene.background = new THREE.Color(0x050608); scene.fog = null;
    const nuit = new THREE.HemisphereLight(0x4a5868, 0x1a1a1a, 0.5); groupe.add(nuit);

    // Le couloir : carrelage vert d'eau fissuré, peinture écaillée
    const sol = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshStandardMaterial({ map: textureCarrelage("rgb(150,180,165)", "#5a6a62", 8, 6), roughness: 0.6 }));
    sol.material.map.repeat.set(3, 2.5); sol.rotation.x = -Math.PI / 2; sol.receiveShadow = R.haute; groupe.add(sol);
    const faience = textureCarrelage("rgb(120,170,150)", "#4a5a52", 6, 4); faience.repeat.set(4, 1);
    const murBas = new THREE.MeshStandardMaterial({ map: faience, roughness: 0.5 });
    [[0, -2.5, 6, 0], [-3, 0, 5, Math.PI / 2], [3, 0, 5, -Math.PI / 2]].forEach(([x, z, l, r]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, 1.4), murBas); m.position.set(x, 0.7, z); m.rotation.y = r; m.receiveShadow = R.haute; groupe.add(m);
      const h = P.maille(new THREE.PlaneGeometry(l, 1.5), 0xc8ccc0, groupe, x, 2.15, z); h.rotation.y = r;
    });
    boite(6, 0.05, 5, 0xb8b8ac, 0, 2.9, 0);
    // Ventilateur de plafond, immobile
    P.maille(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), 0x5a5a5a, groupe, 0.6, 2.8, 0.2);
    for (let i = 0; i < 4; i++) { const pale = boite(0.55, 0.01, 0.12, 0x6a6a60, 0.6, 2.74, 0.2); pale.rotation.y = i * Math.PI / 2; pale.position.x += Math.cos(i * Math.PI / 2) * 0.3; pale.position.z -= Math.sin(i * Math.PI / 2) * 0.3; }
    // Le néon blafard
    const tube = emissif(new THREE.BoxGeometry(1.2, 0.04, 0.08), 0xeaf4ff, 2.2, groupe, -0.4, 2.85, -0.6);
    const neonLum = new THREE.SpotLight(0xe0f0ff, 14, 10, 1.1, 0.7, 1.2); neonLum.position.set(-0.4, 2.8, -0.6); neonLum.target.position.set(-0.2, 0, -0.6);
    if (R.haute) { neonLum.castShadow = true; neonLum.shadow.mapSize.set(1024, 1024); }
    groupe.add(neonLum, neonLum.target);

    // L'armoire à pharmacie presque vide
    const ax = -2.2, az = -2.1;
    [[-0.5, -0.18], [0.5, -0.18], [-0.5, 0.18], [0.5, 0.18]].forEach(([dx, dz]) => P.maille(new THREE.CylinderGeometry(0.015, 0.015, 1.9, 6), 0x8a9090, groupe, ax + dx, 0.95, az + dz));
    [0.3, 0.75, 1.2, 1.65].forEach((y) => boite(1.04, 0.02, 0.4, 0x9aa0a0, ax, y, az));
    P.maille(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10), 0xf0f0ea, groupe, ax - 0.3, 1.26, az).rotation.z = Math.PI / 2;
    P.maille(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10), 0xf0f0ea, groupe, ax - 0.15, 1.26, az + 0.05).rotation.z = Math.PI / 2;
    [[0.2, 0.75], [0.35, 1.65], [-0.2, 0.3]].forEach(([dx, y]) => { boite(0.16, 0.01, 0.12, 0xd8ccb0, ax + dx, y + 0.015, az); boite(0.16, 0.08, 0.01, 0xd8ccb0, ax + dx, y + 0.05, az - 0.06); }); // boîtes vides, ouvertes
    objet("etagere_pharmacie", null, ax, 1.25, az + 0.2);

    // Le lit pédiatrique et l'enfant fiévreux
    const lx = 0.9, lz = -1.5;
    [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(([dx, dz]) => P.maille(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), 0xb8c0c0, groupe, lx + dx, 0.45, lz + dz));
    boite(1.5, 0.12, 0.7, 0xe4e8e0, lx, 0.62, lz);
    [-0.33, 0.33].forEach((dz) => boite(1.5, 0.02, 0.02, 0xb8c0c0, lx, 0.86, lz + dz)); // barrières
    const drap = P.maille(new THREE.CapsuleGeometry(0.15, 0.6, 4, 10), 0xdfe8ee, groupe, lx + 0.05, 0.74, lz); drap.rotation.z = Math.PI / 2; drap.scale.set(1, 1, 0.6);
    boite(0.3, 0.06, 0.4, 0xf4f4f0, lx - 0.58, 0.71, lz);
    P.maille(new THREE.SphereGeometry(0.085, 12, 10), 0x8a6448, groupe, lx - 0.52, 0.8, lz);
    P.maille(new THREE.SphereGeometry(0.088, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x111111, groupe, lx - 0.55, 0.81, lz).rotation.z = Math.PI / 2;

    const valeria = personnage("valeria", -1.4, -1.2, Math.PI * 0.75, "debout");
    const mere = personnage("mere_patient", 0.7, -0.75, Math.PI, "debout");
    tourner(valeria, mere.x, mere.z); tourner(mere, valeria.x, valeria.z);
    placerJoueur(0.2, 1.5, 0.12, -0.12, 1.2);
    A.reinitialiser();
    const sonNeon = A.neon(-0.4, 2.8, -0.6);

    let courant = true, lampe = null;
    majTableau = () => {
      if (courant) {
        const gres = Math.sin(temps * 31) > 0.9 || Math.sin(temps * 4.3) > 0.97;
        neonLum.intensity = gres ? 3 : 14; tube.visible = !gres;
      }
      if (lampe) { lampe.lum.position.copy(lampe.ecran.getWorldPosition(_m)); }
      if (valeria.eclaire) { _m.set(lx - 0.4, 0.9, lz); P.pointerBras(valeria, 1, _m, 0.3); }
    };

    await fondu(false, 2);
    await carte("ilot4");
    await dire("valeria1", 0.6);
    // Coupure de courant brutale (« apagón »)
    courant = false; A.coupure(); sonNeon.arreter(0.1);
    neonLum.intensity = 0; tube.visible = false; nuit.intensity = 0.06;
    await attendre(0.5);
    await dire("merePatient1", 0.5);
    // La lampe du téléphone de Valeria
    const tel = new THREE.Group(); valeria.bras[1].poignet.add(tel);
    P.maille(new THREE.BoxGeometry(0.07, 0.14, 0.012), 0x111111, tel, 0, -0.06, 0.03);
    const ecran = emissif(new THREE.SphereGeometry(0.012, 6, 6), 0xffffff, 6, tel, 0, -0.11, 0.04);
    const lum = new THREE.SpotLight(0xd8e8ff, 6, 6, 0.6, 0.6, 1.4); lum.target.position.set(lx - 0.4, 0.7, lz);
    groupe.add(lum, lum.target);
    lampe = { lum, ecran };
    await allerVers(valeria, lx - 0.9, lz + 0.45, 0.7);
    tourner(valeria, lx - 0.4, lz); valeria.eclaire = true;
    await attendre(0.6);
    await dire("valeria2", 2);
    await fondu(true, 2.5);

    // --- Plus tard, à la maison ---
    viderTableau(); ilotCourant = "ilot4b";
    R.renderer.toneMappingExposure = 1.5;
    groupe.add(new THREE.HemisphereLight(0x4a5878, 0x1a1410, 0.6));
    boite(4.5, 0.05, 4, 0x5a5046, 0, -0.025, 0);
    const murC = 0x8a8c84; // murs gris-vert : la bougie ne doit pas tout teinter d'orange
    boite(4.5, 2.6, 0.15, murC, 0, 1.3, -2); boite(0.15, 2.6, 4, murC, -2.25, 1.3, 0); boite(0.15, 2.6, 4, murC, 2.25, 1.3, 0);
    const lune = new THREE.SpotLight(0x8aa4d8, 5, 8, 0.7, 0.8, 1.2); lune.position.set(-1, 1.7, -1.8); lune.target.position.set(0.5, 0.5, 0.6); groupe.add(lune, lune.target); // la nuit par la fenêtre
    boite(4.7, 0.08, 4.2, 0x8a8078, 0, 2.62, 0);
    emissif(new THREE.PlaneGeometry(0.7, 0.6), 0x1a2a4a, 1, groupe, -1, 1.6, -1.92);   // fenêtre sur la nuit
    boite(0.7, 0.85, 0.5, 0xe0e0d8, 1.7, 0.42, -1.65); boite(0.5, 0.03, 0.4, 0x2a2a2a, 1.7, 0.86, -1.65); // cuisinière éteinte
    boite(1.2, 0.05, 0.8, 0x7a5a3a, 0, 0.75, -0.6);
    [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].forEach(([x, z]) => boite(0.05, 0.75, 0.05, 0x5a4028, x, 0.37, -0.6 + z));
    [[-0.3, -1.25], [0.75, -0.55]].forEach(([x, z]) => { boite(0.4, 0.04, 0.4, 0x7a5a3a, x, 0.45, z); [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([a, b]) => boite(0.035, 0.45, 0.035, 0x5a4028, x + a, 0.22, z + b)); });
    P.maille(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), 0xeae0c8, groupe, -0.35, 0.84, -0.55);
    const flamme = emissif(new THREE.SphereGeometry(0.014, 6, 6), 0xffb060, 5, groupe, -0.35, 0.92, -0.55);
    const bougie = new THREE.PointLight(0xffa860, 1.3, 4, 1.6); bougie.position.set(-0.35, 1.0, -0.55);
    if (R.haute) bougie.castShadow = true;
    groupe.add(bougie);
    // La liasse de bolivars et le diplôme encadré
    const liasse = new THREE.Group(); liasse.position.set(0.25, 0.78, -0.45); groupe.add(liasse);
    for (let i = 0; i < 7; i++) boite(0.16, 0.012, 0.07, 0x9ab09a, 0, i * 0.012, 0, liasse).rotation.y = (Math.random() - 0.5) * 0.15;
    boite(0.03, 0.09, 0.075, 0xd8c890, 0, 0.042, 0, liasse);
    const cadre = new THREE.Group(); cadre.position.set(0.45, 0.87, -0.78); cadre.rotation.x = -0.25; groupe.add(cadre);
    boite(0.36, 0.28, 0.02, 0x3a2a1a, 0, 0, 0, cadre);
    const dip = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), new THREE.MeshStandardMaterial({ map: textureDiplome(), roughness: 0.8 })); dip.position.z = 0.011; cadre.add(dip);
    objet("liasse_bolivars", liasse, 0.33, 0.82, -0.55);

    const mereV = personnage("mere_valeria", -0.3, -1.25, 0, "chaise");
    const valeria2 = personnage("valeria", 2.0, 1.3, -Math.PI * 0.7, "marche");
    placerJoueur(0.6, 1.7, 0.2, -0.15, 0.8);
    majTableau = () => {
      const f = 0.85 + Math.sin(temps * 11) * 0.08 + Math.sin(temps * 6.7) * 0.07;
      flamme.scale.setScalar(f); bougie.intensity = 1.3 * f;
    };
    await fondu(false, 2);
    await carte("ilot4b");
    await allerVers(valeria2, 1.0, -0.5, 0.8); // au bout de la table, de profil : on voit les deux visages
    tourner(valeria2, mereV.x, mereV.z); tourner(mereV, valeria2.x, valeria2.z);
    // Ce qu'elle rapporte : une boîte d'œufs, un paquet de farine
    boite(0.3, 0.07, 0.11, 0xb8a888, -0.05, 0.81, -0.3); boite(0.12, 0.2, 0.08, 0xf0ece0, 0.08, 0.875, -0.7);
    await attendre(0.8);
    await dire("mereValeria", 0.8);
    await dire("valeria3", 1.2);
    tourner(valeria2, cadre.position.x, cadre.position.z);
    valeria2.cible = "tete_basse";
    await attendre(1.5);
    await dire("valeriaDepart", 2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Tableau 5 : Joseph à Santiago du Chili (la remise du chantier)
  // =====================================================================
  function textureCarteRoute() {
    const cv = document.createElement("canvas"); cv.width = 300; cv.height = 420;
    const c = cv.getContext("2d");
    c.fillStyle = "#e8dfc6"; c.fillRect(0, 0, 300, 420);
    const etapes = ["EE.UU.", "México", "Guatemala", "Honduras", "Nicaragua", "Costa Rica", "Panamá — Darién", "Colombia", "Ecuador", "Perú", "Chile — Santiago"];
    c.font = "bold 15px Georgia, serif"; c.fillStyle = "#3a2a1a"; c.textAlign = "center"; c.fillText("10 FRONTERAS", 150, 26);
    c.strokeStyle = "#b02a2a"; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath();
    etapes.forEach((e, i) => { const y = 50 + i * 34, x = 150 + Math.sin(i * 1.3) * 50; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.setLineDash([]);
    etapes.forEach((e, i) => {
      const y = 50 + i * 34, x = 150 + Math.sin(i * 1.3) * 50;
      c.fillStyle = i === 6 ? "#b02a2a" : "#2a2a2a"; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
      c.font = (i === 6 || i === 10 ? "bold " : "") + "12px Georgia, serif"; c.textAlign = x > 150 ? "right" : "left";
      c.fillText(e, x > 150 ? x - 10 : x + 10, y + 4);
    });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  async function tableau5() {
    viderTableau(); ilotCourant = "ilot5";
    solY = () => 0;
    R.renderer.toneMappingExposure = 1.3;
    scene.background = cielDegrade("#1c2a4e", "#e6a27a");
    scene.fog = new THREE.Fog(0x7a7e98, 40, 260);
    groupe.add(new THREE.HemisphereLight(0x8aa0d0, 0x2a2622, 0.9));
    soleil(0xffb48a, 1.4, [-20, 6, -30], 14);

    boite(240, 0.1, 240, 0x4a4844, 0, -0.05, -60);
    // La Cordillère des Andes enneigée, au loin
    for (let i = 0; i < 11; i++) {
      const x = -260 + i * 52 + (alea() - 0.5) * 20, h = 70 + alea() * 50, r = 45 + alea() * 25;
      const z = -220 - alea() * 30;
      P.maille(new THREE.ConeGeometry(r, h, 7), 0x5a6480, groupe, x, h / 2 - 4, z);
      P.maille(new THREE.ConeGeometry(r * 0.32, h * 0.32, 7), 0xe8ecf4, groupe, x, h * 0.84 - 3.5, z); // neiges
    }
    // L'immeuble en construction et la grue
    for (let n = 0; n < 6; n++) boite(18, 0.3, 10, 0x8a8a86, -6, n * 3.2, -32);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) boite(0.4, 16, 0.4, 0x9a9a94, -14 + i * 4, 8, -36.5 + j * 4.5);
    boite(0.8, 40, 0.8, 0xd0a020, 8, 20, -30); boite(42, 0.8, 0.8, 0xd0a020, 14, 39, -30); boite(1.6, 1.6, 1.6, 0x606060, -4, 38, -30);
    emissif(new THREE.SphereGeometry(0.3, 8, 6), 0xff2020, 4, groupe, 35, 39.6, -30);
    // La remise : parois de tôle, banc, ampoule
    const tole = 0x5a6a7a;
    boite(4, 2.6, 0.08, tole, 0, 1.3, -1.5); boite(0.08, 2.6, 3, tole, -2, 1.3, 0); boite(0.08, 2.6, 3, tole, 2, 1.3, 0);
    boite(4.3, 0.06, 3.3, 0x6a7a8a, 0, 2.63, 0);
    boite(4, 0.05, 3, 0x5a5650, 0, 0.01, 0);
    boite(2.2, 0.06, 0.4, 0x8a6a40, -0.6, 0.48, -1.2); [[-1.6, -1.2], [0.4, -1.2]].forEach(([x, z]) => boite(0.06, 0.48, 0.36, 0x6a5030, x, 0.24, z));
    const ampoule = emissif(new THREE.SphereGeometry(0.05, 8, 6), 0xffd8a0, 4, groupe, 0.2, 2.3, -0.5);
    const lumA = new THREE.PointLight(0xffc890, 3, 6, 1.4); lumA.position.set(0.2, 2.2, -0.5); groupe.add(lumA);
    // La carte de sa route, punaisée au mur
    const carteR = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.84), new THREE.MeshStandardMaterial({ map: textureCarteRoute(), roughness: 0.9 }));
    carteR.position.set(1.0, 1.55, -1.45); groupe.add(carteR);
    // Le dossier de l'immigration, sur le banc
    const dossier = boite(0.32, 0.03, 0.24, 0xc8a870, -1.05, 0.525, -1.15);
    objet("dossier_extranjeria", dossier, -1.05, 0.54, -1.15);
    // Sacs de ciment, brouette
    for (let i = 0; i < 9; i++) boite(0.55, 0.14, 0.36, 0x9a9890, 2.8 + (i % 3) * 0.58, 0.07 + Math.floor(i / 3) * 0.14, -0.4);
    const br = new THREE.Group(); br.position.set(-3.2, 0, 0.8); br.rotation.y = 0.6; groupe.add(br);
    boite(0.6, 0.25, 0.8, 0x7a8a7a, 0, 0.55, 0, br); P.maille(new THREE.TorusGeometry(0.17, 0.04, 6, 12), 0x111111, br, 0, 0.2, 0.5).rotation.y = Math.PI / 2;
    // Le casque, qui sera posé sur le banc
    const casqueBanc = new THREE.Group(); casqueBanc.position.set(0.15, 0.6, -1.2); casqueBanc.visible = false; groupe.add(casqueBanc);
    P.maille(new THREE.SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), 0xf2f0e8, casqueBanc);
    P.maille(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 16), 0xf2f0e8, casqueBanc, 0, 0.005, 0.015);
    const giletBanc = boite(0.4, 0.04, 0.3, 0xd97706, -0.35, 0.53, -1.2); giletBanc.visible = false;

    const joseph = personnage("joseph", 0.1, 0.4, Math.PI * 0.25, "debout");
    const chef = personnage("contremaitre", 1.4, 1.3, -Math.PI * 0.75, "debout");
    tourner(joseph, chef.x, chef.z); tourner(chef, joseph.x, joseph.z);
    placerJoueur(2.9, 3.4, 0.55, -0.1, 1.5);
    A.reinitialiser();
    const sonVent = A.ventSec(); sonVent.g.gain.value = 0.02;
    let chantier = true;
    const bruitsChantier = () => { if (!chantier) return; A.echelon(); setTimeout(bruitsChantier, 2500 + Math.random() * 5000); };
    setTimeout(bruitsChantier, 1500);
    majTableau = () => {
      if (joseph.telephone) { joseph.tete.getWorldPosition(_m); _m.y -= 0.12; _m.x += Math.sin(joseph.cap) * 0.12; _m.z += Math.cos(joseph.cap) * 0.12; P.pointerBras(joseph, 1, _m, 1.9); }
    };

    await fondu(false, 2);
    await carte("ilot5");
    await dire("contremaitre1", 0.8);
    await dire("joseph1", 0.8);
    await dire("contremaitre2", 1);
    // Il rend le casque et le gilet.
    await allerVers(joseph, 0.0, -0.75, 0.7);
    tourner(joseph, 0, -3);
    await attendre(0.8);
    if (joseph.coiffe) joseph.coiffe.visible = false; casqueBanc.visible = true;
    await attendre(0.6);
    if (joseph.gilet) joseph.gilet.visible = false; giletBanc.visible = true;
    objet("casque_bottes", casqueBanc, 0.15, 0.62, -1.2);
    allerVers(chef, 8, 6, 1.1).then(() => { chef.racine.visible = false; });
    await attendre(2);
    chantier = false;
    // Assis sur le banc, il enregistre un message pour sa sœur.
    tourner(joseph, 0, 3);
    joseph.cible = "chaise"; joseph.yExtra = 0.02;
    await attendre(1.2);
    const tel = new THREE.Group(); joseph.bras[1].poignet.add(tel);
    P.maille(new THREE.BoxGeometry(0.07, 0.14, 0.012), 0x111111, tel, 0, -0.06, 0.03);
    emissif(new THREE.PlaneGeometry(0.06, 0.12), 0xbfd8ff, 1.5, tel, 0, -0.06, 0.037);
    joseph.telephone = true;
    await attendre(0.6);
    await dire("josephCreole1", 1.5);
    joseph.telephone = false; tel.visible = false;
    joseph.cible = "debout";
    await attendre(1.2);
    await allerVers(joseph, 1.0, -0.85, 0.6);
    tourner(joseph, 1.0, -3);
    await attendre(1.5);
    await dire("joseph2", 2.5);
    sonVent.arreter(2);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Final : l'appel au guide
  // =====================================================================
  async function appelFinal() {
    viderTableau(); ilotCourant = "final";
    scene.background = new THREE.Color(0); scene.fog = null;
    A.reinitialiser();
    await attendre(1.5);
    A.sonnerie(2);
    await attendre(6.5);
    C._posTelephone = null;
    await dire("coyoteVoix", 2);
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
    A.chargerSon("moto-arrivee", "sons/moto-arrivee.mp3");
    A.chargerSon("moto-depart", "sons/moto-depart.mp3");

    const ordre = [["ilot1", tableau1], ["ilot2a", tableau2a], ["ilot2b", tableau2b], ["ilot3", tableau3], ["ilot4", tableau4], ["ilot5", tableau5], ["final", appelFinal]];
    const depart = Math.max(0, ordre.findIndex(([n]) => n === options.ilot));
    for (const [, f] of ordre.slice(depart)) await f();

    ilotCourant = "fin";
    K.liberer();
    aide.classList.remove("visible");
    R.detruire();
    if (onFin) onFin();
  }

  return {
    lancer,
    _etat: () => ({ ilot: ilotCourant, temps, t: temps - debutIlot, joueur: { x: joueur.x, z: joueur.z }, objets: objets.map((o) => o.id), persos: persos.map((p) => [p.qui, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, p.cible]), qualite: R && R.etat() }),
    _placer: (x, z, l, t) => { joueur.x = x; joueur.z = z; K.etat.lacet = l; K.etat.tangage = t || 0; limite.r = 99; },
    _action: action,
  };
})();
