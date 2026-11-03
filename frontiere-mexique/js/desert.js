// Scène 3D : la traversée nocturne, l'arrestation, puis la rupture onirique.
// Aucune condition de victoire ni d'échec : quoi que fasse le joueur, l'issue est la même.

window.Desert = (function () {
  const C = window.CONTENU;
  const A = window.Audio3D;

  // ---------- Aléatoire reproductible ----------
  let graine = 1234567;
  function alea() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }

  // ---------- Relief ----------
  function hauteur(x, z) {
    let h = 2.6 * Math.sin(x * 0.021) * Math.cos(z * 0.017)
      + 1.4 * Math.sin(x * 0.053 + 1.3) * Math.sin(z * 0.041 + 0.4)
      + 0.5 * Math.sin(x * 0.13 + z * 0.11)
      + 0.25 * Math.sin(x * 0.31 - z * 0.27);
    // Montagnes lointaines
    const r = Math.sqrt(x * x + (z + 200) * (z + 200));
    if (r > 260) h += Math.min(1, (r - 260) / 200) * (40 + 25 * Math.sin(x * 0.012) * Math.cos(z * 0.009));
    return h;
  }

  // ---------- État ----------
  let renderer, scene, camera, horloge, onFin;
  let chemin, longueur;
  const groupe = [];   // personnages du groupe
  const agents = [];   // agents de la patrouille
  let joueur, helico, pickup, particules, ciel, lune, faisceauHelico, spotHelico;
  let phase = "marche"; // marche → alerte → reve → fin
  let tp = 0, ta = 0, tr = 0;
  let sLeader = 16;
  const ESPACEMENT = 2.3;
  const touches = {};
  let lacet = 0, tangage = 0, verrouille = false;
  const evenements = {};
  let ernesto = null, ernestoEtat = "marche", ernestoChuteT = 0;
  let dernierAppel = -99;
  let centreAlerte = null;
  let voile, sousTitre, invite, aide;
  let acceleration = 1; // > 1 uniquement pour les tests automatisés

  // ---------- Construction d'un personnage ----------
  function mat(c) { return new THREE.MeshLambertMaterial({ color: c }); }

  function creerPersonnage(couleur, taille, options) {
    options = options || {};
    const s = taille / 1.75;
    const m = mat(couleur);
    const mPeau = mat(0x2b211b);
    const racine = new THREE.Group();
    const hanches = new THREE.Group(); hanches.position.y = 0.85 * s; racine.add(hanches);
    const haut = new THREE.Group(); hanches.add(haut);

    const torse = new THREE.Mesh(new THREE.CapsuleGeometry(0.19 * s, 0.42 * s, 4, 8), m);
    torse.position.y = 0.36 * s; haut.add(torse);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 12, 10), mPeau);
    tete.position.y = 0.78 * s; haut.add(tete);
    if (options.casquette) {
      const cas = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * s, 0.13 * s, 0.07 * s, 12), m);
      cas.position.y = 0.86 * s; haut.add(cas);
    }
    if (!options.sansSac) {
      const sac = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.38 * s, 0.16 * s), mat(0x1c1a17));
      sac.position.set(0, 0.4 * s, -0.2 * s); haut.add(sac);
    }
    const bras = [];
    [-1, 1].forEach((cote) => {
      const pivot = new THREE.Group(); pivot.position.set(0.25 * s * cote, 0.6 * s, 0); haut.add(pivot);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * s, 0.5 * s, 3, 6), m);
      b.position.y = -0.3 * s; pivot.add(b);
      pivot.userData.cote = cote;
      bras.push(pivot);
    });
    const jambes = [];
    [-1, 1].forEach((cote) => {
      const pivot = new THREE.Group(); pivot.position.set(0.1 * s * cote, 0, 0); hanches.add(pivot);
      const j = new THREE.Mesh(new THREE.CapsuleGeometry(0.07 * s, 0.66 * s, 3, 6), mat(0x1d1f22));
      j.position.y = -0.42 * s; pivot.add(j);
      jambes.push(pivot);
    });
    scene.add(racine);
    return {
      racine, hanches, haut, bras, jambes, s,
      pose: { bas: 0, jambe: 0, bras: 0, penche: 0 },
      cible: "marche", cycle: alea() * 6, vitesse: 0, distPas: 0,
      x: 0, z: 0, cap: 0,
    };
  }

  const POSES = {
    marche:   { bas: 0,    jambe: 0,    bras: 0,    penche: 0.08 },
    accroupi: { bas: 0.38, jambe: 1.1,  bras: 0.2,  penche: 0.45 },
    genoux:   { bas: 0.42, jambe: 1.45, bras: 2.75, penche: -0.05 },
    chute:    { bas: 0.45, jambe: 1.45, bras: 0.6,  penche: 0.75 },
    debout:   { bas: 0,    jambe: 0,    bras: 0,    penche: 0 },
  };

  function animerPersonnage(p, dt) {
    const c = POSES[p.cible];
    const k = Math.min(1, dt * 4);
    for (const cle in c) p.pose[cle] += (c[cle] - p.pose[cle]) * k;
    p.cycle += p.vitesse * dt * 3.2;
    const balance = Math.sin(p.cycle) * Math.min(1, p.vitesse) * 0.5;
    p.racine.position.set(p.x, hauteur(p.x, p.z) - p.pose.bas * p.s, p.z);
    p.racine.rotation.y = p.cap;
    p.haut.rotation.x = p.pose.penche;
    p.jambes[0].rotation.x = -p.pose.jambe + balance;
    p.jambes[1].rotation.x = -p.pose.jambe - balance;
    p.bras.forEach((b, i) => {
      b.rotation.x = (i ? 1 : -1) * balance * 0.8;
      b.rotation.z = b.userData.cote * p.pose.bras * 0.95 + b.userData.cote * 0.05;
      if (p.pose.bras > 2) b.rotation.x = -0.3;
    });
    p.racine.position.y += Math.abs(Math.sin(p.cycle)) * 0.04 * Math.min(1, p.vitesse);
  }

  // ---------- Décor ----------
  function construireDecor() {
    // Sol
    const geo = new THREE.PlaneGeometry(1400, 1400, 260, 260);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    // Le maillage est centré sur z = -200 (le chemin part vers le nord, -z).
    for (let i = 0; i < pos.count; i++) pos.setY(i, hauteur(pos.getX(i), pos.getZ(i) - 200));
    const sol = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x8c8272 }));
    sol.position.z = -200;
    geo.computeVertexNormals();
    scene.add(sol);

    // Ciel : étoiles et lune suivent la caméra
    ciel = new THREE.Group();
    const nb = 2500, etoiles = new Float32Array(nb * 3);
    for (let i = 0; i < nb; i++) {
      const u = alea() * Math.PI * 2, v = Math.acos(alea() * 0.95);
      etoiles[i * 3] = Math.sin(v) * Math.cos(u) * 900;
      etoiles[i * 3 + 1] = Math.cos(v) * 900;
      etoiles[i * 3 + 2] = Math.sin(v) * Math.sin(u) * 900;
    }
    const gEt = new THREE.BufferGeometry();
    gEt.setAttribute("position", new THREE.BufferAttribute(etoiles, 3));
    ciel.add(new THREE.Points(gEt, new THREE.PointsMaterial({ color: 0xc8d2ff, size: 1.6, sizeAttenuation: false, fog: false })));
    lune = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshBasicMaterial({ color: 0xe8e4d4, fog: false }));
    lune.position.set(520, 300, -560);
    ciel.add(lune);
    scene.add(ciel);

    // Végétation : buissons, rochers, saguaros
    const buisson = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 0), mat(0x2b2f25), 1800);
    const rocher = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.45, 0), mat(0x504a40), 900);
    const o = new THREE.Object3D();
    for (let i = 0; i < 1800; i++) {
      const x = (alea() - 0.5) * 500, z = 60 - alea() * 620;
      const e = 0.4 + alea() * 1.3;
      o.position.set(x, hauteur(x, z) + 0.15 * e, z);
      o.scale.set(e * (0.8 + alea() * 0.6), e * 0.7, e);
      o.rotation.set(0, alea() * 6, 0);
      o.updateMatrix(); buisson.setMatrixAt(i, o.matrix);
    }
    for (let i = 0; i < 900; i++) {
      const x = (alea() - 0.5) * 500, z = 60 - alea() * 620;
      const e = 0.3 + alea() * 1.6;
      o.position.set(x, hauteur(x, z), z);
      o.scale.set(e, e * 0.6, e * (0.7 + alea() * 0.6));
      o.rotation.set(alea(), alea() * 6, alea());
      o.updateMatrix(); rocher.setMatrixAt(i, o.matrix);
    }
    scene.add(buisson, rocher);

    const mSag = mat(0x26302a);
    for (let i = 0; i < 90; i++) {
      const x = (alea() - 0.5) * 460, z = 50 - alea() * 600;
      if (Math.abs(x - pointChemin(Math.min(1, Math.max(0, -z / 440))).x) < 4) continue;
      const g = new THREE.Group();
      const h = 4 + alea() * 6;
      const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, h, 8), mSag);
      tronc.position.y = h / 2; g.add(tronc);
      const nbBras = 1 + Math.floor(alea() * 3);
      for (let b = 0; b < nbBras; b++) {
        const cote = b % 2 ? 1 : -1, hb = 1.4 + alea() * 2, yb = h * (0.35 + alea() * 0.3);
        const coude = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 6), mSag);
        coude.rotation.z = Math.PI / 2; coude.position.set(cote * 0.6, yb, 0); g.add(coude);
        const bras = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, hb, 6), mSag);
        bras.position.set(cote * 1.0, yb + hb / 2, 0); g.add(bras);
      }
      g.position.set(x, hauteur(x, z) - 0.2, z);
      g.rotation.y = alea() * 6;
      scene.add(g);
    }

    // Le mur frontalier, derrière le point de départ
    const nbBarreaux = 900;
    const barreaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 5.6, 0.14), mat(0x3d3631), nbBarreaux);
    for (let i = 0; i < nbBarreaux; i++) {
      const x = -160 + i * 0.36, z = 22 + Math.sin(x * 0.01) * 3;
      o.position.set(x, hauteur(x, z) + 2.4, z);
      o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0);
      o.updateMatrix(); barreaux.setMatrixAt(i, o.matrix);
    }
    scene.add(barreaux);

    // Bouteilles abandonnées et objets le long du chemin
    const mBout = mat(0x111111);
    for (let i = 0; i < 40; i++) {
      const u = alea() * 0.6, p = pointChemin(u);
      const x = p.x + (alea() - 0.5) * 10, z = p.z + (alea() - 0.5) * 10;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8), mBout);
      b.position.set(x, hauteur(x, z) + 0.05, z);
      b.rotation.z = Math.PI / 2; b.rotation.y = alea() * 6;
      scene.add(b);
    }
  }

  function pointChemin(u) {
    return chemin.getPointAt(Math.min(0.999, Math.max(0, u)));
  }
  function pointS(s) { return pointChemin(s / longueur); }
  function capS(s) {
    const t = chemin.getTangentAt(Math.min(0.999, Math.max(0, s / longueur)));
    return Math.atan2(t.x, t.z);
  }

  // ---------- Hélicoptère, pick-up, faisceaux ----------
  function creerFaisceau(couleur, opacite) {
    const g = new THREE.ConeGeometry(1, 1, 24, 1, true);
    g.translate(0, -0.5, 0); // sommet à l'origine, cône vers -Y
    const m = new THREE.MeshBasicMaterial({
      color: couleur, transparent: true, opacity: opacite, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const f = new THREE.Mesh(g, m);
    f.visible = false;
    scene.add(f);
    return f;
  }
  const _Y = new THREE.Vector3(0, -1, 0), _d = new THREE.Vector3();
  function orienterFaisceau(f, de, vers, angle) {
    _d.subVectors(vers, de);
    const l = _d.length();
    f.position.copy(de);
    f.quaternion.setFromUnitVectors(_Y, _d.normalize());
    const r = Math.tan(angle) * l;
    f.scale.set(r, l, r);
  }

  function construireVehicules() {
    // Hélicoptère
    helico = new THREE.Group();
    const mH = mat(0x1a1c1e);
    const corps = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), mH); corps.scale.set(1, 0.8, 1.6); helico.add(corps);
    const queue = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 6, 6), mH);
    queue.rotation.x = Math.PI / 2; queue.position.z = 4.5; helico.add(queue);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.05, 0.3), mH); rotor.position.y = 1.4; helico.add(rotor);
    helico.userData.rotor = rotor;
    const feuRouge = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2020, fog: false }));
    feuRouge.position.set(0, -1.1, 0); helico.add(feuRouge);
    helico.userData.feu = feuRouge;
    helico.visible = false;
    scene.add(helico);

    spotHelico = new THREE.SpotLight(0xeef2ff, 0, 140, 0.2, 0.45, 0);
    scene.add(spotHelico, spotHelico.target);
    faisceauHelico = creerFaisceau(0xdfe6ff, 0.07);

    // Pick-up de la patrouille
    pickup = new THREE.Group();
    const mBlanc = mat(0xcfd0c8);
    const caisse = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 5.2), mBlanc); caisse.position.y = 0.9; pickup.add(caisse);
    const cabine = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.2), mBlanc); cabine.position.set(0, 1.8, 0.6); pickup.add(cabine);
    const bande = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.18, 5.22), mat(0x23452e)); bande.position.y = 0.95; pickup.add(bande);
    const rouge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xff1010, fog: false }));
    rouge.position.set(-0.4, 2.33, 0.6); pickup.add(rouge);
    const bleu = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x1030ff, fog: false }));
    bleu.position.set(0.4, 2.33, 0.6); pickup.add(bleu);
    pickup.userData.gyro = [rouge, bleu];
    pickup.userData.phares = [];
    [-0.7, 0.7].forEach((x) => {
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff6dd, fog: false }));
      ph.position.set(x, 0.95, 2.62); pickup.add(ph);
      const sp = new THREE.SpotLight(0xfff1d0, 0, 70, 0.45, 0.6, 0);
      sp.position.set(x, 1.0, 2.7);
      sp.target.position.set(x * 3, 0, 30);
      pickup.add(sp, sp.target);
      pickup.userData.phares.push(sp);
    });
    pickup.visible = false;
    scene.add(pickup);

    // Agents
    for (let i = 0; i < 3; i++) {
      const p = creerPersonnage(0x3f4a38, 1.8 + i * 0.03, { casquette: true, sansSac: true });
      p.racine.visible = false;
      const lampe = new THREE.SpotLight(0xffffff, 0, 40, 0.22, 0.5, 0);
      scene.add(lampe, lampe.target);
      p.lampe = lampe;
      p.faisceau = creerFaisceau(0xffffff, 0.05);
      agents.push(p);
    }
  }

  // ---------- Texte flottant (rupture onirique) ----------
  function etiquette(texte) {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 128;
    const c = cv.getContext("2d");
    c.font = "300 64px Georgia, serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.shadowColor = "#ffe9c4"; c.shadowBlur = 24;
    c.fillStyle = "#fff4e0";
    c.fillText(texte, 256, 64);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0, fog: false, depthWrite: false }));
    sp.scale.set(3.2, 0.8, 1);
    scene.add(sp);
    return sp;
  }

  // ---------- Interface ----------
  let sousTitreTimer = null;
  function dire(cle, chuchote) {
    const r = C.repliques[cle];
    if (!r) return;
    A.parler(r.qui, r.texte, chuchote);
    sousTitre.textContent = r.texte;
    sousTitre.className = r.qui === "agent" ? "visible agent" : "visible";
    clearTimeout(sousTitreTimer);
    sousTitreTimer = setTimeout(() => { sousTitre.className = ""; }, 3800);
  }
  function unefois(cle, condition, action) {
    if (!evenements[cle] && condition) { evenements[cle] = true; action(); }
  }
  function montrerInvite(t) { invite.textContent = t || ""; invite.classList.toggle("visible", !!t); }

  // ---------- Entrées ----------
  function installerEntrees() {
    window.addEventListener("keydown", (e) => {
      touches[e.code] = true;
      if (e.code === "KeyE" || e.code === "Space") actionAider();
    });
    window.addEventListener("keyup", (e) => { touches[e.code] = false; });
    renderer.domElement.addEventListener("click", () => {
      if (!verrouille && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => {
      verrouille = document.pointerLockElement === renderer.domElement;
      aide.classList.toggle("visible", !verrouille && phase !== "fin");
    });
    document.addEventListener("mousemove", (e) => {
      if (!verrouille) return;
      lacet -= e.movementX * 0.0022;
      tangage -= e.movementY * 0.0022;
      tangage = Math.max(-1.2, Math.min(1.2, tangage));
    });
    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  }
  function enfoncee(...codes) { return codes.some((c) => touches[c]); }

  function actionAider() {
    if (phase !== "marche" || ernestoEtat !== "tombe") return;
    const d = Math.hypot(joueur.x - ernesto.x, joueur.z - ernesto.z);
    if (d < 3) relever(true);
  }
  function relever(parJoueur) {
    ernestoEtat = "releve";
    ernesto.cible = "marche";
    montrerInvite("");
    dire(parJoueur ? "aide" : "aideAutre", parJoueur);
  }

  // ---------- Joueur ----------
  function majJoueur(dt) {
    let vitesseMax = 1.9 * (1 - 0.45 * joueur.fatigue);
    if (phase === "alerte") vitesseMax = ta > 30 ? 0 : 0.5;
    if (phase === "reve") vitesseMax = 0;

    // Tourner au clavier (si la souris n'est pas capturée)
    if (enfoncee("ArrowLeft")) lacet += 1.6 * dt;
    if (enfoncee("ArrowRight")) lacet -= 1.6 * dt;

    let av = 0, lat = 0;
    if (enfoncee("KeyW", "KeyZ", "ArrowUp")) av += 1;
    if (enfoncee("KeyS", "ArrowDown")) av -= 1;
    if (enfoncee("KeyA", "KeyQ")) lat -= 1;
    if (enfoncee("KeyD")) lat += 1;
    const n = Math.hypot(av, lat) || 1;
    const fx = -Math.sin(lacet), fz = -Math.cos(lacet);
    const rx = Math.cos(lacet), rz = -Math.sin(lacet);
    let dx = (fx * av + rx * lat) / n * vitesseMax * dt;
    let dz = (fz * av + rz * lat) / n * vitesseMax * dt;

    // On ne peut pas s'éloigner du groupe : le désert retient.
    const ref = groupe[3];
    const nx = joueur.x + dx, nz = joueur.z + dz;
    const dRef = Math.hypot(nx - ref.x, nz - ref.z);
    if (dRef > 45 && dRef > Math.hypot(joueur.x - ref.x, joueur.z - ref.z)) { dx *= 0.15; dz *= 0.15; }

    joueur.x += dx; joueur.z += dz;
    const d = Math.hypot(dx, dz);
    joueur.distPas += d;
    if (joueur.distPas > 0.72) { joueur.distPas = 0; A.pas(0.3 + joueur.fatigue * 0.15); }
    joueur.balance += d * 5.5;

    // Hauteur des yeux : debout, accroupi, à genoux
    let yeuxCible = 1.62;
    if (phase === "alerte" && ta > 4) yeuxCible = 1.0;
    if (phase === "alerte" && ta > 33) yeuxCible = 0.82;
    if (phase === "reve") yeuxCible = 0.82;
    joueur.yeux += (yeuxCible - joueur.yeux) * Math.min(1, dt * 2.5);

    // Pendant l'arrestation, le regard est attiré vers l'agent.
    if (phase === "alerte" && ta > 30) {
      const ag = agents[0];
      const vx = ag.x - joueur.x, vz = ag.z - joueur.z;
      const lacetCible = Math.atan2(-vx, -vz);
      let diff = lacetCible - lacet;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      lacet += diff * Math.min(1, dt * 2.2);
      tangage += (0.12 - tangage) * Math.min(1, dt * 2);
    }

    const y = hauteur(joueur.x, joueur.z) + joueur.yeux + Math.sin(joueur.balance) * 0.03;
    camera.position.set(joueur.x, y, joueur.z);
    camera.rotation.set(tangage, lacet, Math.sin(joueur.balance * 0.5) * 0.006, "YXZ");
  }

  // ---------- Groupe ----------
  function dernierDuGroupe() { return groupe[groupe.length - 1]; }

  function majGroupe(dt) {
    const enMarche = phase === "marche";
    if (enMarche) {
      // Le guide attend si le joueur traîne trop.
      const dernier = dernierDuGroupe();
      const retard = Math.hypot(joueur.x - dernier.x, joueur.z - dernier.z);
      let v = 1.25;
      if (retard > 13) v = 0;
      else if (retard > 9) v = 0.5;
      sLeader = Math.min(longueur - 5, sLeader + v * dt);
      if (retard > 13 && tp - dernierAppel > 16) {
        dernierAppel = tp;
        dire(retard > 30 ? "perdu" : (alea() > 0.5 ? "attendre" : "attendre2"));
      }
    }

    groupe.forEach((p, i) => {
      if (p.fuit) {
        if (phase === "reve") return;
        p.x += p.fuit.x * dt; p.z += p.fuit.z * dt; p.vitesse = 3;
        if (Math.hypot(p.x - centreAlerte.x, p.z - centreAlerte.z) > 55) p.racine.visible = false;
        animerPersonnage(p, dt);
        return;
      }
      if (enMarche) {
        const cibleS = sLeader - ESPACEMENT * i;
        const bloque = p === ernesto && ernestoEtat === "tombe";
        const vMax = p === ernesto && ernestoEtat === "releve" ? 1.6 : 1.45;
        const avant = p.abscisse;
        if (!bloque && p.abscisse < cibleS) p.abscisse = Math.min(cibleS, p.abscisse + vMax * dt);
        const pt = pointS(p.abscisse);
        const decal = Math.sin(i * 1.7 + p.abscisse * 0.05) * 0.9;
        const c = capS(p.abscisse);
        p.x = pt.x + Math.cos(c) * decal; p.z = pt.z - Math.sin(c) * decal;
        p.cap = c;
        p.vitesse = (p.abscisse - avant) / Math.max(dt, 1e-4);
        p.distPas += p.abscisse - avant;
      } else {
        p.vitesse *= 0.9;
        if (p.disperse) {
          p.x += p.disperse.x * dt * Math.max(0, 1 - ta / 12);
          p.z += p.disperse.z * dt * Math.max(0, 1 - ta / 12);
        }
        // Se tourner vers la menace
        if (phase === "alerte" && ta > 30 && helico) {
          p.cap += (Math.atan2(pickup.position.x - p.x, pickup.position.z - p.z) - p.cap) * Math.min(1, dt);
        }
      }
      if (p.distPas > 0.8) {
        p.distPas = 0;
        const dJ = Math.hypot(p.x - joueur.x, p.z - joueur.z);
        if (dJ < 25) A.pasAutre(p.x, hauteur(p.x, p.z), p.z);
      }
      animerPersonnage(p, dt);
    });
  }

  // ---------- Déroulé de la marche ----------
  function scenarioMarche() {
    unefois("depart", tp > 3, () => dire("depart", true));
    unefois("rythme", tp > 32, () => dire("rythme", true));
    unefois("enfant", tp > 55, () => dire("enfant"));
    unefois("mere", tp > 59, () => dire("mere", true));
    unefois("soif", tp > 76, () => dire("soif"));
    unefois("chute", tp > 90, () => {
      ernestoEtat = "tombe"; ernestoChuteT = tp;
      ernesto.cible = "chute";
      dire("chute");
    });
    if (ernestoEtat === "tombe") {
      const d = Math.hypot(joueur.x - ernesto.x, joueur.z - ernesto.z);
      montrerInvite(d < 3 ? "[E] Tendre la main" : "");
      if (tp - ernestoChuteT > 14) relever(false);
    }
    if (tp < 12) aide.classList.add("controles");
    else aide.classList.remove("controles");

    const pret = tp > 150 && ernestoEtat !== "tombe";
    if (pret || sLeader >= longueur - 6) debutAlerte();
  }

  function debutAlerte() {
    phase = "alerte"; ta = 0;
    montrerInvite("");
    const g = groupe[3];
    centreAlerte = new THREE.Vector3(g.x, 0, g.z);
    A.helicoptere();
  }

  // ---------- Déroulé de l'arrestation ----------
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  let helicoDepart, helicoArrivee;
  let pickupDepart, pickupArrivee;

  function scenarioAlerte(dt) {
    const G = centreAlerte;
    A.setPeur(Math.min(1, ta / 15));
    unefois("cri", ta > 4, () => {
      dire("alerte");
      groupe.forEach((p, i) => {
        p.cible = "accroupi";
        const a = i * 2.1 + 0.5;
        p.disperse = { x: Math.cos(a) * 0.5, z: Math.sin(a) * 0.5 };
      });
      A.coeur(true);
    });
    unefois("priere", ta > 8, () => dire("priere", true));

    // L'hélicoptère approche puis se met en vol stationnaire
    unefois("helicoVisible", ta > 0.01, () => {
      helicoDepart = new THREE.Vector3(G.x - 60, 80, G.z - 380);
      helicoArrivee = new THREE.Vector3(G.x + 4, 30, G.z + 6);
      helico.visible = true;
    });
    const u = Math.min(1, ta / 20);
    const e = u * u * (3 - 2 * u);
    helico.position.lerpVectors(helicoDepart, helicoArrivee, e);
    if (u >= 1) {
      helico.position.x += Math.sin(ta * 0.4) * 5;
      helico.position.z += Math.cos(ta * 0.33) * 4;
    }
    helico.position.y += Math.sin(ta * 1.3) * 0.4;
    helico.lookAt(G.x, helico.position.y, G.z);
    helico.userData.rotor.rotation.y += dt * 25;
    helico.userData.feu.visible = Math.floor(ta * 1.5) % 2 === 0;
    A.positionHelico(helico.position.x, helico.position.y, helico.position.z);

    if (ta > 12) {
      spotHelico.intensity = 3.5;
      faisceauHelico.visible = true;
      // Balayage, puis le faisceau se fixe sur le groupe et le joueur
      const fixe = Math.min(1, Math.max(0, (ta - 18) / 6));
      const bx = helico.position.x + Math.sin(ta * 0.9) * 25, bz = helico.position.z - 20 + Math.cos(ta * 0.6) * 15;
      const cx = (joueur.x + G.x) / 2, cz = (joueur.z + G.z) / 2;
      _w.set(bx + (cx - bx) * fixe, 0, bz + (cz - bz) * fixe);
      _w.y = hauteur(_w.x, _w.z);
      spotHelico.position.copy(helico.position); spotHelico.position.y -= 1.2;
      spotHelico.target.position.copy(_w);
      orienterFaisceau(faisceauHelico, spotHelico.position, _w, 0.2);
    }

    unefois("panique", ta > 20, () => {
      dire("panique");
      const guide = groupe[0];
      const a = Math.atan2(guide.x - G.x, guide.z - G.z) + 0.6;
      guide.fuit = { x: Math.sin(a) * 4.5, z: Math.cos(a) * 4.5 };
      guide.cap = a; guide.cible = "marche";
    });

    // Le pick-up arrive par le côté
    unefois("pickup", ta > 24, () => {
      pickupDepart = new THREE.Vector3(G.x + 90, 0, G.z + 30);
      pickupArrivee = new THREE.Vector3(G.x + 16, 0, G.z + 5);
      pickup.visible = true;
      pickup.userData.phares.forEach((s) => (s.intensity = 2.2));
      A.moteur(pickupDepart.x, pickupDepart.z);
    });
    if (pickup.visible) {
      const k = Math.min(1, (ta - 24) / 6);
      const ek = 1 - (1 - k) * (1 - k);
      pickup.position.lerpVectors(pickupDepart, pickupArrivee, ek);
      pickup.position.y = hauteur(pickup.position.x, pickup.position.z);
      pickup.rotation.y = Math.atan2(G.x - pickup.position.x, G.z - pickup.position.z);
      const clign = Math.floor(ta * 4) % 2;
      pickup.userData.gyro[0].visible = clign === 0;
      pickup.userData.gyro[1].visible = clign === 1;
      A.positionMoteur(pickup.position.x, pickup.position.z);
    }

    // Les agents descendent et s'approchent
    unefois("agents", ta > 30, () => {
      const cibles = [joueur, groupe[2], groupe[4]];
      agents.forEach((ag, i) => {
        ag.x = pickup.position.x - 2 + i * 1.5; ag.z = pickup.position.z + (i - 1) * 2;
        ag.racine.visible = true;
        ag.vers = cibles[i];
        ag.lampe.intensity = 2.5;
        ag.faisceau.visible = true;
        ag.bras[1].userData.cote = 0.4;
      });
      dire("agent1");
      groupe.forEach((p) => { if (!p.fuit) { p.cible = "genoux"; p.disperse = null; } });
    });
    unefois("agent2", ta > 34, () => dire("agent2"));
    unefois("agent3", ta > 38, () => dire("agent3"));

    agents.forEach((ag) => {
      if (!ag.racine.visible) return;
      const vx = ag.vers.x - ag.x, vz = ag.vers.z - ag.z;
      const d = Math.hypot(vx, vz);
      const arret = 2.0;
      const v = d > arret ? 1.7 : 0;
      ag.x += (vx / d) * v * dt; ag.z += (vz / d) * v * dt;
      ag.cap = Math.atan2(vx, vz);
      ag.vitesse = v;
      ag.cible = "marche";
      animerPersonnage(ag, dt);
      ag.bras.forEach((b) => (b.rotation.x = -1.2));
      // Lampe torche à hauteur d'épaule, braquée vers le visage
      _v.set(ag.x + Math.sin(ag.cap) * 0.3, hauteur(ag.x, ag.z) + 1.45, ag.z + Math.cos(ag.cap) * 0.3);
      const tete = ag.vers === joueur ? camera.position : _w.set(ag.vers.x, hauteur(ag.vers.x, ag.vers.z) + 0.9, ag.vers.z);
      ag.lampe.position.copy(_v);
      ag.lampe.target.position.copy(tete);
      orienterFaisceau(ag.faisceau, _v, tete, 0.12);
      if (ag.vers === joueur) joueur.dAgent = d;
    });

    // La lampe dans les yeux : éblouissement, puis rupture
    if (agents[0].racine.visible) {
      const d = joueur.dAgent || 99;
      const ebloui = Math.max(0, Math.min(1, (6 - d) / 4));
      voile.style.transition = "none";
      voile.style.background = "#fff";
      voile.style.opacity = (ebloui * 0.85).toFixed(3);
      if ((d < 2.3 && ta > 40) || ta > 46) debutReve();
    }
  }

  // ---------- Rupture onirique ----------
  const etiquettes = [];
  function debutReve() {
    phase = "reve"; tr = 0;
    voile.style.opacity = "1";
    A.silence();
    setTimeout(() => A.nappe(), 1800);
    // Le monde se fige et change de couleur
    scene.fog.color.set(0x140c26);
    scene.fog.density = 0.028;
    scene.background.set(0x140c26);
    agents.forEach((ag) => { ag.racine.visible = false; ag.faisceau.visible = false; ag.lampe.intensity = 0; });
    pickup.visible = false;
    pickup.userData.phares.forEach((s) => (s.intensity = 0));
    spotHelico.color.set(0xffd9a8);
    faisceauHelico.material.color.set(0xffc88a);
    faisceauHelico.material.opacity = 0.12;
    helico.visible = false;
    groupe.forEach((p, i) => {
      if (p.fuit) return;
      const perso = C.personnages[i];
      const sp = etiquette(perso.nom);
      sp.position.set(p.x, hauteur(p.x, p.z) + 1.4, p.z);
      sp.userData.p = p;
      sp.userData.retard = 4 + i * 2.5;
      etiquettes.push(sp);
    });
    particules.visible = true;
    lune.material.color.set(0xffe3b0);
    setTimeout(() => {
      voile.style.transition = "opacity 4s ease";
      voile.style.opacity = "0";
    }, 1200);
  }

  function scenarioReve(dt) {
    // Les personnes se relèvent lentement ; leurs noms montent dans la lumière.
    unefois("releve", tr > 7, () => groupe.forEach((p) => { if (!p.fuit) p.cible = "debout"; }));
    groupe.forEach((p) => { if (!p.fuit) { p.vitesse = 0; animerPersonnage(p, dt); } });
    etiquettes.forEach((sp) => {
      const k = Math.max(0, tr - sp.userData.retard);
      sp.material.opacity = Math.min(1, k / 3) * (tr > 40 ? Math.max(0, 1 - (tr - 40) / 4) : 1);
      sp.position.y = hauteur(sp.userData.p.x, sp.userData.p.z) + 2.1 + k * 0.12;
    });
    const pos = particules.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * (0.15 + (i % 7) * 0.03);
      if (y > 8) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    particules.position.set(joueur.x, hauteur(joueur.x, joueur.z) - 0.5, joueur.z);

    unefois("finReve", tr > 44, () => {
      voile.style.transition = "opacity 4s ease";
      voile.style.background = "#000";
      voile.style.opacity = "1";
      A.toutCouper(4);
      setTimeout(terminer, 4500);
    });
  }

  function terminer() {
    phase = "fin";
    if (document.exitPointerLock) document.exitPointerLock();
    aide.classList.remove("visible");
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = "none";
    if (onFin) onFin();
  }

  // ---------- Boucle ----------
  function boucle() {
    const dt = Math.min(0.05, horloge.getDelta()) * acceleration;
    if (phase === "marche") { tp += dt; joueur.fatigue = Math.min(1, tp / 170); A.setFatigue(joueur.fatigue); scenarioMarche(); }
    else if (phase === "alerte") { ta += dt; scenarioAlerte(dt); }
    else if (phase === "reve") { tr += dt; scenarioReve(dt); }
    if (phase === "fin") return;

    majGroupe(dt);
    majJoueur(dt);
    ciel.position.copy(camera.position);
    const avant = _v.set(0, 0, -1).applyQuaternion(camera.quaternion);
    A.auditeur(camera.position, avant);
    renderer.render(scene, camera);
  }

  // ---------- Lancement ----------
  function lancer(options) {
    onFin = options.fin;
    acceleration = options.acceleration || 1;
    voile = document.getElementById("voile");
    sousTitre = document.getElementById("sous-titre");
    invite = document.getElementById("invite");
    aide = document.getElementById("aide");

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.domElement.id = "scene3d";
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a14);
    scene.fog = new THREE.FogExp2(0x070a14, 0.02);
    camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 1500);

    // Lumière de lune, froide et basse
    const luneLum = new THREE.DirectionalLight(0x9db0e0, 1.1);
    luneLum.position.set(520, 300, -560);
    scene.add(luneLum, new THREE.HemisphereLight(0x22304f, 0x0b0907, 0.9));

    chemin = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 8), new THREE.Vector3(8, 0, -60), new THREE.Vector3(-6, 0, -130),
      new THREE.Vector3(15, 0, -200), new THREE.Vector3(5, 0, -280), new THREE.Vector3(25, 0, -360),
      new THREE.Vector3(10, 0, -440),
    ]);
    longueur = chemin.getLength();

    construireDecor();
    construireVehicules();

    C.personnages.forEach((perso, i) => {
      const p = creerPersonnage(perso.couleur, perso.taille, { casquette: perso.id === "guia" });
      p.id = perso.id;
      p.abscisse = sLeader - ESPACEMENT * i;
      groupe.push(p);
      if (perso.id === "ernesto") ernesto = p;
    });

    // Particules de sable pour la rupture
    const nbP = 2200, pp = new Float32Array(nbP * 3);
    for (let i = 0; i < nbP; i++) {
      const a = alea() * Math.PI * 2, r = 2.5 + alea() * 28;
      pp[i * 3] = Math.cos(a) * r; pp[i * 3 + 1] = alea() * 8; pp[i * 3 + 2] = Math.sin(a) * r;
    }
    const gP = new THREE.BufferGeometry();
    gP.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const cvP = document.createElement("canvas"); cvP.width = cvP.height = 32;
    const cP = cvP.getContext("2d");
    const grad = cP.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,240,215,1)"); grad.addColorStop(1, "rgba(255,240,215,0)");
    cP.fillStyle = grad; cP.fillRect(0, 0, 32, 32);
    particules = new THREE.Points(gP, new THREE.PointsMaterial({
      color: 0xf0d8b0, size: 0.05, map: new THREE.CanvasTexture(cvP), transparent: true,
      opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    particules.visible = false;
    scene.add(particules);

    const depart = pointS(2);
    joueur = { x: depart.x, z: depart.z, yeux: 1.62, fatigue: 0, distPas: 0, balance: 0 };
    lacet = capS(2) + Math.PI;

    // Saut direct dans le déroulé (tests, ou reprise par l'enseignant)
    if (options.temps) {
      const t0 = options.temps;
      sLeader = Math.min(longueur - 10, 16 + t0 * 1.2);
      groupe.forEach((p, i) => (p.abscisse = sLeader - ESPACEMENT * i));
      const pj = pointS(sLeader - ESPACEMENT * 6 - 3);
      joueur.x = pj.x; joueur.z = pj.z; lacet = capS(sLeader) + Math.PI;
      tp = t0;
      ["depart", "rythme", "enfant", "mere", "soif", "chute"].forEach((k) => { if (t0 > 95) evenements[k] = true; });
      if (t0 > 95) ernestoEtat = "releve";
    }

    installerEntrees();
    aide.classList.toggle("visible", true);
    horloge = new THREE.Clock();
    renderer.setAnimationLoop(boucle);

    A.vent(); A.insectes(); A.respiration();
    voile.style.transition = "opacity 3s ease";
    voile.style.background = "#000";
    requestAnimationFrame(() => (voile.style.opacity = "0"));

    if (options.reve) { phase = "alerte"; ta = 0; debutAlerte(); ta = 47; scenarioAlerte(0.016); }
  }

  return { lancer, _etat: () => ({ phase, tp, ta, tr, joueur, sLeader, groupe: groupe.map((p) => [p.x, p.racine.position.y, p.z, p.cible, p.racine.visible]) }) };
})();
