// Chapitre 3 : « L'Entonnoir » — la traversée du Darién, puis le raccord avec le désert.
//   1. La boue et les sacs bleus.   2. La halte sous la bâche.   3. La rivière en crue.
//   4. Le péage.   5. La dernière crête → le brouillard s'ouvre sur le désert du chapitre 1.
// Même moteur de tableaux que le chapitre 2 (témoin invisible, objets à examiner avec E).

window.Chapitre3 = (function () {
  const C = window.CONTENU_CH3;
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
    carteLieu.classList.remove("flash"); carteLieu.classList.add("visible");
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
  //  La jungle (commune aux séquences 1 à 5)
  // =====================================================================
  function textureBoue() {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = "#3a2a1c"; c.fillRect(0, 0, T, T);
    for (let i = 0; i < 2600; i++) {
      const g = 30 + Math.random() * 40;
      c.fillStyle = `rgba(${g + 20},${g + 8},${g - 6},0.5)`;
      c.beginPath(); c.ellipse(Math.random() * T, Math.random() * T, 1 + Math.random() * 6, 1 + Math.random() * 3, Math.random() * 3, 0, 7); c.fill();
    }
    for (let i = 0; i < 60; i++) { // flaques
      c.fillStyle = "rgba(20,24,20,0.55)";
      c.beginPath(); c.ellipse(Math.random() * T, Math.random() * T, 6 + Math.random() * 18, 3 + Math.random() * 8, Math.random() * 3, 0, 7); c.fill();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 26); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // Décor de jungle autour d'une allée (axe z). opts : { pente, sansSentier }
  function jungle(opts) {
    opts = opts || {};
    scene.background = new THREE.Color(0x0b1a12);
    scene.fog = new THREE.FogExp2(0x0b1a12, opts.brume || 0.085);
    R.renderer.toneMappingExposure = 1.55;
    const ciel = new THREE.HemisphereLight(0x8aa890, 0x1a140c, 0.9); groupe.add(ciel);
    const jour = soleil(0xb8d0b8, 0.8, [6, 30, 10], 18);

    const geo = new THREE.PlaneGeometry(120, 120, 80, 80); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, solY(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const tex = textureBoue();
    const sol = new THREE.Mesh(geo, R.haute
      ? new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.4, roughness: 0.32, metalness: 0.05 }) // boue détrempée, luisante
      : new THREE.MeshLambertMaterial({ map: tex }));
    sol.receiveShadow = R.haute; groupe.add(sol);

    // Arbres : troncs, contreforts, lianes, grandes feuilles
    const feuilles = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x2f5a30, side: THREE.DoubleSide, roughness: 0.6 }), 900);
    const fougeres = new THREE.InstancedMesh(new THREE.ConeGeometry(0.6, 0.5, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a4a26, side: THREE.DoubleSide, roughness: 0.7 }), 400);
    const o = new THREE.Object3D();
    let nf = 0, ng = 0;
    for (let i = 0; i < 90; i++) {
      let x = (alea() - 0.5) * 50, z = 10 - alea() * 60;
      if (Math.abs(x) < 2.2) x += Math.sign(x || 1) * 2.4;  // l'allée reste libre
      const h = 10 + alea() * 14, r = 0.25 + alea() * 0.5;
      const y0 = solY(x, z);
      P.maille(new THREE.CylinderGeometry(r * 0.8, r * 1.2, h, 9), alea() < 0.5 ? 0x4a3e30 : 0x5a5040, groupe, x, y0 + h / 2, z);
      if (alea() < 0.4) for (let k = 0; k < 3; k++) { const c = P.maille(new THREE.BoxGeometry(0.08, 1.2, 0.9), 0x4a3e30, groupe, x + Math.cos(k * 2.1) * r, y0 + 0.5, z + Math.sin(k * 2.1) * r); c.rotation.y = k * 2.1; }
      if (alea() < 0.5) P.maille(new THREE.CylinderGeometry(0.03, 0.03, 6 + alea() * 4, 4), 0x3a4a2a, groupe, x + (alea() - 0.5) * 2, y0 + 4 + alea() * 3, z + (alea() - 0.5) * 2);
      for (let k = 0; k < 10 && nf < 900; k++) {
        o.position.set(x + (alea() - 0.5) * 4, y0 + 2 + alea() * h * 0.8, z + (alea() - 0.5) * 4);
        o.rotation.set(-0.6 + alea() * 1.2, alea() * 6.3, alea() * 0.6); o.scale.setScalar(0.7 + alea() * 1.4); o.updateMatrix();
        feuilles.setMatrixAt(nf++, o.matrix);
      }
    }
    for (let i = 0; i < 400; i++) {
      let x = (alea() - 0.5) * 40, z = 8 - alea() * 50;
      if (Math.abs(x) < 1.4) x += Math.sign(x || 1) * 1.6;
      o.position.set(x, solY(x, z) + 0.2, z); o.rotation.set(Math.PI, alea() * 6, 0); o.scale.set(1 + alea(), 0.6 + alea() * 0.8, 1 + alea()); o.updateMatrix();
      fougeres.setMatrixAt(ng++, o.matrix);
    }
    feuilles.count = nf; fougeres.count = ng;
    feuilles.castShadow = R.haute;
    groupe.add(feuilles, fougeres);
    return { ciel, jour, sol };
  }

  // Pluie visible : traits qui tombent autour de la caméra.
  function pluieVisible(nb) {
    nb = nb || 1500;
    const p = new Float32Array(nb * 6);
    for (let i = 0; i < nb; i++) {
      const x = (Math.random() - 0.5) * 24, y = Math.random() * 14, z = (Math.random() - 0.5) * 24;
      p.set([x, y, z, x + 0.02, y - 0.45, z], i * 6);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaac4b8, transparent: true, opacity: 0.35 }));
    groupe.add(m);
    return {
      mesh: m,
      maj(dt) {
        const a = g.attributes.position.array;
        for (let i = 0; i < nb; i++) {
          let y = a[i * 6 + 1] - dt * 14;
          if (y < -1) y += 15;
          a[i * 6 + 1] = y; a[i * 6 + 4] = y - 0.45;
        }
        g.attributes.position.needsUpdate = true;
        m.position.set(camera.position.x, camera.position.y - 4, camera.position.z);
      },
    };
  }

  // Un sac plastique bleu noué à une branche
  function sacBleu(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); groupe.add(g);
    P.maille(new THREE.CylinderGeometry(0.02, 0.025, 1.4, 5), 0x4a3e30, g, 0, 0, 0).rotation.z = Math.PI / 2.4;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.4, 2, 4), new THREE.MeshStandardMaterial({ color: Rendu.lumineux(0x2a6ad8, 1.2), side: THREE.DoubleSide, roughness: 0.4 }));
    s.position.set(0.15, -0.22, 0); groupe.add(s); g.add(s);
    g.userData.sac = s;
    return g;
  }

  // Joseph porte Ángel sur ses épaules.
  const _tete = new THREE.Vector3();
  function porterSurEpaules(porteur, enfant) {
    enfant.porte = porteur;
    porteur.haut.add(enfant.racine);
    enfant.cible = "chaise";
  }
  const _g = new THREE.Vector3(), _d2 = new THREE.Vector3();
  function majPorte(enfant) {
    if (!enfant.porte) return;
    const p = enfant.porte;
    // Les hanches de l'enfant posées sur les épaules (repère du buste de Joseph).
    // (on remplace la position calculée par l'animation : le bassin est à 0,92 × taille au-dessus de la racine)
    const hanches = 0.92 * enfant.s;
    enfant.racine.position.set(0, 0.62 - hanches, -0.07);
    enfant.racine.rotation.set(0, 0, 0);
    // Jambes écartées de part et d'autre du cou, tibias qui pendent sur la poitrine.
    enfant.jambes.forEach((j, i) => {
      j.hanche.rotation.set(-1.35, 0, (i ? -1 : 1) * 0.55);
      j.genou.rotation.set(1.5, 0, 0);
    });
    // Ses mains sur la tête de Joseph.
    p.tete.getWorldPosition(_tete); _tete.y += 0.06;
    P.pointerBras(enfant, 0, _tete, 0.9); P.pointerBras(enfant, 1, _tete, 0.9);
    // Joseph lui tient les tibias, devant sa poitrine.
    enfant.racine.updateMatrixWorld(true);
    enfant.jambes[1].genou.getWorldPosition(_g); _g.y -= 0.12;
    enfant.jambes[0].genou.getWorldPosition(_d2); _d2.y -= 0.12;
    P.pointerBras(p, 0, _g, 1.2); P.pointerBras(p, 1, _d2, 1.2);
  }

  // Le groupe du Darién
  function groupeDarien(positions) {
    const g = {};
    Object.entries(positions).forEach(([qui, [x, z, cap, pose]]) => {
      const p = personnage(qui, x, z, cap || Math.PI, pose || "debout");
      g[qui] = p;
    });
    return g;
  }
  function marcheBoue(p, x, z, v) { p.yExtra = -0.1; return allerVers(p, x, z, v || 0.75); }

  // =====================================================================
  //  Séquence 1 : la boue et les sacs bleus
  // =====================================================================
  async function sequence1() {
    viderTableau(); ilotCourant = "seq1";
    solY = (x, z) => 0.25 * Math.sin(x * 0.4) * Math.cos(z * 0.3) + Math.abs(x) * 0.12;
    jungle();
    const pluie = pluieVisible();
    const g = groupeDarien({
      guia_darien: [0, -2.5], wilmer: [0.6, -1.0], valeria: [-0.5, 0.4], mishel: [0.4, 1.4],
      aurelio: [-0.4, 2.6], joseph: [0.5, 3.6], carolina: [-0.3, 4.8], angel: [0.4, 5.6],
    });
    Object.values(g).forEach((p) => (p.yExtra = -0.1));
    // La chaussure d'Ángel, plus tard prisonnière de la boue
    const chaussure = new THREE.Group(); chaussure.visible = false; groupe.add(chaussure);
    boite(0.11, 0.07, 0.22, 0xe0e0e0, 0, 0, 0, chaussure); boite(0.11, 0.02, 0.22, 0x3a2a1a, 0, 0.04, 0.02, chaussure);
    const branche = sacBleu(-1.9, 1.9, -6.5);
    placerJoueur(0.9, 7.6, 0.05, -0.08, 2);
    A.reinitialiser();
    const sonPluie = A.pluie(1);
    const orage = () => { if (ilotCourant !== "seq1") return; A.tonnerre(); setTimeout(orage, 9000 + Math.random() * 9000); };
    setTimeout(orage, 5000);
    let suivreGroupe = true;
    majTableau = (dt) => {
      pluie.maj(dt);
      majPorte(g.angel);
      branche.userData.sac.rotation.y = Math.sin(temps * 2.3) * 0.4;
      if (suivreGroupe) { limite.x = g.carolina.x + 0.6; limite.z = g.carolina.z + 2.4; }
    };
    limite.r = 2.2;

    await fondu(false, 2);
    await carte("seq1");
    // Tout le monde avance, lentement, dans la boue.
    const avancer = (dz, v) => Object.values(g).forEach((p) => { if (p !== g.angel || !g.angel.porte) marcheBoue(p, p.x, p.z - dz, v); });
    avancer(3, 0.6);
    await dire("guideDarien1", 0.5);
    await attendre(2);
    // Ángel est coincé.
    g.angel.but = null; g.angel.cible = "accroupi"; g.angel.yExtra = -0.28;
    chaussure.position.set(g.angel.x + 0.15, solY(g.angel.x, g.angel.z) - 0.02, g.angel.z + 0.1); chaussure.rotation.set(0.5, 0.4, 0.3);
    await dire("angelChaussure", 0.3);
    tourner(g.carolina, g.angel.x, g.angel.z);
    await marcheBoue(g.carolina, g.angel.x - 0.5, g.angel.z - 0.3, 0.9);
    g.carolina.cible = "accroupi";
    await dire("carolinaBoue", 0.4);
    // Joseph revient sur ses pas.
    await marcheBoue(g.joseph, g.angel.x + 0.6, g.angel.z - 0.4, 0.9);
    tourner(g.joseph, g.carolina.x, g.carolina.z);
    await dire("josephEpaules", 0.5);
    g.carolina.cible = "debout"; g.angel.yExtra = 0; g.angel.cible = "chaise";
    chaussure.visible = true;
    objet("chaussure_boue", chaussure, chaussure.position.x, chaussure.position.y + 0.05, chaussure.position.z);
    porterSurEpaules(g.joseph, g.angel);
    await attendre(1.5);
    // On repart. Les sacs bleus dans les branches.
    avancer(3.5, 0.55);
    await attendre(4);
    objet("sac_bleu_arbre", branche, -1.8, 1.75, -6.5);
    tourner(g.mishel, -1.9, -6.5);
    await dire("mishelSacsBleus", 0.4);
    await dire("valeriaSacsBleus", 2);
    suivreGroupe = false;
    await attendre(3);
    sonPluie.arreter(2.5);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Séquence 2 : la halte sous la bâche
  // =====================================================================
  async function sequence2() {
    viderTableau(); ilotCourant = "seq2";
    solY = (x, z) => 0.2 * Math.sin(x * 0.5) * Math.cos(z * 0.4);
    jungle({ brume: 0.1 });
    const pluie = pluieVisible(1200);
    // La bâche bleue tendue entre les arbres, et ses gouttières
    const bache = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2a5aa8, side: THREE.DoubleSide, roughness: 0.4 }));
    bache.position.set(0, 2.3, -0.6); bache.rotation.set(-Math.PI / 2 + 0.25, 0, 0); bache.castShadow = R.haute; groupe.add(bache);
    const bp = bache.geometry.attributes.position; for (let i = 0; i < bp.count; i++) bp.setZ(i, -0.15 * Math.cos(bp.getX(i) * 0.6) * Math.cos(bp.getY(i) * 0.9)); bache.geometry.computeVertexNormals();
    [[-2.4, -2.2], [2.4, -2.2], [-2.4, 1.0], [2.4, 1.0]].forEach(([x, z]) => P.maille(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5), 0x5a4a3a, groupe, x, 1.3, z));
    // La racine où s'assoit Don Aurelio
    const racine = P.maille(new THREE.CylinderGeometry(0.22, 0.3, 2.2, 8), 0x4a3e30, groupe, -0.6, 0.25, -1.2); racine.rotation.z = Math.PI / 2;
    const lampe = emissif(new THREE.SphereGeometry(0.03, 6, 6), 0xffe0b0, 5, groupe, 0.6, 1.95, -0.8);
    const lumL = new THREE.PointLight(0xffd8a0, 2.2, 6, 1.4); lumL.position.set(0.6, 1.9, -0.8); groupe.add(lumL); // une lampe frontale accrochée

    const g = groupeDarien({
      aurelio: [-0.6, -1.0, 0, "chaise"], valeria: [-0.5, -0.25, Math.PI, "agenouille"],
      carolina: [1.4, -1.6, -0.5, "assis"], angel: [1.9, -1.3, -0.8, "dort"], mishel: [-1.8, -1.6, 0.4, "assis"],
      joseph: [1.6, -0.2, -1.2, "assis"], wilmer: [-1.9, 0.2, 1.0, "assis"], guia_darien: [2.6, 1.4, -2.2, "debout"],
    });
    g.aurelio.yExtra = 0.05;
    // La trousse de Valeria, ouverte dans la boue
    const trousse = new THREE.Group(); trousse.position.set(-0.05, solY(-0.05, -0.05) + 0.04, -0.05); groupe.add(trousse);
    boite(0.24, 0.06, 0.16, 0x2a6a8a, 0, 0, 0, trousse); boite(0.06, 0.015, 0.08, 0xc0282a, 0, 0.035, 0, trousse);
    P.maille(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), 0xf2f2ea, trousse, 0.16, 0.0, 0.04).rotation.z = Math.PI / 2;
    objet("trousse_valeria", trousse, -0.05, trousse.position.y + 0.05, -0.05);
    placerJoueur(0.4, 2.4, 0.1, -0.25, 1.2);
    A.reinitialiser();
    const sonPluie = A.pluie(0.8);
    majTableau = (dt) => {
      pluie.maj(dt);
      // Valeria panse les pieds de Don Aurelio.
      _m.set(g.aurelio.x + 0.25 + Math.sin(temps * 2) * 0.05, 0.2, g.aurelio.z + 0.45);
      P.pointerBras(g.valeria, 0, _m, 0.4); _m.x -= 0.15; P.pointerBras(g.valeria, 1, _m, 0.5);
    };
    await fondu(false, 2);
    await carte("seq2");
    await attendre(1);
    tourner(g.valeria, g.aurelio.x, g.aurelio.z);
    await dire("valeriaSoin1", 0.6);
    g.aurelio.regardeJoueur = false;
    await dire("aurelioSoin", 2.5);
    await attendre(3);
    sonPluie.arreter(2.5);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Séquence 3 : la rivière en crue, la chaîne humaine
  // =====================================================================
  function textureEau() {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d");
    c.fillStyle = "#3a5a50"; c.fillRect(0, 0, T, T);
    for (let i = 0; i < 300; i++) {
      c.strokeStyle = `rgba(${200 + Math.random() * 55},${210 + Math.random() * 45},200,${0.1 + Math.random() * 0.25})`;
      c.lineWidth = 1 + Math.random() * 2; const x = Math.random() * T, y = Math.random() * T;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y + 4, x + 20 + Math.random() * 30, y + (Math.random() - 0.5) * 6); c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  async function sequence3() {
    viderTableau(); ilotCourant = "seq3";
    // Deux berges et le lit de la rivière (entre z = -1 et z = -9)
    solY = (x, z) => (z > -1 ? 0.3 + (z + 1) * 0.08 : z < -9 ? 0.3 + (-9 - z) * 0.1 : -0.7) + 0.1 * Math.sin(x * 0.5);
    jungle({ brume: 0.07 });
    const pluie = pluieVisible(1300);
    const texE = textureEau();
    const eau = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), new THREE.MeshStandardMaterial({ map: texE, color: 0x8ab0a0, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.92 }));
    eau.rotation.x = -Math.PI / 2; eau.position.set(0, -0.25, -5); groupe.add(eau);
    // La corde tendue d'une rive à l'autre
    const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push(new THREE.Vector3(-0.6 + u * 0.4, 1.15 - Math.sin(u * Math.PI) * 0.35, 1 - u * 12)); }
    const corde = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.018, 5), P.mat(0xc8b070)); groupe.add(corde);
    [[-0.6, 1.2], [-0.2, -11.2]].forEach(([x, z]) => P.maille(new THREE.CylinderGeometry(0.35, 0.45, 12, 9), 0x4a3e30, groupe, x - 0.5, 6, z));
    const pointCorde = (z) => { const u = Math.min(1, Math.max(0, (1 - z) / 12)); return new THREE.Vector3(-0.6 + u * 0.4, 1.15 - Math.sin(u * Math.PI) * 0.35, z); };

    // La chaîne : chacun dans l'eau, une main sur la corde
    const g = groupeDarien({
      wilmer: [-0.35, -7.4, Math.PI], mishel: [-0.4, -5.6, Math.PI], joseph: [-0.4, -4.2, Math.PI], valeria: [-0.45, -2.8, Math.PI],
      carolina: [-0.5, -1.6, Math.PI], aurelio: [1.6, 1.8, Math.PI, "accroupi"], angel: [2.2, 2.2, Math.PI, "accroupi"], guia_darien: [-0.3, -9.6, 0],
    });
    ["wilmer", "mishel", "joseph", "valeria", "carolina"].forEach((k) => (g[k].yExtra = -0.25));
    placerJoueur(0.8, 2.6, 0.0, -0.2, 1.2);
    A.reinitialiser();
    const sonPluie = A.pluie(0.8);
    const sonRiv = A.riviere(0, -5);
    let crue = 0, emportee = 0, rattrapee = false;
    majTableau = (dt) => {
      pluie.maj(dt);
      texE.offset.x -= dt * (0.25 + crue * 0.6);          // le courant (vers -x)
      eau.position.y = -0.25 + crue * 0.45;
      ["wilmer", "mishel", "joseph", "valeria", "carolina"].forEach((k) => {
        const p = g[k];
        p.yExtra = -0.25 - crue * 0.3 - (k === "mishel" ? emportee * 0.3 : 0);
        if (k === "mishel" && emportee > 0 && !rattrapee) { P.pointerBras(p, 0, g.joseph.tete.getWorldPosition(_m), 0.2); return; }
        P.pointerBras(p, 0, pointCorde(p.z), 0.2);
        if (k === "joseph" && emportee > 0) P.pointerBras(p, 1, g.mishel.haut.getWorldPosition(_m), 0.2);
      });
    };
    await fondu(false, 2);
    await carte("seq3");
    await attendre(1.5);
    // La crue monte d'un coup.
    sonRiv.monter(1.6, 4);
    const monter = (cible, d) => new Promise((r) => { const t0 = temps, c0 = crue; const f = () => { const u = Math.min(1, (temps - t0) / d); crue = c0 + (cible - c0) * u; if (u < 1) attendre(0.05).then(f); else r(); }; f(); });
    monter(0.6, 4);
    await dire("wilmerCorde", 0.3);
    monter(1, 3);
    // Mishel perd pied, le courant l'emporte.
    const t0 = temps; const glisser = () => { emportee = Math.min(1, (temps - t0) / 1.5); g.mishel.x = -0.4 - emportee * 1.4; g.mishel.cible = "accroupi"; if (emportee < 1) attendre(0.05).then(glisser); };
    glisser();
    await dire("mishelCourant", 0.1);
    await dire("josephRiviere", 0.4);
    // Il la ramène contre la corde.
    rattrapee = true;
    const t1 = temps; const ramener = () => { const u = Math.min(1, (temps - t1) / 2); g.mishel.x = -1.8 + u * 1.4; emportee = 1 - u; if (u < 1) attendre(0.05).then(ramener); else g.mishel.cible = "debout"; };
    ramener();
    await attendre(4);
    sonRiv.arreter(3); sonPluie.arreter(3);
    await fondu(true, 3);
  }

  // =====================================================================
  //  Séquence 4 : le péage humain
  // =====================================================================
  async function sequence4() {
    viderTableau(); ilotCourant = "seq4";
    solY = (x, z) => 0.15 * Math.sin(x * 0.4) * Math.cos(z * 0.35);
    jungle({ brume: 0.06 });
    const pluie = pluieVisible(700);
    // La table du barrage, sous une bâche noire, et les bracelets
    const bache = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide, roughness: 0.5 }));
    bache.position.set(1.4, 2.2, -3); bache.rotation.x = -Math.PI / 2 + 0.2; groupe.add(bache);
    [[0, -4], [2.8, -4], [0, -2], [2.8, -2]].forEach(([x, z]) => P.maille(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5), 0x4a3a2a, groupe, x, 1.15, z));
    boite(1.4, 0.05, 0.7, 0x6a5038, 1.45, 0.78, -2.7);
    [[0.8, -2.95], [2.1, -2.95], [0.8, -2.45], [2.1, -2.45]].forEach(([x, z]) => boite(0.05, 0.78, 0.05, 0x4a3628, x, 0.39, z));
    const bracelets = new THREE.Group(); bracelets.position.set(1.45, 0.82, -2.6); groupe.add(bracelets);
    [0xff3a6a, 0x3aff8a, 0xffe03a, 0x3ac8ff, 0xff3a6a, 0xffe03a].forEach((c, i) => {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
      b.rotation.x = Math.PI / 2; b.position.set(-0.2 + i * 0.08, 0, (i % 2) * 0.05); bracelets.add(b);
    });
    objet("bracelet_passage", bracelets, 1.45, 0.85, -2.6);
    const lampe = new THREE.PointLight(0xfff0c8, 3, 7, 1.4); lampe.position.set(1.4, 1.9, -2.8); groupe.add(lampe);
    emissif(new THREE.SphereGeometry(0.04, 6, 6), 0xfff0c8, 4, groupe, 1.4, 1.95, -2.8);

    const g = groupeDarien({
      arme: [1.5, -3.3, 0], arme2: [2.6, -2.0, -0.6],
      valeria: [0.2, -1.6, Math.PI * 0.85], aurelio: [-0.6, -0.8, Math.PI], joseph: [0.4, -0.2, Math.PI], angel: [0.9, 0.2, Math.PI],
      carolina: [1.2, 0.5, Math.PI], mishel: [-0.5, 0.6, Math.PI], wilmer: [-0.1, 1.3, Math.PI], guia_darien: [-1.4, -2.8, Math.PI * 0.7],
    });
    // Les fusils portés en bandoulière (jamais braqués)
    [g.arme, g.arme2].forEach((a) => { const f = boite(0.05, 0.75, 0.05, 0x111111, 0.05, 0.3, -0.16, a.haut); f.rotation.z = 0.6; });
    placerJoueur(-0.8, 2.6, -0.3, -0.12, 1.2);
    A.reinitialiser();
    const sonPluie = A.pluie(0.5);
    let montre = false;
    majTableau = (dt) => {
      pluie.maj(dt);
      if (montre) { g.aurelio.tete.getWorldPosition(_m); _m.y -= 0.35; _m.x += 0.3; P.pointerBras(g.aurelio, 1, _m, 0.6); }
    };
    tourner(g.arme, g.valeria.x, g.valeria.z);
    await fondu(false, 2);
    await carte("seq4");
    await dire("hommeArme1", 0.6);
    await marcheBoue(g.valeria, 0.9, -2.2, 0.6);
    tourner(g.valeria, g.arme.x, g.arme.z);
    await dire("valeriaPeage", 0.5);
    await dire("hommeArme2", 0.4);
    // L'autre homme prend la montre de Don Aurelio.
    tourner(g.arme2, g.aurelio.x, g.aurelio.z);
    await allerVers(g.arme2, g.aurelio.x + 0.7, g.aurelio.z - 0.1, 1);
    montre = true; tourner(g.aurelio, g.arme2.x, g.arme2.z);
    await attendre(2.2);
    montre = false;
    allerVers(g.arme2, 2.6, -2.0, 1);
    // Ils passent, tête basse.
    ["valeria", "aurelio", "joseph", "angel", "carolina", "mishel", "wilmer", "guia_darien"].forEach((k, i) =>
      attendre(i * 0.5).then(() => marcheBoue(g[k], -2.5 - i * 0.3, -9 - i * 0.8, 0.8)));
    await attendre(7);
    sonPluie.arreter(2);
    await fondu(true, 2.5);
  }

  // =====================================================================
  //  Le montage : la route vers le nord, en plans de cinéma
  //  (écran large, grain, contre-jours ; la caméra glisse lentement)
  // =====================================================================
  async function flashCarte(cle) {
    const l = C.lieux[cle];
    carteLieu.querySelector(".lieu").textContent = l.lieu;
    carteLieu.querySelector(".moment").textContent = l.moment;
    carteLieu.classList.add("visible", "flash");
    await attendre(3.4);
    carteLieu.classList.remove("visible");
  }
  // Coupe : un bref passage au noir entre deux plans.
  async function coupe() {
    voile.style.transition = "opacity 0.35s ease"; voile.style.background = "#000"; voile.style.opacity = "1";
    await attendre(0.4);
  }
  async function ouvrirPlan() {
    voile.style.transition = "opacity 0.9s ease"; voile.style.opacity = "0";
    await attendre(0.2);
  }
  function regard(x, z, lx, lz, h, t) { placerJoueur(x, z, Math.atan2(-(lx - x), -(lz - z)), t || 0, 0.01); joueur.yeux = h || 1.62; }
  // Des marcheurs anonymes, pour la foule
  const TEINTES = [0x8a3a3a, 0x3a5a8a, 0x5a7a3a, 0x8a7a3a, 0x4a4a5a, 0x7a4a6a, 0x3a6a6a, 0x9a6a3a];
  function anonyme(x, z, cap, cible) {
    const p = P.creer({ taille: 1.55 + alea() * 0.3, haut: TEINTES[Math.floor(alea() * 8)], bas: 0x2a2c34, peau: [0x8a6448, 0x6b4a36, 0x9c7254, 0x3b2618][Math.floor(alea() * 4)],
      cheveux: alea() < 0.4 ? "longs" : undefined, coiffe: alea() < 0.3 ? "casquette" : undefined, sac: alea() < 0.7 ? "grand" : "petit" });
    p.qui = "anonyme"; p.x = x; p.z = z; p.cap = cap; p.cible = cible || "debout"; p.pose = Object.assign({}, P.POSES[p.cible]);
    persos.push(p); return p;
  }

  // ---------- Outils de mise en image ----------
  // Ciel en dégradé (du zénith à l'horizon, puis sous l'horizon), sur une grande sphère.
  function ciel(arrets) {
    const cv = document.createElement("canvas"); cv.width = 4; cv.height = 512;
    const c = cv.getContext("2d"); const g = c.createLinearGradient(0, 0, 0, 512);
    arrets.forEach(([p, col]) => g.addColorStop(p, col)); c.fillStyle = g; c.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 24), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.renderOrder = -10; groupe.add(m); scene.background = null;
    return m;
  }
  function texteRadiale(interieur, exterieur) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const c = cv.getContext("2d"); const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, interieur); g.addColorStop(1, exterieur); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // Un astre (soleil ou lune) et son halo.
  function astre(x, y, z, couleur, rayon, halo) {
    emissif(new THREE.SphereGeometry(rayon, 24, 16), couleur, 2.6, groupe, x, y, z).material.fog = false;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texteRadiale("rgba(255,255,255,0.9)", "rgba(255,255,255,0)"), color: couleur, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.55 }));
    s.position.set(x, y, z); s.scale.setScalar(rayon * (halo || 14)); groupe.add(s);
    return s;
  }
  // Une lisière en silhouette (arbres, palmiers, montagnes) découpée dans une image.
  function textureLisiere(genre, graine) {
    const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 256;
    const c = cv.getContext("2d"); c.fillStyle = "#fff";
    let s = graine || 1; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    c.beginPath(); c.moveTo(0, 256);
    if (genre === "montagne") {
      const ph = r() * 6;
      for (let x = 0; x <= 2048; x += 8) c.lineTo(x, 130 + Math.sin(x * 0.0035 + ph) * 55 + Math.sin(x * 0.011 + ph * 2) * 18);
      c.lineTo(2048, 256); c.fill();
    } else {
      for (let x = 0; x <= 2048; x += 8) c.lineTo(x, 170 + Math.sin(x * 0.01) * 10 + r() * 8);
      c.lineTo(2048, 256); c.fill();
      // Houppiers ronds, et quelques palmiers ou arbres morts qui dépassent
      for (let i = 0; i < 160; i++) { const x = r() * 2048, rr = 14 + r() * 34; c.beginPath(); c.arc(x, 170 - r() * 40, rr, 0, 7); c.fill(); }
      const n = genre === "palmiers" ? 22 : 8;
      for (let i = 0; i < n; i++) {
        const x = r() * 2048, h = 60 + r() * 90;
        c.fillRect(x - 2, 160 - h, 4, h);
        for (let k = 0; k < 7; k++) { c.save(); c.translate(x, 160 - h); c.rotate(-Math.PI + k * 0.45 + r() * 0.2); c.beginPath(); c.ellipse(26, 0, 30, 5, 0, 0, 7); c.fill(); c.restore(); }
      }
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function lisiere(genre, z, largeur, hauteur, couleur, graine, x, y) {
    const t = textureLisiere(genre, graine); t.repeat.x = genre === "montagne" ? 1 : largeur / 120;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshBasicMaterial({ map: t, alphaMap: t, color: couleur, transparent: true, depthWrite: false }));
    m.position.set(x || 0, (y || 0) + hauteur / 2 - 0.5, z); groupe.add(m);
    return m;
  }
  // Nappe de brume : un voile transparent qui s'estompe sur les bords.
  function brume(x, y, z, l, h, couleur, opacite, ry) {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64;
    const c = cv.getContext("2d"); const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.55, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 256, 64);
    const gx = c.createLinearGradient(0, 0, 256, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.2, "rgba(0,0,0,0)"); gx.addColorStop(0.8, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)");
    c.globalCompositeOperation = "destination-out"; c.fillStyle = gx; c.fillRect(0, 0, 256, 64);
    const t = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshBasicMaterial({ map: t, color: couleur, transparent: true, opacity: opacite, depthWrite: false, fog: false }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; groupe.add(m); return m;
  }
  // Une eau calme qui reflète le ciel (sombre, lisse) et le chemin de lumière de l'astre.
  function eauCalme(couleur, largeur, profondeur, y) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, profondeur, 1, 1), new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.42, metalness: 0.1, map: textureEau() }));
    m.material.map.repeat.set(largeur / 10, profondeur / 10);
    m.rotation.x = -Math.PI / 2; m.position.y = y || 0; groupe.add(m); return m;
  }
  function refletAstre(x, z, couleur, longueur, largeur) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, longueur), new THREE.MeshBasicMaterial({ map: texteRadiale("rgba(255,255,255,0.85)", "rgba(255,255,255,0)"), color: couleur, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); groupe.add(m); return m;
  }
  // Poussière ou étoiles : des points.
  function points(n, f, couleur, taille, attenue) {
    const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set(f(i), i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ color: couleur, size: taille, sizeAttenuation: !!attenue, transparent: true, opacity: 0.9, depthWrite: false, fog: false, map: texteRadiale("rgba(255,255,255,1)", "rgba(255,255,255,0)"), blending: THREE.AdditiveBlending }));
    groupe.add(m); return m;
  }
  // Travelling : la caméra glisse de A vers B en regardant de L1 vers L2.
  const _cA = new THREE.Vector3(), _cL = new THREE.Vector3();
  function travelling(a, b, l1, l2, duree, t0) {
    return () => {
      let u = Math.min(1, (temps - t0) / duree); u = u * u * (3 - 2 * u);
      _cA.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
      _cL.set(l1[0] + (l2[0] - l1[0]) * u, l1[1] + (l2[1] - l1[1]) * u, l1[2] + (l2[2] - l1[2]) * u);
      camera.position.copy(_cA); camera.lookAt(_cL);
    };
  }
  function cinema(oui) { document.body.classList.toggle("cinema", oui); }

  async function montage() {
    const sons = [];
    const finFlash = () => { sons.forEach((x) => x && x.arreter && x.arreter(0.4)); sons.length = 0; };
    cinema(true);
    const DUREE = 4.8;

    // 1. Bajo Chiquito, à l'aube : la pirogue glisse dans la brume
    await coupe(); viderTableau(); ilotCourant = "montage"; solY = () => -0.4;
    ciel([[0, "#1e2a36"], [0.38, "#6f7f86"], [0.49, "#e9c9a0"], [0.5, "#f2d6ae"], [1, "#2a3230"]]);
    scene.fog = new THREE.Fog(0xb9b4a2, 6, 140); R.renderer.toneMappingExposure = 1.15;
    groupe.add(new THREE.HemisphereLight(0xd8d4c4, 0x2a2a20, 0.9));
    const d1 = new THREE.DirectionalLight(0xffd8a8, 0.9); d1.position.set(-40, 10, -100); groupe.add(d1);
    astre(-70, 9, -260, 0xffd29a, 5.5, 16);
    eauCalme(0x2c3634, 400, 400, -0.05);
    refletAstre(-22, -150, 0xffc890, 220, 5).material.opacity = 0.45;
    lisiere("jungle", -26, 300, 16, 0x111a14, 3, 0, -0.4);
    lisiere("palmiers", -55, 400, 22, 0x2a3430, 7, 0, -0.4);
    lisiere("jungle", -110, 600, 30, 0x4a5450, 11, 0, -0.4);
    for (let k = 0; k < 5; k++) brume(-20 + k * 9, 0.8 + (k % 3) * 0.6, -14 - k * 9, 90, 3 + k, 0xeadcc4, 0.22);
    const pirogue = new THREE.Group(); groupe.add(pirogue);
    boite(7.2, 0.4, 0.95, 0x1a1410, 0, 0.05, 0, pirogue);
    [-1, 1].forEach((c) => { const b = P.maille(new THREE.ConeGeometry(0.48, 1.1, 4), 0x1a1410, pirogue, c * 4.15, 0.08, 0); b.rotation.set(Math.PI / 4, 0, -c * Math.PI / 2); });
    const passagers = ["valeria", "joseph", "carolina", "angel", "mishel", "wilmer", "aurelio"].map((q, i) => { const p = personnage(q, 0, 0, Math.PI / 2, "chaise"); p.rang = i; return p; });
    const piroguier = anonyme(0, 0, Math.PI / 2, "debout");
    const perche = P.maille(new THREE.CylinderGeometry(0.02, 0.02, 4.2, 5), 0x1a1410, groupe, 0, 1.5, 0);
    sons.push(A.riviere(0, 0));
    let px = -9;
    const t1 = temps;
    const cam1 = travelling([1.6, 0.5, 5.6], [-1.0, 0.55, 5.0], [-3, 0.9, 0], [0.5, 0.95, 0], DUREE + 0.6, t1);
    majTableau = (dt) => {
      px += dt * 1.6; pirogue.position.set(px, -0.05 + Math.sin(temps * 1.3) * 0.02, 0);
      passagers.forEach((p) => { p.x = px + 2.6 - p.rang * 0.8; p.z = 0; p.yExtra = 0.05; });
      piroguier.x = px - 3.3; piroguier.z = 0; piroguier.yExtra = 0.2;
      perche.position.set(px - 3.0, 1.4, 0.3); perche.rotation.set(0.35, 0, -0.5 + Math.sin(temps * 1.2) * 0.15);
      cam1();
    };
    cam1(); await ouvrirPlan(); flashCarte("f1"); await attendre(DUREE); finFlash();

    // 2. Le car de nuit : les lumières de la route passent sur les visages endormis
    await coupe(); viderTableau(); solY = () => 0;
    scene.background = new THREE.Color(0x020306); scene.fog = null; R.renderer.toneMappingExposure = 1.4;
    groupe.add(new THREE.HemisphereLight(0x2c3a58, 0x08080a, 0.6));
    boite(2.6, 0.05, 12, 0x14151a, 0, 0, -3); boite(2.6, 0.05, 12, 0x1a1c22, 0, 2.3, -3);
    [-1.3, 1.3].forEach((x) => { boite(0.05, 0.85, 12, 0x22242a, x, 0.42, -3); boite(0.05, 0.45, 12, 0x22242a, x, 2.08, -3);
      for (let k = 0; k < 7; k++) boite(0.07, 1.0, 0.12, 0x2a2c32, x, 1.35, -8.4 + k * 1.6); });
    const vitre = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.0), new THREE.MeshStandardMaterial({ color: 0x0a1220, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.6 }));
    vitre.position.set(-1.29, 1.35, -3); vitre.rotation.y = Math.PI / 2; groupe.add(vitre);
    const vitre2 = vitre.clone(); vitre2.position.x = 1.29; vitre2.rotation.y = -Math.PI / 2; groupe.add(vitre2);
    for (let r = 0; r < 6; r++) [-0.75, 0.75].forEach((x) => { boite(0.8, 0.45, 0.5, 0x2a1e22, x, 0.45, -7 + r * 1.6); boite(0.8, 0.42, 0.12, 0x2a1e22, x, 0.86, -6.72 + r * 1.6); });
    const voyageurs = [["valeria", -0.75, -2.2, "chaise"], ["joseph", -0.75, -3.8, "dort"], ["carolina", 0.75, -3.8, "dort"], ["angel", 0.55, -3.8, "dort"], ["mishel", 0.75, -2.2, "dort"], ["wilmer", 0.75, -5.4, "chaise"], ["aurelio", -0.75, -5.4, "dort"]]
      .map(([q, x, z, pose]) => personnage(q, x, z, Math.PI, pose));
    voyageurs[0].capVise = Math.PI - 0.9; // Valeria regarde par la fenêtre
    const lueur = new THREE.DirectionalLight(0x5a78b0, 0.7); lueur.position.set(-6, 3, -2); groupe.add(lueur); // la nuit, par la vitre
    // Les veilleuses bleues du plafond, et leur petite ligne lumineuse
    [-1.5, -4.5, -7.5].forEach((z) => { const v = new THREE.PointLight(0x7a94d0, 2.2, 4.5, 1.6); v.position.set(0, 2.1, z); groupe.add(v); emissif(new THREE.BoxGeometry(0.5, 0.02, 0.05), 0x8aa4e0, 2, groupe, 0, 2.27, z); });
    // Les lumières de la route, floues, derrière la vitre
    const bokeh = points(110, () => [(Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 30), 0.5 + Math.random() * 3, -40 + Math.random() * 60], 0xffb060, 30, false);
    const sodium = new THREE.PointLight(0xff9a40, 0, 7, 1.4); groupe.add(sodium);
    A.voiture(0, -1); sons.push({ arreter: () => A.voitureFin() });
    const t2 = temps;
    const cam2 = travelling([0.1, 1.62, 0.3], [0.05, 1.6, -0.5], [-0.25, 1.0, -8], [-0.1, 1.0, -8], DUREE + 0.6, t2);
    majTableau = (dt) => {
      const a = bokeh.geometry.attributes.position.array;
      for (let i = 0; i < 110; i++) { a[i * 3 + 2] += dt * 26; if (a[i * 3 + 2] > 20) a[i * 3 + 2] -= 60; }
      bokeh.geometry.attributes.position.needsUpdate = true;
      const cyc = (temps * 0.9) % 1;                           // un lampadaire toutes les ~1,1 s
      sodium.position.set(cyc < 0.5 ? -2.2 : 2.2, 2.4, 3 - cyc * 12); sodium.intensity = 14 * Math.pow(Math.sin(cyc * Math.PI), 2);
      voyageurs.forEach((p, i) => { p.tete.rotation.z = Math.sin(temps * 2.6 + i) * 0.04; });
      cam2();
    };
    cam2(); await ouvrirPlan(); flashCarte("f2"); await attendre(DUREE); finFlash();

    // 3. Río Suchiate : le radeau de chambres à air, sous le pont, dans la chaleur
    await coupe(); viderTableau(); solY = () => -0.3;
    ciel([[0, "#8a8f8a"], [0.42, "#d9cba8"], [0.5, "#f1e4c4"], [1, "#6a5a40"]]);
    scene.fog = new THREE.Fog(0xd8c9a6, 10, 170); R.renderer.toneMappingExposure = 1.1;
    groupe.add(new THREE.HemisphereLight(0xfff0d8, 0x5a4a30, 1.2)); soleil(0xfff0d0, 2.0, [-20, 40, -30], 14);
    astre(40, 60, -300, 0xfff2d6, 9, 18);
    eauCalme(0x6a5838, 400, 400, -0.1);
    refletAstre(14, -170, 0xfff0d0, 240, 7).material.opacity = 0.4;
    lisiere("palmiers", -38, 300, 14, 0x3a3a28, 5, 0, -0.3);
    lisiere("montagne", -160, 700, 60, 0x9a9a8a, 9, 0, -0.3);
    // Le pont frontalier, au loin, avec ses piles
    boite(140, 1.2, 6, 0x6a665c, 0, 8, -60); boite(140, 1.4, 0.3, 0x6a665c, 0, 9.2, -57.2);
    for (let k = -3; k <= 3; k++) boite(2.4, 9, 3, 0x5e5a50, k * 20, 3.5, -60);
    for (let k = 0; k < 14; k++) emissif(new THREE.SphereGeometry(0.15, 6, 6), 0xffe0a0, 2, groupe, -65 + k * 10, 10.4, -57.2);
    for (let k = 0; k < 4; k++) brume(-30 + k * 20, 1.5, -20 - k * 8, 90, 5, 0xf0e0c0, 0.35);
    const radeau = new THREE.Group(); groupe.add(radeau);
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => P.maille(new THREE.TorusGeometry(0.45, 0.18, 10, 20), 0x141414, radeau, x, 0, z).rotation.x = Math.PI / 2);
    boite(2.4, 0.06, 2.4, 0x7a5a36, 0, 0.18, 0, radeau);
    const surRadeau = [personnage("valeria", 0, 0, -Math.PI / 2, "debout"), personnage("joseph", 0, 0, -Math.PI / 2, "debout"), anonyme(0, 0, -Math.PI / 2, "debout")];
    const perche3 = P.maille(new THREE.CylinderGeometry(0.02, 0.02, 3.6, 5), 0x2a2018, groupe, 0, 1.4, 0);
    // Un second radeau, chargé de marchandises, plus loin
    const radeau2 = new THREE.Group(); groupe.add(radeau2);
    [[-0.6, 0], [0.6, 0]].forEach(([x, z]) => P.maille(new THREE.TorusGeometry(0.4, 0.16, 8, 16), 0x141414, radeau2, x, 0, z).rotation.x = Math.PI / 2);
    for (let k = 0; k < 5; k++) boite(0.4, 0.3, 0.4, [0xc8b890, 0x8a6a4a, 0xd8d0c0][k % 3], -0.6 + k * 0.3, 0.35 + (k % 2) * 0.3, 0, radeau2);
    radeau2.position.set(-18, -0.15, -22);
    sons.push(A.riviere(0, 0));
    let rx = 6;
    const t3 = temps;
    const cam3 = travelling([-6.5, 0.6, 5.5], [-5.5, 0.7, 4.8], [2, 1.4, 0], [-0.5, 1.6, -4], DUREE + 0.6, t3);
    majTableau = (dt) => {
      rx -= dt * 1.1; radeau.position.set(rx, -0.12 + Math.sin(temps * 1.6) * 0.03, 0); radeau.rotation.y = Math.sin(temps * 0.4) * 0.08;
      surRadeau.forEach((p, i) => { p.x = rx - 0.5 + i * 0.5; p.z = (i - 1) * 0.6; p.yExtra = 0.5; });
      perche3.position.set(rx + 0.6, 1.3, 0.7); perche3.rotation.set(0.2, 0, 0.45 + Math.sin(temps * 1.5) * 0.18);
      radeau2.position.x += dt * 0.5;
      cam3();
    };
    cam3(); await ouvrirPlan(); flashCarte("f3"); await attendre(DUREE); finFlash();

    // 4. Chiapas, au couchant : la caravane marche vers le soleil
    await coupe(); viderTableau(); solY = () => 0;
    ciel([[0, "#34506e"], [0.3, "#c98f6a"], [0.46, "#f6b878"], [0.5, "#ffd9a0"], [0.52, "#8a5a3a"], [1, "#3a2a1e"]]);
    scene.fog = new THREE.Fog(0xe8a878, 20, 260); R.renderer.toneMappingExposure = 1.15;
    groupe.add(new THREE.HemisphereLight(0xffc89a, 0x3a2a20, 0.8));
    const d4 = new THREE.DirectionalLight(0xffb070, 2.4); d4.position.set(4, 8, -60);
    if (R.haute) { d4.castShadow = true; d4.shadow.mapSize.set(2048, 2048); const o4 = d4.shadow.camera; o4.left = o4.bottom = -20; o4.right = o4.top = 20; o4.near = 1; o4.far = 120; }
    groupe.add(d4, d4.target); d4.target.position.set(0, 0, 0);
    astre(2, 7, -330, 0xffc07a, 10, 20);
    boite(9, 0.05, 400, 0x2a2624, 3, 0, -150); boite(60, 0.04, 400, 0x7a6040, -30, -0.01, -150); boite(60, 0.04, 400, 0x7a6040, 37.5, -0.01, -150);
    for (let k = 0; k < 70; k++) boite(0.14, 0.02, 2, 0xd8c8a0, 3, 0.03, 20 - k * 6);
    lisiere("montagne", -200, 800, 70, 0x6a4a4a, 4, 0, 0);
    lisiere("montagne", -280, 900, 110, 0xa07070, 8, 0, 0);
    lisiere("palmiers", -90, 400, 12, 0x2a1a14, 13, 0, 0);
    // Poteaux et fils, le long de la route
    for (let k = 0; k < 18; k++) { const z = 10 - k * 14; P.maille(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), 0x1a1210, groupe, 8.5, 3.5, z); boite(1.6, 0.08, 0.08, 0x1a1210, 8.5, 6.6, z); }
    for (const dx of [-0.7, 0.7]) { const g = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 19 }, (_, k) => new THREE.Vector3(8.5 + dx, 6.55 - 0.12 * Math.sin(k * 3.1), 10 - k * 14))); groupe.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x1a1210 }))); }
    const marcheurs = ["valeria", "joseph", "carolina", "mishel", "wilmer", "aurelio"].map((q, i) => personnage(q, -0.8 - (i % 2) * 0.9, -1 - i * 1.5, Math.PI, "marche"));
    for (let i = 0; i < 26; i++) marcheurs.push(anonyme(-0.3 - alea() * 3.4, -9 - i * 2.4 - alea() * 1.5, Math.PI, "marche"));
    const poussiere = points(220, () => [-6 + Math.random() * 14, Math.random() * 3, -30 + Math.random() * 40], 0xffd0a0, 0.06, true);
    const camion = new THREE.Group(); groupe.add(camion);
    boite(2.4, 2.6, 7, 0xb8b0a0, 0, 1.6, 0, camion); boite(2.4, 1.8, 2, 0x8a2a2a, 0, 1.2, 4.4, camion);
    [-0.8, 0.8].forEach((x) => { emissif(new THREE.SphereGeometry(0.14, 8, 8), 0xfff0d0, 4, camion, x, 0.9, 5.42); });
    const phare = new THREE.SpotLight(0xfff0d0, 0, 60, 0.35, 0.5, 1); camion.add(phare); phare.position.set(0, 1, 5.5); phare.target.position.set(0, 0, 30); camion.add(phare.target);
    sons.push(A.moto(4, -60));
    const t4 = temps;
    const cam4 = travelling([1.6, 0.9, 6], [1.0, 1.1, 2.5], [-1.5, 1.6, -20], [-1.2, 1.8, -30], DUREE + 0.6, t4);
    majTableau = (dt) => {
      marcheurs.forEach((p) => { p.z -= dt * 1.05; p.vitesse = 1.05; p.cap = Math.PI; });
      const a = poussiere.geometry.attributes.position.array;
      for (let i = 0; i < 220; i++) { a[i * 3] += dt * 0.15; a[i * 3 + 1] += Math.sin(temps + i) * dt * 0.05; }
      poussiere.geometry.attributes.position.needsUpdate = true;
      camion.position.set(5.2, 0, -120 + ((temps - t4) * 18) % 160); phare.intensity = 30;
      if (sons[0]) { sons[0].position(5.2, camion.position.z); sons[0].regime(0.8); }
      cam4();
    };
    cam4(); await ouvrirPlan(); flashCarte("f4"); await attendre(DUREE); finFlash();

    // 5. Sur le toit du train, sous la lune : les routes se rejoignent
    await coupe(); viderTableau(); solY = () => 0;
    ciel([[0, "#03050c"], [0.35, "#0b1428"], [0.49, "#2a3a5a"], [0.5, "#3a4a66"], [1, "#05060a"]]);
    scene.fog = new THREE.FogExp2(0x0e1628, 0.012); R.renderer.toneMappingExposure = 1.6;
    groupe.add(new THREE.HemisphereLight(0x3c4d78, 0x0a0a0c, 1.2));
    const lune5 = new THREE.DirectionalLight(0xa8bce8, 1.6); lune5.position.set(-30, 25, 40); groupe.add(lune5);
    astre(-120, 90, 260, 0xe8ecff, 7, 12);
    points(1600, () => { const a = Math.random() * 6.28, v = Math.acos(Math.random() * 0.9); return [Math.sin(v) * Math.cos(a) * 500, 30 + Math.cos(v) * 500, Math.sin(v) * Math.sin(a) * 500]; }, 0xd8e0ff, 2.2, false);
    const sol5 = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x2a2a26, roughness: 1 })); sol5.rotation.x = -Math.PI / 2; groupe.add(sol5);
    // Les wagons : caisses, nervures, passerelle sur le toit
    for (let k = 0; k < 6; k++) {
      const z = -k * 15;
      boite(3, 3.2, 14, 0x3a2420, 0, 2.5, z); boite(3.1, 0.12, 14.1, 0x2a1a16, 0, 4.16, z);
      for (let n = 0; n < 10; n++) { boite(0.06, 3.2, 0.1, 0x2a1a16, 1.53, 2.5, z - 6.5 + n * 1.45); boite(0.06, 3.2, 0.1, 0x2a1a16, -1.53, 2.5, z - 6.5 + n * 1.45); }
      boite(0.6, 0.05, 14, 0x4a4038, 0, 4.25, z);
    }
    const toit = 4.2;
    const surToit = [["rosa", -0.7, -1.0], ["mateo", -0.7, -1.6], ["yesenia", 0.7, -2.8], ["julio", -0.7, -3.8], ["ernesto", 0.7, -4.6], ["valeria", 0.7, -0.2], ["joseph", -0.65, 0.8]]
      .map(([q, x, z]) => { const p = personnage(q, x, z, Math.PI, "assis"); p.yExtra = toit; return p; });
    surToit[1].cible = "dort";
    for (let i = 0; i < 6; i++) { const p = anonyme((i % 2 ? 0.7 : -0.7), -8 - i * 2.2, Math.PI, i % 3 ? "assis" : "dort"); p.yExtra = toit; }
    // Le paysage défile : arbres en silhouette, poteaux
    const defile = [];
    for (let i = 0; i < 26; i++) { const cote = i % 2 ? 1 : -1; const h = 5 + alea() * 7; const m = P.maille(new THREE.ConeGeometry(1.6 + alea() * 1.6, h, 7), 0x0a0e0c, groupe, cote * (9 + alea() * 30), h / 2, -80 + i * 6); defile.push(m); }
    for (let i = 0; i < 8; i++) defile.push(P.maille(new THREE.CylinderGeometry(0.08, 0.1, 7, 5), 0x0a0a0a, groupe, 6, 3.5, -80 + i * 20));
    const roulement = () => { if (ilotCourant !== "montage-train") return; A.pas(0.6); setTimeout(() => A.pas(0.5), 140); setTimeout(roulement, 900); };
    ilotCourant = "montage-train"; roulement();
    sons.push(A.ventSec());
    const t5 = temps;
    const cam5 = travelling([0.05, toit + 1.35, 3.2], [0.1, toit + 1.25, 2.2], [0, toit + 0.5, -6], [0, toit + 0.6, -8], DUREE + 1.6, t5);
    majTableau = (dt) => {
      defile.forEach((m) => { m.position.z += dt * 16; if (m.position.z > 40) m.position.z -= 120; });
      surToit.forEach((p, i) => { p.racine.position.y += Math.sin(temps * 8 + i) * 0.008; });
      cam5(); camera.position.y += Math.sin(temps * 9) * 0.01;
    };
    cam5(); await ouvrirPlan(); flashCarte("f5"); await attendre(DUREE + 1); finFlash(); ilotCourant = "montage";

    // 6. Le mur, dans la lumière crue des projecteurs américains : Joseph monte à l'échelle
    await coupe(); viderTableau(); solY = () => 0;
    ciel([[0, "#02030a"], [0.45, "#0e1426"], [0.5, "#2a3048"], [1, "#05060a"]]);
    scene.fog = new THREE.FogExp2(0x1a2030, 0.03); R.renderer.toneMappingExposure = 1.6;
    groupe.add(new THREE.HemisphereLight(0x2c3b5e, 0x15110d, 0.9));
    boite(120, 0.05, 60, 0x6c6458, 0, -0.02, 0);
    const barreaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 5.6, 0.14), P.mat(0x1a1816), 220);
    const o = new THREE.Object3D();
    for (let i = 0; i < 220; i++) { o.position.set(-40 + i * 0.36, 2.8, -3); o.updateMatrix(); barreaux.setMatrixAt(i, o.matrix); }
    groupe.add(barreaux);
    // Les projecteurs de l'autre côté : halos, et la poussière dans leurs faisceaux
    [-14, 0, 16].forEach((x) => {
      P.maille(new THREE.CylinderGeometry(0.1, 0.12, 9, 6), 0x0a0a0a, groupe, x, 4.5, -9);
      emissif(new THREE.BoxGeometry(0.8, 0.4, 0.2), 0xffffff, 6, groupe, x, 9, -8.9);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texteRadiale("rgba(255,255,255,0.9)", "rgba(255,255,255,0)"), color: 0xdfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      s.position.set(x, 9, -8.8); s.scale.setScalar(9); groupe.add(s);
      const l = new THREE.PointLight(0xdfe8ff, 40, 30, 1.6); l.position.set(x, 8.5, -8); groupe.add(l);
    });
    points(300, () => [-12 + Math.random() * 24, Math.random() * 8, -8 + Math.random() * 4], 0xdfe8ff, 0.05, true);
    [-0.22, 0.22].forEach((x) => boite(0.05, 5.6, 0.05, 0x1a1816, x, 2.8, -2.4));
    for (let y = 0.3; y < 5.4; y += 0.32) boite(0.44, 0.03, 0.03, 0x1a1816, 0, y, -2.4);
    const grimpeur = personnage("joseph", 0, -2.1, Math.PI, "grimpe");
    const t6 = temps;
    const cam6 = travelling([2.4, 1.2, 2.8], [1.6, 1.5, 2.2], [0, 2.2, -2.4], [0, 3.4, -2.4], DUREE, t6);
    majTableau = (dt) => { grimpeur.yExtra = Math.min(4.6, grimpeur.yExtra + dt * 1.0); grimpeur.barreau = grimpeur.yExtra / 0.32; cam6(); };
    cam6(); await ouvrirPlan(); flashCarte("f6"); await attendre(DUREE - 0.8); finFlash();
    cinema(false);
  }

  // =====================================================================
  //  Séquence 5 : la dernière crête → le désert (raccord avec le chapitre 1)
  // =====================================================================
  function textureSableNuit() {
    const T = 256, cv = document.createElement("canvas"); cv.width = cv.height = T;
    const c = cv.getContext("2d"); const img = c.createImageData(T, T), d = img.data;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const v = y / T * Math.PI * 2, u = x / T * Math.PI * 2;
      const val = 170 + Math.sin(v * 9 + Math.sin(u * 2) * 2.4) * 14 + (Math.random() - 0.5) * 30;
      const i = (y * T + x) * 4; d[i] = val; d[i + 1] = val * 0.97; d[i + 2] = val * 0.9; d[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 60); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function creerFaisceau(couleur, opacite) {
    const geo = new THREE.ConeGeometry(1, 1, 24, 1, true); geo.translate(0, -0.5, 0);
    const f = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    groupe.add(f); return f;
  }
  const _Y = new THREE.Vector3(0, -1, 0), _dirF = new THREE.Vector3();
  function orienter(f, de, vers, angle) {
    _dirF.subVectors(vers, de); const l = _dirF.length();
    f.position.copy(de); f.quaternion.setFromUnitVectors(_Y, _dirF.normalize()); const r = Math.tan(angle) * l; f.scale.set(r, l, r);
  }

  async function sequence5() {
    viderTableau(); ilotCourant = "seq5";
    // Une pente raide qui monte vers -z
    solY = (x, z) => Math.max(0, -z) * 0.32 + 0.15 * Math.sin(x * 0.6) + Math.abs(x) * 0.08;
    const j = jungle({ brume: 0.09 });
    const pluie = pluieVisible(1500);
    const g = groupeDarien({
      guia_darien: [0.2, -6.0, Math.PI], wilmer: [-0.4, -4.6], valeria: [0.5, -3.4], joseph: [-0.3, -2.2], angel: [-0.3, -2.2],
      carolina: [0.6, -1.0], mishel: [-0.5, 0.2], aurelio: [0.4, 1.2],
    });
    Object.values(g).forEach((p) => { p.yExtra = -0.08; if (p !== g.angel) p.cible = "marche"; });
    porterSurEpaules(g.joseph, g.angel);
    placerJoueur(0, 3.4, 0.0, 0.12, 1.5);
    A.reinitialiser();
    const sonPluie = A.pluie(1.1);
    let suivre = true;
    majTableau = (dt) => { pluie.maj(dt); majPorte(g.angel); if (suivre) { limite.x = g.aurelio.x - 0.3; limite.z = g.aurelio.z + 2.2; } };
    limite.r = 1.6;
    Object.values(g).forEach((p) => { if (p !== g.angel) { p.capVise = Math.PI; } });

    await fondu(false, 2);
    await carte("seq5");
    // Ils montent, penchés en avant, à bout de souffle.
    Object.values(g).forEach((p) => { if (p !== g.angel) allerVers(p, p.x, p.z - 7, 0.42); });
    await attendre(3);
    await dire("guideSommet", 1);
    // Le brouillard devient blanc et épais : on ne voit plus rien.
    const fogBlanc = new THREE.Color(0xe8ece8);
    const t0 = temps; const blanchir = () => {
      const u = Math.min(1, (temps - t0) / 2.5);
      scene.fog.density = 0.09 + u * 0.4; scene.fog.color.lerpColors(new THREE.Color(0x0b1a12), fogBlanc, u); scene.background.copy(scene.fog.color);
      j.ciel.intensity = 0.9 + u * 2; pluie.mesh.material.opacity = 0.35 * (1 - u);
      if (u < 1) attendre(0.05).then(blanchir);
    };
    blanchir();
    await attendre(2.7);
    // La pluie s'arrête net. Dans le blanc, la voix d'un enfant.
    sonPluie.couper();
    suivre = false;
    await attendre(0.8);
    // Puis la route vers le nord, en flashs.
    await montage();
    await coupe(); viderTableau(); ilotCourant = "seq5-desert";
    scene.background = new THREE.Color(0x070a14); scene.fog = new THREE.FogExp2(0x070a14, 0.2);

    // Le brouillard s'ouvre sur la nuit du désert de Sonora.
    solY = (x, z) => 0.4 * Math.sin(x * 0.05) * Math.cos(z * 0.04);
    R.renderer.toneMappingExposure = 1.8;
    groupe.add(new THREE.HemisphereLight(0x2c3b5e, 0x15110d, 1.5));
    const lune = new THREE.DirectionalLight(0x9db0e0, 1.5); lune.position.set(80, 50, -90); groupe.add(lune);
    const appoint = new THREE.DirectionalLight(0x6a7aa8, 0.9); appoint.position.set(-50, 40, 70); groupe.add(appoint);
    const tex = textureSableNuit();
    const sable = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, color: 0xa39785, roughness: 0.95 }));
    groupe.add(sable);
    const nb = 1800, et = new Float32Array(nb * 3);
    for (let i = 0; i < nb; i++) { const a = Math.random() * 6.28, v = Math.acos(Math.random() * 0.95); et.set([Math.sin(v) * Math.cos(a) * 700, Math.cos(v) * 700, Math.sin(v) * Math.sin(a) * 700], i * 3); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute("position", new THREE.BufferAttribute(et, 3));
    groupe.add(new THREE.Points(ge, new THREE.PointsMaterial({ color: 0xc8d2ff, size: 1.6, sizeAttenuation: false, fog: false })));
    emissif(new THREE.SphereGeometry(16, 20, 14), 0xe8e4d4, 1.6, groupe, 320, 200, -380).material.fog = false;
    const nl = 300, pl = new Float32Array(nl * 3);
    for (let i = 0; i < nl; i++) pl.set([(Math.random() - 0.5) * 260, 3 + Math.random() * Math.random() * 12, -700 - Math.random() * 80], i * 3);
    const gl = new THREE.BufferGeometry(); gl.setAttribute("position", new THREE.BufferAttribute(pl, 3));
    groupe.add(new THREE.Points(gl, new THREE.PointsMaterial({ color: Rendu.lumineux(0xffb36b, 2), size: 2.2, sizeAttenuation: false, fog: false })));
    for (let i = 0; i < 14; i++) { const x = (Math.random() - 0.5) * 80, z = -10 - Math.random() * 70, h = 4 + Math.random() * 5; P.maille(new THREE.CylinderGeometry(0.3, 0.36, h, 8), 0x26302a, groupe, x, h / 2, z); }

    // Tout le groupe, enfin réuni : ceux du sud et ceux du nord.
    const d = groupeDarien({
      guia: [0.3, -5.5], julio: [-1.0, -4.4], yesenia: [1.2, -4.0], rosa: [-0.2, -3.0], mateo: [-1.1, -3.0],
      ernesto: [1.0, -2.2], valeria: [-1.6, -1.8], joseph: [0.4, -1.0],
    });
    Object.values(d).forEach((p) => { p.cible = "debout"; p.capVise = Math.PI; p.cap = Math.PI; });
    placerJoueur(0.2, 1.6, 0.0, 0.0, 1.0);
    // La nuit se découvre : le groupe face aux lumières de la ville.
    const t1 = temps; const dissiper = () => {
      const u = Math.min(1, (temps - t1) / 3);
      scene.fog.density = 0.2 * (1 - u) + 0.018 * u;
      if (u < 1) attendre(0.05).then(dissiper);
    };
    dissiper();
    await ouvrirPlan(); flashCarte("desert");
    await attendre(3.2);
    await dire("mateoTransition", 1.2);
    // Le projecteur de l'hélicoptère s'allume en plein visage.
    A.helicoptere(); A.coeur(true); A.setPeur(1);
    const heli = new THREE.Group(); heli.position.set(6, 24, -14); groupe.add(heli);
    P.maille(new THREE.SphereGeometry(1.5, 12, 8), 0x1a1c1e, heli).scale.set(1, 0.8, 1.6);
    const feu = emissif(new THREE.SphereGeometry(0.18, 6, 6), 0xff2020, 4, heli, 0, -1.1, 0);
    const spot = new THREE.SpotLight(0xeef2ff, 6, 120, 0.22, 0.4, 0); groupe.add(spot, spot.target);
    const faisceau = creerFaisceau(0xdfe6ff, 0.07);
    A.positionHelico(6, 24, -14);
    const pick = new THREE.Group(); pick.position.set(40, 0, -10); groupe.add(pick);
    boite(2.1, 1, 5.2, 0xcfd0c8, 0, 0.9, 0, pick); boite(2, 0.9, 2.2, 0xcfd0c8, 0, 1.8, 0.6, pick);
    const rouge = emissif(new THREE.BoxGeometry(0.6, 0.15, 0.3), 0xff1010, 4, pick, -0.4, 2.33, 0.6);
    const bleu = emissif(new THREE.BoxGeometry(0.6, 0.15, 0.3), 0x1030ff, 5, pick, 0.4, 2.33, 0.6);
    pick.rotation.y = -Math.PI / 2;
    majTableau = (dt) => {
      heli.position.x = 6 - Math.min(1, (temps - t1 - 8) / 8) * 5 + Math.sin(temps * 0.5) * 1.5;
      feu.visible = Math.floor(temps * 1.5) % 2 === 0;
      spot.position.copy(heli.position); spot.position.y -= 1.2;
      spot.target.position.set(Math.sin(temps * 0.7) * 1.5, 0, -3.2 + Math.cos(temps * 0.5)); // sur le groupe couché, juste devant
      orienter(faisceau, spot.position, spot.target.position, 0.22);
      A.positionHelico(heli.position.x, heli.position.y, heli.position.z);
      pick.position.x = Math.max(14, pick.position.x - dt * 6);
      const c = Math.floor(temps * 4) % 2; rouge.visible = c === 0; bleu.visible = c === 1;
    };
    await dire("alerteDesert", 0.2);
    Object.values(d).forEach((p) => (p.cible = "couche"));
    joueur.yeux = 0.9;
    await dire("rosaCriFinal", 0.4);
    await attendre(1.5);
    await dire("agentFinal", 0.8);
    // L'éblouissement… puis le noir.
    voile.style.transition = "opacity 1.5s ease"; voile.style.background = "#fff"; voile.style.opacity = "1";
    await attendre(1.8);
    A.toutCouper(2);
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
    R.detruire();
    if (onFin) onFin();
  }

  return {
    lancer,
    _etat: () => ({ ilot: ilotCourant, temps, t: temps - debutIlot, brume: scene && scene.fog ? [scene.fog.density, scene.fog.color.getHexString(), scene.background && scene.background.getHexString ? scene.background.getHexString() : "ciel"] : null, joueur: { x: joueur.x, z: joueur.z }, objets: objets.map((o) => o.id), persos: persos.map((p) => [p.qui, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, p.cible]), qualite: R && R.etat() }),
    _placer: (x, z, l, t) => { joueur.x = x; joueur.z = z; K.etat.lacet = l; K.etat.tangage = t || 0; limite.r = 99; },
    _action: action,
  };
})();
