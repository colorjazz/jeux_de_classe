// Personnages articulés, partagés par tous les chapitres.
// Usage : const P = Personnages({ scene, hauteur(x, z), alea(), temps(), joueur(), haute });
//         const rosa = P.creer({ taille: 1.58, haut: 0x5a3b44, ... });  P.animer(rosa, dt);
// (Le chapitre 1 en contient encore sa propre copie, identique.)

window.Personnages = function (env) {
  const materiaux = {};
  function mat(c) {
    if (!materiaux[c]) materiaux[c] = env.haute
      ? new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0 })
      : new THREE.MeshLambertMaterial({ color: c });
    return materiaux[c];
  }
  function maille(geo, couleur, parent, x, y, z) {
    const m = new THREE.Mesh(geo, mat(couleur));
    m.position.set(x || 0, y || 0, z || 0);
    if (env.haute) { m.castShadow = true; m.receiveShadow = true; }
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
    let gilet = null;
    if (o.gilet && !o.giletChantier) {
      maille(new THREE.BoxGeometry(0.38, 0.32, 0.28), o.gilet, haut, 0, 0.36, 0);
      maille(new THREE.BoxGeometry(0.4, 0.06, 0.3), 0x15140f, haut, 0, 0.04, 0);          // ceinture
      maille(new THREE.BoxGeometry(0.07, 0.16, 0.1), 0x15140f, haut, 0.2, -0.02, 0.02);  // étui
    }
    if (o.giletChantier) {
      // Gilet de chantier (amovible) : deux pans et des bandes réfléchissantes.
      gilet = pivot(haut);
      [-1, 1].forEach((c) => maille(new THREE.BoxGeometry(0.17, 0.36, 0.27), o.giletChantier, gilet, 0.1 * c, 0.33, 0));
      maille(new THREE.BoxGeometry(0.39, 0.035, 0.28), 0xd8d8c8, gilet, 0, 0.26, 0);
      maille(new THREE.BoxGeometry(0.39, 0.035, 0.28), 0xd8d8c8, gilet, 0, 0.4, 0);
    }
    if (o.tablier) {
      const t = maille(new THREE.BoxGeometry(0.3, 0.42, 0.02), o.tablier, haut, 0, 0.16, 0.13);
      t.rotation.x = -0.08;
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
    [-0.033, 0.033].forEach((ex) => maille(new THREE.SphereGeometry(0.011, 8, 6), 0x0d0a08, tete, ex, 0.018, 0.088)); // yeux
    const coulCheveux = o.couleurCheveux || 0x0d0b0a;
    if (o.cheveux !== "chauve") {
      const ch = maille(new THREE.SphereGeometry(0.104, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), coulCheveux, tete, 0, 0.012, -0.008);
      ch.scale.set(0.95, 1.1, 1.02);
    }
    if (o.cheveux === "longs") {
      const l = maille(new THREE.SphereGeometry(0.1, 10, 10), coulCheveux, tete, 0, -0.07, -0.06);
      l.scale.set(1.05, 1.5, 0.55);
    }
    if (o.cheveux === "attaches") {
      // Chignon serré
      maille(new THREE.SphereGeometry(0.045, 10, 8), coulCheveux, tete, 0, 0.03, -0.1);
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
    let coiffe = null;
    if (o.coiffe === "casque") {
      // Casque de chantier
      coiffe = pivot(tete);
      const c = maille(new THREE.SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), o.couleurCoiffe || 0xf2f0e8, coiffe, 0, 0.025, 0);
      c.scale.set(1, 0.95, 1.08);
      maille(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 16), o.couleurCoiffe || 0xf2f0e8, coiffe, 0, 0.03, 0.015);
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
    let sacMain = null;
    if (o.objet === "sac") sacMain = maille(new THREE.BoxGeometry(0.2, 0.22, 0.08), 0x3a3128, mainD, 0, -0.14, 0);
    if (o.objet === "trousse") {
      maille(new THREE.BoxGeometry(0.18, 0.12, 0.07), 0xe8e4da, mainD, 0, -0.1, 0);
      maille(new THREE.BoxGeometry(0.06, 0.018, 0.072), 0xc0282a, mainD, 0, -0.1, 0); // croix rouge
      maille(new THREE.BoxGeometry(0.018, 0.06, 0.072), 0xc0282a, mainD, 0, -0.1, 0);
    }
    if (o.objet === "lampe") {
      const l = maille(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8), 0x111111, mainD, 0, -0.06, 0.06);
      l.rotation.x = Math.PI / 2;
    }

    env.scene.add(racine);
    return {
      racine, corps, bassin, haut, tete, bras, jambes, s, baton, bidon, sacMain, gilet, coiffe,
      pose: Object.assign({}, POSES.marche),
      cible: "marche", cycle: env.alea() * 6, vitesse: 0, distPas: 0, yExtra: 0,
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
    assis:    { bas: 0.78, couche: 0, penche: 0.38, hanche: 2.18, genou: 1.57, bAvant: 1.0,  bCote: 0.12, coude: 0.9,  cZ: 0, tete: 0.05 },
    dort:     { bas: 0.78, couche: 0, penche: 0.62, hanche: 2.18, genou: 1.57, bAvant: 0.8,  bCote: 0.1,  coude: 1.1,  cZ: 0, tete: 0.55 },
    grimpe:   { bas: 0,    couche: 0, penche: 0.1,  hanche: 0.6,  genou: 0.9,  bAvant: 2.7,  bCote: 0.1,  coude: 0.3,  cZ: 0, tete: -0.4 },
    // Chapitre 2
    chaise:   { bas: 0.44, couche: 0, penche: 0.05, hanche: 1.57, genou: 1.57, bAvant: 0.3,  bCote: 0.08, coude: 0.6,  cZ: 0, tete: 0.05 },
    dessine:  { bas: 0.44, couche: 0, penche: 0.3,  hanche: 1.57, genou: 1.57, bAvant: 0.85, bCote: 0.12, coude: 1.05, cZ: 0, tete: 0.45 },
    travaille:{ bas: 0,    couche: 0, penche: 0.22, hanche: 0.05, genou: 0.05, bAvant: 0.85, bCote: 0.18, coude: 1.15, cZ: 0, tete: 0.35 },
    agenouille:{ bas: 0.44, couche: 0, penche: 0.12, hanche: 0,   genou: 1.55, bAvant: 0.75, bCote: 0.15, coude: 0.55, cZ: 0, tete: 0.15 },
    tete_basse:{ bas: 0,   couche: 0, penche: 0.12, hanche: 0,    genou: 0.05, bAvant: 0.05, bCote: 0.05, coude: 0.2,  cZ: 0, tete: 0.5 },
  };

  // Vitesse de transition de chaque pose (plus lent = plus naturel pour les grands mouvements).
  const VITESSE_POSE = { couche: 2.0, genoux: 2.2, assis: 2.2, dort: 1.2, accroupi: 3.2, chute: 3.5, grimpe: 4, marche: 3, debout: 2.4,
    chaise: 2.2, dessine: 2.2, travaille: 2.6, agenouille: 2.0, tete_basse: 1.6 };

  function animerPersonnage(p, dt) {
    const c = POSES[p.cible];
    const k = 1 - Math.exp(-dt * (VITESSE_POSE[p.cible] || 3));
    for (const cle in c) p.pose[cle] += (c[cle] - p.pose[cle]) * k;
    const P = p.pose;
    // Le bâton n'apparaît que debout (assis ou couché, il pourrait passer pour une arme).
    if (p.baton) p.baton.visible = p.cible === "marche" || p.cible === "debout" || p.cible === "chute";
    if (p.sacMain) p.sacMain.visible = p.cible === "marche" || p.cible === "debout";
    // Vitesse lissée : pas d'à-coups entre l'arrêt et la marche.
    p.vLisse = (p.vLisse || 0) + (p.vitesse - (p.vLisse || 0)) * (1 - Math.exp(-dt * 5));
    const v = Math.max(0, p.vLisse);
    const amp = Math.min(1, v / 1.2) * (1 - P.couche);
    const grimpe = p.cible === "grimpe";
    // Cadence liée à la distance parcourue et à la taille (un enfant fait des pas plus courts).
    const foulee = 0.62 * p.s;
    if (grimpe && p.barreau !== undefined) p.cycle = p.barreau * Math.PI; // un demi-cycle par barreau
    else p.cycle += grimpe ? 4 * dt : (v * dt / foulee) * Math.PI;
    const cy = p.cycle;
    const t = env.temps();
    const joueur = env.joueur();
    const ph0 = p.phaseRepos || (p.phaseRepos = env.alea() * 10);

    // Respiration et petits mouvements au repos
    const repos = 1 - amp;
    const souffle = Math.sin(t * (1.4 + (p.essoufle || 0)) + ph0);
    p.haut.scale.set(1, 1 + souffle * 0.012 * repos, 1 + souffle * 0.02 * repos);

    // À plat ventre : le corps pivote autour des pieds et se pose au sol.
    const yCouche = P.couche * 0.16 * p.s;
    const rebond = (1 - Math.cos(2 * cy)) * 0.5 * 0.035 * amp; // le bassin monte deux fois par cycle
    p.racine.position.set(p.x, env.hauteur(p.x, p.z) + p.yExtra - P.bas * p.s + yCouche + rebond, p.z);
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
      j.hanche.rotation.x = -P.hanche + s1 * 0.4 * amp + (grimpe ? s1 * 0.55 : 0);
      const elan = Math.max(0, Math.sin(cy + ph + 1.2));
      j.genou.rotation.x = P.genou + (elan * elan * 0.9 + 0.08) * amp + (grimpe ? Math.max(0, -s1) * 0.7 : 0);
      j.cheville.rotation.x = -P.genou * 0.25 - P.couche * 0.9 + (Math.cos(cy + ph) * 0.18 - elan * 0.25) * amp;
    });
    p.bras.forEach((b, i) => {
      const ph = i ? 0 : Math.PI;
      const s1 = Math.sin(cy + ph);
      b.epaule.rotation.x = -P.bAvant + s1 * 0.3 * amp + (grimpe ? s1 * 0.4 : 0);
      b.epaule.rotation.z = b.cote * (P.bCote + 0.04 * amp);
      b.coude.rotation.x = -P.coude - (0.15 + Math.max(0, s1) * 0.3) * amp - (grimpe ? Math.max(0, -s1) * 0.9 : 0);
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

  return { mat, maille, pivot, creer: creerPersonnage, animer: animerPersonnage, pointerBras, POSES };
};
