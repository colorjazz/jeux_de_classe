// Scène 3D : le mur, la traversée nocturne, l'arrestation, puis la rupture onirique.
// Aucune condition de victoire ni d'échec : quoi que fasse le joueur, l'issue est la même.
//
// Courbe émotionnelle :
//   le mur (appréhension) → première marche (calme, présentations, la croix)
//   → la halte (intimité) → deuxième marche (froid, soif, fausse alerte, chute)
//   → les lumières de la ville (espoir) → le choc → la rupture.

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
    // Montagnes sur les côtés et derrière ; le nord reste ouvert vers les lumières.
    const ax = Math.abs(x);
    if (ax > 230) h += Math.min(1, (ax - 230) / 160) * (45 + 25 * Math.sin(z * 0.011) * Math.cos(x * 0.008));
    if (z > 140) h += Math.min(1, (z - 140) / 150) * (35 + 15 * Math.sin(x * 0.014));
    return h;
  }

  // ---------- Réglages ----------
  const ESPACEMENT = 2.3;
  const MUR_Z = 22;                // le mur frontalier
  const ECHELLE_X = 0;
  const S_DEPART = 16;             // position du guide au début de la marche
  const S_CROIX = 175;             // la croix au bord du chemin

  // ---------- État ----------
  let renderer, scene, camera, horloge, onFin;
  let chemin, longueur;
  const groupe = [];
  const agents = [];
  let joueur, helico, pickup, particules, ciel, lune, faisceauHelico, spotHelico;
  let lumieresVille, voitureLoin, croix, flamme;
  let mains;
  let phase = "mur"; // mur → marche → alerte → reve → fin
  let tm = 0, tp = 0, ta = 0, tr = 0;
  let sLeader = S_DEPART;
  let arret = false;     // le guide est arrêté (halte, fausse alerte)
  const touches = {};
  let lacet = 0, tangage = 0, verrouille = false;
  const evenements = {};
  let ernesto = null, ernestoEtat = "marche", ernestoChuteT = 0;
  let julio = null;
  let dernierAppel = -99;
  let centreAlerte = null;
  let voile, sousTitre, invite, aide;
  let acceleration = 1; // > 1 uniquement pour les tests automatisés
  let eauOfferte = false, eauBue = false;
  let gesteMain = null, gesteFin = 0, gesteDebut = 0;
  let horlogeAnim = 0;   // temps d'animation (s'arrête pendant la pause)
  // Actions différées, calées sur l'horloge du jeu (donc suspendues pendant la pause).
  const aFaire = [];
  function plus_tard(secondes, f) { aFaire.push({ t: horlogeAnim + secondes, f }); }
  function executerAFaire() {
    for (let i = aFaire.length - 1; i >= 0; i--) if (aFaire[i].t <= horlogeAnim) { const a = aFaire.splice(i, 1)[0]; a.f(); }
  }

  // Place dans la file : Mateo marche à côté de sa mère, pas derrière elle.
  function rangDe(i) { return i <= 2 ? i : i === 3 ? 2 : i - 1; }
  const MATEO_COTE = 0.92; // distance entre Rosa et Mateo (main dans la main)

  // =====================================================================
  //  Personnages articulés
  // =====================================================================
  const materiaux = {};
  function mat(c) {
    if (!materiaux[c]) materiaux[c] = new THREE.MeshLambertMaterial({ color: c });
    return materiaux[c];
  }
  function maille(geo, couleur, parent, x, y, z) {
    const m = new THREE.Mesh(geo, mat(couleur));
    m.position.set(x || 0, y || 0, z || 0);
    parent.add(m);
    return m;
  }
  function pivot(parent, x, y, z) {
    const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g;
  }

  // o : { haut, bas, peau, chaussures, coiffe, cheveux, jupe, sac, objet, chale, gilet, s }
  function creerPersonnage(o) {
    const s = o.taille / 1.72;
    const racine = new THREE.Group();
    racine.rotation.order = "YXZ";
    const corps = pivot(racine);              // échelle globale
    corps.scale.setScalar(s);
    const bassin = pivot(corps, 0, 0.92, 0);
    const peau = o.peau || 0x6b4a36;

    // Bassin
    const pb = maille(new THREE.SphereGeometry(0.15, 12, 8), o.bas, bassin, 0, 0.0, 0);
    pb.scale.set(1.12, 0.75, 0.8);

    // Jambes : hanche → cuisse → genou → tibia → pied
    const jambes = [];
    [-1, 1].forEach((cote) => {
      const hanche = pivot(bassin, 0.085 * cote, -0.02, 0);
      maille(new THREE.CapsuleGeometry(0.068, 0.32, 4, 8), o.bas, hanche, 0, -0.21, 0);
      const genou = pivot(hanche, 0, -0.44, 0);
      maille(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), o.bas, genou, 0, -0.2, 0);
      const cheville = pivot(genou, 0, -0.44, 0);
      maille(new THREE.BoxGeometry(0.095, 0.07, 0.24), o.chaussures || 0x1a1714, cheville, 0, 0.0, 0.045);
      jambes.push({ hanche, genou, cheville });
    });
    if (o.jupe) {
      const jupe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.55, 14, 1, true), mat(o.jupe));
      jupe.material.side = THREE.DoubleSide;
      jupe.position.y = -0.26; bassin.add(jupe);
    }

    // Haut du corps
    const haut = pivot(bassin, 0, 0.02, 0);
    const ventre = maille(new THREE.CapsuleGeometry(0.14, 0.12, 4, 10), o.haut, haut, 0, 0.17, 0);
    ventre.scale.set(1.05, 1, 0.78);
    const torse = maille(new THREE.CapsuleGeometry(0.16, 0.16, 4, 10), o.haut, haut, 0, 0.38, 0);
    torse.scale.set(1.18, 1, 0.74);
    if (o.gilet) {
      maille(new THREE.BoxGeometry(0.38, 0.32, 0.28), o.gilet, haut, 0, 0.36, 0);
      maille(new THREE.BoxGeometry(0.4, 0.06, 0.3), 0x15140f, haut, 0, 0.04, 0);          // ceinture
      maille(new THREE.BoxGeometry(0.07, 0.16, 0.1), 0x15140f, haut, 0.2, -0.02, 0.02);  // étui
    }
    if (o.chale) {
      const ch = maille(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 14, 1, true), o.chale, haut, 0, 0.47, 0);
      ch.material.side = THREE.DoubleSide; ch.scale.z = 0.8;
    }
    maille(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 8), peau, haut, 0, 0.6, 0);

    // Tête
    const tete = pivot(haut, 0, 0.7, 0);
    const crane = maille(new THREE.SphereGeometry(0.1, 16, 12), peau, tete);
    crane.scale.set(0.92, 1.1, 1);
    maille(new THREE.BoxGeometry(0.025, 0.04, 0.03), peau, tete, 0, -0.005, 0.1);  // nez
    const coulCheveux = o.couleurCheveux || 0x0d0b0a;
    if (o.cheveux !== "chauve") {
      const ch = maille(new THREE.SphereGeometry(0.104, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), coulCheveux, tete, 0, 0.012, -0.008);
      ch.scale.set(0.95, 1.1, 1.02);
    }
    if (o.cheveux === "longs") {
      const l = maille(new THREE.SphereGeometry(0.1, 10, 10), coulCheveux, tete, 0, -0.07, -0.06);
      l.scale.set(1.05, 1.5, 0.55);
    }
    if (o.cheveux === "tresse") {
      for (let i = 0; i < 6; i++) maille(new THREE.SphereGeometry(0.028 - i * 0.002, 8, 6), coulCheveux, haut, 0, 0.66 - i * 0.055, -0.13 - (i < 2 ? i * 0.02 : 0.03));
    }
    if (o.coiffe === "casquette") {
      const c = maille(new THREE.SphereGeometry(0.108, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), o.couleurCoiffe || 0x22201c, tete, 0, 0.02, 0);
      c.scale.set(0.98, 0.9, 1.05);
      const v = maille(new THREE.BoxGeometry(0.17, 0.012, 0.09), o.couleurCoiffe || 0x22201c, tete, 0, 0.035, 0.12);
      v.rotation.x = 0.12;
    }
    if (o.coiffe === "sombrero") {
      maille(new THREE.CylinderGeometry(0.2, 0.21, 0.012, 20), 0x6d5a3e, tete, 0, 0.07, 0);
      maille(new THREE.CylinderGeometry(0.085, 0.1, 0.1, 14), 0x6d5a3e, tete, 0, 0.12, 0);
    }
    if (o.coiffe === "capuche") {
      const c = maille(new THREE.SphereGeometry(0.125, 12, 10), o.haut, tete, 0, 0.0, -0.035);
      c.scale.set(1.05, 1.1, 1.05);
      maille(new THREE.TorusGeometry(0.11, 0.035, 6, 14), o.haut, haut, 0, 0.6, -0.02).rotation.x = Math.PI / 2;
    }

    // Bras : épaule → bras → coude → avant-bras → main
    const bras = [];
    [-1, 1].forEach((cote) => {
      const epaule = pivot(haut, 0.2 * cote, 0.5, 0);
      maille(new THREE.SphereGeometry(0.06, 8, 6), o.haut, epaule);
      maille(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8), o.haut, epaule, 0, -0.14, 0);
      const coude = pivot(epaule, 0, -0.29, 0);
      maille(new THREE.CapsuleGeometry(0.04, 0.19, 4, 8), o.manches === "courtes" ? peau : o.haut, coude, 0, -0.12, 0);
      const poignet = pivot(coude, 0, -0.26, 0);
      const main = maille(new THREE.BoxGeometry(0.06, 0.09, 0.035), peau, poignet, 0, -0.035, 0);
      main.scale.set(1, 1, 1);
      bras.push({ epaule, coude, poignet, cote });
    });

    // Sac à dos
    if (o.sac) {
      const dims = { grand: [0.3, 0.4, 0.17], petit: [0.24, 0.3, 0.13], ecole: [0.22, 0.27, 0.1] }[o.sac];
      maille(new THREE.BoxGeometry(...dims), o.couleurSac || 0x1d1c19, haut, 0, 0.36, -0.12 - dims[2] / 2);
      [-1, 1].forEach((c) => maille(new THREE.BoxGeometry(0.035, 0.3, 0.02), o.couleurSac || 0x1d1c19, haut, 0.09 * c, 0.4, 0.115));
    }
    // Objet tenu dans la main droite
    const mainD = bras[1].poignet;
    let bidon = null;
    if (o.objet === "bidon") {
      bidon = maille(new THREE.BoxGeometry(0.15, 0.22, 0.11), 0x0c0c0c, mainD, 0, -0.16, 0);
      maille(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 6), 0x0c0c0c, mainD, 0.04, -0.03, 0);
    }
    let baton = null;
    if (o.objet === "baton") baton = maille(new THREE.CylinderGeometry(0.014, 0.018, 1.05, 6), 0x5a4630, mainD, 0, -0.4, 0.02);
    if (o.objet === "sac") maille(new THREE.BoxGeometry(0.2, 0.22, 0.08), 0x3a3128, mainD, 0, -0.14, 0);
    if (o.objet === "lampe") {
      const l = maille(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8), 0x111111, mainD, 0, -0.06, 0.06);
      l.rotation.x = Math.PI / 2;
    }

    scene.add(racine);
    return {
      racine, corps, bassin, haut, tete, bras, jambes, s, baton, bidon,
      pose: Object.assign({}, POSES.marche),
      cible: "marche", cycle: alea() * 6, vitesse: 0, distPas: 0, yExtra: 0,
      x: 0, z: 0, cap: 0,
    };
  }

  // Poses : valeurs cibles des articulations (en radians, hauteurs en mètres avant échelle).
  //  bas      : descente du bassin       couche : 0 debout → 1 à plat ventre
  //  penche   : inclinaison du buste      hanche : flexion des cuisses (vers l'avant)
  //  genou    : flexion des genoux        bAvant : bras vers l'avant / le haut
  //  bCote    : bras écartés              coude  : flexion des coudes   cZ : coudes levés (mains en l'air)
  const POSES = {
    marche:   { bas: 0,    couche: 0, penche: 0.07, hanche: 0,    genou: 0,    bAvant: 0,    bCote: 0.08, coude: 0.25, cZ: 0, tete: 0 },
    debout:   { bas: 0,    couche: 0, penche: 0,    hanche: 0,    genou: 0,    bAvant: 0,    bCote: 0.06, coude: 0.1,  cZ: 0, tete: 0 },
    accroupi: { bas: 0.6,  couche: 0, penche: 0.5,  hanche: 1.7,  genou: 2.3,  bAvant: 0.5,  bCote: 0.15, coude: 0.7,  cZ: 0, tete: -0.3 },
    couche:   { bas: 0,    couche: 1, penche: 0,    hanche: 0,    genou: 0.15, bAvant: 2.6,  bCote: 0.35, coude: 1.9,  cZ: 0, tete: -0.6 },
    genoux:   { bas: 0.44, couche: 0, penche: -0.04,hanche: 0,    genou: 1.55, bAvant: 0,    bCote: 1.45, coude: 0,    cZ: 1.5, tete: 0.05 },
    chute:    { bas: 0.44, couche: 0, penche: 0.8,  hanche: 0.3,  genou: 1.55, bAvant: 1.1,  bCote: 0.1,  coude: 0.2,  cZ: 0, tete: 0.4 },
    assis:    { bas: 0.66, couche: 0, penche: 0.25, hanche: 1.75, genou: 2.0,  bAvant: 0.9,  bCote: 0.12, coude: 1.0,  cZ: 0, tete: 0.1 },
    dort:     { bas: 0.66, couche: 0, penche: 0.55, hanche: 1.75, genou: 2.0,  bAvant: 0.6,  bCote: 0.1,  coude: 1.2,  cZ: 0, tete: 0.6 },
    grimpe:   { bas: 0,    couche: 0, penche: 0.1,  hanche: 0.6,  genou: 0.9,  bAvant: 2.7,  bCote: 0.1,  coude: 0.3,  cZ: 0, tete: -0.4 },
  };

  // Vitesse de transition de chaque pose (plus lent = plus naturel pour les grands mouvements).
  const VITESSE_POSE = { couche: 2.0, genoux: 2.2, assis: 2.2, dort: 1.2, accroupi: 3.2, chute: 3.5, grimpe: 4, marche: 3, debout: 2.4 };

  function animerPersonnage(p, dt) {
    const c = POSES[p.cible];
    const k = 1 - Math.exp(-dt * (VITESSE_POSE[p.cible] || 3));
    for (const cle in c) p.pose[cle] += (c[cle] - p.pose[cle]) * k;
    const P = p.pose;
    // Le bâton n'apparaît que debout (assis ou couché, il pourrait passer pour une arme).
    if (p.baton) p.baton.visible = p.cible === "marche" || p.cible === "debout" || p.cible === "chute";
    // Vitesse lissée : pas d'à-coups entre l'arrêt et la marche.
    p.vLisse = (p.vLisse || 0) + (p.vitesse - (p.vLisse || 0)) * (1 - Math.exp(-dt * 5));
    const v = Math.max(0, p.vLisse);
    const amp = Math.min(1, v / 1.2) * (1 - P.couche);
    const grimpe = p.cible === "grimpe";
    // Cadence liée à la distance parcourue et à la taille (un enfant fait des pas plus courts).
    const foulee = 0.62 * p.s;
    p.cycle += grimpe ? 4 * dt : (v * dt / foulee) * Math.PI;
    const cy = p.cycle;
    const t = horlogeAnim;
    const ph0 = p.phaseRepos || (p.phaseRepos = alea() * 10);

    // Respiration et petits mouvements au repos
    const repos = 1 - amp;
    const souffle = Math.sin(t * (1.4 + (p.essoufle || 0)) + ph0);
    p.haut.scale.set(1, 1 + souffle * 0.012 * repos, 1 + souffle * 0.02 * repos);

    // À plat ventre : le corps pivote autour des pieds et se pose au sol.
    const yCouche = P.couche * 0.16 * p.s;
    const rebond = (1 - Math.cos(2 * cy)) * 0.5 * 0.035 * amp; // le bassin monte deux fois par cycle
    p.racine.position.set(p.x, hauteur(p.x, p.z) + p.yExtra - P.bas * p.s + yCouche + rebond, p.z);
    p.racine.rotation.set(P.couche * Math.PI / 2, p.cap, 0);
    p.bassin.rotation.set(0, Math.sin(cy) * 0.12 * amp, Math.sin(cy) * 0.05 * amp + Math.sin(t * 0.4 + ph0) * 0.015 * repos);
    p.haut.rotation.set(P.penche + Math.sin(2 * cy) * 0.02 * amp, -Math.sin(cy) * 0.16 * amp, -Math.sin(cy) * 0.03 * amp);

    // Tête : stabilisée pendant la marche, tournée vers l'interlocuteur quand on parle.
    let lacetTete = Math.sin(t * 0.23 + ph0) * 0.25 * repos + Math.sin(cy) * 0.12 * amp;
    let hocheTete = 0;
    if (p.parleJusqua > t) {
      hocheTete = Math.sin(t * 9 + ph0) * 0.035 + Math.sin(t * 3.1) * 0.03;
      if (p.regardeJoueur && joueur) {
        let d = Math.atan2(joueur.x - p.x, joueur.z - p.z) - p.cap;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        lacetTete = Math.max(-1.1, Math.min(1.1, d));
      }
    }
    p.teteLacet = (p.teteLacet || 0) + (lacetTete - (p.teteLacet || 0)) * (1 - Math.exp(-dt * 4));
    p.tete.rotation.set(P.tete - P.penche * 0.5 + hocheTete, p.teteLacet, 0);

    p.jambes.forEach((j, i) => {
      const ph = i ? Math.PI : 0;
      const s1 = Math.sin(cy + ph);
      // Cuisse : balancier ; genou : se plie pendant la phase d'élan ; cheville : attaque du talon.
      j.hanche.rotation.x = -P.hanche + s1 * 0.4 * amp + (grimpe ? s1 * 0.4 : 0);
      const elan = Math.max(0, Math.sin(cy + ph + 1.2));
      j.genou.rotation.x = P.genou + (elan * elan * 0.9 + 0.08) * amp;
      j.cheville.rotation.x = -P.genou * 0.25 - P.couche * 0.9 + (Math.cos(cy + ph) * 0.18 - elan * 0.25) * amp;
    });
    p.bras.forEach((b, i) => {
      const ph = i ? 0 : Math.PI;
      const s1 = Math.sin(cy + ph);
      b.epaule.rotation.x = -P.bAvant + s1 * 0.3 * amp + (grimpe ? s1 * 0.25 : 0);
      b.epaule.rotation.z = b.cote * (P.bCote + 0.04 * amp);
      b.coude.rotation.x = -P.coude - (0.15 + Math.max(0, s1) * 0.3) * amp;
      b.coude.rotation.z = b.cote * P.cZ;
    });
  }

  // Oriente un bras (épaule) pour que la main aille vers un point du monde.
  const _bas = new THREE.Vector3(0, -1, 0), _loc = new THREE.Vector3();
  function pointerBras(p, iBras, cible, flexion) {
    const b = p.bras[iBras];
    p.racine.updateMatrixWorld(true);
    _loc.copy(cible);
    b.epaule.parent.worldToLocal(_loc);
    _loc.sub(b.epaule.position).normalize();
    b.epaule.quaternion.setFromUnitVectors(_bas, _loc);
    b.coude.rotation.set(-(flexion || 0.12), 0, 0);
  }
  const _ps = new THREE.Vector3(), _pm = new THREE.Vector3(), _mil = new THREE.Vector3();
  // Rosa tient la main de Mateo.
  function tenirLaMain(dt) {
    const rosa = groupe[2], mateo = groupe[3];
    const ok = ["marche", "debout"].includes(rosa.cible) && ["marche", "debout"].includes(mateo.cible)
      && !rosa.fuit && Math.hypot(rosa.x - mateo.x, rosa.z - mateo.z) < 1.4;
    if (!ok) return;
    rosa.racine.updateMatrixWorld(true); mateo.racine.updateMatrixWorld(true);
    rosa.bras[0].epaule.getWorldPosition(_ps);
    mateo.bras[1].epaule.getWorldPosition(_pm);
    _mil.lerpVectors(_ps, _pm, 0.48);
    _mil.y = hauteur(_mil.x, _mil.z) + 0.84;
    // Les deux mains se balancent ensemble, doucement, au rythme des pas.
    const f = Math.sin(rosa.cycle) * 0.05 * Math.min(1, (rosa.vLisse || 0));
    _mil.x += Math.sin(rosa.cap) * f; _mil.z += Math.cos(rosa.cap) * f;
    pointerBras(rosa, 0, _mil, 0.1);
    pointerBras(mateo, 1, _mil, 0.05);
  }

  // =====================================================================
  //  Décor
  // =====================================================================
  function construireDecor() {
    const geo = new THREE.PlaneGeometry(1400, 1500, 260, 280);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, hauteur(pos.getX(i), pos.getZ(i) - 300));
    geo.computeVertexNormals();
    const sol = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x8c8272 }));
    sol.position.z = -300;
    scene.add(sol);

    // Ciel
    ciel = new THREE.Group();
    const nb = 2600, etoiles = new Float32Array(nb * 3);
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

    // Lumières de la ville, très loin au nord (révélées au moment de l'espoir)
    const nbL = 420, pl = new Float32Array(nbL * 3);
    for (let i = 0; i < nbL; i++) {
      const x = (alea() - 0.5) * (alea() < 0.7 ? 260 : 520);
      pl[i * 3] = x; pl[i * 3 + 1] = 4 + alea() * alea() * 18; pl[i * 3 + 2] = -1150 - alea() * 120;
    }
    const gL = new THREE.BufferGeometry();
    gL.setAttribute("position", new THREE.BufferAttribute(pl, 3));
    lumieresVille = new THREE.Points(gL, new THREE.PointsMaterial({ color: 0xffb36b, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0 }));
    scene.add(lumieresVille);

    // Végétation
    const buisson = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 0), mat(0x2b2f25), 2200);
    const rocher = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.45, 0), mat(0x504a40), 1100);
    const o = new THREE.Object3D();
    for (let i = 0; i < 2200; i++) {
      const x = (alea() - 0.5) * 520, z = 90 - alea() * 800;
      const e = 0.4 + alea() * 1.3;
      o.position.set(x, hauteur(x, z) + 0.15 * e, z);
      o.scale.set(e * (0.8 + alea() * 0.6), e * 0.7, e);
      o.rotation.set(0, alea() * 6, 0);
      o.updateMatrix(); buisson.setMatrixAt(i, o.matrix);
    }
    for (let i = 0; i < 1100; i++) {
      const x = (alea() - 0.5) * 520, z = 90 - alea() * 800;
      const e = 0.3 + alea() * 1.4;
      o.position.set(x, hauteur(x, z), z);
      o.scale.set(e, e * 0.6, e * (0.7 + alea() * 0.6));
      o.rotation.set(alea(), alea() * 6, alea());
      o.updateMatrix(); rocher.setMatrixAt(i, o.matrix);
    }
    scene.add(buisson, rocher);

    const mSag = 0x26302a;
    for (let i = 0; i < 120; i++) {
      const x = (alea() - 0.5) * 480, z = 80 - alea() * 780;
      const surChemin = Math.abs(x - pointChemin(Math.min(1, Math.max(0, (8 - z) / 620))).x) < 5;
      if (surChemin || Math.abs(z - MUR_Z) < 6) continue;
      const g = new THREE.Group();
      const h = 4 + alea() * 6;
      maille(new THREE.CylinderGeometry(0.32, 0.38, h, 10), mSag, g, 0, h / 2, 0);
      const nbBras = 1 + Math.floor(alea() * 3);
      for (let b = 0; b < nbBras; b++) {
        const cote = b % 2 ? 1 : -1, hb = 1.4 + alea() * 2, yb = h * (0.35 + alea() * 0.3);
        maille(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 8), mSag, g, cote * 0.6, yb, 0).rotation.z = Math.PI / 2;
        maille(new THREE.CylinderGeometry(0.22, 0.24, hb, 8), mSag, g, cote * 1.0, yb + hb / 2, 0);
      }
      g.position.set(x, hauteur(x, z) - 0.2, z);
      g.rotation.y = alea() * 6;
      scene.add(g);
    }

    // Le mur frontalier
    const nbBarreaux = 900;
    const barreaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 5.6, 0.14), mat(0x3d3631), nbBarreaux);
    for (let i = 0; i < nbBarreaux; i++) {
      const x = -160 + i * 0.36;
      o.position.set(x, hauteur(x, MUR_Z) + 2.4, MUR_Z);
      o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0);
      o.updateMatrix(); barreaux.setMatrixAt(i, o.matrix);
    }
    scene.add(barreaux);
    // Les échelles, de chaque côté
    const hMur = hauteur(ECHELLE_X, MUR_Z);
    [1, -1].forEach((cote) => {
      const e = new THREE.Group();
      [-0.22, 0.22].forEach((x) => maille(new THREE.BoxGeometry(0.05, 5.6, 0.05), 0x5c5850, e, x, 2.8, 0));
      for (let y = 0.3; y < 5.4; y += 0.32) maille(new THREE.BoxGeometry(0.44, 0.03, 0.03), 0x5c5850, e, 0, y, 0);
      e.position.set(ECHELLE_X, hMur - 0.1, MUR_Z + cote * 0.55);
      e.rotation.x = -cote * 0.12;
      scene.add(e);
    });

    // Objets abandonnés le long du chemin
    for (let i = 0; i < 50; i++) {
      const p = pointChemin(alea() * 0.8);
      const x = p.x + (alea() - 0.5) * 10, z = p.z + (alea() - 0.5) * 10;
      const b = maille(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8), 0x111111, scene, x, hauteur(x, z) + 0.05, z);
      b.rotation.z = Math.PI / 2; b.rotation.y = alea() * 6;
    }
    // Un sac à dos abandonné, une petite chaussure
    [[60, 0x2a2622, [0.3, 0.4, 0.15]], [118, 0x3a3a52, [0.1, 0.07, 0.18]]].forEach(([sAb, c, d]) => {
      const p = pointS(sAb);
      const m = maille(new THREE.BoxGeometry(...d), c, scene, p.x + 1.4, hauteur(p.x + 1.4, p.z) + d[1] / 2, p.z);
      m.rotation.y = 0.7;
    });

    // La croix, avec des fleurs et une bougie
    const pc = pointS(S_CROIX);
    const cx = pc.x + 2.2, cz = pc.z;
    croix = new THREE.Group();
    maille(new THREE.BoxGeometry(0.07, 1.0, 0.05), 0x6b5236, croix, 0, 0.5, 0);
    maille(new THREE.BoxGeometry(0.5, 0.07, 0.05), 0x6b5236, croix, 0, 0.75, 0);
    [0xb04a5a, 0xd0a040, 0xe0e0d0, 0x8a3a8a].forEach((c, i) => maille(new THREE.SphereGeometry(0.06, 6, 5), c, croix, -0.25 + i * 0.16, 0.05, 0.15));
    maille(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), 0xddd4c0, croix, 0.18, 0.06, 0.25);
    flamme = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffc060, fog: false }));
    flamme.position.set(0.18, 0.15, 0.25); croix.add(flamme);
    const lueur = new THREE.PointLight(0xff9a40, 1.2, 6, 1.5);
    lueur.position.set(0.18, 0.3, 0.3); croix.add(lueur);
    croix.userData.lueur = lueur;
    croix.position.set(cx, hauteur(cx, cz), cz);
    croix.rotation.y = -Math.PI / 2;
    scene.add(croix);

    // Voiture lointaine (fausse alerte) : deux phares sur une route invisible
    voitureLoin = new THREE.Group();
    [-0.7, 0.7].forEach((x) => {
      const ph = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false }));
      ph.position.x = x; voitureLoin.add(ph);
    });
    voitureLoin.visible = false;
    scene.add(voitureLoin);
  }

  function pointChemin(u) { return chemin.getPointAt(Math.min(0.999, Math.max(0, u))); }
  function pointS(s) { return pointChemin(s / longueur); }
  function capS(s) {
    const t = chemin.getTangentAt(Math.min(0.999, Math.max(0, s / longueur)));
    return Math.atan2(t.x, t.z);
  }

  // =====================================================================
  //  Hélicoptère, pick-up, faisceaux
  // =====================================================================
  function creerFaisceau(couleur, opacite) {
    const g = new THREE.ConeGeometry(1, 1, 24, 1, true);
    g.translate(0, -0.5, 0);
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
    helico = new THREE.Group();
    const mH = 0x1a1c1e;
    maille(new THREE.SphereGeometry(1.6, 12, 8), mH, helico).scale.set(1, 0.8, 1.6);
    maille(new THREE.CylinderGeometry(0.2, 0.35, 6, 6), mH, helico, 0, 0, 4.5).rotation.x = Math.PI / 2;
    helico.userData.rotor = maille(new THREE.BoxGeometry(11, 0.05, 0.3), mH, helico, 0, 1.4, 0);
    const feuRouge = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2020, fog: false }));
    feuRouge.position.set(0, -1.1, 0); helico.add(feuRouge);
    helico.userData.feu = feuRouge;
    helico.visible = false;
    scene.add(helico);

    spotHelico = new THREE.SpotLight(0xeef2ff, 0, 140, 0.2, 0.45, 0);
    scene.add(spotHelico, spotHelico.target);
    faisceauHelico = creerFaisceau(0xdfe6ff, 0.07);

    pickup = new THREE.Group();
    const mBlanc = 0xcfd0c8;
    maille(new THREE.BoxGeometry(2.1, 1.0, 5.2), mBlanc, pickup, 0, 0.9, 0);
    maille(new THREE.BoxGeometry(2.0, 0.9, 2.2), mBlanc, pickup, 0, 1.8, 0.6);
    maille(new THREE.BoxGeometry(2.14, 0.18, 5.22), 0x23452e, pickup, 0, 0.95, 0);
    [-0.9, 0.9].forEach((x) => [-1.6, 1.6].forEach((z) => {
      const r = maille(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), 0x0e0e0e, pickup, x, 0.42, z);
      r.rotation.z = Math.PI / 2;
    }));
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

    for (let i = 0; i < 3; i++) {
      const p = creerPersonnage({
        taille: 1.8 + i * 0.03, haut: 0x3b4636, bas: 0x3b4636, gilet: 0x23291f, peau: [0x9c7a62, 0x6b4a36, 0xb08a70][i],
        coiffe: "casquette", couleurCoiffe: 0x2b3326, chaussures: 0x0f0f0f, objet: "lampe",
      });
      p.racine.visible = false;
      const lampe = new THREE.SpotLight(0xffffff, 0, 40, 0.22, 0.5, 0);
      scene.add(lampe, lampe.target);
      p.lampe = lampe;
      p.faisceau = creerFaisceau(0xffffff, 0.05);
      agents.push(p);
    }
  }

  // ---------- Les mains du joueur (vues à la première personne) ----------
  const POS_MAINS = {
    cache:  [[-0.3, -0.9, -0.4, 0], [0.3, -0.9, -0.4, 0]],
    haut:   [[-0.34, -0.12, -0.5, 0.1], [0.34, -0.12, -0.5, 0.1]],
    sol:    [[-0.22, -0.27, -0.42, -1.45], [0.22, -0.27, -0.42, -1.45]],
    tendre: [[-0.3, -0.9, -0.4, 0], [0.14, -0.28, -0.36, -1.35]],
    boire:  [[-0.3, -0.9, -0.4, 0], [0.05, -0.16, -0.26, -0.5]],
    echelle:[[-0.2, -0.05, -0.35, 0.2], [0.2, -0.2, -0.35, 0.2]],
  };
  function construireMains() {
    mains = [];
    scene.add(camera);
    [0, 1].forEach((i) => {
      const g = new THREE.Group();
      maille(new THREE.CapsuleGeometry(0.035, 0.24, 4, 8), 0x2a2724, g, 0, -0.1, 0);   // manche
      maille(new THREE.BoxGeometry(0.07, 0.1, 0.035), 0x6b4a36, g, 0, 0.1, 0);          // main
      [-0.024, -0.008, 0.008, 0.024].forEach((x) => maille(new THREE.BoxGeometry(0.013, 0.05, 0.015), 0x6b4a36, g, x, 0.17, 0));
      maille(new THREE.BoxGeometry(0.014, 0.04, 0.016), 0x6b4a36, g, i ? -0.04 : 0.04, 0.11, 0.01).rotation.z = i ? 0.6 : -0.6;
      if (i === 1) {
        // Le bidon que Julio tend : visible seulement pendant qu'on boit.
        const b = maille(new THREE.BoxGeometry(0.14, 0.21, 0.1), 0x0c0c0c, g, -0.02, 0.17, -0.06);
        maille(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 8), 0x0c0c0c, b, 0.03, 0.12, 0);
        b.visible = false;
        mains.bidon = b;
      }
      g.position.set(0, -0.9, -0.4);
      camera.add(g);
      mains.push(g);
    });
    mains.etat = "cache";
  }
  // Le geste de boire, image par image : prendre le bidon, le porter à la bouche,
  // pencher la tête en arrière, boire, le rendre.
  const DUREE_BOIRE = 4.2;
  function cibleBoire(u) {
    const cle = [
      [0.00, [0.30, -0.70, -0.45, -0.2], 0],
      [0.14, [0.16, -0.30, -0.50, -1.25], 0],    // la main se tend vers Julio
      [0.26, [0.16, -0.30, -0.48, -1.2], 0],     // elle saisit le bidon
      [0.42, [0.04, -0.21, -0.23, -0.4], 0.32],  // le bidon monte à la bouche, la tête bascule
      [0.72, [0.03, -0.19, -0.21, 0.0], 0.42],   // on boit
      [0.84, [0.14, -0.28, -0.46, -1.2], 0.05],  // on le rend
      [1.00, [0.30, -0.90, -0.40, 0], 0],
    ];
    let i = 0; while (i < cle.length - 2 && u > cle[i + 1][0]) i++;
    const [u0, a, t0] = cle[i], [u1, b, t1] = cle[i + 1];
    let k = Math.min(1, Math.max(0, (u - u0) / (u1 - u0)));
    k = k * k * (3 - 2 * k); // lissage
    return { main: a.map((v, j) => v + (b[j] - v) * k), tete: t0 + (t1 - t0) * k, bidon: u > 0.24 && u < 0.86 };
  }
  function majMains(dt) {
    const enGeste = gesteMain && horlogeAnim < gesteFin;
    if (enGeste && gesteMain === "boire") {
      const u = (horlogeAnim - gesteDebut) / DUREE_BOIRE;
      const c = cibleBoire(u);
      mains.bidon.visible = c.bidon;
      if (julio && julio.bidon) julio.bidon.visible = !c.bidon;
      joueur.teteGeste = c.tete;
      const m = mains[1];
      m.position.set(c.main[0], c.main[1], c.main[2]); m.rotation.x = c.main[3];
      const g = mains[0], k = 1 - Math.exp(-dt * 6);
      g.position.y += (-0.9 - g.position.y) * k;
      return;
    }
    if (mains.bidon) mains.bidon.visible = false;
    if (julio && julio.bidon) julio.bidon.visible = true;
    joueur.teteGeste = 0;
    const etat = enGeste ? gesteMain : mains.etat;
    const cibles = POS_MAINS[etat];
    const k = 1 - Math.exp(-dt * 6);
    mains.forEach((m, i) => {
      const c = cibles[i];
      m.position.x += (c[0] - m.position.x) * k;
      m.position.y += (c[1] - m.position.y) * k;
      m.position.z += (c[2] - m.position.z) * k;
      m.rotation.x += (c[3] - m.rotation.x) * k;
    });
  }
  function geste(nom, duree) { gesteMain = nom; gesteDebut = horlogeAnim; gesteFin = horlogeAnim + duree; }

  // Julio tend le bidon vers le joueur tant que l'eau est offerte.
  const _cible = new THREE.Vector3();
  function majJulioEau() {
    if (!julio || !eauOfferte || evenements.repart) return;
    const enTrainDeBoire = gesteMain === "boire" && horlogeAnim < gesteFin;
    if (eauBue && !enTrainDeBoire) return;
    const d = Math.hypot(joueur.x - julio.x, joueur.z - julio.z);
    if (d > 6) return;
    _cible.set(camera.position.x, camera.position.y - 0.45, camera.position.z);
    pointerBras(julio, 1, _cible, 0.25);
    julio.regardeJoueur = true; julio.parleJusqua = Math.max(julio.parleJusqua || 0, horlogeAnim + 0.2);
  }
  function tempsTotal() { return tm + tp + ta + tr; }

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

  // =====================================================================
  //  Interface
  // =====================================================================
  let sousTitreTimer = null;
  const ID_PERSONNAGE = ["guia", "julio", "rosa", "mateo", "yesenia", "ernesto"];
  function dire(cle, chuchote) {
    const r = C.repliques[cle];
    if (!r) return;
    const ton = r.ton || (chuchote ? "chuchote" : "normal");
    // Qui parle, et où est-il ?
    let p = null;
    if (r.qui === "agent") p = agents.find((a) => a.racine.visible) || null;
    else p = groupe[ID_PERSONNAGE.indexOf(r.qui)] || null;
    const pos = p ? { x: p.x, y: hauteur(p.x, p.z), z: p.z } : null;
    const duree = A.parler(r.qui, r.texte, ton, cle, pos) || 2;
    if (p) {
      p.parleJusqua = horlogeAnim + duree;
      // On se tourne vers le joueur pour lui parler, sauf quand on crie ou qu'on chuchote un ordre.
      p.regardeJoueur = !["cri", "presse"].includes(ton) && Math.hypot(p.x - joueur.x, p.z - joueur.z) < 14;
    }
    const langue = window.LANGUE_SOUS_TITRES || "fr";
    sousTitre.textContent = r[langue] || r.texte;
    sousTitre.className = r.qui === "agent" ? "visible agent" : "visible";
    clearTimeout(sousTitreTimer);
    sousTitreTimer = setTimeout(() => { sousTitre.className = ""; }, Math.max(3400, duree * 1000 + 1200));
  }
  function unefois(cle, condition, action) {
    if (!evenements[cle] && condition) { evenements[cle] = true; action(); }
  }
  function montrerInvite(t) {
    // Sur écran tactile, « [E] » devient le bouton « Agir ».
    const texte = tactile && t ? t.replace(/^\[E\]\s*/, "") : t;
    if (invite.textContent !== (texte || "")) invite.textContent = texte || "";
    invite.classList.toggle("visible", !!t);
    if (btnAction) btnAction.classList.toggle("visible", !!t && /^\[E\]/.test(t));
  }

  // ---------- Commandes tactiles ----------
  // Joystick à gauche pour marcher, glisser ailleurs pour regarder, bouton « Agir ».
  let tactile = false, btnAction = null;
  const joy = { id: null, x: 0, y: 0 };
  function installerTactile() {
    tactile = document.body.classList.contains("tactile");
    if (!tactile) return;
    const zone = document.getElementById("tactile");
    zone.classList.add("actif");
    const base = document.getElementById("joystick"), bouton = document.getElementById("joystick-bouton");
    btnAction = document.getElementById("btn-action");
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
        if (t.identifier === joy.id || t.target.closest("button, #joystick, .ecran.visible")) continue;
        regards[t.identifier] = { x: t.clientX, y: t.clientY };
      }
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joy.id) { majJoy(t); continue; }
        const r = regards[t.identifier];
        if (!r || enPause()) continue;
        lacet -= (t.clientX - r.x) * 0.006;
        tangage -= (t.clientY - r.y) * 0.006;
        tangage = Math.max(-1.2, Math.min(1.2, tangage));
        r.x = t.clientX; r.y = t.clientY;
      }
      if (e.cancelable && phase !== "fin") e.preventDefault();
    }, { passive: false });
    const fin = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; bouton.style.transform = ""; }
        delete regards[t.identifier];
      }
    };
    window.addEventListener("touchend", fin);
    window.addEventListener("touchcancel", fin);
    btnAction.addEventListener("touchstart", (e) => { e.preventDefault(); action(); }, { passive: false });
    btnAction.addEventListener("click", () => action());
  }

  function installerEntrees() {
    window.addEventListener("keydown", (e) => {
      touches[e.code] = true;
      if (e.code === "KeyE" || e.code === "Space") action();
    });
    window.addEventListener("keyup", (e) => { touches[e.code] = false; });
    renderer.domElement.addEventListener("click", () => {
      if (!verrouille && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => {
      const avant = verrouille;
      verrouille = document.pointerLockElement === renderer.domElement;
      aide.classList.toggle("visible", !verrouille && phase !== "fin");
      // Échap libère la souris : on met en pause.
      if (avant && !verrouille && phase !== "fin" && window.Pause) window.Pause.activer();
    });
    document.addEventListener("mousemove", (e) => {
      if (!verrouille || enPause()) return;
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
  function enPause() { return window.Pause && window.Pause.actif; }

  // Touche E : selon le moment, monter, aider, boire.
  function action() {
    if (enPause()) return;
    if (phase === "mur" && joueur.etat === "attend" && distEchelle() < 3 && evenements.tousPasses) return franchirJoueur();
    if (phase !== "marche") return;
    if (ernestoEtat === "tombe" && Math.hypot(joueur.x - ernesto.x, joueur.z - ernesto.z) < 3) {
      geste("tendre", 1.8);
      relever(true);
      return;
    }
    if (eauOfferte && !eauBue && Math.hypot(joueur.x - julio.x, joueur.z - julio.z) < 3.2) {
      eauBue = true;
      montrerInvite("");
      geste("boire", DUREE_BOIRE);
      plus_tard(1.6, () => A.gorgees());
      joueur.fatigue = Math.max(0, joueur.fatigue - 0.15);
      plus_tard(3.6, () => dire("eauMerci", true));
    }
  }
  function relever(parJoueur) {
    ernestoEtat = "releve";
    ernesto.cible = "marche";
    montrerInvite("");
    dire(parJoueur ? "aide" : "aideAutre", parJoueur);
  }
  function distEchelle() { return Math.hypot(joueur.x - ECHELLE_X, joueur.z - (MUR_Z + 1.2)); }

  // =====================================================================
  //  Joueur
  // =====================================================================
  function majJoueur(dt) {
    // Montée de l'échelle : trajectoire imposée.
    if (joueur.etat === "grimpe") {
      joueur.tGrimpe += dt;
      const u = Math.min(1, joueur.tGrimpe / 6.5);
      const hm = hauteur(ECHELLE_X, MUR_Z);
      let y, z;
      if (u < 0.45) { const k = u / 0.45; z = MUR_Z + 0.9 - k * 0.5; y = hm + 1.6 + k * 4.4; }
      else if (u < 0.6) { const k = (u - 0.45) / 0.15; z = MUR_Z + 0.4 - k * 0.8; y = hm + 6.0 + Math.sin(k * Math.PI) * 0.3; }
      else { const k = (u - 0.6) / 0.4; z = MUR_Z - 0.4 - k * 0.6; y = hm + 6.0 - k * 4.4; }
      joueur.x = ECHELLE_X; joueur.z = z;
      if (Math.floor(joueur.tGrimpe / 0.55) !== joueur.dernierEchelon) { joueur.dernierEchelon = Math.floor(joueur.tGrimpe / 0.55); if (u < 0.45 || u > 0.6) A.echelon(); }
      tangage += ((u < 0.45 ? 0.5 : u < 0.6 ? -0.3 : -0.4) - tangage) * Math.min(1, dt * 2);
      let diff = 0 - lacet; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
      lacet += diff * Math.min(1, dt * 2);
      camera.position.set(joueur.x, y, joueur.z);
      camera.rotation.set(tangage, lacet, 0, "YXZ");
      if (u >= 1) { joueur.etat = "libre"; mains.etat = "cache"; debutMarche(); }
      return;
    }

    let vitesseMax = 1.9 * (1 - 0.45 * joueur.fatigue);
    if (phase === "marche" && arret && evenements.fausseAlerte && !evenements.fausseFin) vitesseMax = 0.3;
    if (phase === "alerte") vitesseMax = ta > 6 ? 0 : 0.5;
    if (phase === "reve") vitesseMax = 0;

    if (enfoncee("ArrowLeft")) lacet += 1.6 * dt;
    if (enfoncee("ArrowRight")) lacet -= 1.6 * dt;

    let av = 0, lat = 0;
    if (enfoncee("KeyW", "KeyZ", "ArrowUp")) av += 1;
    if (enfoncee("KeyS", "ArrowDown")) av -= 1;
    if (enfoncee("KeyA", "KeyQ")) lat -= 1;
    if (enfoncee("KeyD")) lat += 1;
    // Joystick tactile (analogique : on peut marcher lentement).
    if (joy.id !== null && Math.hypot(joy.x, joy.y) > 0.15) { av += -joy.y; lat += joy.x; }
    const n = Math.max(1, Math.hypot(av, lat));
    const fx = -Math.sin(lacet), fz = -Math.cos(lacet);
    const rx = Math.cos(lacet), rz = -Math.sin(lacet);
    // Vitesse lissée : on démarre et on s'arrête progressivement.
    const kv = 1 - Math.exp(-dt * (av || lat ? 4 : 6));
    joueur.vx = (joueur.vx || 0) + ((fx * av + rx * lat) / n * vitesseMax - (joueur.vx || 0)) * kv;
    joueur.vz = (joueur.vz || 0) + ((fz * av + rz * lat) / n * vitesseMax - (joueur.vz || 0)) * kv;
    let dx = joueur.vx * dt;
    let dz = joueur.vz * dt;

    // Le désert retient : on ne peut pas s'éloigner du groupe.
    const ref = phase === "mur" ? { x: ECHELLE_X, z: MUR_Z + 6 } : groupe[3];
    const rayon = phase === "mur" ? 14 : 45;
    const nx = joueur.x + dx, nz = joueur.z + dz;
    const dRef = Math.hypot(nx - ref.x, nz - ref.z);
    if (dRef > rayon && dRef > Math.hypot(joueur.x - ref.x, joueur.z - ref.z)) { dx *= 0.15; dz *= 0.15; }
    joueur.x += dx; joueur.z += dz;
    // Le mur : on ne le traverse pas, et on ne revient pas en arrière.
    if (phase === "mur") joueur.z = Math.max(MUR_Z + 1.0, joueur.z);
    else joueur.z = Math.min(MUR_Z - 1.0, joueur.z);

    const d = Math.hypot(dx, dz);
    joueur.distPas += d;
    if (joueur.distPas > 0.72) { joueur.distPas = 0; A.pas(0.3 + joueur.fatigue * 0.15); }
    joueur.balance += d * 5.5;

    // Hauteur des yeux : debout, accroupi, à plat ventre, à genoux
    let yeuxCible = 1.62;
    if (phase === "marche" && arret && evenements.fausseAlerte && !evenements.fausseFin) yeuxCible = 0.95;
    if (phase === "marche" && arret && evenements.halte && !evenements.repart) yeuxCible = 0.9;
    if (phase === "alerte") yeuxCible = ta < 2 ? 1.62 : ta < 6 ? 1.0 : ta < 38 ? 0.32 : 0.82;
    if (phase === "reve") yeuxCible = tr > 9 ? 1.62 : 0.82;
    joueur.yeux += (yeuxCible - joueur.yeux) * Math.min(1, dt * (phase === "reve" ? 0.5 : 2.5));

    if (phase === "alerte" && ta > 6 && ta < 38) tangage = Math.max(-0.25, Math.min(0.35, tangage));
    // Pendant l'arrestation, le regard est attiré vers l'agent.
    if (phase === "alerte" && ta > 31) {
      const ag = agents[0];
      const lacetCible = Math.atan2(-(ag.x - joueur.x), -(ag.z - joueur.z));
      let diff = lacetCible - lacet;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      lacet += diff * Math.min(1, dt * 2.2);
      tangage += ((ta > 38 ? 0.25 : 0.12) - tangage) * Math.min(1, dt * 2);
    }

    const y = hauteur(joueur.x, joueur.z) + joueur.yeux + Math.sin(joueur.balance) * 0.03;
    camera.position.set(joueur.x, y, joueur.z);
    joueur.teteLisse = (joueur.teteLisse || 0) + ((joueur.teteGeste || 0) - (joueur.teteLisse || 0)) * (1 - Math.exp(-dt * 5));
    camera.rotation.set(tangage + joueur.teteLisse, lacet, Math.sin(joueur.balance * 0.5) * 0.006, "YXZ");
  }

  // =====================================================================
  //  Le mur
  // =====================================================================
  const POS_ATTENTE = [[-1.2, 25.0], [1.4, 25.6], [-2.6, 26.8], [-0.6, 27.6], [-1.6, 28.0], [2.8, 27.2]];
  function franchir(p, duree) {
    p.franchit = { t: 0, duree };
    p.cible = "grimpe";
  }
  function franchirJoueur() {
    joueur.etat = "grimpe"; joueur.tGrimpe = 0; joueur.dernierEchelon = -1;
    mains.etat = "echelle";
    montrerInvite("");
  }
  function majMur(dt) {
    unefois("murAttente", tm > 4, () => dire("murAttente", true));
    // Chacun passe à son tour, le guide d'abord.
    const ordre = [0, 1, 4, 2, 3, 5]; // guide, Julio, Yesenia, Rosa, Mateo, Ernesto
    ordre.forEach((i, rang) => unefois("passe" + i, tm > 8 + rang * 5.5, () => franchir(groupe[i], i === 5 ? 7 : 5)));
    unefois("murMateo", tm > 8 + 4 * 5.5 - 1, () => dire("murMateo", true));
    unefois("tousPasses", tm > 8 + 5 * 5.5 + 5, () => {});
    if (evenements.tousPasses && joueur.etat === "attend") {
      montrerInvite(distEchelle() < 3 ? "[E] Monter à l'échelle" : "Rejoignez l'échelle");
      if (!evenements.murJoueur) { evenements.murJoueur = tm; dire("murJoueur"); }
      else if (tm - evenements.murJoueur > 14) { evenements.murJoueur = tm; dire("murJoueur"); }
      if (tm > 8 + 5 * 5.5 + 5 + 45) franchirJoueur(); // personne ne reste derrière
    }

    groupe.forEach((p, i) => {
      if (p.franchit) {
        const f = p.franchit;
        f.t += dt;
        const u = Math.min(1, f.t / f.duree);
        const hm = hauteur(ECHELLE_X, MUR_Z);
        if (u < 0.45) { const k = u / 0.45; p.x = ECHELLE_X; p.z = MUR_Z + 0.75 - k * 0.3; p.yExtra = k * 5.0; p.cap = Math.PI; }
        else if (u < 0.6) { p.z = MUR_Z + 0.45 - (u - 0.45) / 0.15 * 0.9; p.yExtra = 5.0; }
        else { const k = (u - 0.6) / 0.4; p.z = MUR_Z - 0.45 - k * 0.3; p.yExtra = 5.0 * (1 - k); p.cap = 0; }
        p.vitesse = 0.8;
        if (u >= 1) { p.franchit = null; p.passe = true; p.yExtra = 0; p.cible = "marche"; }
      } else if (p.passe) {
        const cible = pointS(S_DEPART - ESPACEMENT * rangDe(i));
        if (i === 3) { const c3 = capS(S_DEPART - ESPACEMENT * 2); cible.x -= Math.cos(c3) * MATEO_COTE; cible.z += Math.sin(c3) * MATEO_COTE; }
        const vx = cible.x - p.x, vz = cible.z - p.z, d = Math.hypot(vx, vz);
        const v = d > 0.3 ? 1.3 : 0;
        if (d > 0.01) { p.x += vx / d * v * dt; p.z += vz / d * v * dt; }
        p.cap = d > 0.3 ? Math.atan2(vx, vz) : capS(S_DEPART);
        p.vitesse = v;
        p.cible = d > 0.3 ? "marche" : (i === 3 ? "accroupi" : "debout");
      } else {
        const [x, z] = POS_ATTENTE[i];
        p.x = x; p.z = z;
        p.cap = Math.atan2(ECHELLE_X - x, MUR_Z - z) + Math.sin(tm * 0.3 + i) * 0.3;
        p.vitesse = 0;
        p.cible = i === 3 ? "accroupi" : "debout";
      }
      p.distPas += p.vitesse * dt;
      if (p.distPas > 0.8 && !p.franchit) { p.distPas = 0; A.pasAutre(p.x, hauteur(p.x, p.z), p.z); }
      animerPersonnage(p, dt);
    });
  }

  function debutMarche() {
    phase = "marche"; tp = 0;
    dernierAppel = 6; // laisser le temps de rejoindre le groupe après le mur
    groupe.forEach((p, i) => { p.abscisse = S_DEPART - ESPACEMENT * rangDe(i); p.passe = false; p.cible = "marche"; });
    dire("murApres", true);
  }

  // =====================================================================
  //  La marche
  // =====================================================================
  function dernierDuGroupe() { return groupe[groupe.length - 1]; }

  function majGroupe(dt) {
    const enMarche = phase === "marche";
    if (enMarche) {
      const dernier = dernierDuGroupe();
      const retard = Math.hypot(joueur.x - dernier.x, joueur.z - dernier.z);
      let v = tp > 230 ? 1.1 : 1.25;
      if (retard > 13) v = 0;
      else if (retard > 9) v = 0.5;
      if (arret) v = 0;
      sLeader = Math.min(longueur - 5, sLeader + v * dt);
      if (retard > 13 && !arret && tp - dernierAppel > 16) {
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
        const cibleS = sLeader - ESPACEMENT * rangDe(i);
        const bloque = p === ernesto && ernestoEtat === "tombe";
        const vMax = p === ernesto && ernestoEtat === "releve" ? 1.6 : 1.45;
        const avant = p.abscisse;
        // Accélération et freinage progressifs.
        const vVoulue = bloque ? 0 : Math.max(0, Math.min(vMax, (cibleS - p.abscisse) * 1.4));
        p.vMarche = (p.vMarche || 0) + (vVoulue - (p.vMarche || 0)) * (1 - Math.exp(-dt * 2.5));
        p.abscisse = Math.min(Math.max(cibleS, p.abscisse), p.abscisse + p.vMarche * dt);
        const pt = pointS(p.abscisse);
        const decal = Math.sin(i * 1.7 + p.abscisse * 0.05) * 0.9;
        const c = capS(p.abscisse);
        p.x = pt.x + Math.cos(c) * decal; p.z = pt.z - Math.sin(c) * decal;
        p.cap = c + (p.regard || 0);
        p.vitesse = (p.abscisse - avant) / Math.max(dt, 1e-4);
        p.distPas += p.abscisse - avant;
        if (i === 3) {
          // Mateo, main dans la main avec sa mère (la main libre : l'autre porte un sac).
          const rosa = groupe[2];
          p.abscisse = rosa.abscisse;
          p.x = rosa.x - Math.cos(rosa.cap) * MATEO_COTE; p.z = rosa.z + Math.sin(rosa.cap) * MATEO_COTE;
          p.cap = rosa.cap; p.vitesse = rosa.vitesse;
        }
      } else {
        p.vitesse *= 0.9;
        if (p.versSol) {
          const vx = p.versSol.x - p.x, vz = p.versSol.z - p.z, d = Math.hypot(vx, vz);
          if (d > 0.4) {
            const v = Math.min(3.2, d * 2);
            p.x += vx / d * v * dt; p.z += vz / d * v * dt;
            p.cap = Math.atan2(vx, vz); p.vitesse = v;
          } else {
            p.cap = p.versSol.cap; p.versSol = null;
            if (p.cible === "accroupi") p.cible = "couche";
          }
        }
        if (phase === "alerte" && ta > 38 && pickup.visible) {
          const c = Math.atan2(pickup.position.x - p.x, pickup.position.z - p.z);
          let diff = c - p.cap; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
          p.cap += diff * Math.min(1, dt);
        }
      }
      if (p.distPas > 0.8) {
        p.distPas = 0;
        if (Math.hypot(p.x - joueur.x, p.z - joueur.z) < 25) A.pasAutre(p.x, hauteur(p.x, p.z), p.z);
      }
      animerPersonnage(p, dt);
    });
  }

  // Le déroulé de la marche, seconde par seconde.
  function scenarioMarche() {
    const ev = (cle, t, f) => unefois(cle, tp > t, f);
    // --- Première marche : calme, présentations ---
    ev("depart", 7, () => dire("depart", true));
    ev("enfant", 28, () => dire("enfant"));
    ev("mere", 32, () => dire("mere", true));
    ev("yesenia1", 52, () => dire("yesenia1", true));
    ev("yesenia2", 60, () => dire("yesenia2", true));
    ev("julio1", 84, () => dire("julio1", true));
    ev("coyotes", 108, () => { const g = groupe[0]; A.coyotes(g.x - 120, g.z - 90); });
    ev("coyoteEnfant", 113, () => dire("coyoteEnfant"));
    ev("coyoteMere", 117, () => dire("coyoteMere", true));
    ev("coyotes2", 135, () => { const g = groupe[0]; A.coyotes(g.x + 140, g.z - 40); });
    // La croix : quand le guide passe à sa hauteur
    unefois("cruz1", groupe[4].abscisse > S_CROIX - 4, () => { dire("cruz1", true); groupe[4].regard = 0.9; });
    unefois("cruz2", evenements.cruz1 && groupe[2].abscisse > S_CROIX + 1, () => { dire("cruz2", true); groupe[4].regard = 0; });

    // --- La halte ---
    ev("halte", 160, () => {
      arret = true; dire("halte", true);
      groupe.forEach((p, i) => plus_tard(0.6 + i * 0.45, () => { if (phase === "marche" && arret) p.cible = "assis"; }));
    });
    ev("eau", 170, () => { dire("eau", true); eauOfferte = true; });
    if (eauOfferte && !eauBue && !evenements.repart) {
      const d = Math.hypot(joueur.x - julio.x, joueur.z - julio.z);
      montrerInvite(d < 3.2 ? "[E] Boire" : "");
    }
    ev("berceuse", 182, () => { dire("berceuse", true); groupe[3].cible = "dort"; });
    ev("ernestoHalte", 196, () => dire("ernestoHalte", true));
    ev("repart", 214, () => {
      dire("repart", true); arret = false; eauOfferte = false; montrerInvite("");
      groupe.forEach((p) => (p.cible = "marche"));
      A.setVent(0.3); A.tension(0.05);
    });

    // --- Deuxième marche : froid, soif, peur ---
    ev("rythme", 226, () => dire("rythme", true));
    ev("froid", 240, () => dire("froid"));
    ev("soif", 256, () => dire("soif"));
    ev("soifReponse", 261, () => dire("soifReponse", true));
    ev("fausseAlerte", 276, () => {
      arret = true; dire("fausseAlerte");
      groupe.forEach((p) => (p.cible = "accroupi"));
      A.coeur(true); A.setPeur(0.8); A.tension(0.12);
      const g = groupe[0];
      voitureLoin.visible = true;
      voitureLoin.userData = { x0: g.x - 260, x1: g.x + 260, z: g.z - 110, t0: tp };
      A.voiture(voitureLoin.userData.x0, voitureLoin.userData.z);
    });
    if (voitureLoin.visible) {
      const u = (tp - voitureLoin.userData.t0) / 16;
      const x = voitureLoin.userData.x0 + (voitureLoin.userData.x1 - voitureLoin.userData.x0) * u;
      const z = voitureLoin.userData.z;
      voitureLoin.position.set(x, hauteur(x, z) + 0.9, z);
      A.positionVoiture(x, z);
      if (u > 1) { voitureLoin.visible = false; A.voitureFin(); }
    }
    ev("fausseFin", 292, () => {
      dire("fausseFin", true); arret = false;
      groupe.forEach((p) => (p.cible = "marche"));
      A.setPeur(0); A.tension(0.07);
    });
    ev("chute", 316, () => {
      ernestoEtat = "tombe"; ernestoChuteT = tp;
      ernesto.cible = "chute";
      dire("chute");
    });
    if (ernestoEtat === "tombe") {
      const d = Math.hypot(joueur.x - ernesto.x, joueur.z - ernesto.z);
      montrerInvite(d < 3 ? "[E] Tendre la main" : "");
      if (tp - ernestoChuteT > 15) relever(false);
    }

    // --- L'espoir ---
    ev("espoir1", 352, () => {
      dire("espoir1", true);
      A.tension(0); A.setVent(0.18); A.espoir(); A.setFatigue(joueur.fatigue * 0.6);
      groupe[0].regard = 0;
    });
    ev("espoir2", 359, () => dire("espoir2", true));
    ev("espoir3", 364, () => dire("espoir3"));
    ev("espoir4", 368, () => dire("espoir4", true));
    if (evenements.espoir1) lumieresVille.material.opacity = Math.min(1, lumieresVille.material.opacity + 0.004);

    if (tp < 14) aide.classList.add("controles");
    else aide.classList.remove("controles");

    const pret = tp > 384 && ernestoEtat !== "tombe";
    if (pret || sLeader >= longueur - 6) debutAlerte();
  }

  function debutAlerte() {
    phase = "alerte"; ta = 0;
    arret = true;
    montrerInvite("");
    A.espoirCouper();
    const g = groupe[3];
    centreAlerte = new THREE.Vector3(g.x, 0, g.z);
    A.helicoptere();
  }

  // =====================================================================
  //  L'arrestation
  // =====================================================================
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  let helicoDepart, helicoArrivee, pickupDepart, pickupArrivee;

  function scenarioAlerte(dt) {
    const G = centreAlerte;
    A.setPeur(Math.min(1, ta / 12));
    unefois("chut", ta > 0.8, () => {
      dire("chut", true);
      groupe.forEach((p) => { p.cible = "accroupi"; p.vitesse = 0; });
      groupe[0].cible = "debout";
    });
    unefois("cri", ta > 5, () => {
      dire("alerte");
      // Chacun se jette au sol, tout près du joueur.
      const fx = -Math.sin(lacet), fz = -Math.cos(lacet), rx = Math.cos(lacet), rz = -Math.sin(lacet);
      const places = [null, [2.6, 1.2], [3.4, -1.0], [2.2, -2.3], [4.6, 0.3], [1.3, 2.4]]; // [devant, côté]
      groupe.forEach((p, i) => {
        if (!places[i]) return;
        const [av, co] = places[i];
        p.versSol = { x: joueur.x + fx * av + rx * co, z: joueur.z + fz * av + rz * co, cap: lacet + Math.PI + (i % 2 ? 0.3 : -0.25) };
        p.cible = "accroupi";
      });
      mains.etat = "sol";
      A.coeur(true); A.tension(0.16);
    });
    unefois("priere", ta > 10, () => dire("priere", true));

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

    unefois("agents", ta > 30, () => {
      const cibles = [joueur, groupe[2], groupe[4]];
      agents.forEach((ag, i) => {
        ag.x = pickup.position.x - 2 + i * 1.5; ag.z = pickup.position.z + (i - 1) * 2;
        ag.racine.visible = true;
        ag.vers = cibles[i];
        ag.lampe.intensity = 2.5;
        ag.faisceau.visible = true;
      });
      dire("agent1");
    });
    unefois("agent2", ta > 34, () => dire("agent2"));
    unefois("agent3", ta > 38, () => {
      dire("agent3");
      groupe.forEach((p) => { if (!p.fuit) { p.cible = "genoux"; p.versSol = null; } });
      mains.etat = "haut";
    });

    agents.forEach((ag) => {
      if (!ag.racine.visible) return;
      const vx = ag.vers.x - ag.x, vz = ag.vers.z - ag.z;
      const d = Math.hypot(vx, vz);
      const v = d > 2.0 ? 1.7 : 0;
      ag.x += (vx / d) * v * dt; ag.z += (vz / d) * v * dt;
      ag.cap = Math.atan2(vx, vz);
      ag.vitesse = v;
      ag.cible = "marche";
      animerPersonnage(ag, dt);
      // Bras droit tendu, lampe braquée
      ag.bras[1].epaule.rotation.x = -1.35; ag.bras[1].coude.rotation.x = -0.1;
      ag.bras[0].epaule.rotation.x = -0.9; ag.bras[0].coude.rotation.x = -0.9;
      _v.set(ag.x + Math.sin(ag.cap) * 0.5 + Math.cos(ag.cap) * 0.2, hauteur(ag.x, ag.z) + 1.4, ag.z + Math.cos(ag.cap) * 0.5 - Math.sin(ag.cap) * 0.2);
      const tete = ag.vers === joueur ? camera.position : _w.set(ag.vers.x, hauteur(ag.vers.x, ag.vers.z) + 0.6, ag.vers.z);
      ag.lampe.position.copy(_v);
      ag.lampe.target.position.copy(tete);
      orienterFaisceau(ag.faisceau, _v, tete, 0.12);
      if (ag.vers === joueur) joueur.dAgent = d;
    });

    if (agents[0].racine.visible) {
      const d = joueur.dAgent || 99;
      const ebloui = ta > 38 ? Math.max(0, Math.min(1, (6 - d) / 4)) : Math.max(0, Math.min(0.4, (6 - d) / 8));
      voile.style.transition = "none";
      voile.style.background = "#fff";
      voile.style.opacity = (ebloui * 0.85).toFixed(3);
      if ((d < 2.3 && ta > 43) || ta > 48) debutReve();
    }
  }

  // =====================================================================
  //  La rupture onirique
  // =====================================================================
  const etiquettes = [];
  function debutReve() {
    phase = "reve"; tr = 0;
    voile.style.opacity = "1";
    clearTimeout(sousTitreTimer); sousTitre.className = ""; montrerInvite("");
    A.silence();
    setTimeout(() => A.nappe(), 1800);
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
    mains.etat = "cache";
    groupe.forEach((p, i) => {
      if (p.fuit) return;
      const sp = etiquette(C.personnages[i].nom);
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
    unefois("releve", tr > 7, () => groupe.forEach((p) => { if (!p.fuit) p.cible = "debout"; }));
    groupe.forEach((p) => {
      if (p.fuit) return;
      p.vitesse = 0;
      // Ils se tournent vers le joueur.
      const c = Math.atan2(joueur.x - p.x, joueur.z - p.z);
      if (tr > 9) { let diff = c - p.cap; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; p.cap += diff * Math.min(1, dt * 0.4); }
      animerPersonnage(p, dt);
    });
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

  // =====================================================================
  //  Boucle
  // =====================================================================
  function boucle() {
    let dt = Math.min(0.05, horloge.getDelta()) * acceleration;
    if (enPause()) { renderer.render(scene, camera); return; }
    horlogeAnim += dt;
    executerAFaire();
    if (phase === "mur") { tm += dt; majMur(dt); }
    else if (phase === "marche") {
      tp += dt;
      const fCible = Math.min(1, tp / 330) * (evenements.espoir1 ? 0.6 : 1);
      joueur.fatigue += (fCible - joueur.fatigue) * Math.min(1, dt * 0.2);
      A.setFatigue(joueur.fatigue);
      groupe.forEach((p) => (p.essoufle = joueur.fatigue * 1.2));
      scenarioMarche();
    }
    else if (phase === "alerte") { ta += dt; scenarioAlerte(dt); }
    else if (phase === "reve") { tr += dt; scenarioReve(dt); }
    if (phase === "fin") return;

    if (phase !== "mur") majGroupe(dt);
    if (phase === "marche") { tenirLaMain(dt); majJulioEau(); }
    majJoueur(dt);
    majMains(dt);
    if (flamme) {
      const f = 0.8 + Math.sin(tempsTotal() * 13) * 0.1 + Math.sin(tempsTotal() * 7.3) * 0.1;
      flamme.scale.setScalar(f); croix.userData.lueur.intensity = 1.1 * f;
    }
    ciel.position.copy(camera.position);
    const avant = _v.set(0, 0, -1).applyQuaternion(camera.quaternion);
    A.auditeur(camera.position, avant);
    renderer.render(scene, camera);
  }

  // =====================================================================
  //  Lancement
  // =====================================================================
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
    camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1500);

    const luneLum = new THREE.DirectionalLight(0x9db0e0, 1.5);
    luneLum.position.set(520, 300, -560);
    scene.add(luneLum, new THREE.HemisphereLight(0x2c3b5e, 0x15110d, 1.5));
    // Lumière d'appoint : le ciel du sud éclaire doucement le dos des marcheurs.
    const appoint = new THREE.DirectionalLight(0x6a7aa8, 0.9);
    appoint.position.set(-300, 220, 420);
    scene.add(appoint);

    chemin = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 8), new THREE.Vector3(8, 0, -60), new THREE.Vector3(-6, 0, -130),
      new THREE.Vector3(15, 0, -200), new THREE.Vector3(5, 0, -280), new THREE.Vector3(25, 0, -360),
      new THREE.Vector3(10, 0, -440), new THREE.Vector3(-12, 0, -520), new THREE.Vector3(0, 0, -610),
    ]);
    longueur = chemin.getLength();

    construireDecor();
    construireVehicules();
    construireMains();

    C.personnages.forEach((perso, i) => {
      const p = creerPersonnage(perso.corps);
      p.id = perso.id;
      p.abscisse = S_DEPART - ESPACEMENT * rangDe(i);
      groupe.push(p);
      if (perso.id === "ernesto") ernesto = p;
      if (perso.id === "julio") julio = p;
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

    joueur = { x: 1.6, z: 33, yeux: 1.62, fatigue: 0, distPas: 0, balance: 0, etat: "attend" };
    lacet = 0.05;

    // Saut direct dans le déroulé (tests, ou reprise par l'enseignant)
    if (options.temps !== undefined && options.temps !== null) {
      const t0 = options.temps;
      phase = "marche"; joueur.etat = "libre";
      sLeader = Math.min(longueur - 10, S_DEPART + t0 * 1.05);
      groupe.forEach((p, i) => (p.abscisse = sLeader - ESPACEMENT * rangDe(i)));
      const pj = pointS(sLeader - ESPACEMENT * 6 - 3);
      joueur.x = pj.x; joueur.z = pj.z; lacet = capS(sLeader) + Math.PI;
      tp = t0;
      joueur.fatigue = Math.min(1, t0 / 330);
      // Les événements déjà passés sont marqués comme faits.
      const passes = { depart: 7, enfant: 28, mere: 32, yesenia1: 52, yesenia2: 60, julio1: 84, coyotes: 108, coyoteEnfant: 113, coyoteMere: 117, coyotes2: 135,
        halte: 160, eau: 170, berceuse: 182, ernestoHalte: 196, repart: 214, rythme: 226, froid: 240, soif: 256, soifReponse: 261, fausseAlerte: 276, fausseFin: 292, chute: 316 };
      for (const k in passes) if (t0 > passes[k]) evenements[k] = true;
      if (sLeader > S_CROIX + 6) evenements.cruz1 = evenements.cruz2 = true;
      if (t0 > 160 && t0 < 214) { arret = true; groupe.forEach((p) => (p.cible = "assis")); eauOfferte = t0 > 170; }
    }

    installerEntrees();
    installerTactile();
    if (tactile) renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25)); // téléphones : alléger le rendu
    aide.classList.toggle("visible", true);
    horloge = new THREE.Clock();
    renderer.setAnimationLoop(boucle);

    A.vent(); A.insectes(); A.respiration();
    A.prechargerVoix();
    voile.style.transition = "opacity 3s ease";
    voile.style.background = "#000";
    requestAnimationFrame(() => (voile.style.opacity = "0"));

    if (options.reve) {
      phase = "marche"; joueur.etat = "libre";
      const pj = pointS(sLeader - ESPACEMENT * 6 - 3);
      joueur.x = pj.x; joueur.z = pj.z; lacet = capS(sLeader) + Math.PI;
      groupe.forEach((p, i) => { const pt = pointS(p.abscisse); p.x = pt.x; p.z = pt.z; });
      debutAlerte(); ta = 47; scenarioAlerte(0.016);
    }
  }

  return {
    lancer,
    _etat: () => joueur && ({ phase, tm, tp, ta, tr, joueur: { x: joueur.x, z: joueur.z, yeux: joueur.yeux, etat: joueur.etat }, sLeader,
      groupe: groupe.map((p) => [Math.round(p.x), Math.round(p.racine.position.y * 10) / 10, Math.round(p.z), p.cible]) }),
    _action: action,
    _placer: (x, z, l, t) => { joueur.x = x; joueur.z = z; lacet = l; tangage = t || 0; }, // tests
  };
})();
