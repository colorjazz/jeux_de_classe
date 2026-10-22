/*
 * Lecture d'une feuille de notes (photos ou PDF, même manuscrite) avec Claude.
 * Partagé par le favori (inséré par build.py) et par index.html.
 * Mêmes règles d'écriture que saisie-notes.js : commentaires en bloc, points-virgules, pas de chaîne sur plusieurs lignes.
 *
 * lireFeuille(fichiers, cle, nomsDuGroupe) -> Promise<{ notes: [{nom, note}], a_verifier: [texte], cout: nombre en $ US }>
 */
var LECTURE_MODELE = 'claude-opus-5-5';
var LECTURE_PRIX = { entree: 4 / 1e6, sortie: 20 / 1e6 };

function lectureBloc(fichier) {
  if (fichier.type === 'application/pdf') {
    return new Promise(function (ok, ko) {
      var fr = new FileReader();
      fr.onload = function () {
        ok({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: String(fr.result).split(',')[1] } });
      };
      fr.onerror = function () { ko(new Error('Impossible de lire le fichier ' + fichier.name)); };
      fr.readAsDataURL(fichier);
    });
  }
  /* Image : réduite à 2000 px au plus, en JPEG (photos de téléphone trop lourdes sinon) */
  return createImageBitmap(fichier).then(function (img) {
    var echelle = Math.min(1, 2000 / Math.max(img.width, img.height));
    var c = document.createElement('canvas');
    c.width = Math.round(img.width * echelle);
    c.height = Math.round(img.height * echelle);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.9).split(',')[1] } };
  }, function () {
    throw new Error('Le navigateur ne peut pas ouvrir « ' + fichier.name + ' » (format HEIC d\'iPhone ?). Enregistrez-la en JPEG ou en PDF.');
  });
}

function lectureConsigne(noms) {
  var t = 'Ce document est une feuille de résultats d\'élèves (photo ou PDF, souvent manuscrite). Relève la note de chaque élève.\n' +
    '- nom : le nom de l\'élève. ';
  if (noms && noms.length) {
    t += 'Utilise l\'orthographe exacte de la liste du groupe ci-dessous quand c\'est clairement le même élève ; sinon recopie le nom tel qu\'il est écrit.\n';
  } else {
    t += 'Recopie-le tel qu\'il est écrit.\n';
  }
  t += '- note : la note telle qu\'elle est écrite (chiffres, virgule décimale), sans le dénominateur (pas de « /50 »). ' +
    'Élève absent : « abs ». Note illisible ou douteuse : « ?? ». N\'invente jamais une note.\n' +
    '- Vérifie que chaque note est bien sur la même ligne que le nom : ne décale pas les lignes.\n' +
    '- a_verifier : les cas douteux en quelques mots (ex. « Roy Emma : 7 ou 1 ? », « ligne raturée »). Liste vide si tout est clair.';
  if (noms && noms.length) { t += '\n\nListe du groupe :\n' + noms.join('\n'); }
  return t;
}

var LECTURE_SCHEMA = {
  type: 'object',
  properties: {
    notes: { type: 'array', items: { type: 'object', properties: { nom: { type: 'string' }, note: { type: 'string' } },
      required: ['nom', 'note'], additionalProperties: false } },
    a_verifier: { type: 'array', items: { type: 'string' } }
  },
  required: ['notes', 'a_verifier'],
  additionalProperties: false
};

function lireFeuille(fichiers, cle, noms) {
  if (!/^sk-ant-/.test(cle || '')) { return Promise.reject(new Error('Clé API manquante ou invalide (elle commence par sk-ant-).')); }
  return Promise.all(Array.prototype.map.call(fichiers, lectureBloc)).then(function (blocs) {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cle,
        'anthropic-version': '2026-10-21',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: LECTURE_MODELE,
        max_tokens: 16000,
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: LECTURE_SCHEMA } },
        messages: [{ role: 'user', content: blocs.concat([{ type: 'text', text: lectureConsigne(noms) }]) }]
      })
    }).catch(function () {
      throw new Error('Connexion à Claude impossible (Internet coupé, ou le site bloque la connexion). Essayez la lecture depuis la page d\'installation (index.html).');
    });
  }).then(function (rep) {
    return rep.json().catch(function () { return {}; }).then(function (data) {
      if (!rep.ok) {
        var msg = (data.error && data.error.message) || ('erreur ' + rep.status);
        if (rep.status === 401) { msg = 'Clé API refusée : vérifiez-la dans la console Anthropic.'; }
        else if (/credit/i.test(msg)) { msg = 'Crédits épuisés : rechargez votre compte sur console.anthropic.com.'; }
        else if (rep.status === 429 || rep.status === 529 || rep.status >= 500) { msg = 'Service occupé, réessayez dans une minute.'; }
        throw new Error(msg);
      }
      if (data.stop_reason === 'refusal') { throw new Error('Claude a refusé de lire ce document.'); }
      if (data.stop_reason === 'max_tokens') { throw new Error('Réponse trop longue : envoyez moins de pages à la fois.'); }
      var texte = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
      var res;
      try { res = JSON.parse(texte); } catch (e) { throw new Error('Réponse illisible, réessayez.'); }
      var u = data.usage || {};
      res.cout = (u.input_tokens || 0) * LECTURE_PRIX.entree + (u.output_tokens || 0) * LECTURE_PRIX.sortie;
      return res;
    });
  });
}
