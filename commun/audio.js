// Moteur sonore entièrement procédural (Web Audio API) : aucun fichier audio requis.
// Le son est spatialisé en binaural (HRTF) : les écouteurs sont indispensables.
// Les voix utilisent la synthèse vocale du navigateur en attendant de vrais enregistrements.

window.Audio3D = (function () {
  let ctx = null;
  let master = null;
  let bruitBuffer = null;
  const sons = {};

  function creerBruit(type) {
    const duree = 4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duree, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let dernier = 0;
    for (let i = 0; i < d.length; i++) {
      const blanc = Math.random() * 2 - 1;
      if (type === "brun") {
        dernier = (dernier + 0.02 * blanc) / 1.02;
        d[i] = dernier * 3.5;
      } else {
        d[i] = blanc;
      }
    }
    return buf;
  }

  function sourceBruit(type) {
    const s = ctx.createBufferSource();
    s.buffer = type === "brun" ? sons._brun : bruitBuffer;
    s.loop = true;
    return s;
  }

  function panner(x, y, z) {
    const p = ctx.createPanner();
    p.panningModel = "HRTF";
    p.distanceModel = "inverse";
    p.refDistance = 4;
    p.rolloffFactor = 1;
    p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z;
    return p;
  }

  function demarrer() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    bruitBuffer = creerBruit("blanc");
    sons._brun = creerBruit("brun");
  }

  function t() { return ctx.currentTime; }

  function rampe(param, valeur, duree) {
    param.cancelScheduledValues(t());
    param.setValueAtTime(param.value, t());
    param.linearRampToValueAtTime(valeur, t() + duree);
  }

  // --- Ambiance du sas : bourdonnement froid de climatisation ---
  function sasDebut() {
    const g = ctx.createGain(); g.gain.value = 0;
    const o1 = ctx.createOscillator(); o1.frequency.value = 50; o1.type = "sine";
    const o2 = ctx.createOscillator(); o2.frequency.value = 100.6; o2.type = "triangle";
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const n = sourceBruit("blanc");
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 400;
    const gn = ctx.createGain(); gn.gain.value = 0.05;
    o1.connect(g); o2.connect(g2).connect(g); n.connect(f).connect(gn).connect(g);
    g.connect(master);
    o1.start(); o2.start(); n.start();
    rampe(g.gain, 0.18, 4);
    sons.sas = { g, stop: () => { rampe(g.gain, 0, 2); setTimeout(() => { o1.stop(); o2.stop(); n.stop(); }, 2500); } };
  }
  function sasFin() { if (sons.sas) sons.sas.stop(); }

  // --- Vent du désert ---
  function vent() {
    const n = sourceBruit("brun");
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 300;
    lfo.connect(lfoG).connect(f.frequency);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.13;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.08;
    lfo2.connect(lfo2G).connect(g.gain);
    n.connect(f).connect(g).connect(master);
    n.start(); lfo.start(); lfo2.start();
    rampe(g.gain, 0.22, 6);
    sons.vent = { g };
  }

  // --- Insectes nocturnes (stridulations aléatoires, spatialisées) ---
  function insectes() {
    const chant = () => {
      if (sons.silence) return;
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 25;
      const p = panner(Math.cos(a) * r + (sons.lx || 0), 0, Math.sin(a) * r + (sons.lz || 0));
      // Un grillon : 2 à 4 impulsions brèves et douces, très bas volume.
      // (Pas d'oscillateur carré : c'était la source du son « modem ».)
      const g = ctx.createGain(); g.gain.value = 0;
      const o = ctx.createOscillator(); o.frequency.value = 3600 + Math.random() * 600;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 4500;
      o.connect(g).connect(f).connect(p).connect(master);
      const debut = t() + 0.02, nb = 2 + Math.floor(Math.random() * 3), pic = 0.006 + Math.random() * 0.006;
      for (let k = 0; k < nb; k++) {
        const t0 = debut + k * 0.07;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(pic, t0 + 0.012);
        g.gain.linearRampToValueAtTime(0, t0 + 0.035);
      }
      o.start(debut); o.stop(debut + nb * 0.07 + 0.05);
      sons.insectesTimer = setTimeout(chant, 1500 + Math.random() * 3500);
    };
    chant();
  }

  // --- Pas dans le sable : rafale de bruit filtré ---
  function pas(volume) {
    if (!ctx || sons.silence) return;
    const n = ctx.createBufferSource(); n.buffer = bruitBuffer;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 700; f.Q.value = 0.8;
    const g = ctx.createGain();
    const v = (volume || 0.35) * (0.7 + Math.random() * 0.3);
    g.gain.setValueAtTime(0, t());
    g.gain.linearRampToValueAtTime(v, t() + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t() + 0.22);
    n.connect(f).connect(g).connect(master);
    n.start(t(), Math.random() * 3, 0.3);
  }

  // Pas d'un autre personnage, spatialisé.
  function pasAutre(x, y, z) {
    if (!ctx || sons.silence) return;
    const n = ctx.createBufferSource(); n.buffer = bruitBuffer;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1100; f.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t());
    g.gain.linearRampToValueAtTime(0.25, t() + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t() + 0.2);
    n.connect(f).connect(g).connect(panner(x, y, z)).connect(master);
    n.start(t(), Math.random() * 3, 0.25);
  }

  // --- Respiration du joueur : son rythme suit la fatigue (0 → 1) ---
  function respiration() {
    const n = sourceBruit("blanc");
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0;
    n.connect(f).connect(g).connect(master); n.start();
    sons.resp = { g, f, fatigue: 0, peur: 0 };
    const cycle = () => {
      if (!sons.resp) return;
      const r = sons.resp;
      const niveau = Math.max(r.fatigue, r.peur);
      if (sons.silence) { sons.respTimer = setTimeout(cycle, 500); return; }
      const periode = 4.2 - niveau * 2.6; // de 4,2 s à 1,6 s
      const v = 0.04 + niveau * 0.12;
      const now = t();
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(v, now + periode * 0.3);   // inspiration
      g.gain.linearRampToValueAtTime(0.0, now + periode * 0.45);
      g.gain.linearRampToValueAtTime(v * 1.3, now + periode * 0.6); // expiration
      g.gain.linearRampToValueAtTime(0, now + periode * 0.9);
      f.frequency.setValueAtTime(600 + niveau * 300, now);
      sons.respTimer = setTimeout(cycle, periode * 1000);
    };
    cycle();
  }
  function setFatigue(v) { if (sons.resp) sons.resp.fatigue = v; }
  function setPeur(v) { if (sons.resp) sons.resp.peur = v; }

  // --- Battements de cœur ---
  function coeur(actif) {
    if (actif && !sons.coeurTimer) {
      const bat = () => {
        if (sons.silence) { sons.coeurTimer = setTimeout(bat, 500); return; }
        [0, 0.28].forEach((dt, i) => {
          const o = ctx.createOscillator(); o.frequency.value = i ? 48 : 55;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t() + dt);
          g.gain.linearRampToValueAtTime(i ? 0.35 : 0.5, t() + dt + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t() + dt + 0.18);
          o.connect(g).connect(master); o.start(t() + dt); o.stop(t() + dt + 0.2);
        });
        sons.coeurTimer = setTimeout(bat, 620);
      };
      bat();
    }
  }

  // --- Hélicoptère : rotor = bruit modulé en amplitude + grondement grave ---
  function helicoptere() {
    const p = panner(0, 60, -400);
    p.refDistance = 30; p.rolloffFactor = 1.2;
    const g = ctx.createGain(); g.gain.value = 0;
    const n = sourceBruit("brun");
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const am = ctx.createGain(); am.gain.value = 0.4;
    const rotor = ctx.createOscillator(); rotor.frequency.value = 17; rotor.type = "sawtooth";
    const rotorG = ctx.createGain(); rotorG.gain.value = 0.5;
    rotor.connect(rotorG).connect(am.gain);
    const turbine = ctx.createOscillator(); turbine.frequency.value = 1150; turbine.type = "sine";
    const turbG = ctx.createGain(); turbG.gain.value = 0.004;
    const grave = ctx.createOscillator(); grave.frequency.value = 34; grave.type = "triangle";
    const graveG = ctx.createGain(); graveG.gain.value = 0.5;
    n.connect(f).connect(am).connect(g);
    turbine.connect(turbG).connect(g);
    grave.connect(graveG).connect(am);
    g.connect(p).connect(master);
    n.start(); rotor.start(); turbine.start(); grave.start();
    rampe(g.gain, 1.6, 8);
    sons.helico = { p, g };
  }
  function positionHelico(x, y, z) {
    if (!sons.helico) return;
    const p = sons.helico.p;
    p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z;
  }

  // --- Moteurs (pick-up de la patrouille, voiture lointaine) ---
  function creerMoteur(x, z, volume, ref) {
    const p = panner(x, 1, z); p.refDistance = ref || 8;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 42;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(f).connect(g).connect(p).connect(master); o.start();
    rampe(g.gain, volume, 3);
    return { p, g, o };
  }
  function moteur(x, z) { sons.moteur = creerMoteur(x, z, 0.5); }
  function positionMoteur(x, z) {
    if (!sons.moteur) return;
    sons.moteur.p.positionX.value = x; sons.moteur.p.positionZ.value = z;
  }
  function voiture(x, z) { sons.voiture = creerMoteur(x, z, 0.9, 40); return sons.voiture; }
  function positionVoiture(x, z) {
    if (!sons.voiture) return;
    sons.voiture.p.positionX.value = x; sons.voiture.p.positionZ.value = z;
  }
  function voitureFin() {
    if (!sons.voiture) return;
    const v = sons.voiture; sons.voiture = null;
    rampe(v.g.gain, 0, 3); setTimeout(() => v.o.stop(), 3500);
  }

  // --- Coyotes au loin : hurlements glissés, sous 1 kHz (rien de strident) ---
  function coyotes(x, z) {
    if (!ctx || sons.silence) return;
    const p = panner(x, 2, z); p.refDistance = 40;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
    f.connect(p).connect(master);
    for (let v = 0; v < 3; v++) {
      const d0 = t() + v * 0.9 + Math.random() * 0.4;
      const o = ctx.createOscillator(); o.type = "triangle";
      const vib = ctx.createOscillator(); vib.frequency.value = 5 + Math.random() * 2;
      const vibG = ctx.createGain(); vibG.gain.value = 12;
      vib.connect(vibG).connect(o.frequency);
      const g = ctx.createGain(); g.gain.value = 0;
      const base = 420 + Math.random() * 120;
      o.frequency.setValueAtTime(base, d0);
      o.frequency.linearRampToValueAtTime(base * 1.9, d0 + 0.5);
      o.frequency.setValueAtTime(base * 1.9, d0 + 1.4);
      o.frequency.linearRampToValueAtTime(base * 1.3, d0 + 2.4);
      g.gain.setValueAtTime(0, d0);
      g.gain.linearRampToValueAtTime(0.09, d0 + 0.4);
      g.gain.setValueAtTime(0.09, d0 + 1.6);
      g.gain.linearRampToValueAtTime(0, d0 + 2.5);
      o.connect(g).connect(f);
      o.start(d0); vib.start(d0); o.stop(d0 + 2.6); vib.stop(d0 + 2.6);
    }
  }

  // --- Échelle métallique : choc sourd ---
  function echelon() {
    if (!ctx) return;
    const n = ctx.createBufferSource(); n.buffer = bruitBuffer;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t()); g.gain.exponentialRampToValueAtTime(0.001, t() + 0.35);
    n.connect(f).connect(g).connect(master); n.start(t(), Math.random() * 3, 0.4);
  }

  // --- Gorgées d'eau ---
  function gorgees() {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
      const d0 = t() + 0.3 + i * 0.55;
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(220, d0); o.frequency.exponentialRampToValueAtTime(90, d0 + 0.15);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, d0);
      g.gain.linearRampToValueAtTime(0.25, d0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, d0 + 0.2);
      o.connect(g).connect(master); o.start(d0); o.stop(d0 + 0.22);
    }
  }

  // --- Nappe d'espoir (chaude, douce) et coupure brutale ---
  function espoir() {
    if (!ctx || sons.espoir) return;
    const g = ctx.createGain(); g.gain.value = 0;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1200;
    const osc = [];
    [146.8, 220, 277.2, 370].forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = fr;
      o.detune.value = (Math.random() - 0.5) * 10;
      const og = ctx.createGain(); og.gain.value = 0.08 / (i + 1);
      o.connect(og).connect(f); o.start(); osc.push(o);
    });
    f.connect(g).connect(master);
    g.gain.setValueAtTime(0, t()); g.gain.linearRampToValueAtTime(0.4, t() + 10);
    sons.espoir = { g, osc };
  }
  function espoirCouper() {
    if (!sons.espoir) return;
    const e = sons.espoir; sons.espoir = null;
    e.g.gain.cancelScheduledValues(t()); e.g.gain.setValueAtTime(e.g.gain.value, t());
    e.g.gain.linearRampToValueAtTime(0, t() + 0.08);
    setTimeout(() => e.osc.forEach((o) => o.stop()), 300);
  }

  // --- Bourdon de tension (grave, monte avec la peur) ---
  function tension(v) {
    if (!ctx) return;
    if (!sons.tension) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 55;
      const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 55.7;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 160;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g).connect(master); o.start(); o2.start();
      sons.tension = { g, o, o2 };
    }
    rampe(sons.tension.g.gain, v, 4);
  }

  // --- Vent : intensité réglable (il forcit et refroidit en deuxième partie) ---
  function setVent(v) { if (sons.vent) rampe(sons.vent.g.gain, v, 8); }

  // =====================================================================
  //  Ambiances du chapitre 2 (chaque fonction renvoie { arreter(duree) })
  // =====================================================================
  function arreteur(noeuds, g) {
    return { g, arreter(d) { rampe(g.gain, 0, d || 2); setTimeout(() => noeuds.forEach((n) => { try { n.stop(); } catch (e) {} }), (d || 2) * 1000 + 300); } };
  }
  // Le comal qui grésille (spatialisé)
  function comal(x, y, z) {
    const n = sourceBruit("blanc");
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500;
    const f2 = ctx.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = 0;
    const crep = ctx.createGain(); crep.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.type = "square"; lfo.frequency.value = 7.3;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.25; lfo.connect(lfoG).connect(crep.gain);
    const p = panner(x, y, z); p.refDistance = 1.5;
    n.connect(f).connect(f2).connect(crep).connect(g).connect(p).connect(master);
    n.start(); lfo.start();
    rampe(g.gain, 0.05, 2);
    return arreteur([n, lfo], g);
  }
  // Rue animée : rumeur de circulation lointaine, voix indistinctes, chiens au loin.
  function rue() {
    const n = sourceBruit("brun");
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 380;
    const g = ctx.createGain(); g.gain.value = 0;
    n.connect(f).connect(g).connect(master); n.start();
    rampe(g.gain, 0.16, 3);
    const murmures = ctx.createGain(); murmures.gain.value = 1; murmures.connect(g);
    let actif = true;
    const voix = () => {
      if (!actif) return;
      // Une voix lointaine : bruit filtré à la hauteur d'une voix, modulé comme une syllabe.
      const s = ctx.createBufferSource(); s.buffer = bruitBuffer;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500 + Math.random() * 500; bp.Q.value = 3;
      const vg = ctx.createGain(); const t0 = t();
      vg.gain.setValueAtTime(0, t0);
      for (let i = 0; i < 4 + Math.random() * 6; i++) { vg.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.05, t0 + i * 0.18 + 0.06); vg.gain.linearRampToValueAtTime(0.01, t0 + i * 0.18 + 0.16); }
      vg.gain.linearRampToValueAtTime(0, t0 + 2);
      s.connect(bp).connect(vg).connect(murmures); s.start(t0, Math.random() * 3, 2.1);
      setTimeout(voix, 900 + Math.random() * 2600);
    };
    voix();
    const r = arreteur([n], g);
    const arreter = r.arreter;
    r.arreter = (d) => { actif = false; arreter(d); };
    return r;
  }
  // Moto (deux-temps) : bourdonnement nasal, spatialisé et mobile.
  function moto(x, z) {
    const p = panner(x, 1, z); p.refDistance = 6;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 95;
    const o2 = ctx.createOscillator(); o2.type = "square"; o2.frequency.value = 47.5;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0;
    const g2 = ctx.createGain(); g2.gain.value = 0.4;
    o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(p).connect(master);
    o.start(); o2.start();
    rampe(g.gain, 0.22, 2);
    const r = arreteur([o, o2], g);
    r.position = (nx, nz) => { p.positionX.value = nx; p.positionZ.value = nz; };
    r.regime = (v) => { o.frequency.setTargetAtTime(70 + v * 60, t(), 0.3); o2.frequency.setTargetAtTime(35 + v * 30, t(), 0.3); };
    return r;
  }
  // Vent sec dans les feuilles de maïs : souffle + froissements.
  function ventSec() {
    const n = sourceBruit("blanc");
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3;
    const lg = ctx.createGain(); lg.gain.value = 0.02; lfo.connect(lg).connect(g.gain);
    n.connect(f).connect(g).connect(master); n.start(); lfo.start();
    rampe(g.gain, 0.035, 3);
    const v = sourceBruit("brun");
    const fv = ctx.createBiquadFilter(); fv.type = "lowpass"; fv.frequency.value = 500;
    const gv = ctx.createGain(); gv.gain.value = 0.18; v.connect(fv).connect(gv).connect(g); v.start();
    return arreteur([n, lfo, v], g);
  }
  // Néon défectueux : bourdonnement grave et grésillements irréguliers.
  function neon(x, y, z) {
    const p = panner(x, y, z); p.refDistance = 2;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 120;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 400;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(f).connect(g).connect(p).connect(master); o.start();
    rampe(g.gain, 0.03, 1.5);
    return arreteur([o], g);
  }
  // Sonnerie de téléphone (deux tons doux), quelques fois.
  function sonnerie(fois) {
    for (let i = 0; i < (fois || 2); i++) {
      const d0 = t() + i * 3;
      [440, 480].forEach((fr) => {
        const o = ctx.createOscillator(); o.frequency.value = fr;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, d0);
        g.gain.linearRampToValueAtTime(0.05, d0 + 0.05); g.gain.setValueAtTime(0.05, d0 + 1.9); g.gain.linearRampToValueAtTime(0, d0 + 2);
        o.connect(g).connect(master); o.start(d0); o.stop(d0 + 2.05);
      });
    }
  }
  // =====================================================================
  //  Sons enregistrés (bruitages réels). Chargés à l'avance ; seulement sur un
  //  vrai site web (pas en ouvrant le fichier en double-cliquant). Sinon, on
  //  garde le son généré : sonPret(nom) permet de choisir.
  // =====================================================================
  const bruitages = {};
  function chargerSon(nom, url) {
    if (!/^https?:/.test(location.protocol) || !ctx || bruitages[nom]) return;
    bruitages[nom] = "chargement";
    fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => ctx.decodeAudioData(b)).then((ab) => { bruitages[nom] = ab; })
      .catch(() => { delete bruitages[nom]; });
  }
  function sonPret(nom) { return bruitages[nom] instanceof AudioBuffer; }
  // pos : {x, y, z} ; renvoie { position(x, z), arreter(d), duree }
  function jouerSon(nom, pos, volume) {
    if (!sonPret(nom)) return null;
    const src = ctx.createBufferSource(); src.buffer = bruitages[nom];
    const g = ctx.createGain(); g.gain.value = volume || 1;
    const p = panner(pos.x, pos.y || 1, pos.z);
    // L'enregistrement contient déjà son éloignement : atténuation douce seulement.
    p.refDistance = 25; p.rolloffFactor = 0.6;
    src.connect(g).connect(p).connect(master); src.start();
    return {
      duree: src.buffer.duration,
      position(x, z) { p.positionX.value = x; p.positionZ.value = z; },
      arreter(d) { rampe(g.gain, 0, d || 1); setTimeout(() => { try { src.stop(); } catch (e) {} }, (d || 1) * 1000 + 200); },
    };
  }

  // Volume général (fondus entre les tableaux)
  function volumeGeneral(v, d) { if (master) rampe(master.gain, v, d || 1); }
  function reinitialiser() { sons.silence = false; if (master) { master.gain.cancelScheduledValues(t()); master.gain.setValueAtTime(0.9, t()); } }

  // --- Pause ---
  function pause() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (ctx && ctx.state === "running") ctx.suspend();
  }
  function reprise() { if (ctx && ctx.state === "suspended") ctx.resume(); }

  // --- Auditeur = caméra ---
  function auditeur(pos, avant) {
    if (!ctx) return;
    const L = ctx.listener;
    sons.lx = pos.x; sons.lz = pos.z;
    if (L.positionX) {
      L.positionX.value = pos.x; L.positionY.value = pos.y; L.positionZ.value = pos.z;
      L.forwardX.value = avant.x; L.forwardY.value = avant.y; L.forwardZ.value = avant.z;
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else {
      L.setPosition(pos.x, pos.y, pos.z);
      L.setOrientation(avant.x, avant.y, avant.z, 0, 1, 0);
    }
  }

  // =====================================================================
  //  Voix
  //  1) Si un enregistrement existe (voix/<cle>.mp3, listé dans voix/liste.json ;
  //     généré par outils/generer-voix.mjs ou enregistré par de vrais comédiens),
  //     il est joué et spatialisé à la position du personnage.
  //  2) Sinon, synthèse vocale du navigateur, avec la meilleure voix disponible
  //     (voix neuronales « Natural » d'Edge, puis Google, puis système),
  //     une voix distincte par personnage et un ton par réplique.
  // =====================================================================
  const enregistrements = {}; // cle -> AudioBuffer
  let listeChargee = false;
  function prechargerVoix() {
    if (listeChargee || !/^https?:/.test(location.protocol)) return; // file:// : pas de fetch possible
    listeChargee = true;
    fetch("voix/liste.json").then((r) => (r.ok ? r.json() : [])).then((cles) => {
      // Chargement échelonné pour ne pas tout demander d'un coup.
      cles.forEach((nom, i) => setTimeout(() => {
        const fichier = /\.\w+$/.test(nom) ? nom : nom + ".mp3";
        const cle = nom.replace(/\.\w+$/, "");
        fetch("voix/" + fichier).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
          .then((buf) => ctx.decodeAudioData(buf)).then((ab) => { enregistrements[cle] = ab; })
          .catch(() => {});
      }, i * 120));
    }).catch(() => {});
  }

  // Noms de voix courants, pour deviner le genre (les navigateurs ne le donnent pas).
  const FEMININ = /dalia|paloma|elvira|sabina|helena|laura|m[oó]nica|paulina|marisol|larissa|elena|ximena|renata|beatriz|candela|nuria|abril|valentina|camila|marta|belkys|karla|lupe|pilar|elsa|irene|lucia|luc[ií]a|carlota|esperanza|triana|vera|estrella|teresa|catalina|ana\b|zira|aria|jenny|michelle|samantha|ava|allison|susan|emma|female|mujer/i;
  const MASCULIN = /jorge|ra[uú]l|pablo|[aá]lvaro|gerardo|juan|diego|tom[aá]s|alonso|lorenzo|liberto|cecilio|yago|emilio|andr[eé]s|carlos|luciano|gonzalo|federico|arnau|dario|jos[eé]|manuel|antonio|sa[uú]l|elias|nil|guy|davis|eric|christopher|roger|steffan|andrew|brian|tony|jason|ryan|aaron|fred|alex|daniel|david|mark|tom\b|male|hombre/i;
  function qualite(v) {
    let q = 0;
    if (/natural|neural|online/i.test(v.name)) q += 20;
    if (/premium|enhanced|mejorad/i.test(v.name)) q += 12;
    if (/google/i.test(v.name)) q += 8;
    if (!v.localService) q += 2;
    return q;
  }
  function genre(v) { return FEMININ.test(v.name) ? "f" : MASCULIN.test(v.name) ? "m" : "?"; }

  // Caractère de chaque personnage : genre voulu, hauteur et débit de base.
  const PERSONNAGES = {
    guia:    { genre: "m", rang: 0, pitch: 0.85, rate: 1.0 },
    julio:   { genre: "m", rang: 1, pitch: 1.0,  rate: 1.0 },
    ernesto: { genre: "m", rang: 2, pitch: 0.72, rate: 0.88 },
    rosa:    { genre: "f", rang: 0, pitch: 1.05, rate: 1.0 },
    yesenia: { genre: "f", rang: 1, pitch: 1.15, rate: 0.95 },
    mateo:   { genre: "f", rang: 3, pitch: 1.6,  rate: 1.08 }, // une voix aiguë pour l'enfant
    agent:   { genre: "m", rang: 0, pitch: 0.9,  rate: 1.15, anglais: true },
    // Chapitre 2
    marero:       { genre: "m", rang: 3, pitch: 0.95, rate: 0.9 },
    pere_yesenia: { genre: "m", rang: 4, pitch: 0.8,  rate: 0.85 },
    fille_julio:  { genre: "f", rang: 4, pitch: 1.75, rate: 1.0 },
  };
  // Le ton modifie débit, hauteur et volume.
  const TONS = {
    normal:   { rate: 1,    pitch: 1,    volume: 0.85 },
    chuchote: { rate: 0.92, pitch: 0.95, volume: 0.45 },
    presse:   { rate: 1.18, pitch: 1.04, volume: 0.65 },
    cri:      { rate: 1.15, pitch: 1.12, volume: 1 },
    peur:     { rate: 1.2,  pitch: 1.12, volume: 0.8 },
    fatigue:  { rate: 0.82, pitch: 0.93, volume: 0.6 },
    douleur:  { rate: 0.78, pitch: 0.9,  volume: 0.75 },
    tendre:   { rate: 0.88, pitch: 1.02, volume: 0.6 },
    triste:   { rate: 0.84, pitch: 0.94, volume: 0.55 },
    joie:     { rate: 1.06, pitch: 1.1,  volume: 0.85 },
    berceuse: { rate: 0.7,  pitch: 1.08, volume: 0.45 },
    froid:    { rate: 0.86, pitch: 0.92, volume: 0.8 },
  };
  let voixParPersonnage = {};
  function chargerVoix() {
    const toutes = speechSynthesis.getVoices();
    const choisir = (filtreLangue) => {
      const v = toutes.filter((x) => filtreLangue.test(x.lang));
      // Préférence pour le Mexique / les États-Unis hispanophones, puis la qualité.
      return v.sort((a, b) => (qualite(b) + (/MX|US|419/i.test(b.lang) ? 3 : 0)) - (qualite(a) + (/MX|US|419/i.test(a.lang) ? 3 : 0)));
    };
    const es = choisir(/^es/i), en = choisir(/^en[-_]US/i).concat(choisir(/^en/i));
    voixParPersonnage = {};
    for (const qui in PERSONNAGES) {
      const c = PERSONNAGES[qui];
      const liste = c.anglais ? en : es;
      if (!liste.length) continue;
      const memeGenre = liste.filter((v) => genre(v) === c.genre);
      const neutres = liste.filter((v) => genre(v) === "?");
      const pool = memeGenre.length ? memeGenre : neutres.length ? neutres : liste;
      // Des voix différentes pour des personnages du même genre, si possible,
      // mais jamais une voix nettement moins bonne que la meilleure disponible.
      const meilleurs = pool.filter((v) => qualite(v) >= qualite(pool[0]) - 5);
      voixParPersonnage[qui] = meilleurs[c.rang % meilleurs.length];
    }
  }
  if (window.speechSynthesis) {
    chargerVoix();
    speechSynthesis.onvoiceschanged = chargerVoix;
  }

  // Joue une réplique. pos = position du personnage (pour l'enregistrement spatialisé).
  // Renvoie la durée estimée en secondes (pour l'animation de la parole).
  function parler(qui, texte, ton, cle, pos, opts) {
    opts = opts || {};
    if (sons.silence) return 0;
    const t0 = TONS[ton] || TONS.normal;
    if (cle && enregistrements[cle] && ctx) {
      const src = ctx.createBufferSource(); src.buffer = enregistrements[cle];
      const g = ctx.createGain(); g.gain.value = qui === "agent" ? 1.2 : 1;
      let entree = src;
      if (opts.telephone) {
        // Son de combiné : bande étroite, légère saturation.
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 420;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000;
        const sat = ctx.createWaveShaper(); const k = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = i / 128 - 1; k[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
        sat.curve = k;
        src.connect(hp).connect(lp).connect(sat); entree = sat;
        g.gain.value = 0.8;
      }
      if (pos) { const p = panner(pos.x, pos.y + 1.5, pos.z); p.refDistance = 3; entree.connect(g).connect(p).connect(master); }
      else entree.connect(g).connect(master);
      src.start();
      (sons.voixActives = sons.voixActives || []).push(src);
      src.onended = () => { sons.voixActives = sons.voixActives.filter((x) => x !== src); };
      return src.buffer.duration;
    }
    if (!window.speechSynthesis) return 0;
    const c = PERSONNAGES[qui] || PERSONNAGES.julio;
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = c.anglais ? "en-US" : "es-MX";
    const v = voixParPersonnage[qui];
    if (v) { u.voice = v; u.lang = v.lang; }
    u.pitch = Math.min(2, c.pitch * t0.pitch);
    u.rate = c.rate * t0.rate;
    u.volume = t0.volume;
    speechSynthesis.speak(u);
    return texte.length * 0.065 / u.rate + 0.4;
  }
  function voixUtilisees() {
    const r = {};
    for (const k in voixParPersonnage) r[k] = voixParPersonnage[k] && voixParPersonnage[k].name;
    return r;
  }

  // --- Rupture : tout se tait, puis une nappe suspendue ---
  function silence() {
    sons.silence = true;
    (sons.voixActives || []).forEach((x) => { try { x.stop(); } catch (e) {} });
    if (window.speechSynthesis) speechSynthesis.cancel();
    rampe(master.gain, 0, 0.15);
    setTimeout(() => {
      ["vent", "helico", "moteur", "resp", "tension", "voiture"].forEach((k) => sons[k] && sons[k].g && (sons[k].g.gain.cancelScheduledValues(t()), sons[k].g.gain.setValueAtTime(0, t())));
      if (sons.moteur) sons.moteur.o.stop();
      clearTimeout(sons.coeurTimer); sons.coeurTimer = null;
      master.gain.setValueAtTime(0.9, t() + 0.1);
    }, 300);
  }
  function nappe() {
    const g = ctx.createGain(); g.gain.value = 0;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1800;
    [220, 277.2, 329.6, 440, 554.4].forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = fr;
      o.detune.value = (Math.random() - 0.5) * 12;
      const og = ctx.createGain(); og.gain.value = 0.06 / (i + 1);
      o.connect(og).connect(f); o.start();
    });
    f.connect(g).connect(master);
    g.gain.setValueAtTime(0, t());
    g.gain.linearRampToValueAtTime(0.35, t() + 6);
    sons.nappe = { g };
  }
  function toutCouper(duree) {
    if (!ctx) return;
    rampe(master.gain, 0, duree || 3);
    if (window.speechSynthesis) speechSynthesis.cancel();
    clearTimeout(sons.insectesTimer); clearTimeout(sons.respTimer); clearTimeout(sons.coeurTimer);
  }

  return {
    demarrer, sasDebut, sasFin, vent, insectes, pas, pasAutre, respiration,
    setFatigue, setPeur, coeur, helicoptere, positionHelico, moteur, positionMoteur,
    voiture, positionVoiture, voitureFin, coyotes, echelon, gorgees, espoir, espoirCouper,
    tension, setVent, pause, reprise, prechargerVoix, voixUtilisees,
    comal, rue, moto, ventSec, neon, sonnerie, volumeGeneral, reinitialiser, chargerSon, sonPret, jouerSon,
    enregistrementsCharges: () => Object.keys(enregistrements),
    auditeur, parler, silence, nappe, toutCouper,
  };
})();
