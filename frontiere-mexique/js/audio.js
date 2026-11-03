// Moteur sonore entièrement procédural (Web Audio API) : aucun fichier audio requis.
// Le son est spatialisé en binaural (HRTF) : le casque est indispensable.
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
      const g = ctx.createGain(); g.gain.value = 0;
      const o = ctx.createOscillator(); o.frequency.value = 4200 + Math.random() * 1500;
      const am = ctx.createOscillator(); am.frequency.value = 30 + Math.random() * 20; am.type = "square";
      const amG = ctx.createGain(); amG.gain.value = 0.5;
      am.connect(amG).connect(g.gain);
      o.connect(g).connect(p).connect(master);
      const d = 0.4 + Math.random() * 1.2;
      o.start(); am.start(); o.stop(t() + d); am.stop(t() + d);
      sons.insectesTimer = setTimeout(chant, 600 + Math.random() * 2500);
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
    const turbine = ctx.createOscillator(); turbine.frequency.value = 2400; turbine.type = "sine";
    const turbG = ctx.createGain(); turbG.gain.value = 0.015;
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

  // --- Moteur du pick-up ---
  function moteur(x, z) {
    const p = panner(x, 1, z); p.refDistance = 8;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 42;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(f).connect(g).connect(p).connect(master); o.start();
    rampe(g.gain, 0.5, 3);
    sons.moteur = { p, g, o };
  }
  function positionMoteur(x, z) {
    if (!sons.moteur) return;
    sons.moteur.p.positionX.value = x; sons.moteur.p.positionZ.value = z;
  }

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

  // --- Voix (synthèse vocale, provisoire) ---
  let voixES = null, voixEN = null;
  function chargerVoix() {
    const v = speechSynthesis.getVoices();
    voixES = v.find((x) => /es[-_]MX/i.test(x.lang)) || v.find((x) => /^es/i.test(x.lang)) || null;
    voixEN = v.find((x) => /en[-_]US/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang)) || null;
  }
  if (window.speechSynthesis) {
    chargerVoix();
    speechSynthesis.onvoiceschanged = chargerVoix;
  }
  const hauteurs = { guia: 0.8, julio: 0.95, rosa: 1.25, mateo: 1.7, yesenia: 1.35, ernesto: 0.7, agent: 0.85 };
  function parler(qui, texte, chuchote) {
    if (!window.speechSynthesis || sons.silence) return;
    const u = new SpeechSynthesisUtterance(texte);
    const anglais = qui === "agent";
    u.lang = anglais ? "en-US" : "es-MX";
    const v = anglais ? voixEN : voixES;
    if (v) u.voice = v;
    u.pitch = hauteurs[qui] || 1;
    u.rate = anglais ? 1.15 : chuchote ? 0.9 : 1.05;
    u.volume = anglais ? 1 : chuchote ? 0.45 : 0.8;
    speechSynthesis.speak(u);
  }

  // --- Rupture : tout se tait, puis une nappe suspendue ---
  function silence() {
    sons.silence = true;
    if (window.speechSynthesis) speechSynthesis.cancel();
    rampe(master.gain, 0, 0.15);
    setTimeout(() => {
      ["vent", "helico", "moteur", "resp"].forEach((k) => sons[k] && sons[k].g && (sons[k].g.gain.cancelScheduledValues(t()), sons[k].g.gain.setValueAtTime(0, t())));
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
    auditeur, parler, silence, nappe, toutCouper,
  };
})();
