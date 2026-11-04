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
  //  Le montage : la route vers le nord, en flashs rapides
  // =====================================================================
  async function flashCarte(cle) {
    const l = C.lieux[cle];
    carteLieu.querySelector(".lieu").textContent = l.lieu;
    carteLieu.querySelector(".moment").textContent = l.moment;
    carteLieu.classList.add("visible", "flash");
    await attendre(2.4);
    carteLieu.classList.remove("visible");
  }
  // Coupe franche : un éclair blanc entre deux flashs.
  async function coupe() {
    voile.style.transition = "opacity 0.15s ease"; voile.style.background = "#fff"; voile.style.opacity = "0.85";
    await attendre(0.18);
    voile.style.transition = "opacity 0.5s ease"; voile.style.opacity = "0";
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

  async function montage() {
    const sons = [];
    const finFlash = () => { sons.forEach((x) => x && x.arreter && x.arreter(0.4)); sons.length = 0; };

    // 1. Bajo Chiquito : la pirogue sur la rivière
    viderTableau(); ilotCourant = "montage"; solY = (x, z) => (Math.abs(z) < 4 ? -0.5 : 0.2);
    scene.background = new THREE.Color(0x8aa08a); scene.fog = new THREE.Fog(0x8aa08a, 15, 70); R.renderer.toneMappingExposure = 1.2;
    groupe.add(new THREE.HemisphereLight(0xd8e0d0, 0x3a3020, 1.4)); soleil(0xfff0d8, 1.5, [10, 30, 10], 14);
    const eau = new THREE.Mesh(new THREE.PlaneGeometry(120, 8), new THREE.MeshStandardMaterial({ map: textureEau(), color: 0x8a9a6a, roughness: 0.2 })); eau.rotation.x = -Math.PI / 2; eau.position.y = -0.3; groupe.add(eau);
    boite(120, 0.6, 30, 0x3a5a2a, 0, 0, -19); boite(120, 0.6, 30, 0x3a5a2a, 0, 0, 19);
    for (let i = 0; i < 30; i++) P.maille(new THREE.ConeGeometry(2 + alea() * 2, 8 + alea() * 6, 7), 0x2a4a22, groupe, -60 + i * 4 + alea() * 2, 5, (i % 2 ? -1 : 1) * (6 + alea() * 6));
    const pirogue = new THREE.Group(); groupe.add(pirogue);
    boite(7, 0.45, 1.1, 0x6a4a2a, 0, -0.1, 0, pirogue);
    const passagers = ["valeria", "joseph", "carolina", "angel", "mishel", "wilmer", "aurelio"].map((q, i) => { const p = personnage(q, 0, 0, Math.PI / 2, "chaise"); p.rang = i; return p; });
    const piroguier = anonyme(0, 0, Math.PI / 2, "debout");
    regard(-2.5, 6, -3.5, 0, 1.4, -0.05);
    sons.push(A.riviere(0, 0));
    let px = -7;
    majTableau = (dt) => {
      px += dt * 2.2; pirogue.position.set(px, 0, 0);
      passagers.forEach((p) => { p.x = px + 2.5 - p.rang * 0.75; p.z = 0; p.yExtra = -0.35; });
      piroguier.x = px - 3.2; piroguier.z = 0; piroguier.yExtra = -0.1;
    };
    await coupe(); flashCarte("f1"); await attendre(4.2); finFlash();

    // 2. Le car de nuit
    viderTableau(); solY = () => 0;
    scene.background = new THREE.Color(0x05060a); scene.fog = null; R.renderer.toneMappingExposure = 1.5;
    groupe.add(new THREE.HemisphereLight(0x303848, 0x101010, 0.5));
    boite(2.6, 0.05, 10, 0x2a2a2a, 0, 0, -3); boite(2.6, 0.05, 10, 0x3a3a40, 0, 2.3, -3);
    [-1.3, 1.3].forEach((x) => { boite(0.05, 0.8, 10, 0x4a4a50, x, 0.4, -3); boite(0.05, 0.4, 10, 0x4a4a50, x, 2.1, -3);
      for (let k = 0; k < 6; k++) emissif(new THREE.PlaneGeometry(1.4, 0.9), 0x101828, 1, groupe, x * 0.99, 1.35, -7 + k * 1.6).rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; });
    for (let r = 0; r < 6; r++) [-0.75, 0.75].forEach((x) => { boite(0.8, 0.45, 0.5, 0x5a3a3a, x, 0.45, -7 + r * 1.6); boite(0.8, 0.7, 0.1, 0x5a3a3a, x, 0.95, -6.75 + r * 1.6); });
    const voyageurs = [["valeria", -0.75, -2.2], ["joseph", 0.75, -2.2], ["carolina", -0.75, -3.8], ["angel", -0.55, -3.8], ["mishel", 0.75, -3.8], ["wilmer", 0.75, -5.4], ["aurelio", -0.75, -5.4]]
      .map(([q, x, z]) => personnage(q, x, z, 0, q === "angel" ? "dort" : "chaise"));
    const passage = new THREE.PointLight(0xffc880, 6, 6, 1.5); groupe.add(passage);
    regard(0.05, 1.2, 0, -5, 1.5, -0.05);
    A.voiture(0, -1); sons.push({ arreter: () => A.voitureFin() }); // le moteur du car
    majTableau = (dt) => {
      passage.position.set(Math.sin(temps) > 0 ? 2 : -2, 1.5, 4 - ((temps * 9) % 14));    // les lampadaires qui défilent
      voyageurs.forEach((p, i) => { p.tete.rotation.z = Math.sin(temps * 3 + i) * 0.06; });
    };
    await coupe(); flashCarte("f2"); await attendre(4.2); finFlash();

    // 3. Río Suchiate : le radeau de chambres à air
    viderTableau(); solY = (x, z) => (Math.abs(x) < 9 ? -0.4 : 0.2);
    scene.background = new THREE.Color(0xc8c0a8); scene.fog = new THREE.Fog(0xc8c0a8, 20, 90); R.renderer.toneMappingExposure = 1.15;
    groupe.add(new THREE.HemisphereLight(0xfff0d8, 0x5a4a30, 1.4)); soleil(0xfff0d0, 2.2, [-10, 30, 5], 14);
    const eau3 = new THREE.Mesh(new THREE.PlaneGeometry(18, 120), new THREE.MeshStandardMaterial({ map: textureEau(), color: 0x9a8a6a, roughness: 0.25 })); eau3.rotation.x = -Math.PI / 2; eau3.position.y = -0.3; groupe.add(eau3);
    boite(40, 0.6, 120, 0x7a6a4a, -29, 0, 0); boite(40, 0.6, 120, 0x7a6a4a, 29, 0, 0);
    const radeau = new THREE.Group(); groupe.add(radeau);
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => P.maille(new THREE.TorusGeometry(0.45, 0.18, 8, 16), 0x151515, radeau, x, 0, z).rotation.x = Math.PI / 2);
    boite(2.4, 0.06, 2.4, 0x8a6a40, 0, 0.18, 0, radeau);
    const surRadeau = [personnage("valeria", 0, 0, -Math.PI / 2, "debout"), personnage("joseph", 0, 0, -Math.PI / 2, "debout"), anonyme(0, 0, -Math.PI / 2, "debout")];
    regard(-11, 4, 0, 0, 1.6);
    sons.push(A.riviere(0, 0));
    let rx = 7;
    majTableau = (dt) => {
      rx -= dt * 1.2; radeau.position.set(rx, -0.15, 0);
      surRadeau.forEach((p, i) => { p.x = rx - 0.5 + i * 0.5; p.z = (i - 1) * 0.6; p.yExtra = 0.25; });
      surRadeau[2].bras[1].epaule.rotation.x = -1.2 + Math.sin(temps * 2) * 0.4;               // le passeur pousse sa perche
    };
    await coupe(); flashCarte("f3"); await attendre(4.2); finFlash();

    // 4. Chiapas : à pied, au bord de la route, parmi d'autres
    viderTableau(); solY = () => 0;
    scene.background = new THREE.Color(0xe8dcc0); scene.fog = new THREE.Fog(0xe8dcc0, 25, 120); R.renderer.toneMappingExposure = 1.1;
    groupe.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a40, 1.4)); soleil(0xfff0d0, 2.6, [5, 40, 10], 16);
    boite(8, 0.05, 200, 0x3a3a3a, 3, 0, -60); boite(30, 0.04, 200, 0x9a8a5a, -16, -0.01, -60);
    for (let k = 0; k < 40; k++) boite(0.15, 0.02, 2, 0xe8e0c8, 3, 0.03, 20 - k * 5);
    const marcheurs = ["valeria", "joseph", "carolina", "mishel", "wilmer", "aurelio"].map((q, i) => personnage(q, -1 - (i % 2), 1 - i * 1.6, Math.PI, "marche"));
    for (let i = 0; i < 14; i++) marcheurs.push(anonyme(-0.5 - alea() * 3, -4 - i * 2.2 - alea(), Math.PI, "marche"));
    const camion = new THREE.Group(); groupe.add(camion);
    boite(2.4, 2.6, 7, 0xd8d8d0, 0, 1.6, 0, camion); boite(2.4, 1.8, 2, 0xb02a2a, 0, 1.2, -4.4, camion);
    regard(-4.5, 4, -1.5, -6, 1.6);
    sons.push(A.moto(4, 20));
    majTableau = (dt) => {
      marcheurs.forEach((p) => { p.z -= dt * 1.1; p.vitesse = 1.1; p.cap = Math.PI; });
      camion.position.set(4.6, 0, 30 - ((temps * 22) % 160));
      if (sons[0]) { sons[0].position(4.6, camion.position.z); sons[0].regime(1); }
    };
    await coupe(); flashCarte("f4"); await attendre(4.2); finFlash();

    // 5. Sur le toit du train : les routes se rejoignent
    viderTableau(); solY = () => 0;
    scene.background = new THREE.Color(0x070a14); scene.fog = new THREE.FogExp2(0x070a14, 0.03); R.renderer.toneMappingExposure = 1.7;
    groupe.add(new THREE.HemisphereLight(0x2c3b5e, 0x15110d, 1.4));
    const lune = new THREE.DirectionalLight(0x9db0e0, 1.4); lune.position.set(30, 40, -20); groupe.add(lune);
    const sol5 = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x4a4436, roughness: 1 })); sol5.rotation.x = -Math.PI / 2; groupe.add(sol5);
    for (let k = 0; k < 5; k++) { boite(3, 3.2, 14, 0x5a3a2a, 0, 1.6 + 0.9, -k * 15); boite(3.1, 0.1, 14.1, 0x4a3022, 0, 4.15, -k * 15); }
    const passants = [];
    for (let i = 0; i < 18; i++) { const x = (alea() - 0.5) * 60; const z = (alea() - 0.5) * 60; passants.push(P.maille(new THREE.CylinderGeometry(0.25, 0.3, 6 + alea() * 4, 7), 0x26302a, groupe, x < 0 ? x - 4 : x + 4, 3, z)); }
    const toit = 4.2;
    const surToit = [["rosa", -0.6, 1.0], ["mateo", -0.6, 0.4], ["yesenia", 0.7, -0.8], ["julio", -0.7, -1.8], ["ernesto", 0.6, -2.6], ["valeria", 0.6, 1.8], ["joseph", -0.6, 2.8]]
      .map(([q, x, z]) => { const p = personnage(q, x, z, Math.PI, "assis"); p.yExtra = toit; return p; });
    surToit[1].cible = "dort";
    regard(0.2, 5.2, 0, -2, toit + 1.2, -0.1);
    const roulement = () => { if (ilotCourant !== "montage-train") return; A.pas(0.6); setTimeout(() => A.pas(0.5), 140); setTimeout(roulement, 900); };
    ilotCourant = "montage-train"; roulement();
    sons.push(A.ventSec());
    majTableau = (dt) => {
      // Le paysage défile : arbres qui passent vers l'arrière
      passants.forEach((m) => { m.position.z += dt * 14; if (m.position.z > 30) m.position.z -= 60; });
      surToit.forEach((p, i) => { p.racine.position.y += Math.sin(temps * 8 + i) * 0.01; });
    };
    await coupe(); flashCarte("f5"); await attendre(5.2); finFlash(); ilotCourant = "montage";

    // 6. Le mur : un éclair de l'échelle, comme au chapitre 1
    viderTableau(); solY = () => 0;
    scene.background = new THREE.Color(0x070a14); scene.fog = new THREE.FogExp2(0x070a14, 0.03); R.renderer.toneMappingExposure = 1.8;
    groupe.add(new THREE.HemisphereLight(0x2c3b5e, 0x15110d, 1.5));
    const l6 = new THREE.DirectionalLight(0x9db0e0, 1.5); l6.position.set(-20, 30, -30); groupe.add(l6);
    boite(80, 0.05, 40, 0x8c8272, 0, -0.02, 0);
    const barreaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 5.6, 0.14), P.mat(0x3d3631), 160);
    const o = new THREE.Object3D();
    for (let i = 0; i < 160; i++) { o.position.set(-28 + i * 0.36, 2.8, -3); o.updateMatrix(); barreaux.setMatrixAt(i, o.matrix); }
    groupe.add(barreaux);
    [-0.22, 0.22].forEach((x) => boite(0.05, 5.6, 0.05, 0x5c5850, x, 2.8, -2.4));
    for (let y = 0.3; y < 5.4; y += 0.32) boite(0.44, 0.03, 0.03, 0x5c5850, 0, y, -2.4);
    const grimpeur = personnage("joseph", 0, -2.1, Math.PI, "grimpe");
    regard(1.6, 1.8, 0, -2.4, 1.6, 0.35);
    majTableau = (dt) => { grimpeur.yExtra = Math.min(4.6, grimpeur.yExtra + dt * 1.1); grimpeur.barreau = grimpeur.yExtra / 0.32; };
    await coupe(); flashCarte("f6"); await attendre(3.4); finFlash();
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
    viderTableau(); ilotCourant = "seq5-desert";
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
    await coupe(); flashCarte("desert");
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
    _etat: () => ({ ilot: ilotCourant, temps, t: temps - debutIlot, brume: scene && scene.fog ? [scene.fog.density, scene.fog.color.getHexString(), scene.background.getHexString ? scene.background.getHexString() : "tex"] : null, joueur: { x: joueur.x, z: joueur.z }, objets: objets.map((o) => o.id), persos: persos.map((p) => [p.qui, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, p.cible]), qualite: R && R.etat() }),
    _placer: (x, z, l, t) => { joueur.x = x; joueur.z = z; K.etat.lacet = l; K.etat.tangage = t || 0; limite.r = 99; },
    _action: action,
  };
})();
