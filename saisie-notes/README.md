# Saisie de notes automatique

Favori (bookmarklet) qui lit une feuille de notes (photo ou PDF, même manuscrite) avec Claude
et inscrit les notes des élèves dans un site de notes (Mozaïk ou autre).

- Ouvrir `index.html` dans le navigateur et suivre les instructions : clé API, installation du favori, utilisation.
- Lecture : la photo et les noms du groupe affichés sur la page sont envoyés à l'API Claude (`lecture-photo.js`),
  qui renvoie la liste `Nom ; note` et les cas douteux. Coût : quelques sous par feuille, payés avec la clé API.
- Remplissage : le favori repère chaque élève par son nom (ordre, accents et majuscules ignorés, petites fautes tolérées),
  trouve la case de note sur la même ligne et y écrit la note. Il n'enregistre jamais : l'enseignant vérifie puis enregistre.
- Sans clé API, on peut coller la liste à la main ; rien ne quitte alors le navigateur.

Pour modifier le favori : éditer `saisie-notes.js` ou `lecture-photo.js`, puis régénérer la page avec `python3 build.py`.
