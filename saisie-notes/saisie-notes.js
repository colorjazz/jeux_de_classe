/*
 * Saisie de notes automatique (favori / bookmarklet).
 *
 * Sur la page de saisie des notes (ex. Mozaïk), ouvre un panneau où l'on colle
 * une liste « Nom ; note ». Le script repère chaque élève sur la page, trouve la
 * case de note sur la même ligne et y inscrit la note. Rien n'est enregistré :
 * l'enseignant vérifie puis clique lui-même sur « Enregistrer ».
 *
 * Règles d'écriture (le fichier est compressé sur une seule ligne par build.py) :
 * uniquement des commentaires en bloc, des points-virgules partout, aucune
 * chaîne sur plusieurs lignes.
 */
(function () {
  'use strict';
  var ID = 'sn-saisie-notes';
  var existing = document.getElementById(ID);
  if (existing) { existing.remove(); return; }

  /* ---------- Outils texte ---------- */
  function norm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function tokens(s) {
    return norm(s).split(' ').filter(function (t) { return t.length > 1 && !/^\d+$/.test(t); });
  }
  function lev(a, b) {
    var i, j, prev, cur = [];
    for (j = 0; j <= b.length; j++) { cur[j] = j; }
    for (i = 1; i <= a.length; i++) {
      prev = cur; cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return cur[b.length];
  }
  /* 0 = différent, 1 = approchant (une faute de frappe), 2 = identique */
  function tokenMatch(a, b) {
    if (a === b) { return 2; }
    if (Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1) { return 1; }
    return 0;
  }

  /* ---------- Lecture de la liste collée ---------- */
  var LINE_RE = /^(.+?)[\s;:\t|=]+(\d+(?:[.,]\d+)?|abs)\s*(?:\/\s*\d+(?:[.,]\d+)?)?\s*%?\s*$/i;
  function parseList(text) {
    var entries = [], rejected = [];
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) { return; }
      var m = line.match(LINE_RE);
      if (m && tokens(m[1]).length) {
        entries.push({ name: m[1].replace(/[\s,;:]+$/, ''), toks: tokens(m[1]), grade: m[2] });
      } else {
        rejected.push(line);
      }
    });
    return { entries: entries, rejected: rejected };
  }

  /* ---------- Parcours de la page (y compris les iframes du même site) ---------- */
  function allDocs() {
    var docs = [document], i, j, frames;
    for (i = 0; i < docs.length; i++) {
      frames = docs[i].querySelectorAll('iframe, frame');
      for (j = 0; j < frames.length; j++) {
        try { if (frames[j].contentDocument) { docs.push(frames[j].contentDocument); } } catch (e) { /* autre site */ }
      }
    }
    return docs;
  }
  /* Rectangle dans le repère de la fenêtre principale */
  function absRect(el) {
    var r = el.getBoundingClientRect(), x = r.left, y = r.top;
    var win = el.ownerDocument.defaultView, fr;
    while (win && win.frameElement) {
      fr = win.frameElement.getBoundingClientRect();
      x += fr.left; y += fr.top;
      win = win.parent;
    }
    return { left: x, top: y, right: x + r.width, bottom: y + r.height, width: r.width, height: r.height,
      cx: x + r.width / 2, cy: y + r.height / 2 };
  }
  function visible(el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { return false; }
    var cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function inPanel(el) { return panel.contains(el); }

  function gradeInputs() {
    var list = [];
    allDocs().forEach(function (d) {
      Array.prototype.forEach.call(d.querySelectorAll('input'), function (inp) {
        var t = (inp.type || 'text').toLowerCase();
        if ((t === 'text' || t === 'number' || t === 'tel') && !inp.disabled && !inp.readOnly &&
            !inPanel(inp) && visible(inp)) {
          list.push({ el: inp, r: absRect(inp) });
        }
      });
    });
    return list;
  }

  /* Éléments de texte courts (noms possibles), sans case de saisie à l'intérieur */
  function textElements() {
    var list = [];
    allDocs().forEach(function (d) {
      Array.prototype.forEach.call(d.body ? d.body.querySelectorAll('*') : [], function (el) {
        if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|SELECT|OPTION|svg)$/i.test(el.tagName) || inPanel(el)) { return; }
        var txt = el.textContent;
        if (!txt || txt.length > 120 || el.querySelector('input, textarea, select')) { return; }
        var toks = tokens(txt);
        if (!toks.length || !visible(el)) { return; }
        list.push({ el: el, toks: toks });
      });
    });
    return list;
  }

  /* Score d'un élément de la page pour un nom de la liste */
  function score(entryToks, pageToks) {
    var matched = 0, fuzzy = false;
    entryToks.forEach(function (et) {
      var best = 0;
      pageToks.forEach(function (pt) { best = Math.max(best, tokenMatch(et, pt)); });
      if (best) { matched++; if (best === 1) { fuzzy = true; } }
    });
    return { matched: matched, full: matched === entryToks.length, fuzzy: fuzzy,
      exact: matched === entryToks.length && pageToks.length === entryToks.length };
  }

  function findStudent(entry, texts) {
    var hits = [];
    texts.forEach(function (t) {
      var s = score(entry.toks, t.toks);
      if (s.full || s.matched >= 2) { hits.push({ el: t.el, s: s }); }
    });
    /* Garder les éléments les plus profonds (pas un parent d'un autre résultat) */
    hits = hits.filter(function (h) {
      return !hits.some(function (o) { return o !== h && h.el.contains(o.el); });
    });
    if (!hits.length) { return { status: 'absent' }; }
    function rank(h) { return (h.s.full ? 100 : 0) + (h.s.fuzzy ? 0 : 10) + (h.s.exact ? 5 : 0) + h.s.matched; }
    var top = Math.max.apply(null, hits.map(rank));
    var best = hits.filter(function (h) { return rank(h) === top; });
    /* Plusieurs éléments sur la même ligne = un seul élève */
    var rows = [];
    best.forEach(function (h) {
      var r = absRect(h.el);
      if (!rows.some(function (o) { return Math.abs(o.r.cy - r.cy) < 6; })) { rows.push({ el: h.el, r: r, s: h.s }); }
    });
    if (rows.length > 1) {
      return { status: 'ambigu', names: rows.map(function (o) { return o.el.textContent.trim(); }) };
    }
    return { status: 'ok', el: rows[0].el, r: rows[0].r, approx: !rows[0].s.full || rows[0].s.fuzzy };
  }

  /* Case de note sur la même ligne que le nom */
  function findInput(nameRect, inputs) {
    var row = inputs.filter(function (i) {
      var tol = Math.max(nameRect.height, i.r.height) / 2 + 4;
      return Math.abs(i.r.cy - nameRect.cy) <= tol;
    });
    if (!row.length) { return { status: 'pas de case' }; }
    if (row.length === 1) { return { status: 'ok', input: row[0] }; }
    if (targetX === null) { return { status: 'colonne' }; }
    row.sort(function (a, b) { return Math.abs(a.r.cx - targetX) - Math.abs(b.r.cx - targetX); });
    return { status: 'ok', input: row[0] };
  }

  /* Inscrire une valeur comme si elle avait été tapée au clavier */
  function typeValue(inp, value) {
    var win = inp.ownerDocument.defaultView;
    var setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set;
    inp.focus();
    setter.call(inp, value);
    inp.dispatchEvent(new win.Event('input', { bubbles: true }));
    inp.dispatchEvent(new win.Event('change', { bubbles: true }));
    inp.dispatchEvent(new win.KeyboardEvent('keyup', { bubbles: true, key: 'Tab' }));
    inp.blur();
  }

  /* ---------- Surlignage ---------- */
  var marked = [];
  function mark(el, color) {
    marked.push({ el: el, outline: el.style.outline, offset: el.style.outlineOffset });
    el.style.outline = '3px solid ' + color;
    el.style.outlineOffset = '1px';
  }
  function clearMarks() {
    marked.forEach(function (m) { m.el.style.outline = m.outline; m.el.style.outlineOffset = m.offset; });
    marked = [];
  }
  var GREEN = '#2e7d32', YELLOW = '#f9a825', ORANGE = '#ef6c00';

  /* ---------- Panneau ---------- */
  var panel = document.createElement('div');
  panel.id = ID;
  panel.setAttribute('style', 'position:fixed;top:12px;right:12px;width:380px;max-height:calc(100vh - 24px);' +
    'overflow:auto;z-index:2147483647;background:#fff;color:#222;border:1px solid #999;border-radius:8px;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.25);font:14px/1.4 system-ui,sans-serif;padding:12px;');
  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
    '<strong>Saisie de notes</strong>' +
    '<button data-a="close" style="border:0;background:none;font-size:18px;cursor:pointer" title="Fermer">✕</button></div>' +
    '<div style="font-size:12px;color:#555;margin-bottom:6px">Collez une ligne par élève : <code>Nom Prénom ; note</code></div>' +
    '<textarea data-a="list" rows="9" style="width:100%;box-sizing:border-box;font:13px monospace" ' +
    'placeholder="Tremblay, Léa ; 25&#10;Samuel Gagnon 43,5&#10;Roy Emma : abs"></textarea>' +
    '<div data-a="col" style="font-size:12px;margin:6px 0;color:#555"></div>' +
    '<label style="display:block;font-size:13px"><input type="checkbox" data-a="overwrite"> Remplacer les notes déjà inscrites</label>' +
    '<label style="display:block;font-size:13px"><input type="checkbox" data-a="comma"> Écrire la décimale avec une virgule (25,5)</label>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button data-a="check" style="flex:1;padding:6px;cursor:pointer">1. Vérifier</button>' +
    '<button data-a="fill" style="flex:1;padding:6px;cursor:pointer;font-weight:bold" disabled>2. Remplir</button></div>' +
    '<div data-a="out" style="margin-top:10px;font-size:13px"></div>' +
    '<div style="font-size:11px;color:#777;margin-top:8px">Rien n\'est enregistré automatiquement : vérifiez, puis cliquez sur « Enregistrer » dans le site.</div>';
  document.body.appendChild(panel);
  function q(a) { return panel.querySelector('[data-a="' + a + '"]'); }

  /* Colonne visée : la dernière case cliquée sur la page */
  var targetX = null;
  function setTarget(el) {
    if (el && el.tagName === 'INPUT' && !inPanel(el)) {
      targetX = absRect(el).cx;
      q('col').innerHTML = '✔ Colonne choisie (case cliquée). Cliquez dans une autre case pour changer de colonne.';
    }
  }
  function showColHelp() {
    if (targetX === null) {
      q('col').innerHTML = 'S\'il y a plusieurs évaluations sur la page, cliquez d\'abord dans une case de la bonne colonne.';
    }
  }
  showColHelp();
  setTarget(document.activeElement);
  function onFocus(e) { setTarget(e.target); }
  allDocs().forEach(function (d) { d.addEventListener('focusin', onFocus, true); });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  var plan = [];
  function analyse() {
    clearMarks();
    plan = [];
    var parsed = parseList(q('list').value);
    var inputs = gradeInputs(), texts = textElements();
    var overwrite = q('overwrite').checked, comma = q('comma').checked;
    var used = [], rows = [], counts = { ok: 0, pb: 0 };
    parsed.entries.forEach(function (e) {
      var grade = comma ? e.grade.replace('.', ',') : e.grade;
      var st = findStudent(e, texts), msg = '', color = '#c62828', inp;
      if (st.status === 'absent') { msg = 'élève introuvable sur la page'; }
      else if (st.status === 'ambigu') { msg = 'plusieurs élèves possibles : ' + st.names.map(esc).join(' / '); }
      else {
        var fi = findInput(st.r, inputs);
        if (fi.status === 'colonne') { msg = 'plusieurs colonnes : cliquez dans une case de la bonne colonne'; }
        else if (fi.status !== 'ok') { msg = 'aucune case de note sur sa ligne'; }
        else {
          inp = fi.input.el;
          var who = st.el.textContent.trim();
          if (used.indexOf(inp) >= 0) { msg = 'même case qu\'un autre nom de la liste (' + esc(who) + ')'; }
          else if (inp.value.trim() && inp.value.trim() !== grade && !overwrite) {
            msg = 'déjà une note (' + esc(inp.value) + ') — non remplacée'; color = ORANGE;
            mark(inp, ORANGE);
          } else {
            used.push(inp);
            plan.push({ input: inp, grade: grade });
            color = st.approx ? YELLOW : GREEN;
            msg = (st.approx ? '≈ ' : '') + esc(who) + (inp.value.trim() === grade ? ' (déjà inscrite)' : '');
            mark(inp, color);
            if (st.approx) { mark(st.el, YELLOW); }
          }
        }
      }
      if (color === GREEN || color === YELLOW) { counts.ok++; } else { counts.pb++; }
      rows.push('<tr><td style="padding:2px 4px">' + esc(e.name) + '</td><td style="padding:2px 4px;text-align:right"><b>' +
        esc(grade) + '</b></td><td style="padding:2px 4px;color:' + color + '">' + msg + '</td></tr>');
    });
    var html = '<div><b style="color:' + GREEN + '">' + counts.ok + ' prête(s)</b>' +
      (counts.pb ? ' · <b style="color:#c62828">' + counts.pb + ' problème(s)</b>' : '') + '</div>';
    if (parsed.rejected.length) {
      html += '<div style="color:#c62828">Lignes non comprises : ' + parsed.rejected.map(esc).join(' | ') + '</div>';
    }
    html += '<table style="width:100%;border-collapse:collapse;margin-top:4px">' + rows.join('') + '</table>';
    html += '<div style="font-size:11px;color:#555;margin-top:4px">Vert = trouvé · Jaune (≈) = nom approchant, à vérifier · Orange = déjà rempli</div>';
    q('out').innerHTML = html;
    q('fill').disabled = !plan.length;
    q('fill').textContent = '2. Remplir ' + plan.length + ' case(s)';
  }

  function fill() {
    analyse();
    plan.forEach(function (p) { typeValue(p.input, p.grade); });
    /* Cases encore vides dans la même colonne : élèves sans note dans la liste */
    var filled = plan.map(function (p) { return p.input; });
    var cols = filled.map(function (i) { return absRect(i).cx; });
    var empty = gradeInputs().filter(function (i) {
      return !i.el.value.trim() && cols.some(function (x) { return Math.abs(x - i.r.cx) < 10; });
    });
    empty.forEach(function (i) { mark(i.el, ORANGE); });
    q('out').insertAdjacentHTML('afterbegin', '<div style="background:#e8f5e9;padding:6px;border-radius:4px;margin-bottom:6px">' +
      '✔ ' + plan.length + ' note(s) inscrite(s).' +
      (empty.length ? ' <span style="color:' + ORANGE + '">' + empty.length + ' case(s) encore vide(s) dans la colonne (en orange).</span>' : '') +
      '<br>Vérifiez puis cliquez sur <b>Enregistrer</b> dans le site.</div>');
    q('fill').disabled = true;
  }

  panel.addEventListener('click', function (e) {
    var a = e.target.getAttribute && e.target.getAttribute('data-a');
    if (a === 'close') {
      clearMarks();
      allDocs().forEach(function (d) { d.removeEventListener('focusin', onFocus, true); });
      panel.remove();
    } else if (a === 'check') { analyse(); }
    else if (a === 'fill') { fill(); }
  });
  q('list').addEventListener('input', function () { q('fill').disabled = true; q('fill').textContent = '2. Remplir'; });
  q('list').focus();
})();
