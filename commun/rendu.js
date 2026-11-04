// Rendu partagé par les chapitres : moteur WebGL, qualité automatique, halo (bloom),
// courbe « cinéma », surveillance de la fluidité.
// Usage : const R = Rendu.creer({ qualite: "auto" | "haute" | "legere", exposition: 1.6 });
//         R.scene, R.camera, R.renderer, R.haute ; dans la boucle : R.surveiller(dtReel); R.rendre();

window.Rendu = (function () {
  function choisirQualite(demande) {
    if (demande === "haute") return true;
    if (demande === "legere") return false;
    const tactileSeul = window.matchMedia("(pointer: coarse)").matches;
    const faible = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    return !tactileSeul && !faible;
  }

  function creer(options) {
    options = options || {};
    const haute = choisirQualite(options.qualite);
    const forcee = options.qualite === "haute" || options.qualite === "legere";
    const tactile = document.body.classList.contains("tactile");

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, tactile ? 1.25 : 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.exposition || 1.6;
    if (haute) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
    renderer.domElement.id = "scene3d";
    document.body.appendChild(renderer.domElement);
    document.body.classList.add("en-scene");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1500);
    scene.add(camera);

    let composer = null, bloom = null;
    if (haute && THREE.EffectComposer) {
      composer = new THREE.EffectComposer(renderer);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(innerWidth, innerHeight);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.7, 0.5, 0.85);
      composer.addPass(bloom);
      composer.addPass(new THREE.OutputPass());
    }

    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      if (composer) composer.setSize(innerWidth, innerHeight);
    });

    // Moins de 22 images/s : on retire les halos, puis les ombres.
    const f = { t: 0, n: 0, etape: 0 };
    function surveiller(dtReel) {
      if (!haute || forcee || f.etape >= 2) return;
      f.t += dtReel; f.n++;
      if (f.t < 5) return;
      const ips = f.n / f.t; f.t = 0; f.n = 0;
      if (ips >= 22) return;
      if (f.etape === 0 && composer) { composer = null; f.etape = 1; return; }
      renderer.shadowMap.enabled = false;
      scene.traverse((o) => {
        if (o.isLight) o.castShadow = false;
        if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true));
      });
      f.etape = 2;
    }

    return {
      renderer, scene, camera, haute,
      bloom: () => bloom,
      rendre() { if (composer) composer.render(); else renderer.render(scene, camera); },
      surveiller,
      etat: () => ({ haute, halo: !!composer, ombres: renderer.shadowMap.enabled }),
      detruire() {
        renderer.setAnimationLoop(null);
        renderer.domElement.remove();
        document.body.classList.remove("en-scene");
      },
    };
  }

  // Lumière « HDR » : une couleur plus forte que 1 déclenche le halo.
  function lumineux(couleur, force) { return new THREE.Color(couleur).multiplyScalar(force || 3); }

  return { creer, lumineux };
})();
